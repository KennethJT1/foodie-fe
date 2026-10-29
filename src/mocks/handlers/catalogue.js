import { http } from 'msw';

import { db } from '../db';
import {
  catalogueContext,
  isItemVisible,
  isVendorVisible,
  serializeFoodItem,
  serializeVendor,
  visibleItems,
} from '../utils/catalogue';
import { applyListQuery, cursorPaginate, listResponse, sortRows } from '../utils/list';
import { api } from '../utils/path';
import { chaos, fail, latency, ok } from '../utils/respond';

const FEED_TABS = ['nearby', 'popular', 'newest', 'following'];

const numberFilter =
  (field, compare) =>
  (row, [v]) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return true;
    const value = field.split('.').reduce((o, k) => o?.[k], row);
    return value != null && compare(value, n);
  };

export const catalogueHandlers = [
  // Home feed (cursor pagination)
  http.get(api('/feed'), async ({ request }) => {
    await latency();
    const failure = chaos();
    if (failure) return failure;
    const params = new URL(request.url).searchParams;
    const ctx = catalogueContext(request, params);
    const tab = FEED_TABS.includes(params.get('tab')) ? params.get('tab') : 'nearby';
    const categoryId = params.get('categoryId');

    let items = visibleItems(ctx);
    if (categoryId) items = items.filter((f) => f.categoryId === categoryId);
    if (tab === 'following') items = items.filter((f) => ctx.followedIds.has(f.vendorId));

    let rows = items.map((f) => serializeFoodItem(f, ctx));
    if (tab === 'nearby') {
      // Nearest first, in 1 km bands so fresh posts still surface
      rows = rows
        .map((r) => ({ ...r, _band: Math.floor((r.distanceM ?? 0) / 1000) }))
        .sort((a, b) => a._band - b._band || b.createdAt.localeCompare(a.createdAt))
        .map(({ _band, ...r }) => r);
    } else if (tab === 'popular') {
      rows = rows
        .map((r) => ({ r, score: r.likesCount + r.ordersCount * 2 + r.commentsCount * 3 }))
        .sort((a, b) => b.score - a.score)
        .map((x) => x.r);
    } else {
      rows = sortRows(rows, '-createdAt');
    }
    return listResponse(cursorPaginate(rows, params, 10));
  }),

  // Search and menus (page pagination)
  http.get(api('/food-items'), async ({ request }) => {
    await latency();
    const failure = chaos();
    if (failure) return failure;
    const params = new URL(request.url).searchParams;
    const ctx = catalogueContext(request, params);
    const rows = visibleItems(ctx).map((f) => serializeFoodItem(f, ctx));
    return listResponse(
      applyListQuery(rows, params, {
        searchFields: ['name', 'description', 'vendor.name', 'categoryName'],
        defaultSort: '-likesCount',
        filters: {
          categoryId: 'categoryId',
          vendorId: 'vendorId',
          available: (r, [v]) => (v === 'true' ? r.isAvailable : true),
          minPrice: numberFilter('price', (a, b) => a >= b),
          maxPrice: numberFilter('price', (a, b) => a <= b),
          minRating: numberFilter('vendor.rating', (a, b) => a >= b),
          maxDistanceKm: numberFilter('distanceM', (a, b) => a <= b * 1000),
        },
      }),
    );
  }),

  http.get(api('/food-items/:id'), async ({ request, params }) => {
    await latency();
    const failure = chaos();
    if (failure) return failure;
    const ctx = catalogueContext(request, new URL(request.url).searchParams);
    const item = db.foodItems.find((f) => f.id === params.id);
    if (!isItemVisible(item, ctx))
      return fail(404, { message: "We couldn't find that dish. It may have been removed." });
    return ok(serializeFoodItem(item, ctx));
  }),

  // Public vendor list (search by store name)
  http.get(api('/vendors'), async ({ request }) => {
    await latency();
    const params = new URL(request.url).searchParams;
    const ctx = catalogueContext(request, params);
    const rows = db.vendors.filter(isVendorVisible).map((v) => serializeVendor(v, ctx));
    return listResponse(
      applyListQuery(rows, params, {
        searchFields: ['name', 'address.area', 'city'],
        defaultSort: '-rating',
        filters: { city: 'city' },
      }),
    );
  }),

  http.get(api('/vendors/:slug'), async ({ request, params }) => {
    await latency();
    const failure = chaos();
    if (failure) return failure;
    const ctx = catalogueContext(request, new URL(request.url).searchParams);
    const vendor = db.vendors.find((v) => v.slug === params.slug || v.id === params.slug);
    if (!isVendorVisible(vendor))
      return fail(404, { message: "This store isn't available right now." });
    return ok(serializeVendor(vendor, ctx));
  }),
];
