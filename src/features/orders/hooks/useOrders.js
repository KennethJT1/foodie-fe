import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { toast } from '@/components/feedback';
import { queryKeys } from '@/constants/query-keys';
import { useAddToCart } from '@/features/cart';
import { catalogueApi } from '@/features/catalogue';
import { useUiStore } from '@/stores/ui-store';

import { ordersApi } from '../api/orders.api';

/** Role-scoped order list (customer: own; vendor: store; rider: trips; admin: all). */
export const useOrders = (params, options = {}) =>
  useQuery({
    queryKey: queryKeys.orders.list(params),
    queryFn: () => ordersApi.list(params),
    placeholderData: keepPreviousData,
    ...options,
  });

export const useOrder = (id, options = {}) =>
  useQuery({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => ordersApi.get(id),
    enabled: Boolean(id),
    ...options,
  });

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ordersApi.cancel,
    onSuccess: (order) => {
      qc.setQueryData(queryKeys.orders.detail(order.id), order);
      qc.invalidateQueries({ queryKey: queryKeys.orders.all });
      qc.invalidateQueries({ queryKey: queryKeys.payments.all });
    },
  });
}

/**
 * Reorder (FR-ORD-06): fetches today's menu for each line, skips what is no longer sold and
 * adds the rest at today's prices. Render <NewCartDialog {...dialog} /> for vendor conflicts.
 */
export function useReorder() {
  const { add, dialog } = useAddToCart();
  const openCart = useUiStore((s) => s.openCart);
  const [isLoading, setIsLoading] = useState(false);

  const reorder = async (order) => {
    setIsLoading(true);
    try {
      const results = await Promise.allSettled(
        order.items.map((l) => catalogueApi.get(l.foodItemId)),
      );
      const lines = [];
      let skipped = 0;
      results.forEach((r, i) => {
        const old = order.items[i];
        const item = r.status === 'fulfilled' ? r.value : null;
        if (!item || !item.isAvailable) {
          skipped += 1;
          return;
        }
        const options = old.options.flatMap((o) => {
          const group = item.optionGroups.find((g) => g.id === o.groupId);
          const opt = group?.options.find((x) => x.id === o.optionId);
          return opt
            ? [
                {
                  groupId: group.id,
                  groupName: group.name,
                  optionId: opt.id,
                  name: opt.name,
                  price: opt.price,
                },
              ]
            : [];
        });
        lines.push({
          foodItemId: item.id,
          name: item.name,
          photo: item.photos?.[0] ?? null,
          unitPrice: item.price,
          quantity: old.quantity,
          options,
        });
      });
      if (!lines.length) {
        toast.error('None of these dishes are available right now.');
        return;
      }
      const vendor = results.find((r) => r.status === 'fulfilled')?.value.vendor;
      add(vendor, lines, {
        onAdded: () => {
          toast.success(
            skipped
              ? `Added to your cart. ${skipped} item${skipped > 1 ? 's are' : ' is'} no longer available.`
              : 'Added to your cart',
          );
          openCart();
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { reorder, isLoading, dialog };
}
