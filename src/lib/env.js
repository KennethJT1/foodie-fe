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

// A relative API URL only works behind the Vite dev proxy. On a static host (Vercel) it hits
// the SPA rewrite and gets index.html back, so every API call fails.
if (import.meta.env.PROD && !env.useMocks && env.apiUrl.startsWith('/')) {
  console.error(
    `[KJT Foodie] VITE_API_URL is "${env.apiUrl}". Set it to the backend's full URL ` +
      '(e.g. https://<api host>/api/v1) in the hosting env vars and redeploy.',
  );
}
