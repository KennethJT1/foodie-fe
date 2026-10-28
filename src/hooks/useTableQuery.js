import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Keeps page, limit, sort and filters in the URL so refresh, back and shared links show the
 * same view. Parameter names match the backend exactly.
 *
 * const table = useTableQuery({ defaults: { limit: 20, sort: '-createdAt' } });
 * table.params  -> { page, limit, sort, search, status, from, to, ... }
 *
 * @param {{ defaults?: Record<string, string|number> }} [opts]
 */
export function useTableQuery({ defaults = {} } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultsKey = JSON.stringify(defaults);

  const params = useMemo(() => {
    const d = JSON.parse(defaultsKey);
    const out = { page: 1, limit: 20, ...d };
    for (const [k, value] of searchParams.entries()) out[k] = value;
    out.page = Number(out.page) || 1;
    out.limit = Number(out.limit) || 20;
    for (const k of Object.keys(out)) if (out[k] === '' || out[k] == null) delete out[k];
    return out;
  }, [searchParams, defaultsKey]);

  const update = useCallback(
    (changes, { resetPage = false } = {}) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, value] of Object.entries(changes)) {
            const empty =
              value == null || value === '' || (Array.isArray(value) && value.length === 0);
            if (empty) next.delete(k);
            else next.set(k, Array.isArray(value) ? value.join(',') : String(value));
          }
          if (resetPage) next.delete('page');
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const { page, limit, sort, ...filters } = params;

  return {
    params,
    page,
    limit,
    sort,
    filters,
    setPage: (p) => update({ page: p === 1 ? null : p }),
    setLimit: (l) => update({ limit: l }, { resetPage: true }),
    setSort: (s) => update({ sort: s }),
    /** Replaces the filter values given; any change goes back to page 1. */
    setFilters: (next) => update(next, { resetPage: true }),
    reset: () => setSearchParams(new URLSearchParams(), { replace: true }),
  };
}
