import { http } from 'msw';

import { db } from '../db';
import { applyListQuery, listResponse } from '../utils/list';
import { api } from '../utils/path';
import { latency, ok, readJson, validationError } from '../utils/respond';

/** Endpoints used only by the /dev demo pages. */
export const devHandlers = [
  http.get(api('/dev/people'), async ({ request }) => {
    await latency();
    const rows = db.users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt,
    }));
    return listResponse(
      applyListQuery(rows, new URL(request.url).searchParams, {
        searchFields: ['name', 'email', 'phone'],
        filters: { role: 'role', status: 'status' },
      }),
    );
  }),

  http.post(api('/dev/demo-form'), async ({ request }) => {
    await latency();
    const body = await readJson(request);
    const fieldErrors = {};
    if (db.users.some((u) => u.email === body.email?.toLowerCase())) {
      fieldErrors.email = 'That email is already registered. Log in instead?';
    }
    if (body.price > 100000) fieldErrors.price = 'That price looks too high for one plate';
    if (Object.keys(fieldErrors).length) return validationError(fieldErrors);
    return ok({ saved: true });
  }),
];
