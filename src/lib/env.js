/** Typed access to Vite env variables (see .env.example). */
export const env = {
  apiUrl: import.meta.env.VITE_API_URL || '/api/v1',
  socketUrl: import.meta.env.VITE_SOCKET_URL || '',
  useMocks: import.meta.env.VITE_USE_MOCKS === 'true',
  paystackPublicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
  googleMapsKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || '',
  isDev: import.meta.env.DEV,
};
