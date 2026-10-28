import { getErrorMessage, normaliseError } from './api-error';

describe('normaliseError', () => {
  it('reads the backend error envelope', () => {
    const err = {
      response: {
        status: 422,
        data: {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Check the form',
            fieldErrors: { email: 'Enter a valid email address' },
          },
        },
      },
    };
    expect(normaliseError(err)).toEqual({
      isApiError: true,
      status: 422,
      code: 'VALIDATION_ERROR',
      message: 'Check the form',
      fieldErrors: { email: 'Enter a valid email address' },
    });
  });

  it('gives a friendly message for network failures', () => {
    const result = normaliseError(new Error('Network Error'));
    expect(result.status).toBe(0);
    expect(result.code).toBe('NETWORK_ERROR');
    expect(result.message).toMatch(/couldn't reach/);
  });

  it('falls back for server errors without a body', () => {
    expect(getErrorMessage({ response: { status: 503, data: {} } })).toMatch(/on our side/);
  });

  it('passes through errors that are already normalised', () => {
    const e = normaliseError({ response: { status: 404, data: {} } });
    expect(normaliseError(e)).toBe(e);
  });
});
