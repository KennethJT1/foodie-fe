import { HttpResponse } from 'msw';

/**
 * Applies list query params exactly like the backend's `buildListQuery`:
 *   page, limit (max 100), sort ("-field" = descending, comma for several), search,
 *   per-field filters (comma = any of), from / to (on `dateField`).
 *
 * @param {object[]} rows
 * @param {URLSearchParams} params
 * @param {{ searchFields?: string[], filters?: Record<string, string | ((row: object, values: string[]) => boolean)>,
 *   dateField?: string, defaultSort?: string }} [config]
 */
export function applyListQuery(rows, params, config = {}) {
  const {
    searchFields = [],
    filters = {},
    dateField = 'createdAt',
    defaultSort = '-createdAt',
  } = config;
  let result = rows;

  const search = params.get('search')?.trim().toLowerCase();
  if (search && searchFields.length) {
    result = result.filter((row) =>
      searchFields.some((f) =>
        String(getPath(row, f) ?? '')
          .toLowerCase()
          .includes(search),
      ),
    );
  }

  for (const [param, field] of Object.entries(filters)) {
    const raw = params.get(param);
    if (raw == null || raw === '') continue;
    const values = raw.split(',');
    result = result.filter((row) =>
      typeof field === 'function'
        ? field(row, values)
        : values.includes(String(getPath(row, field))),
    );
  }

  const from = params.get('from');
  const to = params.get('to');
  if (from) result = result.filter((r) => getPath(r, dateField) >= startOfDay(from));
  if (to) result = result.filter((r) => getPath(r, dateField) <= endOfDay(to));

  const sort = params.get('sort') || defaultSort;
  if (sort) result = sortRows(result, sort);

  return paginate(result, params);
}

export function paginate(rows, params) {
  const limit = clamp(Number(params.get('limit')) || 20, 1, 100);
  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const page = clamp(Number(params.get('page')) || 1, 1, totalPages);
  const start = (page - 1) * limit;
  return {
    data: rows.slice(start, start + limit),
    meta: { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
  };
}

/** Cursor pagination for feeds and comments: `cursor` is the index of the next row. */
export function cursorPaginate(rows, params, defaultLimit = 10) {
  const limit = clamp(Number(params.get('limit')) || defaultLimit, 1, 50);
  const start = Number(params.get('cursor')) || 0;
  const data = rows.slice(start, start + limit);
  const next = start + limit < rows.length ? String(start + limit) : null;
  return { data, meta: { nextCursor: next, limit, total: rows.length } };
}

/** `{ success, data, meta }` envelope. */
export const listResponse = ({ data, meta }) => HttpResponse.json({ success: true, data, meta });

export function sortRows(rows, sort) {
  const keys = sort.split(',').map((k) => (k.startsWith('-') ? [k.slice(1), -1] : [k, 1]));
  return [...rows].sort((a, b) => {
    for (const [key, dir] of keys) {
      const av = getPath(a, key);
      const bv = getPath(b, key);
      if (av === bv) continue;
      if (av == null) return 1;
      if (bv == null) return -1;
      return (av > bv ? 1 : -1) * dir;
    }
    return 0;
  });
}

export const getPath = (obj, path) => path.split('.').reduce((v, k) => (v == null ? v : v[k]), obj);

const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi);
const startOfDay = (d) => (d.length === 10 ? `${d}T00:00:00.000Z` : d);
const endOfDay = (d) => (d.length === 10 ? `${d}T23:59:59.999Z` : d);
