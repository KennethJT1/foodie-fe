import { http } from 'msw';

import { db, persist } from '../db';
import { requireUser } from '../utils/auth';
import { applyListQuery, listResponse } from '../utils/list';
import { api } from '../utils/path';
import { fail, latency, ok } from '../utils/respond';

export const notificationHandlers = [
  http.get(api('/notifications'), async ({ request }) => {
    await latency();
    const { user, error } = requireUser(request);
    if (error) return error;
    const params = new URL(request.url).searchParams;
    const rows = db.notifications.filter((n) => n.userId === user.id);
    return listResponse(
      applyListQuery(rows, params, {
        filters: { type: 'type', unread: (n, [v]) => (v === 'true' ? !n.readAt : true) },
      }),
    );
  }),

  http.get(api('/notifications/unread-count'), ({ request }) => {
    const { user, error } = requireUser(request);
    if (error) return error;
    return ok({ count: db.notifications.filter((n) => n.userId === user.id && !n.readAt).length });
  }),

  http.post(api('/notifications/:id/read'), ({ request, params }) => {
    const { user, error } = requireUser(request);
    if (error) return error;
    const n = db.notifications.find((x) => x.id === params.id && x.userId === user.id);
    if (!n) return fail(404);
    n.readAt ??= new Date().toISOString();
    persist();
    return ok(n);
  }),

  http.post(api('/notifications/read-all'), ({ request }) => {
    const { user, error } = requireUser(request);
    if (error) return error;
    const now = new Date().toISOString();
    db.notifications.forEach((n) => {
      if (n.userId === user.id && !n.readAt) n.readAt = now;
    });
    persist();
    return ok({ done: true });
  }),
];
