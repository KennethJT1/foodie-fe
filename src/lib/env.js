/** Typed access to Vite env variables (see .env.example). */
export const env = {
  apiUrl: import.meta.env.VITE_API_URL || '/api/v1',
  socketUrl: import.meta.env.VITE_SOCKET_URL || '',
  // Pinged on an interval to keep a sleeping host (e.g. Render free tier) awake. Empty = disabled.
  healthUrl:
    import.meta.env.VITE_HEALTH_URL ||
    (import.meta.env.VITE_SOCKET_URL
      ? `${import.meta.env.VITE_SOCKET_URL.replace(/\/$/, '')}/health`
      : ''),
  useMocks: import.meta.env.VITE_USE_MOCKS === 'true',
  paystackPublicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || '',
  googleMapsKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || '',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  isDev: import.meta.env.DEV,
};

// A relative API URL (the default "/api/v1") needs the host to forward it to the backend:
// the Vite dev proxy locally, the /api/v1 rewrite in vercel.json in production. Same-origin
// requests also let the browser send the SameSite=lax refresh cookie.
