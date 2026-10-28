import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { toast } from '@/components/feedback';
import { queryKeys } from '@/constants/query-keys';

import { feedApi } from '../api/feed.api';
import {
  patchFoodItemQueries,
  restoreSnapshot,
  snapshotFoodItemQueries,
  FOOD_ITEM_QUERY_PREFIXES,
} from '../lib/patch-food-item';

const nextCursor = (last) => last.meta?.nextCursor ?? undefined;

/** Home feed, cursor paginated. params: { tab, categoryId } */
export const useFeed = (params, options = {}) =>
  useInfiniteQuery({
    queryKey: queryKeys.feed.list(params),
    queryFn: ({ pageParam }) => feedApi.feed({ ...params, cursor: pageParam, limit: 10 }),
    initialPageParam: undefined,
    getNextPageParam: nextCursor,
    ...options,
  });

export const useLikedItems = (params) =>
  useQuery({
    queryKey: queryKeys.likes.list(params),
    queryFn: () => feedApi.liked(params),
    placeholderData: keepPreviousData,
  });

/** Like / unlike with an optimistic update across every cached copy of the item. */
export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isLiked }) => (isLiked ? feedApi.unlike(id) : feedApi.like(id)),
    onMutate: async ({ id, isLiked }) => {
      await Promise.all(FOOD_ITEM_QUERY_PREFIXES.map((queryKey) => qc.cancelQueries({ queryKey })));
      const snapshot = snapshotFoodItemQueries(qc);
      patchFoodItemQueries(qc, id, (item) => ({
        ...item,
        isLiked: !isLiked,
        likesCount: Math.max(0, item.likesCount + (isLiked ? -1 : 1)),
      }));
      return { snapshot };
    },
    onError: (_error, _vars, context) => {
      restoreSnapshot(qc, context?.snapshot);
      toast.error("We couldn't save that. Try again.");
    },
    onSuccess: (res) =>
      patchFoodItemQueries(qc, res.foodItemId, (item) => ({
        ...item,
        isLiked: res.isLiked,
        likesCount: res.likesCount,
      })),
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.likes.all }),
  });
}

export const useComments = (foodItemId) =>
  useInfiniteQuery({
    queryKey: queryKeys.comments.list(foodItemId),
    queryFn: ({ pageParam }) => feedApi.comments(foodItemId, { cursor: pageParam, limit: 10 }),
    initialPageParam: undefined,
    getNextPageParam: nextCursor,
    enabled: Boolean(foodItemId),
  });

export function useAddComment(foodItemId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => feedApi.addComment({ foodItemId, ...body }),
    onSuccess: () => {
      patchFoodItemQueries(qc, foodItemId, (item) => ({
        ...item,
        commentsCount: item.commentsCount + 1,
      }));
      return qc.invalidateQueries({ queryKey: queryKeys.comments.list(foodItemId) });
    },
  });
}

export function useEditComment(foodItemId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: feedApi.editComment,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.comments.list(foodItemId) }),
  });
}

export function useDeleteComment(foodItemId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: feedApi.deleteComment,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.comments.list(foodItemId) }),
  });
}

export const useReport = () => useMutation({ mutationFn: feedApi.report });

/** Comments on the vendor's own dishes, for the engagement inbox. */
export const useVendorComments = (params) =>
  useQuery({
    queryKey: [...queryKeys.comments.all, 'vendor', params],
    queryFn: () => feedApi.vendorComments(params),
    placeholderData: keepPreviousData,
  });

/** Vendor reply to a customer's comment on their dish. */
export function useReplyToComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: feedApi.addComment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.comments.all });
      qc.invalidateQueries({ queryKey: queryKeys.vendorMe.engagement });
    },
  });
}
