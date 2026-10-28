import { http } from 'msw';

import { db, findById, persist } from '../db';
import { newId } from '../seed/seed';
import { notify, requireUser } from '../utils/auth';
import {
  catalogueContext,
  isItemVisible,
  isVendorVisible,
  serializeFoodItem,
  serializeVendor,
} from '../utils/catalogue';
import { cursorPaginate, listResponse, paginate } from '../utils/list';
import { api } from '../utils/path';
import { created, fail, latency, ok, readJson, validationError } from '../utils/respond';

const COMMENT_MAX = 500;
const REPORT_TARGETS = ['comment', 'food_item'];

function visibleItemOr404(request, id) {
  const ctx = catalogueContext(request, new URL(request.url).searchParams);
  const item = findById('foodItems', id);
  if (!isItemVisible(item, ctx)) return { error: fail(404) };
  return { item, ctx };
}

function serializeComment(c, viewer, usersById) {
  const author = usersById.get(c.userId);
  const vendor = c.isVendorReply ? db.vendors.find((v) => v.ownerId === c.userId) : null;
  const gone = c.removed || c.hidden;
  return {
    id: c.id,
    foodItemId: c.foodItemId,
    parentId: c.parentId,
    body: gone ? null : c.body,
    removed: gone,
    isVendorReply: c.isVendorReply,
    author: {
      id: author?.id ?? null,
      name: vendor?.name ?? author?.name ?? 'KJT Foodie user',
      avatar: vendor?.logo ?? author?.avatar ?? null,
    },
    isMine: Boolean(viewer && viewer.id === c.userId),
    editedAt: c.editedAt,
    createdAt: c.createdAt,
  };
}

function setLike(request, id, liked) {
  const { user, error } = requireUser(request, { roles: ['customer'] });
  if (error) return error;
  const { item, error: notFound } = visibleItemOr404(request, id);
  if (notFound) return notFound;
  const index = db.likes.findIndex((l) => l.userId === user.id && l.foodItemId === item.id);
  if (liked && index === -1) {
    db.likes.push({
      id: newId('lik'),
      userId: user.id,
      foodItemId: item.id,
      createdAt: new Date().toISOString(),
    });
    item.likesCount += 1;
  } else if (!liked && index !== -1) {
    db.likes.splice(index, 1);
    item.likesCount = Math.max(0, item.likesCount - 1);
  }
  persist();
  return ok({ foodItemId: item.id, isLiked: liked, likesCount: item.likesCount });
}

function setFollow(request, vendorId, following) {
  const { user, error } = requireUser(request, { roles: ['customer'] });
  if (error) return error;
  const vendor = findById('vendors', vendorId);
  if (!isVendorVisible(vendor)) return fail(404);
  const index = db.follows.findIndex((f) => f.userId === user.id && f.vendorId === vendor.id);
  if (following && index === -1) {
    db.follows.push({
      id: newId('fol'),
      userId: user.id,
      vendorId: vendor.id,
      createdAt: new Date().toISOString(),
    });
    vendor.followersCount += 1;
  } else if (!following && index !== -1) {
    db.follows.splice(index, 1);
    vendor.followersCount = Math.max(0, vendor.followersCount - 1);
  }
  persist();
  return ok({ vendorId: vendor.id, isFollowing: following, followersCount: vendor.followersCount });
}

export const socialHandlers = [
  // ── Likes ───────────────────────────────────────────────────────────────
  http.post(api('/food-items/:id/likes'), async ({ request, params }) => {
    await latency();
    return setLike(request, params.id, true);
  }),

  http.delete(api('/food-items/:id/likes'), async ({ request, params }) => {
    await latency();
    return setLike(request, params.id, false);
  }),

  http.get(api('/me/likes'), async ({ request }) => {
    await latency();
    const { user, error } = requireUser(request);
    if (error) return error;
    const params = new URL(request.url).searchParams;
    const ctx = catalogueContext(request, params);
    const rows = db.likes
      .filter((l) => l.userId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((l) => findById('foodItems', l.foodItemId))
      .filter((f) => isItemVisible(f, ctx))
      .map((f) => serializeFoodItem(f, ctx));
    return listResponse(paginate(rows, params));
  }),

  // ── Comments ───────────────────────────────────────────────────────────
  http.get(api('/food-items/:id/comments'), async ({ request, params }) => {
    await latency();
    const { item, ctx, error } = visibleItemOr404(request, params.id);
    if (error) return error;
    const usersById = new Map(db.users.map((u) => [u.id, u]));
    const all = db.comments.filter((c) => c.foodItemId === item.id);
    const top = all
      .filter((c) => !c.parentId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((c) => ({
        ...serializeComment(c, ctx.user, usersById),
        replies: all
          .filter((r) => r.parentId === c.id)
          .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
          .map((r) => serializeComment(r, ctx.user, usersById)),
      }));
    const page = cursorPaginate(top, new URL(request.url).searchParams, 10);
    return listResponse({ ...page, meta: { ...page.meta, commentsCount: item.commentsCount } });
  }),

  http.post(api('/food-items/:id/comments'), async ({ request, params }) => {
    await latency();
    const { user, error } = requireUser(request, { roles: ['customer', 'vendor'] });
    if (error) return error;
    const { item, error: notFound } = visibleItemOr404(request, params.id);
    if (notFound) return notFound;
    const body = await readJson(request);
    const text = String(body.body ?? '').trim();
    if (!text) return validationError({ body: 'Write a comment first' });
    if (text.length > COMMENT_MAX)
      return validationError({ body: `Keep it under ${COMMENT_MAX} characters` });

    const isVendor = user.role === 'vendor';
    if (isVendor && user.vendorId !== item.vendorId) return fail(403);
    const parent = body.parentId ? findById('comments', body.parentId) : null;
    if (isVendor && !parent)
      return fail(422, { message: 'Vendors can reply to comments on their own dishes.' });
    if (parent && (parent.foodItemId !== item.id || parent.parentId)) return fail(404);

    const comment = {
      id: newId('cmt'),
      foodItemId: item.id,
      userId: user.id,
      parentId: isVendor ? parent.id : null,
      isVendorReply: isVendor,
      body: text,
      editedAt: null,
      removed: false,
      hidden: false,
      createdAt: new Date().toISOString(),
    };
    db.comments.push(comment);
    item.commentsCount += 1;
    if (isVendor) {
      notify(parent.userId, {
        type: 'social',
        title: 'The vendor replied to your comment',
        body: text.slice(0, 80),
        link: `/food/${item.id}`,
      });
    } else {
      const vendor = findById('vendors', item.vendorId);
      notify(vendor?.ownerId, {
        type: 'social',
        title: 'New comment',
        body: `${user.firstName} commented on ${item.name}.`,
        link: '/vendor/engagement',
      });
    }
    persist();
    const usersById = new Map(db.users.map((u) => [u.id, u]));
    return created({ ...serializeComment(comment, user, usersById), replies: [] });
  }),

  http.patch(api('/comments/:id'), async ({ request, params }) => {
    await latency();
    const { user, error } = requireUser(request);
    if (error) return error;
    const comment = findById('comments', params.id);
    if (!comment || comment.removed) return fail(404);
    if (comment.userId !== user.id) return fail(403);
    const body = await readJson(request);
    const text = String(body.body ?? '').trim();
    if (!text) return validationError({ body: 'Write a comment first' });
    if (text.length > COMMENT_MAX)
      return validationError({ body: `Keep it under ${COMMENT_MAX} characters` });
    comment.body = text;
    comment.editedAt = new Date().toISOString();
    persist();
    const usersById = new Map(db.users.map((u) => [u.id, u]));
    return ok(serializeComment(comment, user, usersById));
  }),

  http.delete(api('/comments/:id'), async ({ request, params }) => {
    await latency();
    const { user, error } = requireUser(request);
    if (error) return error;
    const comment = findById('comments', params.id);
    if (!comment) return fail(404);
    if (comment.userId !== user.id) return fail(403);
    comment.removed = true;
    persist();
    return ok({ id: comment.id, removed: true });
  }),

  // ── Reports (moderation queue, FR-SOC-08) ────────────────────────────────
  http.post(api('/reports'), async ({ request }) => {
    await latency();
    const { user, error } = requireUser(request);
    if (error) return error;
    const body = await readJson(request);
    if (!REPORT_TARGETS.includes(body.targetType)) return fail(400);
    const collection = body.targetType === 'comment' ? 'comments' : 'foodItems';
    if (!findById(collection, body.targetId)) return fail(404);
    const reason = String(body.reason ?? '').trim();
    if (!reason) return validationError({ reason: 'Pick a reason' });
    const existing = db.reports.find(
      (r) =>
        r.reporterId === user.id &&
        r.targetId === body.targetId &&
        r.targetType === body.targetType &&
        r.status === 'open',
    );
    if (existing) return ok(existing);
    const report = {
      id: newId('rep'),
      reporterId: user.id,
      targetType: body.targetType,
      targetId: body.targetId,
      reason: reason.slice(0, 200),
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    db.reports.unshift(report);
    persist();
    return created(report);
  }),

  // ── Follows ─────────────────────────────────────────────────────────────
  http.post(api('/vendors/:id/follow'), async ({ request, params }) => {
    await latency();
    return setFollow(request, params.id, true);
  }),

  http.delete(api('/vendors/:id/follow'), async ({ request, params }) => {
    await latency();
    return setFollow(request, params.id, false);
  }),

  http.get(api('/me/follows'), async ({ request }) => {
    await latency();
    const { user, error } = requireUser(request);
    if (error) return error;
    const params = new URL(request.url).searchParams;
    const ctx = catalogueContext(request, params);
    const rows = db.follows
      .filter((f) => f.userId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((f) => findById('vendors', f.vendorId))
      .filter(isVendorVisible)
      .map((v) => serializeVendor(v, ctx));
    return listResponse(paginate(rows, params));
  }),
];
