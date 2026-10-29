import { http, HttpResponse } from 'msw';

import { db, findById, persist } from '../db';
import { newId } from '../seed/seed';
import { requireUser } from '../utils/auth';
import { applyListQuery } from '../utils/list';
import { api } from '../utils/path';
import { created, fail, latency, noContent, ok, readJson, validationError } from '../utils/respond';

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function vendorContext(request) {
  const { user, error } = requireUser(request, { roles: ['vendor'] });
  if (error) return { error };
  const vendor = findById('vendors', user.vendorId);
  const plan = findById('plans', vendor?.planId);
  const items = db.foodItems.filter((f) => f.vendorId === vendor?.id && !f.deletedAt);
  return {
    vendor,
    items,
    limits: {
      menuItems: plan?.limits.menuItems ?? 20,
      photosPerItem: plan?.limits.photosPerItem ?? 1,
      planName: plan?.name ?? 'Basic',
    },
  };
}

const serialize = (f) => {
  const category = db.categories.find((c) => c.id === f.categoryId);
  return {
    ...f,
    categoryName: category?.name ?? null,
    availableFrom: f.availableFrom ?? null,
    availableTo: f.availableTo ?? null,
  };
};

/** Validates a create/edit body against the plan limits (BRD section 4). */
function readItem(body, limits, existing) {
  const errors = {};
  const name = String(body.name ?? existing?.name ?? '').trim();
  if (name.length < 2) errors.name = 'Enter the food name';
  if (name.length > 80) errors.name = 'Keep the name under 80 characters';
  const description = String(body.description ?? existing?.description ?? '').trim();
  if (description.length > 500) errors.description = 'Keep it under 500 characters';
  const categoryId = body.categoryId ?? existing?.categoryId;
  if (!db.categories.some((c) => c.id === categoryId)) errors.categoryId = 'Pick a category';
  const price = Math.round(Number(body.price ?? existing?.price));
  if (!(price > 0)) errors.price = 'Price must be more than ₦0';
  const photos = body.photos ?? existing?.photos ?? [];
  if (!photos.length) errors.photos = 'Add at least one photo';
  if (photos.length > limits.photosPerItem)
    errors.photos = `Your ${limits.planName} plan allows ${limits.photosPerItem} photo${limits.photosPerItem > 1 ? 's' : ''} per item`;
  const availableDays = body.availableDays ?? existing?.availableDays ?? [0, 1, 2, 3, 4, 5, 6];
  if (!availableDays.length) errors.availableDays = 'Pick at least one day';
  const availableFrom = body.availableFrom ?? existing?.availableFrom ?? null;
  const availableTo = body.availableTo ?? existing?.availableTo ?? null;
  if ((availableFrom || availableTo) && !(TIME.test(availableFrom) && TIME.test(availableTo)))
    errors.availableFrom = 'Enter both times';
  else if (availableFrom && availableFrom >= availableTo)
    errors.availableTo = 'The end time must be after the start time';
  const groups = body.optionGroups ?? existing?.optionGroups ?? [];
  groups.forEach((g, i) => {
    if (!String(g.name ?? '').trim()) errors[`optionGroups.${i}.name`] = 'Name this group';
    if (!g.options?.length) errors[`optionGroups.${i}.name`] = 'Add at least one option';
    g.options?.forEach((o, j) => {
      if (!String(o.name ?? '').trim())
        errors[`optionGroups.${i}.options.${j}.name`] = 'Name this option';
    });
  });
  if (Object.keys(errors).length) return { errors };
  return {
    fields: {
      name,
      slug: slugify(name),
      description,
      categoryId,
      price,
      photos,
      portion: String(body.portion ?? existing?.portion ?? '').trim(),
      prepTimeMins: Number(body.prepTimeMins ?? existing?.prepTimeMins ?? 20),
      isAvailable: body.isAvailable ?? existing?.isAvailable ?? true,
      availableDays: [...new Set(availableDays.map(Number))].sort(),
      availableFrom,
      availableTo,
      optionGroups: groups.map((g) => ({
        id: g.id || newId('grp'),
        name: g.name.trim(),
        required: Boolean(g.required),
        max: Math.max(1, Number(g.max) || 1),
        options: g.options.map((o) => ({
          id: o.id || newId('opt'),
          name: o.name.trim(),
          price: Math.max(0, Math.round(Number(o.price) || 0)),
        })),
      })),
    },
  };
}

export const menuHandlers = [
  http.get(api('/vendor/menu'), async ({ request }) => {
    await latency();
    const { items, limits, error } = vendorContext(request);
    if (error) return error;
    const params = new URL(request.url).searchParams;
    const page = applyListQuery(items.map(serialize), params, {
      searchFields: ['name', 'description'],
      filters: {
        categoryId: 'categoryId',
        availability: (f, [v]) => (v === 'sold_out' ? !f.isAvailable : f.isAvailable),
      },
    });
    return HttpResponse.json({
      success: true,
      data: page.data,
      meta: { ...page.meta, limits: { ...limits, used: items.length } },
    });
  }),

  http.get(api('/vendor/menu/:id'), async ({ request, params }) => {
    await latency();
    const { vendor, limits, error } = vendorContext(request);
    if (error) return error;
    const item = findById('foodItems', params.id);
    if (!item || item.vendorId !== vendor.id || item.deletedAt) return fail(404);
    return ok({ ...serialize(item), limits });
  }),

  http.post(api('/vendor/menu'), async ({ request }) => {
    await latency();
    const { vendor, items, limits, error } = vendorContext(request);
    if (error) return error;
    if (limits.menuItems != null && items.length >= limits.menuItems)
      return fail(409, {
        code: 'PLAN_LIMIT',
        message: `Your ${limits.planName} plan allows ${limits.menuItems} menu items. Upgrade to add more.`,
      });
    const { fields, errors } = readItem(await readJson(request), limits);
    if (errors) return validationError(errors);
    const item = {
      id: newId('food'),
      vendorId: vendor.id,
      ...fields,
      emoji: '🍽️',
      likesCount: 0,
      commentsCount: 0,
      ordersCount: 0,
      isHidden: false,
      createdAt: new Date().toISOString(),
    };
    db.foodItems.unshift(item);
    persist();
    return created(serialize(item));
  }),

  http.patch(api('/vendor/menu/:id'), async ({ request, params }) => {
    await latency();
    const { vendor, limits, error } = vendorContext(request);
    if (error) return error;
    const item = findById('foodItems', params.id);
    if (!item || item.vendorId !== vendor.id || item.deletedAt) return fail(404);
    const { fields, errors } = readItem(await readJson(request), limits, item);
    if (errors) return validationError(errors);
    Object.assign(item, fields, { updatedAt: new Date().toISOString() });
    persist();
    return ok(serialize(item));
  }),

  // Past orders keep their own copy of the name and price, so deleting is safe
  http.delete(api('/vendor/menu/:id'), async ({ request, params }) => {
    await latency();
    const { vendor, error } = vendorContext(request);
    if (error) return error;
    const item = findById('foodItems', params.id);
    if (!item || item.vendorId !== vendor.id) return fail(404);
    item.isHidden = true;
    item.deletedAt = new Date().toISOString();
    persist();
    return noContent();
  }),
];
