import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';

import { reviewsApi } from '../api/reviews.api';

export const useReviews = (params, options = {}) =>
  useQuery({
    queryKey: queryKeys.reviews.list(params),
    queryFn: () => reviewsApi.list(params),
    placeholderData: keepPreviousData,
    ...options,
  });

/** Rate the vendor or rider of a delivered order (FR-SOC-06). */
export function useRateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reviewsApi.rateOrder,
    onSuccess: (review) => {
      const flag = review.targetType === 'vendor' ? 'ratedVendor' : 'ratedRider';
      qc.setQueryData(queryKeys.orders.detail(review.orderId), (o) => o && { ...o, [flag]: true });
      qc.invalidateQueries({ queryKey: queryKeys.reviews.all });
      qc.invalidateQueries({ queryKey: queryKeys.vendors.all });
    },
  });
}

/** The vendor answers a review of their store. */
export function useReplyToReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: reviewsApi.reply,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.reviews.all }),
  });
}
