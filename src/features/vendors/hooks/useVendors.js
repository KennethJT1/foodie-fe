import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/components/feedback';
import { queryKeys } from '@/constants/query-keys';

import { vendorsApi } from '../api/vendors.api';

export const useVendor = (slug) =>
  useQuery({
    queryKey: queryKeys.vendors.bySlug(slug),
    queryFn: () => vendorsApi.bySlug(slug),
    enabled: Boolean(slug),
  });

export const useFollowedVendors = (params) =>
  useQuery({
    queryKey: queryKeys.follows.list(params),
    queryFn: () => vendorsApi.followed(params),
    placeholderData: keepPreviousData,
  });

const patchVendor = (vendorId, update) => (data) => {
  if (!data) return data;
  if (Array.isArray(data.data))
    return { ...data, data: data.data.map((v) => (v.id === vendorId ? update(v) : v)) };
  return data.id === vendorId ? update(data) : data;
};

/** Follow / unfollow a vendor with an optimistic update (FR-SOC-05). */
export function useToggleFollow() {
  const qc = useQueryClient();
  const prefixes = [queryKeys.vendors.all, queryKeys.follows.all];
  return useMutation({
    mutationFn: ({ id, isFollowing }) =>
      isFollowing ? vendorsApi.unfollow(id) : vendorsApi.follow(id),
    onMutate: async ({ id, isFollowing }) => {
      await Promise.all(prefixes.map((queryKey) => qc.cancelQueries({ queryKey })));
      const snapshot = prefixes.flatMap((queryKey) => qc.getQueriesData({ queryKey }));
      prefixes.forEach((queryKey) =>
        qc.setQueriesData(
          { queryKey },
          patchVendor(id, (v) => ({
            ...v,
            isFollowing: !isFollowing,
            followersCount: Math.max(0, v.followersCount + (isFollowing ? -1 : 1)),
          })),
        ),
      );
      return { snapshot };
    },
    onError: (_e, _v, context) => {
      context?.snapshot.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error("We couldn't update that. Try again.");
    },
    onSuccess: (res) =>
      qc.setQueriesData(
        { queryKey: queryKeys.vendors.all },
        patchVendor(res.vendorId, (v) => ({
          ...v,
          isFollowing: res.isFollowing,
          followersCount: res.followersCount,
        })),
      ),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.follows.all }),
  });
}
