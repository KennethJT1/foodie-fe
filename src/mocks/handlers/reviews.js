import { http } from 'msw';

import { db, findById, persist } from '../db';
import { newId } from '../seed/seed';
import { notify, requireUser } from '../utils/auth';
import { applyListQuery, listResponse } from '../utils/list';
import { api } from '../utils/path';
import { created, fail, latency, ok, readJson, validationError } from '../utils/respond';

const TARGETS = { vendor: 'vendors', rider: 'riders' };

export const reviewHandlers = [
  // Public reviews of a vendor or rider
  http.get(api('/reviews'), async ({ request }) => {
    await latency();
    const params = new URL(request.url).searchParams;
    return listResponse(
      applyListQuery(db.reviews, params, {
        filters: { targetType: 'targetType', targetId: 'targetId', rating: 'rating' },
        searchFields: ['comment', 'userName'],
      }),
    );
  }),

  // FR-SOC-06: rate vendor and rider after delivery, verified orders only
  http.post(api('/orders/:id/reviews'), async ({ request, params }) => {
    await latency();
    const { user, error } = requireUser(request, { roles: ['customer'] });
    if (error) return error;
    const order = findById('orders', params.id);
    if (!order || order.customerId !== user.id) return fail(404);
    if (order.status !== 'delivered')
      return fail(409, { message: 'You can rate an order once it has been delivered.' });
    const body = await readJson(request);
    const targetType = body.targetType;
    if (!TARGETS[targetType]) return fail(400);
    const flag = targetType === 'vendor' ? 'ratedVendor' : 'ratedRider';
    if (order[flag]) return fail(409, { message: `You've already rated this ${targetType}.` });
    const targetId = targetType === 'vendor' ? order.vendorId : order.riderId;
    const target = targetId && findById(TARGETS[targetType], targetId);
    if (!target) return fail(404);
    const rating = Math.round(Number(body.rating));
    if (!(rating >= 1 && rating <= 5)) return validationError({ rating: 'Pick 1 to 5 stars' });
    const comment = String(body.comment ?? '').trim();
    if (comment.length > 500) return validationError({ comment: 'Keep it under 500 characters' });

    const review = {
      id: newId('rev'),
      orderId: order.id,
      targetType,
      targetId,
      userId: user.id,
      userName: user.name,
      rating,
      comment,
      reply: null,
      createdAt: new Date().toISOString(),
    };
    db.reviews.unshift(review);
    target.rating = Number(
      ((target.rating * target.ratingCount + rating) / (target.ratingCount + 1)).toFixed(2),
    );
    target.ratingCount += 1;
    order[flag] = true;
    if (targetType === 'vendor') {
      notify(target.ownerId, {
        type: 'review',
        title: `New ${rating}-star review`,
        body: comment || `${user.firstName} rated order KJT-${order.code}.`,
        link: '/vendor/engagement',
      });
    }
    persist();
    return created(review);
  }),
  // The vendor answers a review of their store once
  http.post(api('/reviews/:id/reply'), async ({ request, params }) => {
    await latency();
    const { user, error } = requireUser(request, { roles: ['vendor'] });
    if (error) return error;
    const review = findById('reviews', params.id);
    if (!review || review.targetType !== 'vendor' || review.targetId !== user.vendorId)
      return fail(404);
    if (review.reply) return fail(409, { message: 'You have already replied to this review.' });
    const body = String((await readJson(request)).body ?? '').trim();
    if (!body) return validationError({ body: 'Write a reply first' });
    if (body.length > 500) return validationError({ body: 'Keep it under 500 characters' });
    review.reply = { body, createdAt: new Date().toISOString() };
    notify(review.userId, {
      type: 'review',
      title: 'The vendor replied to your review',
      body: body.slice(0, 80),
      link: `/account/orders/${review.orderId}`,
    });
    persist();
    return ok(review);
  }),
];
