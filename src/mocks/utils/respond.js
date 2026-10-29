import { HttpResponse, delay } from 'msw';

/** Same envelopes as the backend (Backend Architecture, section 5). */
export const ok = (data, init) => HttpResponse.json({ success: true, data }, init);

export const created = (data) => HttpResponse.json({ success: true, data }, { status: 201 });

export const noContent = () => new HttpResponse(null, { status: 204 });

const DEFAULT_MESSAGES = {
  400: 'That request was not valid.',
  401: 'Please log in to continue.',
  403: "You don't have access to do that.",
  404: "We couldn't find that.",
  409: 'That conflicts with something that already exists.',
  422: 'Please check the highlighted fields.',
  429: 'Too many tries. Please wait a moment.',
  500: 'Something went wrong on our side.',
};

const DEFAULT_CODES = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'VALIDATION_ERROR',
  429: 'RATE_LIMITED',
  500: 'INTERNAL_ERROR',
};

/**
 * @param {number} status
 * @param {{ code?: string, message?: string, fieldErrors?: Record<string,string> }} [opts]
 */
export function fail(status, { code, message, fieldErrors } = {}) {
  return HttpResponse.json(
    {
      success: false,
      error: {
        code: code ?? DEFAULT_CODES[status] ?? 'ERROR',
        message: message ?? DEFAULT_MESSAGES[status] ?? 'Something went wrong.',
        ...(fieldErrors ? { fieldErrors } : {}),
      },
    },
    { status },
  );
}

export const validationError = (fieldErrors, message) => fail(422, { fieldErrors, message });

const isTest = import.meta.env.MODE === 'test';

/** Realistic latency (300–800 ms) so loading states get built; none in tests. */
export async function latency() {
  if (isTest) return;
  await delay(300 + Math.floor(Math.random() * 500));
}

/**
 * Occasionally fails reads so error states get built. Off by default; turn on with
 * localStorage.setItem('kjt-mock-chaos', '0.1') for a 10% failure rate.
 */
export function chaos() {
  if (isTest || typeof window === 'undefined') return null;
  const rate = Number(window.localStorage.getItem('kjt-mock-chaos') ?? 0);
  return rate > 0 && Math.random() < rate ? fail(500) : null;
}

/** Reads a JSON body safely. */
export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
