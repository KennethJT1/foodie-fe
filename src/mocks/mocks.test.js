import { api } from '@/lib/api-client';

import { db } from './db';
import { applyListQuery } from './utils/list';

describe('mock API', () => {
  it('answers GET /health', async () => {
    const res = await api.get('/health');
    expect(res.data).toMatchObject({ success: true, data: { status: 'ok' } });
  });

  it('paginates GET /categories with the list envelope', async () => {
    const res = await api.get('/categories', { params: { page: 2, limit: 5 } });
    expect(res.data.success).toBe(true);
    expect(res.data.data).toHaveLength(5);
    expect(res.data.meta).toMatchObject({ page: 2, limit: 5, total: 12, totalPages: 3 });
  });

  it('searches categories', async () => {
    const res = await api.get('/categories', { params: { search: 'rice' } });
    expect(res.data.data.map((c) => c.slug)).toEqual(['rice']);
  });
});

describe('seed data', () => {
  it('has the demo accounts', () => {
    const emails = db.users.map((u) => u.email);
    for (const email of [
      'customer@kjtfoodie.test',
      'vendor@kjtfoodie.test',
      'rider@kjtfoodie.test',
      'super@kjtfoodie.test',
    ]) {
      expect(emails).toContain(email);
    }
  });

  it('keeps order money consistent', () => {
    for (const o of db.orders.slice(0, 50)) {
      expect(o.total).toBe(o.subtotal + o.deliveryFee + o.processingFee);
      expect(o.subtotal).toBe(o.items.reduce((s, l) => s + l.lineTotal, 0));
    }
  });
});

describe('applyListQuery', () => {
  const rows = [
    { id: 1, name: 'Jollof', status: 'paid', createdAt: '2026-10-01T10:00:00Z', total: 300 },
    { id: 2, name: 'Amala', status: 'delivered', createdAt: '2026-10-05T10:00:00Z', total: 100 },
    { id: 3, name: 'Suya', status: 'paid', createdAt: '2026-10-09T10:00:00Z', total: 200 },
  ];
  const q = (s) => new URLSearchParams(s);

  it('filters with comma-separated values', () => {
    const r = applyListQuery(rows, q('status=paid'), { filters: { status: 'status' } });
    expect(r.data.map((x) => x.id)).toEqual([3, 1]);
    const r2 = applyListQuery(rows, q('status=paid,delivered'), { filters: { status: 'status' } });
    expect(r2.meta.total).toBe(3);
  });

  it('sorts ascending and descending', () => {
    expect(applyListQuery(rows, q('sort=total')).data.map((x) => x.id)).toEqual([2, 3, 1]);
    expect(applyListQuery(rows, q('sort=-total')).data.map((x) => x.id)).toEqual([1, 3, 2]);
  });

  it('filters by date range', () => {
    const r = applyListQuery(rows, q('from=2026-10-02&to=2026-10-05'));
    expect(r.data.map((x) => x.id)).toEqual([2]);
  });

  it('clamps the page', () => {
    const r = applyListQuery(rows, q('page=9&limit=2'));
    expect(r.meta).toMatchObject({ page: 2, totalPages: 2, hasNextPage: false });
  });
});
