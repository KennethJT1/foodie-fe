import { queryKeys } from '@/constants/query-keys';

/** Every cache that can hold a food item: feed pages, search lists, details, liked list. */
export const FOOD_ITEM_QUERY_PREFIXES = [
  queryKeys.feed.all,
  queryKeys.foodItems.all,
  queryKeys.likes.all,
];

/**
 * Returns `data` with the food item `id` replaced by `update(item)`. Understands the three
 * cache shapes: a single item, a `{ data: [] }` list and `{ pages: [{ data: [] }] }`.
 * Untouched data keeps its identity so React Query skips re-renders.
 */
export function patchFoodItem(data, id, update) {
  if (!data) return data;
  if (Array.isArray(data.pages)) {
    const pages = data.pages.map((p) => patchFoodItem(p, id, update));
    return pages.some((p, i) => p !== data.pages[i]) ? { ...data, pages } : data;
  }
  if (Array.isArray(data.data)) {
    let changed = false;
    const rows = data.data.map((row) => {
      if (row?.id !== id) return row;
      changed = true;
      return update(row);
    });
    return changed ? { ...data, data: rows } : data;
  }
  return data.id === id ? update(data) : data;
}

export function patchFoodItemQueries(qc, id, update) {
  FOOD_ITEM_QUERY_PREFIXES.forEach((queryKey) =>
    qc.setQueriesData({ queryKey }, (data) => patchFoodItem(data, id, update)),
  );
}

export const snapshotFoodItemQueries = (qc) =>
  FOOD_ITEM_QUERY_PREFIXES.flatMap((queryKey) => qc.getQueriesData({ queryKey }));

export const restoreSnapshot = (qc, snapshot = []) =>
  snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
