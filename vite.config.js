import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    // Offline shell + update prompt. The manifest is public/manifest.webmanifest.
    // On mocks the MSW worker owns the scope, so the app only registers this worker without mocks.
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      manifest: false,
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/mockServiceWorker\.js$/],
        globPatterns: ['**/*.{js,css,html,png,webp,svg,woff2}'],
        // The mock API chunk is only downloaded in mock mode
        globIgnores: ['mockServiceWorker.js', 'assets/browser-*.js'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, 'src') },
  },
  server: { port: 5173 },
  build: {
    // The two chunks over the default 500 kB are never on the first load: the mock API (faker
    // data, mock mode only) and Recharts (dashboards). First-load JS is checked separately.
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Libraries change less often than app code, so they get their own long-cached chunks
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'react';
          if (/[\\/](react-router|react-router-dom|@remix-run)[\\/]/.test(id)) return 'router';
          if (/[\\/]@tanstack[\\/](react-virtual|virtual-core)[\\/]/.test(id)) return 'virtual';
          if (/[\\/](@tanstack|axios|zustand)[\\/]/.test(id)) return 'data';
          if (/[\\/](react-hook-form|@hookform|zod)[\\/]/.test(id)) return 'forms';
          if (
            /[\\/](socket\.io-client|engine\.io-client|socket\.io-parser|engine\.io-parser)[\\/]/.test(
              id,
            )
          )
            return 'socket';
          if (/[\\/](date-fns|@date-fns)[\\/]/.test(id)) return 'dates';
          if (
            /[\\/](clsx|tailwind-merge|class-variance-authority|sonner|use-sync-external-store|react-is)[\\/]/.test(
              id,
            )
          )
            return 'ui';
          // Recharts and everything only it uses: downloaded with the first dashboard
          if (
            /[\\/](recharts|d3-[^\\/]+|victory-vendor|@reduxjs|immer|es-toolkit|reselect|react-redux|decimal\.js-light|eventemitter3|tiny-invariant)[\\/]/.test(
              id,
            )
          )
            return 'charts';
          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    css: false,
    // jsdom + the seeded mock db are heavy; fewer workers keeps runs stable on laptops and CI
    maxWorkers: 2,
    testTimeout: 15000,
    hookTimeout: 20000,
  },
});
