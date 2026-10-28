import { http } from 'msw';

import { ORDER_STATUS } from '@/constants/order-status';
import { PERMISSIONS } from '@/constants/permissions';

import { db, findById, persist } from '../db';
import { scheduleChatReply } from '../realtime';
import { newId } from '../seed/seed';
import { serverEmit } from '../socket';
import { notify, permissionsFor, requireUser } from '../utils/auth';
import { applyListQuery, listResponse } from '../utils/list';
import { api } from '../utils/path';
import { created, fail, latency, ok, readJson, validationError } from '../utils/respond';

const ROLES = ['customer', 'vendor', 'rider'];
const text = (v, max) =>
  String(v ?? '')
    .trim()
    .slice(0, max);

/** Internal notes never leave the support team. */
const publicTicket = (t) => ({ ...t, messages: t.messages.filter((m) => !m.internal) });

function ownTicket(request, id) {
  const { user, error } = requireUser(request, { roles: ROLES });
  if (error) return { error };
  const t = findById('tickets', id);
  if (!t || t.userId !== user.id) return { error: fail(404) };
  return { user, ticket: t };
}

/** Orders a user can attach to a ticket. */
const canUseOrder = (user, order) =>
  order &&
  ((user.role === 'customer' && order.customerId === user.id) ||
    (user.role === 'vendor' && order.vendorId === user.vendorId) ||
    (user.role === 'rider' && order.riderId === user.riderId));

function notifyAgents(ticket, title) {
  const agents = ticket.assigneeId
    ? [findById('users', ticket.assigneeId)]
    : db.users.filter(
        (u) => u.role === 'admin' && permissionsFor(u).includes(PERMISSIONS.SUPPORT_MANAGE),
      );
  agents.forEach((a) =>
    notify(a?.id, {
      type: 'support',
      title,
      body: `#${ticket.number}: ${ticket.subject}`,
      link: `/admin/support?ticket=${ticket.id}`,
    }),
  );
}

// ── Customer–rider chat during a delivery ───────────────────────────────────
const CHAT_OPEN = [ORDER_STATUS.RIDER_ASSIGNED, ORDER_STATUS.PICKED_UP];

function chatParty(request, orderId) {
  const { user, error } = requireUser(request, { roles: ['customer', 'rider'] });
  if (error) return { error };
  const order = findById('orders', orderId);
  const isParty =
    order &&
    ((user.role === 'customer' && order.customerId === user.id) ||
      (user.role === 'rider' && order.riderId === user.riderId));
  if (!isParty) return { error: fail(404) };
  return { user, order };
}

export const supportHandlers = [
  // ── My support tickets (customers, vendors, riders) ────────────────────────
  http.get(api('/support/tickets'), async ({ request }) => {
    await latency();
    const { user, error } = requireUser(request, { roles: ROLES });
    if (error) return error;
    const rows = db.tickets
      .filter((t) => t.userId === user.id)
      .map(({ messages, ...t }) => ({
        ...t,
        lastMessage: messages.filter((m) => !m.internal).at(-1)?.body ?? '',
        hasReply: messages.at(-1)?.authorRole === 'admin' && !messages.at(-1)?.internal,
      }));
    return listResponse(
      applyListQuery(rows, new URL(request.url).searchParams, {
        searchFields: ['subject', 'number'],
        filters: { status: 'status' },
        dateField: 'updatedAt',
        defaultSort: '-updatedAt',
      }),
    );
  }),

  http.post(api('/support/tickets'), async ({ request }) => {
    await latency();
    const { user, error } = requireUser(request, { roles: ROLES });
    if (error) return error;
    const body = await readJson(request);
    const errors = {};
    const subject = text(body.subject, 120);
    const message = text(body.body, 2000);
    if (subject.length < 4) errors.subject = 'Say what it is about in a few words';
    if (message.length < 10) errors.body = 'Tell us a bit more so we can help';
    const order = body.orderId ? findById('orders', body.orderId) : null;
    if (body.orderId && !canUseOrder(user, order)) errors.orderId = 'Pick one of your orders';
    if (Object.keys(errors).length) return validationError(errors);
    const now = new Date().toISOString();
    const ticket = {
      id: newId('tkt'),
      number: Math.max(999, ...db.tickets.map((t) => t.number)) + 1,
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      orderId: order?.id ?? null,
      orderCode: order?.code ?? null,
      subject,
      status: 'open',
      priority: /refund|money|debit|paid|payout/i.test(`${subject} ${message}`) ? 'high' : 'normal',
      assigneeId: null,
      assigneeName: null,
      messages: [
        {
          id: newId('msg'),
          authorId: user.id,
          authorName: user.name,
          authorRole: user.role,
          body: message,
          internal: false,
          createdAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };
    db.tickets.unshift(ticket);
    notifyAgents(ticket, 'New support ticket');
    persist();
    return created(publicTicket(ticket));
  }),

  http.get(api('/support/tickets/:id'), async ({ request, params }) => {
    await latency();
    const { ticket, error } = ownTicket(request, params.id);
    if (error) return error;
    return ok(publicTicket(ticket));
  }),

  http.post(api('/support/tickets/:id/messages'), async ({ request, params }) => {
    await latency();
    const { user, ticket, error } = ownTicket(request, params.id);
    if (error) return error;
    const message = text((await readJson(request)).body, 2000);
    if (!message) return validationError({ body: 'Write a message first' });
    if (ticket.status === 'closed')
      return fail(409, {
        message: 'This ticket is closed. Open a new one if you still need help.',
      });
    const now = new Date().toISOString();
    ticket.messages.push({
      id: newId('msg'),
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role,
      body: message,
      internal: false,
      createdAt: now,
    });
    ticket.updatedAt = now;
    // A reply re-opens a ticket that was waiting on them or already resolved
    if (['pending', 'resolved'].includes(ticket.status)) ticket.status = 'open';
    notifyAgents(ticket, 'Customer replied');
    persist();
    return ok(publicTicket(ticket));
  }),

  http.post(api('/support/tickets/:id/resolve'), async ({ request, params }) => {
    await latency();
    const { ticket, error } = ownTicket(request, params.id);
    if (error) return error;
    ticket.status = 'resolved';
    ticket.updatedAt = new Date().toISOString();
    persist();
    return ok(publicTicket(ticket));
  }),

  // ── Delivery chat ────────────────────────────────────────────────────────
  http.get(api('/orders/:id/chat'), async ({ request, params }) => {
    await latency();
    const { order, error } = chatParty(request, params.id);
    if (error) return error;
    return ok({
      isOpen: CHAT_OPEN.includes(order.status),
      messages: db.chatMessages.filter((m) => m.orderId === order.id),
    });
  }),

  http.post(api('/orders/:id/chat'), async ({ request, params }) => {
    await latency();
    const { user, order, error } = chatParty(request, params.id);
    if (error) return error;
    if (!CHAT_OPEN.includes(order.status))
      return fail(409, { message: 'Chat is only open while the order is on its way.' });
    const message = text((await readJson(request)).body, 500);
    if (!message) return validationError({ body: 'Write a message first' });
    const m = {
      id: newId('chm'),
      orderId: order.id,
      senderId: user.id,
      senderRole: user.role,
      senderName: user.role === 'rider' ? user.name : user.firstName,
      body: message,
      createdAt: new Date().toISOString(),
    };
    db.chatMessages.push(m);
    const other =
      user.role === 'customer' ? findById('riders', order.riderId)?.userId : order.customerId;
    notify(other, {
      type: 'chat',
      title: user.role === 'customer' ? 'Message from your customer' : 'Message from your rider',
      body: message.slice(0, 80),
      link: user.role === 'customer' ? '/rider/delivery' : `/account/orders/${order.id}`,
    });
    persist();
    serverEmit('chat:message', m);
    scheduleChatReply(order, m);
    return created(m);
  }),
];
