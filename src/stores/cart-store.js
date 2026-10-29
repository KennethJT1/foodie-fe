import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Cart for one vendor at a time (FR-ORD-01). Persisted so it survives reloads.
 * Prices are in kobo. A line is unique by item + chosen options.
 *
 * @typedef {{ groupId: string, groupName: string, optionId: string, name: string, price: number }} ChosenOption
 * @typedef {{ key: string, foodItemId: string, name: string, photo?: string, unitPrice: number,
 *   quantity: number, options: ChosenOption[], note?: string }} CartLine
 */

export const lineKey = (foodItemId, options = []) =>
  [foodItemId, ...options.map((o) => o.optionId).sort()].join('|');

export const linePrice = (line) =>
  (line.unitPrice + line.options.reduce((sum, o) => sum + o.price, 0)) * line.quantity;

const emptyCart = { vendor: null, lines: [] };

export const useCartStore = create(
  persist(
    (set, get) => ({
      ...emptyCart,

      /**
       * Adds a line. Returns { conflict: true } without changing anything when the item is
       * from another vendor; the caller asks "Start a new cart?" and then calls replaceWith.
       */
      addItem: (vendor, item) => {
        const state = get();
        if (state.vendor && state.vendor.id !== vendor.id && state.lines.length > 0) {
          return { conflict: true, currentVendor: state.vendor };
        }
        const key = lineKey(item.foodItemId, item.options);
        const existing = state.lines.find((l) => l.key === key);
        const lines = existing
          ? state.lines.map((l) =>
              l.key === key ? { ...l, quantity: l.quantity + (item.quantity ?? 1) } : l,
            )
          : [...state.lines, { ...item, key, quantity: item.quantity ?? 1 }];
        set({ vendor, lines });
        return { conflict: false };
      },

      replaceWith: (vendor, item) => {
        set(emptyCart);
        return get().addItem(vendor, item);
      },

      setQuantity: (key, quantity) =>
        set((s) => {
          const lines =
            quantity <= 0
              ? s.lines.filter((l) => l.key !== key)
              : s.lines.map((l) => (l.key === key ? { ...l, quantity } : l));
          return lines.length ? { lines } : emptyCart;
        }),

      removeLine: (key) =>
        set((s) => {
          const lines = s.lines.filter((l) => l.key !== key);
          return lines.length ? { lines } : emptyCart;
        }),

      clear: () => set(emptyCart),
    }),
    { name: 'kjt-cart', version: 1, storage: createJSONStorage(() => localStorage) },
  ),
);

export const selectCartCount = (s) => s.lines.reduce((n, l) => n + l.quantity, 0);
export const selectCartSubtotal = (s) => s.lines.reduce((n, l) => n + linePrice(l), 0);
