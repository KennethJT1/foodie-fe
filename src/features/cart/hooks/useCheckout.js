import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/constants/query-keys';

import { checkoutApi } from '../api/checkout.api';

/** Server-priced totals for the cart (FR-ORD-02). `input` is null until an address is picked. */
export const useCheckoutQuote = (input) =>
  useQuery({
    queryKey: queryKeys.checkoutQuote(input),
    queryFn: () => checkoutApi.quote(input),
    enabled: Boolean(input),
    placeholderData: keepPreviousData,
    retry: false,
    staleTime: 60_000,
  });
