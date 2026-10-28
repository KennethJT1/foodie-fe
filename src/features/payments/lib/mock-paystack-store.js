import { create } from 'zustand';

/** Client state for the simulated Paystack sheet used in mock mode. */
export const useMockPaystackStore = create((set, get) => ({
  request: null, // { amount, email, reference, resolve }
  open: (details) =>
    new Promise((resolve) => {
      set({ request: { ...details, resolve } });
    }),
  finish: (result) => {
    const { request } = get();
    set({ request: null });
    request?.resolve({ reference: request.reference, ...result });
  },
}));
