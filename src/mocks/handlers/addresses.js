import { http } from 'msw';

import { db, persist } from '../db';
import { newId } from '../seed/seed';
import { requireUser } from '../utils/auth';
import { api } from '../utils/path';
import { created, fail, latency, ok, readJson, validationError } from '../utils/respond';

const FIELDS = ['label', 'line1', 'area', 'city', 'state', 'lat', 'lng', 'directions'];

function validate(body) {
  const errors = {};
  if (!String(body.line1 ?? '').trim()) errors.line1 = 'Enter the street address';
  if (!String(body.area ?? '').trim()) errors.area = 'Enter the area';
  if (!String(body.city ?? '').trim()) errors.city = 'Pick a city';
  if (!Number.isFinite(Number(body.lat)) || !Number.isFinite(Number(body.lng)))
    errors.pin = 'Drop a pin on the map';
  return errors;
}

const mine = (user) =>
  db.addresses
    .filter((a) => a.userId === user.id)
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault));

const pick = (body) =>
  Object.fromEntries(
    FIELDS.filter((k) => body[k] !== undefined).map((k) => [
      k,
      k === 'lat' || k === 'lng' ? Number(body[k]) : String(body[k]).trim(),
    ]),
  );

function makeDefault(user, address) {
  db.addresses.forEach((a) => {
    if (a.userId === user.id) a.isDefault = a.id === address.id;
  });
}

export const addressHandlers = [
  http.get(api('/addresses'), async ({ request }) => {
    await latency();
    const { user, error } = requireUser(request, { roles: ['customer'] });
    if (error) return error;
    return ok(mine(user));
  }),

  http.post(api('/addresses'), async ({ request }) => {
    await latency();
    const { user, error } = requireUser(request, { roles: ['customer'] });
    if (error) return error;
    const body = await readJson(request);
    const errors = validate(body);
    if (Object.keys(errors).length) return validationError(errors);
    const isFirst = mine(user).length === 0;
    const address = {
      id: newId('adr'),
      userId: user.id,
      label: 'Home',
      state: '',
      ...pick(body),
      isDefault: isFirst || Boolean(body.isDefault),
    };
    db.addresses.push(address);
    if (address.isDefault) makeDefault(user, address);
    persist();
    return created(address);
  }),

  http.patch(api('/addresses/:id'), async ({ request, params }) => {
    await latency();
    const { user, error } = requireUser(request, { roles: ['customer'] });
    if (error) return error;
    const address = db.addresses.find((a) => a.id === params.id && a.userId === user.id);
    if (!address) return fail(404);
    const body = await readJson(request);
    const errors = validate({ ...address, ...body });
    if (Object.keys(errors).length) return validationError(errors);
    Object.assign(address, pick(body));
    if (body.isDefault) makeDefault(user, address);
    persist();
    return ok(address);
  }),

  http.post(api('/addresses/:id/default'), async ({ request, params }) => {
    await latency();
    const { user, error } = requireUser(request, { roles: ['customer'] });
    if (error) return error;
    const address = db.addresses.find((a) => a.id === params.id && a.userId === user.id);
    if (!address) return fail(404);
    makeDefault(user, address);
    persist();
    return ok(address);
  }),

  http.delete(api('/addresses/:id'), async ({ request, params }) => {
    await latency();
    const { user, error } = requireUser(request, { roles: ['customer'] });
    if (error) return error;
    const index = db.addresses.findIndex((a) => a.id === params.id && a.userId === user.id);
    if (index === -1) return fail(404);
    const [removed] = db.addresses.splice(index, 1);
    if (removed.isDefault) {
      const next = mine(user)[0];
      if (next) makeDefault(user, next);
    }
    persist();
    return ok({ id: removed.id, deleted: true });
  }),
];
