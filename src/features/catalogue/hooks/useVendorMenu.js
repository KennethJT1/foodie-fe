import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';

import { menuApi } from '../api/menu.api';

const MENU = ['vendor-me', 'menu'];

export const useVendorMenu = (params) =>
  useQuery({
    queryKey: queryKeys.vendorMe.menu(params),
    queryFn: () => menuApi.list(params),
    placeholderData: keepPreviousData,
  });

export const useVendorMenuItem = (id) =>
  useQuery({
    queryKey: [...MENU, 'detail', id],
    queryFn: () => menuApi.get(id),
    enabled: Boolean(id),
  });

const useMenuMutation = (mutationFn) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: MENU });
      qc.invalidateQueries({ queryKey: queryKeys.foodItems.all });
      qc.invalidateQueries({ queryKey: queryKeys.feed.all });
    },
  });
};

/** Creates when there is no id, updates otherwise. */
export const useSaveMenuItem = () =>
  useMenuMutation((body) => (body.id ? menuApi.update(body) : menuApi.create(body)));

export const useDeleteMenuItem = () => useMenuMutation(menuApi.remove);

/** Sold out / back on sale, with the switch flipping straight away. */
export function useToggleSoldOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isAvailable }) => menuApi.update({ id, isAvailable }),
    onMutate: async ({ id, isAvailable }) => {
      await qc.cancelQueries({ queryKey: MENU });
      const previous = qc.getQueriesData({ queryKey: MENU });
      qc.setQueriesData({ queryKey: MENU }, (page) =>
        page?.data
          ? { ...page, data: page.data.map((f) => (f.id === id ? { ...f, isAvailable } : f)) }
          : page,
      );
      return { previous };
    },
    onError: (_e, _v, ctx) => ctx?.previous.forEach(([key, data]) => qc.setQueryData(key, data)),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: MENU });
      qc.invalidateQueries({ queryKey: queryKeys.foodItems.all });
    },
  });
}
