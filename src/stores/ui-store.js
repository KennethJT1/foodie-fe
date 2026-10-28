import { create } from 'zustand';

/** Small UI flags shared across distant components. Never put API data here. */
export const useUiStore = create((set) => ({
  isCartOpen: false,
  isMobileNavOpen: false,
  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  setMobileNavOpen: (isMobileNavOpen) => set({ isMobileNavOpen }),
}));
