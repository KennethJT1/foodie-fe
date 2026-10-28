import { useState } from 'react';

import { useCartStore } from '@/stores/cart-store';

/** Vendor fields the cart keeps. */
export const cartVendor = (v) => ({ id: v.id, name: v.name, slug: v.slug, logo: v.logo ?? null });

/**
 * Adds lines to the one-vendor cart (FR-ORD-01). When the cart holds another vendor's food it
 * asks first: render <NewCartDialog {...dialog} /> next to the button.
 */
export function useAddToCart() {
  const [pending, setPending] = useState(null);

  const put = (vendor, lines) => {
    const { addItem } = useCartStore.getState();
    lines.forEach((line) => addItem(vendor, line));
  };

  /** Returns true when added now, false when waiting for the "Start a new cart?" answer. */
  const add = (vendor, lines, { onAdded } = {}) => {
    const v = cartVendor(vendor);
    const state = useCartStore.getState();
    if (state.vendor && state.vendor.id !== v.id && state.lines.length > 0) {
      setPending({ vendor: v, lines, currentVendor: state.vendor, onAdded });
      return false;
    }
    put(v, lines);
    onAdded?.();
    return true;
  };

  const confirm = () => {
    if (!pending) return;
    useCartStore.getState().clear();
    put(pending.vendor, pending.lines);
    pending.onAdded?.();
    setPending(null);
  };

  return {
    add,
    dialog: {
      open: Boolean(pending),
      currentVendor: pending?.currentVendor,
      newVendor: pending?.vendor,
      onConfirm: confirm,
      onClose: () => setPending(null),
    },
  };
}
