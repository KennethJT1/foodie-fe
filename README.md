# KJT Foodie — Web

Responsive web app for the KJT Foodie food marketplace: one React + Tailwind codebase for customers, vendors, riders and admins. It is built first against a mock API (MSW), then switched to the real backend feature by feature.

## Requirements

- Node 20+ (see `.nvmrc`)
- npm

## Getting started

```bash
cp .env.example .env
npm install
npm run dev
```

The app runs at http://localhost:5173. With `VITE_USE_MOCKS=true` it needs no backend.

## Demo accounts (mock mode)

Every account uses the password `password123`; every SMS code is `123456`. In development a
**Demo accounts** button (bottom right) switches between them in one tap.

| Account                                          | Email                                                               |
| ------------------------------------------------ | ------------------------------------------------------------------- |
| Customer (Ada Okafor)                            | `customer@kjtfoodie.test`                                           |
| Vendor, Pro plan (Mama Put)                      | `vendor@kjtfoodie.test`                                             |
| Vendor, plan expired                             | `expired.vendor@kjtfoodie.test`                                     |
| Vendor, not onboarded yet                        | `new.vendor@kjtfoodie.test`                                         |
| Rider (Tunde Bakare)                             | `rider@kjtfoodie.test`                                              |
| Rider, not onboarded yet                         | `new.rider@kjtfoodie.test`                                          |
| Admin: Super admin                               | `super@kjtfoodie.test`                                              |
| Admin: Support / Finance / Dispatch / Onboarding | `support@` / `finance@` / `dispatch@` / `onboarding@kjtfoodie.test` |

Mock data lives in your browser's localStorage. Run `window.__kjtMocks.resetDb()` in the
console to start fresh. `localStorage.setItem('kjt-mock-chaos', '0.1')` makes 10% of reads fail
so you can check error states.

On mocks, any 10-digit bank account number resolves to the account owner's name, except numbers
ending in `0000`, which come back as "account not found". On the Paystack test sheet, pick
**Simulate a failed payment** to see the failed-payment path. While a vendor has the dashboard
open, a demo order arrives about once a minute so the live queue has something to do.

## Scripts

| Script               | What it does                        |
| -------------------- | ----------------------------------- |
| `npm run dev`        | Start the Vite dev server           |
| `npm run build`      | Production build into `dist/`       |
| `npm run preview`    | Serve the production build          |
| `npm run lint`       | ESLint (no warnings allowed)        |
| `npm run format`     | Format everything with Prettier     |
| `npm test`           | Run Vitest unit and component tests |
| `npm run test:watch` | Vitest in watch mode                |
| `npm run test:e2e`   | Playwright journeys on the mock API |

The Playwright journeys (`tests/e2e/`) start their own dev server on port 5174 with mocks on.
Install the browser once with `npx playwright install chromium`. They cover: a customer orders
and tracks a delivery, a vendor accepts and marks ready, a rider delivers with the code on a
360 px phone, an admin approves a vendor, and every role's main screens fit a 360 px phone.

## Offline and install (PWA)

The production build includes a service worker (offline app shell, cached assets, an
"update ready" prompt and an "add to home screen" offer). With `VITE_USE_MOCKS=true` the MSW
worker owns the same scope, so the app's own worker is only registered when mocks are off.

Commits follow [Conventional Commits](https://www.conventionalcommits.org) (`feat(orders): add accept button`); Husky runs lint-staged and commitlint on every commit.

## Environment variables

| Variable                   | Purpose                               |
| -------------------------- | ------------------------------------- |
| `VITE_API_URL`             | Base URL of the API (`.../api/v1`)    |
| `VITE_SOCKET_URL`          | Socket.IO server for live updates     |
| `VITE_USE_MOCKS`           | `true` runs on the MSW mock API       |
| `VITE_PAYSTACK_PUBLIC_KEY` | Paystack public key (test key in dev) |
| `VITE_GOOGLE_MAPS_KEY`     | Google Maps JavaScript API key        |

## Documentation

Read in this order:

1. [Business Requirements Document](docs/01-brd.md)
2. [Frontend Guidelines](docs/02-frontend-guidelines.md)
3. [Frontend Build Plan](docs/03-frontend-build-plan.md)
4. [Implementation Plan](docs/04-implementation-plan.md)
5. [API contract](docs/api/openapi.yaml) (copy; the master lives in the backend repo)
6. [Backend handoff](docs/05-backend-handoff.md): endpoints, filters, real-time events, rules and the seeder spec (with [real seed photos](docs/backend/seed-images.json))
