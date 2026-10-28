import { http } from 'msw';

import { PERMISSIONS } from '@/constants/permissions';

import { db, findById, persist } from '../db';
import { resolveAccount } from './onboarding';
import { newId } from '../seed/seed';
import { audit, notify, permissionsFor, requireUser } from '../utils/auth';
import { applyListQuery, listResponse } from '../utils/list';
import { api } from '../utils/path';
import { created, fail, latency, noContent, ok, readJson, validationError } from '../utils/respond';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function ownStore(request) {
  const { user, error } = requireUser(request, { roles: ['vendor'] });
  if (error) return { error };
  const vendor = findById('vendors', user.vendorId);
  if (!vendor) return { error: fail(404) };
  return { user, vendor };
}

const serializeStore = (v) => ({
  id: v.id,
  name: v.name,
  slug: v.slug,
  description: v.description,
  logo: v.logo,
  cover: v.cover,
  phone: v.phone,
  address: v.address,
  isPaused: v.isPaused,
  deliveryRadiusKm: v.deliveryRadiusKm,
  prepTimeMins: v.prepTimeMins,
  openingHours: v.openingHours,
  bank: v.bank && {
    bankName: v.bank.bankName,
    accountName: v.bank.accountName,
    accountNumberLast4: v.bank.accountNumber.slice(-4),
  },
  bankChangeRequest: v.bankChangeRequest,
});

function readHours(hours) {
  if (!Array.isArray(hours) || hours.length !== 7) return { error: 'Set hours for every day' };
  for (const h of hours) {
    if (h.closed) continue;
    if (!TIME.test(h.open) || !TIME.test(h.close))
      return { error: 'Enter opening and closing times' };
    if (h.open >= h.close) return { error: 'Closing time must be after opening time' };
  }
  return {
    hours: hours.map((h, day) => ({
      day,
      open: h.open,
      close: h.close,
      closed: Boolean(h.closed),
    })),
  };
}

export const vendorStoreHandlers = [
  http.get(api('/vendor/store'), async ({ request }) => {
    await latency();
    const { vendor, error } = ownStore(request);
    if (error) return error;
    return ok(serializeStore(vendor));
  }),

  // FR-VEN-03: hours, delivery radius, prep time, pause orders, store page details
  http.patch(api('/vendor/store'), async ({ request }) => {
    await latency();
    const { vendor, error } = ownStore(request);
    if (error) return error;
    const body = await readJson(request);
    const errors = {};
    const patch = {};
    if (body.openingHours !== undefined) {
      const { hours, error: e } = readHours(body.openingHours);
      if (e) errors.openingHours = e;
      else patch.openingHours = hours;
    }
    if (body.deliveryRadiusKm !== undefined) {
      const r = Number(body.deliveryRadiusKm);
      if (!(r >= 1 && r <= 30)) errors.deliveryRadiusKm = 'Pick a delivery radius';
      else patch.deliveryRadiusKm = r;
    }
    if (body.prepTimeMins !== undefined) {
      const m = Number(body.prepTimeMins);
      if (!(m >= 5 && m <= 120)) errors.prepTimeMins = 'Pick a usual preparation time';
      else patch.prepTimeMins = m;
    }
    if (body.description !== undefined) {
      const d = String(body.description).trim();
      if (d.length > 300) errors.description = 'Keep it under 300 characters';
      else patch.description = d;
    }
    if (body.isPaused !== undefined) patch.isPaused = Boolean(body.isPaused);
    for (const k of ['logo', 'cover']) if (body[k] !== undefined) patch[k] = body[k];
    if (Object.keys(errors).length) return validationError(errors);
    Object.assign(vendor, patch);
    persist();
    return ok(serializeStore(vendor));
  }),

  // BR-PAY-02: a new settlement account needs re-verification and admin approval
  http.post(api('/vendor/bank-change'), async ({ request }) => {
    await latency();
    const { user, vendor, error } = ownStore(request);
    if (error) return error;
    if (vendor.bankChangeRequest?.status === 'pending')
      return fail(409, { message: 'You already have a bank change waiting for approval.' });
    const { account, fieldErrors } = resolveAccount(user, await readJson(request));
    if (fieldErrors) return validationError(fieldErrors);
    vendor.bankChangeRequest = {
      id: newId('bcr'),
      ...account,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    audit(
      user,
      'vendor.bank_change_requested',
      'vendor',
      vendor.id,
      `${vendor.name} asked to change their bank account`,
    );
    db.users
      .filter((u) => u.role === 'admin' && permissionsFor(u).includes(PERMISSIONS.VENDORS_APPROVE))
      .forEach((u) =>
        notify(u.id, {
          type: 'vendor',
          title: 'Bank change to review',
          body: `${vendor.name} wants to change their settlement account.`,
          link: `/admin/vendors/${vendor.id}`,
        }),
      );
    persist();
    return ok(serializeStore(vendor));
  }),

  http.get(api('/vendor/staff'), async ({ request }) => {
    await latency();
    const { vendor, error } = ownStore(request);
    if (error) return error;
    const plan = findById('plans', vendor.planId);
    const staff = db.staff.filter((s) => s.vendorId === vendor.id);
    return ok({ staff, limit: plan?.limits.staff ?? 1, planName: plan?.name ?? '' });
  }),

  http.post(api('/vendor/staff'), async ({ request }) => {
    await latency();
    const { vendor, error } = ownStore(request);
    if (error) return error;
    const plan = findById('plans', vendor.planId);
    const limit = plan?.limits.staff ?? 1;
    if (db.staff.filter((s) => s.vendorId === vendor.id).length >= limit)
      return fail(409, {
        code: 'PLAN_LIMIT',
        message: `Your ${plan?.name ?? ''} plan allows ${limit} staff login${limit > 1 ? 's' : ''}. Upgrade to add more.`,
      });
    const body = await readJson(request);
    const errors = {};
    const name = String(body.name ?? '').trim();
    const email = String(body.email ?? '')
      .trim()
      .toLowerCase();
    if (name.length < 2) errors.name = "Enter the person's name";
    if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Enter a valid email address';
    else if (db.staff.some((s) => s.email === email) || db.users.some((u) => u.email === email))
      errors.email = 'That email already has an account';
    if (!['manager', 'kitchen'].includes(body.role)) errors.role = 'Pick a role';
    if (Object.keys(errors).length) return validationError(errors);
    const member = {
      id: newId('stf'),
      vendorId: vendor.id,
      name,
      email,
      phone: body.phone ?? '',
      role: body.role,
      createdAt: new Date().toISOString(),
    };
    db.staff.push(member);
    persist();
    return created(member);
  }),

  http.delete(api('/vendor/staff/:id'), async ({ request, params }) => {
    await latency();
    const { vendor, error } = ownStore(request);
    if (error) return error;
    const member = findById('staff', params.id);
    if (!member || member.vendorId !== vendor.id) return fail(404);
    db.staff = db.staff.filter((s) => s.id !== member.id);
    persist();
    return noContent();
  }),

  // Engagement numbers: likes, followers, most liked dishes
  http.get(api('/vendor/engagement'), async ({ request }) => {
    await latency();
    const { vendor, error } = ownStore(request);
    if (error) return error;
    const items = db.foodItems.filter((f) => f.vendorId === vendor.id && !f.deletedAt);
    const users = new Map(db.users.map((u) => [u.id, u]));
    const follows = db.follows
      .filter((f) => f.vendorId === vendor.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const itemIds = new Set(items.map((i) => i.id));
    const unanswered = db.comments.filter(
      (c) =>
        itemIds.has(c.foodItemId) &&
        !c.parentId &&
        !c.removed &&
        !db.comments.some((r) => r.parentId === c.id && r.isVendorReply),
    ).length;
    return ok({
      likesCount: items.reduce((s, i) => s + i.likesCount, 0),
      followersCount: vendor.followersCount,
      newFollowers: follows.filter((f) => f.createdAt >= monthAgo).length,
      unansweredComments: unanswered,
      rating: vendor.rating,
      ratingCount: vendor.ratingCount,
      topLiked: [...items]
        .sort((a, b) => b.likesCount - a.likesCount)
        .slice(0, 5)
        .map((i) => ({
          id: i.id,
          name: i.name,
          photo: i.photos[0] ?? null,
          likesCount: i.likesCount,
        })),
      recentFollowers: follows.slice(0, 8).map((f) => ({
        id: f.id,
        name: users.get(f.userId)?.name ?? 'Customer',
        createdAt: f.createdAt,
      })),
    });
  }),

  // Comments on the vendor's dishes; `answered=false` lists those still waiting for a reply
  http.get(api('/vendor/comments'), async ({ request }) => {
    await latency();
    const { vendor, error } = ownStore(request);
    if (error) return error;
    const items = new Map(
      db.foodItems.filter((f) => f.vendorId === vendor.id).map((f) => [f.id, f]),
    );
    const users = new Map(db.users.map((u) => [u.id, u]));
    const rows = db.comments
      .filter((c) => items.has(c.foodItemId) && !c.parentId && !c.removed && !c.hidden)
      .map((c) => {
        const reply = db.comments.find((r) => r.parentId === c.id && r.isVendorReply && !r.removed);
        const item = items.get(c.foodItemId);
        return {
          id: c.id,
          foodItemId: item.id,
          foodItemName: item.name,
          foodItemPhoto: item.photos[0] ?? null,
          authorName: users.get(c.userId)?.name ?? 'Customer',
          body: c.body,
          createdAt: c.createdAt,
          isAnswered: Boolean(reply),
          reply: reply ? { id: reply.id, body: reply.body, createdAt: reply.createdAt } : null,
        };
      });
    return listResponse(
      applyListQuery(rows, new URL(request.url).searchParams, {
        searchFields: ['body', 'foodItemName', 'authorName'],
        filters: { answered: (r, [v]) => String(r.isAnswered) === v },
      }),
    );
  }),
];
