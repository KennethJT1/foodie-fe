import { isOpenAt } from '@/lib/opening-hours';

import { db } from '../db';
import { currentUser } from './auth';
import { distanceMetres } from './geo';

/** Used when we don't know where the customer is. */
export const LAGOS_CENTRE = { lat: 6.5244, lng: 3.3792 };

/** Subscription states that keep a store visible (BR-SUB-06: expired or none = hidden). */
const VISIBLE_SUBSCRIPTIONS = ['active', 'trial', 'grace', 'cancelled'];

export const isVendorVisible = (v) =>
  Boolean(v) &&
  v.approvalStatus === 'approved' &&
  VISIBLE_SUBSCRIPTIONS.includes(v.subscriptionStatus);

export const isVendorOpen = (v, now = new Date()) => !v.isPaused && isOpenAt(v.openingHours, now);

const num = (v) => (v == null || v === '' ? NaN : Number(v));

/** Where distances are measured from: ?lat&lng, else the user's default address, else Lagos. */
export function originFor(user, params) {
  const lat = num(params?.get('lat'));
  const lng = num(params?.get('lng'));
  if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  if (user) {
    const a = db.addresses.find((x) => x.userId === user.id && x.isDefault);
    if (a) return { lat: a.lat, lng: a.lng };
  }
  return LAGOS_CENTRE;
}

/** Everything a public catalogue handler needs, computed once per request. */
export function catalogueContext(request, params) {
  const user = currentUser(request);
  return {
    user,
    origin: originFor(user, params),
    now: new Date(),
    vendorsById: new Map(db.vendors.map((v) => [v.id, v])),
    categoriesById: new Map(db.categories.map((c) => [c.id, c])),
    likedIds: new Set(
      user ? db.likes.filter((l) => l.userId === user.id).map((l) => l.foodItemId) : [],
    ),
    followedIds: new Set(
      user ? db.follows.filter((f) => f.userId === user.id).map((f) => f.vendorId) : [],
    ),
  };
}

export const isItemVisible = (item, ctx) =>
  Boolean(item) && !item.isHidden && isVendorVisible(ctx.vendorsById.get(item.vendorId));

export const visibleItems = (ctx) => db.foodItems.filter((f) => isItemVisible(f, ctx));

/** Small vendor block embedded in food items and orders. */
export function vendorSummary(v, ctx) {
  return {
    id: v.id,
    name: v.name,
    slug: v.slug,
    logo: v.logo,
    rating: v.rating,
    ratingCount: v.ratingCount,
    area: v.address?.area,
    city: v.city,
    isOpen: isVendorOpen(v, ctx.now),
    isPaused: v.isPaused,
    prepTimeMins: v.prepTimeMins,
    deliveryRadiusKm: v.deliveryRadiusKm,
  };
}

/** Food item as the public API returns it. */
export function serializeFoodItem(f, ctx) {
  const v = ctx.vendorsById.get(f.vendorId);
  const category = ctx.categoriesById.get(f.categoryId);
  return {
    id: f.id,
    vendorId: f.vendorId,
    categoryId: f.categoryId,
    categoryName: category?.name ?? null,
    name: f.name,
    slug: f.slug,
    description: f.description,
    price: f.price,
    photos: f.photos,
    portion: f.portion,
    prepTimeMins: f.prepTimeMins,
    isAvailable: f.isAvailable,
    availableDays: f.availableDays,
    optionGroups: f.optionGroups,
    likesCount: f.likesCount,
    commentsCount: f.commentsCount,
    ordersCount: f.ordersCount,
    isLiked: ctx.likedIds.has(f.id),
    distanceM: v ? distanceMetres(ctx.origin, v) : null,
    vendor: v ? vendorSummary(v, ctx) : null,
    createdAt: f.createdAt,
  };
}

/** Public storefront fields: no bank details, documents or owner data. */
export function serializeVendor(v, ctx) {
  const items = db.foodItems.filter((f) => f.vendorId === v.id && !f.isHidden);
  return {
    ...vendorSummary(v, ctx),
    type: v.type,
    description: v.description,
    cover: v.cover,
    phone: v.phone,
    address: v.address,
    lat: v.lat,
    lng: v.lng,
    openingHours: v.openingHours,
    followersCount: v.followersCount,
    isFollowing: ctx.followedIds.has(v.id),
    distanceM: distanceMetres(ctx.origin, v),
    itemCount: items.length,
    categoryIds: [...new Set(items.map((f) => f.categoryId))],
    createdAt: v.createdAt,
  };
}
