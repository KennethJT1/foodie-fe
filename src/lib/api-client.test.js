import { api, unwrap, unwrapList } from './api-client';

/** Answers every request with `body` as if the server returned it with `status`. */
const respondWith =
  (body, status = 200) =>
  (config) =>
    Promise.resolve({ data: body, status, statusText: 'OK', headers: {}, config });

describe('api client response guard', () => {
  it('rejects an HTML page served in place of the API (SPA rewrite on a static host)', async () => {
    const html = '<!doctype html><html><body><div id="root"></div></body></html>';
    await expect(api.get('/feed', { adapter: respondWith(html) })).rejects.toMatchObject({
      isApiError: true,
      code: 'BAD_RESPONSE',
    });
  });

  it('passes the JSON envelope through', async () => {
    const res = await api.get('/feed', { adapter: respondWith({ success: true, data: [1] }) });
    expect(unwrapList(res).data).toEqual([1]);
  });
});

describe('unwrapList / unwrap', () => {
  it('always returns an array for list data', () => {
    expect(unwrapList({ data: {} })).toEqual({ data: [], meta: {} });
    expect(unwrapList(undefined)).toEqual({ data: [], meta: {} });
    expect(unwrapList({ data: { data: null, meta: { nextCursor: 'x' } } })).toEqual({
      data: [],
      meta: { nextCursor: 'x' },
    });
  });

  it('does not throw on a missing body', () => {
    expect(unwrap(undefined)).toBeUndefined();
  });
});
