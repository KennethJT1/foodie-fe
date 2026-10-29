import { http } from 'msw';

import { PERMISSIONS } from '@/constants/permissions';
import { normalisePhone } from '@/lib/format';

import { db, findById, persist } from '../db';
import { newId } from '../seed/seed';
import { notify, permissionsFor, requireUser } from '../utils/auth';
import { api } from '../utils/path';
import { created, fail, latency, noContent, ok, readJson, validationError } from '../utils/respond';

/** Wizard order (FR-VEN-01). `submitted` comes after review. */
const STEPS = ['type', 'business', 'location', 'documents', 'bank', 'review'];
const EDITABLE = ['draft', 'rejected'];

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const requiredDocsFor = (type) => (type ? (db.requiredDocuments[type] ?? []) : []);

/** Account name for a bank account. Numbers ending in 0000 are "not found" so errors get built. */
export function resolveAccount(user, { bankCode, accountNumber }) {
  const bank = db.banks.find((b) => b.code === bankCode);
  if (!bank) return { fieldErrors: { bankCode: 'Pick your bank' } };
  if (!/^\d{10}$/.test(accountNumber ?? ''))
    return { fieldErrors: { accountNumber: 'Enter the 10-digit account number' } };
  if (accountNumber.endsWith('0000'))
    return {
      fieldErrors: {
        accountNumber: "We couldn't find that account. Check the number and the bank.",
      },
    };
  return {
    account: {
      bankCode,
      bankName: bank.name,
      accountNumber,
      accountName: user.name.toUpperCase(),
    },
  };
}

function serializeOnboarding(vendor) {
  return {
    step: vendor.onboardingStep,
    approvalStatus: vendor.approvalStatus,
    rejectionReason: vendor.rejectionReason,
    submittedAt: vendor.submittedAt ?? null,
    approvedAt: vendor.approvedAt ?? null,
    type: vendor.type,
    name: vendor.name,
    slug: vendor.slug,
    description: vendor.description,
    phone: vendor.phone,
    logo: vendor.logo,
    cover: vendor.cover,
    address: vendor.address,
    lat: vendor.lat,
    lng: vendor.lng,
    deliveryRadiusKm: vendor.deliveryRadiusKm,
    prepTimeMins: vendor.prepTimeMins,
    documents: vendor.documents,
    requiredDocuments: requiredDocsFor(vendor.type),
    bank: vendor.bank,
  };
}

function ownVendor(request, { editable = false } = {}) {
  const { user, error } = requireUser(request, { roles: ['vendor'] });
  if (error) return { error };
  const vendor = findById('vendors', user.vendorId);
  if (!vendor) return { error: fail(404) };
  if (editable && !EDITABLE.includes(vendor.approvalStatus))
    return {
      error: fail(409, {
        code: 'ALREADY_SUBMITTED',
        message: 'Your details are with our team. Contact support to change them.',
      }),
    };
  return { user, vendor };
}

const missingDocs = (vendor) =>
  requiredDocsFor(vendor.type).filter((d) => !vendor.documents.some((x) => x.type === d.type));

/** Validates and applies one wizard step. Returns field errors, or null when saved. */
function applyStep(user, vendor, step, body) {
  const errors = {};
  if (step === 'type') {
    if (!['restaurant', 'home_cook'].includes(body.type))
      errors.type = 'Pick what kind of vendor you are';
    else {
      vendor.type = body.type;
      // Documents for the other type no longer count
      const wanted = requiredDocsFor(body.type).map((d) => d.type);
      vendor.documents = vendor.documents.filter((d) => wanted.includes(d.type));
    }
  }
  if (step === 'business') {
    const name = String(body.name ?? '').trim();
    const slug = slugify(name);
    if (name.length < 2) errors.name = 'Enter your business name';
    else if (db.vendors.some((v) => v.id !== vendor.id && v.slug === slug))
      errors.name = 'Another store already uses that name. Try adding your area.';
    const description = String(body.description ?? '').trim();
    if (description.length > 300) errors.description = 'Keep it under 300 characters';
    const phone = normalisePhone(body.phone);
    if (!phone) errors.phone = 'Enter a valid Nigerian phone number';
    if (!Object.keys(errors).length)
      Object.assign(vendor, {
        name,
        slug,
        description,
        phone,
        logo: body.logo ?? null,
        cover: body.cover ?? null,
      });
  }
  if (step === 'location') {
    const a = body.address ?? {};
    if (!a.line1?.trim()) errors['address.line1'] = 'Enter the street address';
    if (!a.area?.trim()) errors['address.area'] = 'Enter the area';
    if (!a.city) errors['address.city'] = 'Pick a city';
    if (body.lat == null || body.lng == null) errors.pin = 'Drop a pin where riders pick up food';
    const radius = Number(body.deliveryRadiusKm);
    if (!(radius >= 1 && radius <= 30)) errors.deliveryRadiusKm = 'Pick a delivery radius';
    const prep = Number(body.prepTimeMins);
    if (!(prep >= 5 && prep <= 120)) errors.prepTimeMins = 'Pick a usual preparation time';
    if (!Object.keys(errors).length)
      Object.assign(vendor, {
        address: { line1: a.line1.trim(), area: a.area.trim(), city: a.city, state: a.state },
        city: a.city,
        lat: body.lat,
        lng: body.lng,
        deliveryRadiusKm: radius,
        prepTimeMins: prep,
      });
  }
  if (step === 'documents') {
    for (const d of missingDocs(vendor)) errors[d.type] = `Upload your ${d.label.split(' (')[0]}`;
  }
  if (step === 'bank') {
    const { account, fieldErrors } = resolveAccount(user, body);
    if (fieldErrors) Object.assign(errors, fieldErrors);
    else vendor.bank = { ...account, verified: true };
  }
  return Object.keys(errors).length ? errors : null;
}

function notifyOnboardingAdmins(vendor) {
  db.users
    .filter((u) => u.role === 'admin' && permissionsFor(u).includes(PERMISSIONS.VENDORS_APPROVE))
    .forEach((u) =>
      notify(u.id, {
        type: 'vendor_submitted',
        title: 'New vendor to review',
        body: `${vendor.name} sent their documents for approval.`,
        link: `/admin/vendors/${vendor.id}`,
      }),
    );
}

export const onboardingHandlers = [
  http.get(api('/vendor/onboarding'), async ({ request }) => {
    await latency();
    const { vendor, error } = ownVendor(request);
    if (error) return error;
    return ok(serializeOnboarding(vendor));
  }),

  // Saves one step: { step, ...fields }. Moves the saved progress forward, never back.
  http.patch(api('/vendor/onboarding'), async ({ request }) => {
    await latency();
    const { user, vendor, error } = ownVendor(request, { editable: true });
    if (error) return error;
    const body = await readJson(request);
    if (!STEPS.slice(0, -1).includes(body.step)) return fail(400);
    if (body.step !== 'type' && !vendor.type)
      return validationError({ type: 'Pick what kind of vendor you are first' });
    const errors = applyStep(user, vendor, body.step, body);
    if (errors) return validationError(errors);
    const next = STEPS[STEPS.indexOf(body.step) + 1];
    const reached = STEPS.indexOf(vendor.onboardingStep);
    if (vendor.onboardingStep !== 'submitted' && STEPS.indexOf(next) > reached)
      vendor.onboardingStep = next;
    persist();
    return ok(serializeOnboarding(vendor));
  }),

  http.post(api('/vendor/onboarding/submit'), async ({ request }) => {
    await latency();
    const { vendor, error } = ownVendor(request, { editable: true });
    if (error) return error;
    const incomplete =
      !vendor.type ||
      !vendor.name ||
      vendor.lat == null ||
      !vendor.bank?.verified ||
      missingDocs(vendor).length > 0;
    if (incomplete)
      return fail(422, {
        message: 'Some steps are not finished yet. Check each step and try again.',
      });
    Object.assign(vendor, {
      approvalStatus: 'pending',
      rejectionReason: null,
      submittedAt: new Date().toISOString(),
      onboardingStep: 'submitted',
    });
    notifyOnboardingAdmins(vendor);
    persist();
    return ok(serializeOnboarding(vendor));
  }),

  // Documents arrive as uploaded file URLs (data URLs on mocks). One per type.
  http.post(api('/vendor/documents'), async ({ request }) => {
    await latency();
    const { vendor, error } = ownVendor(request, { editable: true });
    if (error) return error;
    const { type, url } = await readJson(request);
    const required = requiredDocsFor(vendor.type).find((d) => d.type === type);
    if (!required) return validationError({ type: 'Pick which document this is' });
    if (!url) return validationError({ url: 'Add a photo or scan of the document' });
    const doc = {
      id: newId('doc'),
      type,
      label: required.label,
      url,
      uploadedAt: new Date().toISOString(),
    };
    vendor.documents = [...vendor.documents.filter((d) => d.type !== type), doc];
    persist();
    return created(doc);
  }),

  http.delete(api('/vendor/documents/:id'), async ({ request, params }) => {
    await latency();
    const { vendor, error } = ownVendor(request, { editable: true });
    if (error) return error;
    if (!vendor.documents.some((d) => d.id === params.id)) return fail(404);
    vendor.documents = vendor.documents.filter((d) => d.id !== params.id);
    persist();
    return noContent();
  }),

  http.get(api('/banks'), async () => {
    await latency();
    return ok(db.banks);
  }),

  http.post(api('/banks/resolve'), async ({ request }) => {
    await latency();
    const { user, error } = requireUser(request);
    if (error) return error;
    const { account, fieldErrors } = resolveAccount(user, await readJson(request));
    if (fieldErrors) return validationError(fieldErrors);
    return ok(account);
  }),
];
