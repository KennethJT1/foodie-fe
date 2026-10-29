/**
 * Every failed request becomes this one shape, so forms and toasts read errors the same way.
 * @typedef {{ status: number, code: string, message: string, fieldErrors: Record<string, string> }} ApiError
 */

const FRIENDLY = {
  0: "We couldn't reach KJT Foodie. Check your connection and try again.",
  401: 'Your session has ended. Please log in again.',
  403: "You don't have access to do that.",
  404: "We couldn't find that.",
  429: 'Too many tries. Please wait a moment and try again.',
  500: 'Something went wrong on our side. Please try again.',
};

/**
 * Normalises an Axios error (or anything thrown) to an ApiError.
 * The backend envelope is `{ success: false, error: { code, message, fieldErrors } }`.
 * @returns {ApiError}
 */
export function normaliseError(error) {
  if (error?.isApiError) return error;
  const response = error?.response;
  const status = response?.status ?? 0;
  const body = response?.data?.error ?? {};
  const fallback = FRIENDLY[status] ?? (status >= 500 ? FRIENDLY[500] : 'Something went wrong.');
  return {
    isApiError: true,
    status,
    code: body.code ?? (status === 0 ? 'NETWORK_ERROR' : 'UNKNOWN_ERROR'),
    message: body.message || fallback,
    fieldErrors: body.fieldErrors ?? {},
  };
}

/** The message to show a person for any error. */
export const getErrorMessage = (error) => normaliseError(error).message;
