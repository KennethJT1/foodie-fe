import { http } from 'msw';

import { normalisePhone } from '@/lib/format';

import { db, findById, persist } from '../db';
import { DEMO_OTP, newId } from '../seed/seed';
import {
  getRefreshSession,
  issueAccessToken,
  requireUser,
  sessionUser,
  setRefreshSession,
} from '../utils/auth';
import { api } from '../utils/path';
import { created, fail, latency, noContent, ok, readJson, validationError } from '../utils/respond';

const session = (user) => {
  setRefreshSession(user.id);
  return ok({ accessToken: issueAccessToken(user.id), user: sessionUser(user) });
};

const findByPhone = (phone) => {
  const p = normalisePhone(phone);
  return p ? db.users.find((u) => u.phone === p) : null;
};

const findByIdentifier = (identifier = '') =>
  identifier.includes('@')
    ? db.users.find((u) => u.email === identifier.trim().toLowerCase())
    : findByPhone(identifier);

function blockedResponse(user) {
  if (user.status === 'banned')
    return fail(403, {
      code: 'ACCOUNT_BANNED',
      message: 'This account has been closed. Contact support if you think this is a mistake.',
    });
  if (user.status === 'suspended')
    return fail(403, {
      code: 'ACCOUNT_SUSPENDED',
      message: 'This account is suspended. Contact support to restore it.',
    });
  return null;
}

/** Creates the vendor or rider record that goes with a new account. */
function createRoleProfile(user) {
  const now = new Date().toISOString();
  if (user.role === 'vendor') {
    const vendor = {
      id: newId('ven'),
      ownerId: user.id,
      slug: newId('store').replace('_', '-'),
      name: '',
      type: null,
      description: '',
      logo: null,
      cover: null,
      phone: user.phone,
      email: user.email,
      address: null,
      lat: null,
      lng: null,
      city: null,
      deliveryRadiusKm: 8,
      prepTimeMins: 25,
      isPaused: false,
      openingHours: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
        day,
        open: '09:00',
        close: '21:00',
        closed: false,
      })),
      approvalStatus: 'draft',
      rejectionReason: null,
      rating: 0,
      ratingCount: 0,
      followersCount: 0,
      refundRate: 0,
      bank: null,
      bankChangeRequest: null,
      documents: [],
      onboardingStep: 'type',
      planId: null,
      subscriptionStatus: 'none',
      trialUsed: false,
      createdAt: now,
    };
    db.vendors.push(vendor);
    user.vendorId = vendor.id;
  }
  if (user.role === 'rider') {
    const rider = {
      id: newId('rid'),
      userId: user.id,
      name: user.name,
      phone: user.phone,
      vehicleType: null,
      plateNumber: '',
      licenceNumber: '',
      guarantor: null,
      documents: [],
      bank: null,
      approvalStatus: 'draft',
      rejectionReason: null,
      isOnline: false,
      lat: null,
      lng: null,
      city: null,
      rating: 0,
      ratingCount: 0,
      tripsCount: 0,
      createdAt: now,
    };
    db.riders.push(rider);
    user.riderId = rider.id;
  }
}

export const authHandlers = [
  http.post(api('/auth/register'), async ({ request }) => {
    await latency();
    const body = await readJson(request);
    if (!['customer', 'vendor', 'rider'].includes(body.role))
      return fail(400, { message: 'Pick how you want to use KJT Foodie.' });
    const phone = normalisePhone(body.phone);
    const email = body.email?.trim().toLowerCase() || null;
    const fieldErrors = {};
    if (!phone) fieldErrors.phone = 'Enter a valid Nigerian phone number';
    else if (findByPhone(phone))
      fieldErrors.phone = 'That phone number is already registered. Log in instead?';
    if (email && db.users.some((u) => u.email === email))
      fieldErrors.email = 'That email is already registered. Log in instead?';
    if (!body.password || body.password.length < 8)
      fieldErrors.password = 'Use at least 8 characters';
    if (Object.keys(fieldErrors).length) return validationError(fieldErrors);

    const user = {
      id: newId('usr'),
      role: body.role,
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
      name: `${body.firstName.trim()} ${body.lastName.trim()}`,
      email,
      phone,
      password: body.password,
      avatar: null,
      status: 'active',
      phoneVerified: false,
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    createRoleProfile(user);
    persist();
    return created({ otpRequestId: newId('otp'), phone, expiresInSec: 300 });
  }),

  http.post(api('/auth/otp/request'), async ({ request }) => {
    await latency();
    const { phone, purpose = 'login' } = await readJson(request);
    const p = normalisePhone(phone);
    if (!p) return validationError({ phone: 'Enter a valid Nigerian phone number' });
    if (purpose === 'login' && !findByPhone(p)) {
      return validationError({ phone: 'No account uses this number. Sign up instead?' });
    }
    return ok({ otpRequestId: newId('otp'), phone: p, expiresInSec: 300 });
  }),

  http.post(api('/auth/otp/verify'), async ({ request }) => {
    await latency();
    const { phone, code } = await readJson(request);
    const user = findByPhone(phone);
    if (!user) return validationError({ code: 'That code has expired. Request a new one.' });
    if (code !== DEMO_OTP)
      return validationError({ code: "That code isn't right. Check the SMS and try again." });
    const blocked = blockedResponse(user);
    if (blocked) return blocked;
    user.phoneVerified = true;
    persist();
    return session(user);
  }),

  http.post(api('/auth/login'), async ({ request }) => {
    await latency();
    const { email, password } = await readJson(request);
    const user = db.users.find((u) => u.email === email?.trim().toLowerCase());
    if (!user || user.password !== password) {
      return fail(401, {
        code: 'INVALID_CREDENTIALS',
        message: 'That email or password is wrong. Try again or reset your password.',
      });
    }
    return blockedResponse(user) ?? session(user);
  }),

  // Mock of Google sign-in (FR-ACC-05): signs in or creates a customer for the Google account
  http.post(api('/auth/google'), async ({ request }) => {
    await latency();
    const { email = 'google.user@gmail.com', name = 'Google User' } = await readJson(request);
    let user = db.users.find((u) => u.email === email);
    if (!user) {
      const [firstName, ...rest] = name.split(' ');
      user = {
        id: newId('usr'),
        role: 'customer',
        firstName,
        lastName: rest.join(' ') || 'User',
        name,
        email,
        phone: null,
        password: null,
        avatar: null,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      db.users.push(user);
      persist();
    }
    return blockedResponse(user) ?? session(user);
  }),

  http.post(api('/auth/refresh'), async () => {
    const userId = getRefreshSession();
    const user = userId && findById('users', userId);
    if (!user || user.status === 'banned') {
      setRefreshSession(null);
      return fail(401, { message: 'Please log in to continue.' });
    }
    return session(user);
  }),

  http.post(api('/auth/logout'), async () => {
    setRefreshSession(null);
    return noContent();
  }),

  http.post(api('/auth/password/forgot'), async () => {
    await latency();
    // Same answer whether or not the account exists (no account enumeration)
    return ok({ sent: true, expiresInSec: 600 });
  }),

  http.post(api('/auth/password/reset'), async ({ request }) => {
    await latency();
    const { identifier, code, password } = await readJson(request);
    const user = findByIdentifier(identifier);
    if (!user || code !== DEMO_OTP)
      return validationError({ code: "That code isn't right or has expired." });
    if (!password || password.length < 8)
      return validationError({ password: 'Use at least 8 characters' });
    user.password = password;
    persist();
    return ok({ reset: true });
  }),

  http.get(api('/me'), async ({ request }) => {
    const { user, error } = requireUser(request);
    if (error) return error;
    return ok(sessionUser(user));
  }),

  http.patch(api('/me'), async ({ request }) => {
    await latency();
    const { user, error } = requireUser(request);
    if (error) return error;
    const body = await readJson(request);
    const email = body.email?.trim().toLowerCase();
    if (email && email !== user.email && db.users.some((u) => u.email === email)) {
      return validationError({ email: 'That email is already used by another account.' });
    }
    for (const k of ['firstName', 'lastName', 'avatar'])
      if (body[k] !== undefined) user[k] = body[k];
    if (email !== undefined) user.email = email || null;
    user.name = `${user.firstName} ${user.lastName}`;
    persist();
    return ok(sessionUser(user));
  }),

  // NDPA 2023: a customer can delete their account
  http.delete(api('/me'), async ({ request }) => {
    await latency();
    const { user, error } = requireUser(request, { roles: ['customer'] });
    if (error) return error;
    user.status = 'banned';
    user.name = 'Deleted user';
    user.email = null;
    user.phone = null;
    setRefreshSession(null);
    persist();
    return noContent();
  }),
];
