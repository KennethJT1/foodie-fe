# KJT Foodie — Frontend Build Plan

Oct 28, 2026 · @Lorem Backend

## 0. Where the documents live

Export each KJT Foodie document as Markdown and commit it to the frontend repo's `docs/` folder, numbered in reading order. The backend-only documents stay in the backend repo; the API contract is copied from the backend repo whenever it changes.

```text
kjt-foodie-web/
├─ README.md                       # how to run; links to every file in docs/
├─ docs/
│  ├─ 01-brd.md                    # KJT Foodie — Business Requirements Document
│  ├─ 02-frontend-guidelines.md    # KJT Foodie — Frontend Guidelines
│  ├─ 03-frontend-build-plan.md    # this document
│  ├─ 04-implementation-plan.md    # KJT Foodie — Implementation Plan (both teams)
│  └─ api/
│     └─ openapi.yaml              # API contract (master copy lives in the backend repo)
└─ src/ ...
```

| Document | Frontend repo | Backend repo |
| --- | --- | --- |
| Business Requirements Document | `docs/01-brd.md` | `docs/01-brd.md` |
| Frontend Guidelines | `docs/02-frontend-guidelines.md` | — |
| Frontend Build Plan | `docs/03-frontend-build-plan.md` | — |
| Implementation Plan | `docs/04-implementation-plan.md` | `docs/05-implementation-plan.md` |
| Backend Architecture | — | `docs/02-backend-architecture.md` |
| Database Schema | — | `docs/03-database-schema.md` |
| Backend Build Plan | — | `docs/04-backend-build-plan.md` |
| API contract (OpenAPI) | `docs/api/openapi.yaml` (copy) | `docs/openapi/` (master) |

If you prefer one place for everything, make a third repo `kjt-foodie-docs` and link to it from both READMEs instead of copying the BRD and plan.

## 1. Build order at a glance

The frontend is built in 18 phases over weeks 1–14, from the foundations no screen can live without, through each role in the order money flows, to sign-off; phase 18 happens later, while the backend is built. Never start a phase before the ones it depends on are done.

| # | Phase | Sprint (weeks) | Needs |
| --- | --- | --- | --- |
| 1 | Project setup | FE0 (1–2) | — |
| 2 | Design tokens and Tailwind theme | FE0 (1–2) | 1 |
| 3 | Core `lib`, stores and constants | FE0 (1–2) | 1 |
| 4 | Mock API foundation (MSW) | FE0 (1–2) | 3 |
| 5 | UI primitives | FE1 (3–4) | 2 |
| 6 | Data, form and feedback components | FE1 (3–4) | 5 |
| 7 | Layouts, navigation and guards | FE1 (3–4) | 5, 3 |
| 8 | Authentication | FE1 (3–4) | 4, 6, 7 |
| 9 | Customer discovery and social | FE2 (5–6) | 8 |
| 10 | Cart, checkout and orders | FE3 (7–8) | 9 |
| 11 | Live tracking, reviews and refund requests | FE3 (7–8) | 10 |
| 12 | Vendor onboarding and subscription | FE4 (9–10) | 8 |
| 13 | Vendor operations | FE4 (9–10) | 12, 10 |
| 14 | Rider app | FE5 (11–12) | 11 |
| 15 | Admin core | FE5 (11–12) | 12, 14 |
| 16 | Admin finance and operations | FE6 (13–14) | 15 |
| 17 | Polish, tests and sign-off | FE6 (13–14) | all |
| 18 | Switch to the real backend | Weeks 15–28 | Backend phases |

Each phase below lists what to build (with file paths from the Frontend Guidelines) and how you know it is done.

## 2. Foundation (phases 1–4, weeks 1–2)

Nothing visible to users yet: these phases give every later screen its styling, its API client and fake data to run on.

### Phase 1 — Project setup

- [ ] `npm create vite@latest kjt-foodie-web -- --template react`; Node 20, npm or pnpm
- [ ] Install Tailwind CSS, `@tailwindcss/forms`, `clsx`, `tailwind-merge`, `class-variance-authority`
- [ ] Path alias `@/` → `src/` in `vite.config.js` and `jsconfig.json`
- [ ] ESLint (react, react-hooks, jsx-a11y, import order), Prettier, Husky + lint-staged, Conventional Commits
- [ ] Create the empty folder structure from Frontend Guidelines section 2
- [ ] `.env.example`: `VITE_API_URL`, `VITE_SOCKET_URL`, `VITE_USE_MOCKS`, `VITE_PAYSTACK_PUBLIC_KEY`, `VITE_GOOGLE_MAPS_KEY`
- [ ] Vitest + React Testing Library configured; GitHub Actions CI: lint + test + build
- [ ] Commit the documents into `docs/` (section 0)

**Done when:** `npm run dev` shows a blank app, CI is green on the first PR.

### Phase 2 — Design tokens and Tailwind theme

- [ ] `tailwind.config.js` with KJT Foodie colours, fonts, radius, shadows (Frontend Guidelines section 8)
- [ ] Load Poppins and Inter; `src/styles/index.css` with base layer (body background `surface-page`, text `ink`)
- [ ] `lib/cn.js` helper
- [ ] Logo SVG, favicon, PWA icons in `public/`

**Done when:** a test page shows every colour, heading size and spacing step correctly on phone and desktop.

### Phase 3 — Core `lib`, stores and constants

- [ ] `lib/api-client.js`: Axios instance, auth header, 401 → refresh → retry, error normaliser
- [ ] `lib/query-client.js`: React Query defaults (retry 1, staleTime 30 s, refetch on focus)
- [ ] `lib/format.js`: `formatNaira`, `formatDate`, `formatTime`, `formatRelative`, `formatDistance`, `formatPhone` + unit tests
- [ ] `lib/socket.js`: connect/disconnect helpers (used later)
- [ ] `stores/auth-store.js` (user, accessToken, login/logout), `stores/cart-store.js` (persisted), `stores/ui-store.js`
- [ ] `constants/`: `roles.js`, `permissions.js`, `order-status.js` (labels + badge tones), `routes.js`, `query-keys.js`
- [ ] `app/providers.jsx` and `app/App.jsx` wiring QueryClient, Router, Toaster

**Done when:** formatter tests pass; providers render without errors.

### Phase 4 — Mock API foundation

- [ ] Install MSW and `@faker-js/faker`; `src/mocks/browser.js` starts only when `VITE_USE_MOCKS=true`
- [ ] `mocks/db.js`: in-memory collections (users, vendors, food items, orders...) seeded with Nigerian names, cities and ₦ prices
- [ ] `mocks/utils/list.js`: applies `page`, `limit`, `sort`, `search` and filters exactly like the backend's `buildListQuery`, returns the `{ success, data, meta }` envelope
- [ ] `mocks/utils/errors.js`: standard error envelope; random delay 300–800 ms
- [ ] `mocks/handlers/index.js` with one file per feature (filled in phase by phase)
- [ ] `mocks/socket.js`: fake event emitter for `order:status` and `rider:location`
- [ ] Draft `docs/api/openapi.yaml` endpoints for auth and catalogue together with the backend lead

**Done when:** `GET /api/v1/health` and a paginated `GET /api/v1/categories` answer from mocks in the browser.

## 3. Shared components and access (phases 5–8, weeks 3–4)

Build the reusable pieces once, before any feature screen, so every role's pages are assembled from the same parts.

### Phase 5 — UI primitives (`components/ui`)

- [ ] `Button`, `IconButton`, `Input`, `Textarea`, `Select`, `Combobox`, `Checkbox`, `Switch`, `RadioGroup`
- [ ] `Badge`, `Avatar`, `Card`, `Tabs`, `Dropdown`, `Tooltip`, `Rating`, `PriceTag`
- [ ] `Modal`, `Drawer` (bottom sheet on mobile), with focus trap and Esc to close
- [ ] `components/ui/index.js` barrel; tests for each; `/dev/ui` style-guide page (development only)

**Done when:** every primitive appears on `/dev/ui` in all variants, works by keyboard and passes its tests.

### Phase 6 — Data, form and feedback components

- [ ] `components/feedback`: `Spinner`, `Skeleton`, `PageLoader`, `ErrorState`, `EmptyState`, `ConfirmDialog`, `Toaster`, `OfflineBanner`
- [ ] `components/forms`: `Form` (React Hook Form + Zod, maps server `fieldErrors`), `FormField`, `FormInput`, `FormSelect`, `FormTextarea`, `FormSwitch`, `MoneyInput`, `PhoneInput`, `OtpInput`, `ImageUpload`
- [ ] `components/data`: `DataTable` (sort, row actions, mobile cards), `Pagination`, `FilterBar`, `StatCard`, `ChartCard`, `InfiniteList`, `Timeline`
- [ ] `hooks/useTableQuery.js` (page, limit, sort, filters in the URL), `hooks/useDebounce.js`
- [ ] `components/maps`: `MapView`, `RiderMarker`, `RouteLine`, `AddressPicker` (Google Maps)

**Done when:** a demo list page on mocks filters, sorts and paginates through the URL; a demo form shows field errors from the mock API.

### Phase 7 — Layouts, navigation and guards

- [ ] `layouts/PublicLayout.jsx`, `CustomerLayout.jsx` (top bar + mobile bottom tabs), `DashboardLayout.jsx` (sidebar + header + mobile drawer)
- [ ] `layouts/nav/vendor.js`, `rider.js`, `admin.js` menu configs with permissions
- [ ] Guards: `RequireAuth`, `RequireRole`, `RequirePermission`, `RequireApproved`, `RequireActiveSubscription`; `<Can>` component
- [ ] `app/router.jsx` with all route groups lazy-loaded; placeholder pages; 404 and 403 pages

**Done when:** switching the mock user's role shows the right layout and menu, and blocked routes redirect correctly.

### Phase 8 — Authentication (`features/auth`)

- [ ] Pages: login (phone + OTP or email + password), sign-up for customer, vendor and rider, verify OTP, forgot and reset password
- [ ] `auth.api.js`, hooks `useLogin`, `useRegister`, `useVerifyOtp`, `useLogout`, `useMe`
- [ ] Silent refresh on app load; redirect to `?next=` after login; each role lands on its own home
- [ ] Mock handlers: `/auth/*`, `/me`

**Done when:** a customer, vendor, rider and admin can each sign up or log in on mocks and reach their own dashboard.

## 4. Customer (phases 9–11, weeks 5–8)

The customer side comes first because every other role reacts to a customer's order.

### Phase 9 — Discovery and social (`features/feed`, `catalogue`, `vendors`)

- [ ] Home feed with `InfiniteList` of `FoodPost` cards (photos, price, vendor, likes, comments count)
- [ ] Search page with `FilterBar`: food name, category, price range, distance, rating; category chips
- [ ] Food detail page: photo gallery, options, add-to-cart button (cart wired in phase 10)
- [ ] Vendor storefront: cover, logo, rating, hours, open/closed, menu by category, follow button
- [ ] Like toggle (optimistic update), comments with vendor replies, report comment, follow vendor, share link
- [ ] Liked items and followed vendors pages under `/account`
- [ ] Mock handlers: `/food-items`, `/categories`, `/vendors`, `/food-items/:id/likes`, `/comments`, `/follows`, `/reports`

**Done when:** a customer can find food near them, like, comment and follow on mocks; empty, loading and error states all show.

### Phase 10 — Cart, checkout and orders (`features/cart`, `orders`, `payments`)

- [ ] `CartDrawer` and cart page; one-vendor rule with "Start a new cart?" confirm
- [ ] Checkout: address picker, delivery note, `CheckoutSummary` (subtotal, delivery fee, processing fee, total) from a mock `/checkout/quote`
- [ ] Paystack popup (`@paystack/inline-js`) behind `features/payments/startPayment.js`; mocked success/failure in mock mode
- [ ] Order confirmation page; order history with `DataTable`/cards; order detail with `Timeline`
- [ ] Addresses and profile pages
- [ ] Mock handlers: `/checkout/quote`, `/orders`, `/orders/:id`, `/payments/initialize`, `/addresses`

**Done when:** a customer can place and "pay" for an order on mocks and see it in their history.

### Phase 11 — Tracking, reviews and refunds (`features/tracking`, `reviews`, `refunds`, `notifications`)

- [ ] `useOrderLive(orderId)`: subscribes to `order:status` and `rider:location`, updates the React Query cache
- [ ] `LiveTrackingMap` with rider marker, route line, ETA; delivery code shown to the customer
- [ ] Rate vendor and rider after delivery
- [ ] Refund request form (reason, amount, photos) and refund status timeline; confirm receipt or dispute
- [ ] Notifications bell + list page (in-app)
- [ ] Mock socket moves a fake rider along a route and changes status every few seconds

**Done when:** a customer watches a mocked order go from paid to delivered on a live map, rates it and opens a refund request.

## 5. Vendor (phases 12–13, weeks 9–10)

Vendors must be able to join and pay before they can sell, so onboarding and subscription come before daily operations.

### Phase 12 — Onboarding and subscription (`features/vendors`, `subscriptions`)

- [ ] Onboarding wizard: vendor type (restaurant / home cook) → business details → location pin and delivery radius → documents for that type (`ImageUpload`) → bank account (account name resolved and shown) → review and submit
- [ ] Pending, rejected (with reason) and approved status screens (`RequireApproved`)
- [ ] Plans page with `PlanCard` (monthly / yearly toggle, yearly discount), start free trial, pay via Paystack
- [ ] Subscription page: current plan, renewal date, upgrade/downgrade, cancel at period end, invoices
- [ ] Banners for trial ending, payment failed (grace) and expired; `RequireActiveSubscription` locks other pages when expired
- [ ] Mock handlers: `/vendor/onboarding`, `/vendor/documents`, `/banks`, `/banks/resolve`, `/plans`, `/vendor/subscription`

**Done when:** a new vendor can onboard, start a trial, see the expired lock, and renew on mocks.

### Phase 13 — Vendor operations (`features/orders`, `catalogue`, `reports`, `refunds`)

- [ ] Overview: today's orders, sales, rating, top items (`StatCard`, `ChartCard`)
- [ ] Live order queue: new-order sound and toast via socket, accept/reject with countdown to auto-reject, mark preparing, mark ready, see rider arriving
- [ ] Menu management: items list with filters, create/edit item (photos within plan limit, option groups, availability schedule), toggle sold out
- [ ] Order history (reuses order columns from phase 10)
- [ ] Sales and payouts: per order and per day, "settling" vs settled, CSV export
- [ ] Engagement: likes, comments to reply to, followers, reviews with reply
- [ ] Refund requests: accept full/partial, reject with reason, mark paid with reference, see deadline
- [ ] Store settings: hours, pause orders, delivery radius, prep time; bank change request; staff accounts

**Done when:** a vendor can run a full day on mocks: receive, accept and complete orders, edit the menu, answer a refund.

## 6. Rider and admin (phases 14–16, weeks 11–14)

The rider app closes the delivery loop; the admin dashboard comes last because it oversees everything the other three roles do.

### Phase 14 — Rider app (`features/riders`, `tracking`)

- [ ] Rider onboarding: vehicle, licence, guarantor, documents, bank account; pending-approval screen
- [ ] Big online/offline switch; `hooks/useGeolocation.js` sends `rider:location` every 5–10 s only while online; keep-screen-awake prompt
- [ ] Job offer card with pickup, drop-off, distance, fee and 30-second countdown (accept / decline)
- [ ] Active delivery: map with directions link, steps (to vendor → picked up → to customer), call/chat customer, enter 4-digit code to complete
- [ ] Trips history; earnings this month (fees × payout %); monthly payout statements
- [ ] Mock handlers: `/rider/*`, `/deliveries/*`; mock socket sends a job offer when the rider goes online

**Done when:** a rider can go online, accept a mocked job and complete it with the code, on a 360 px phone.

### Phase 15 — Admin core (`features/reports`, `vendors`, `riders`, `orders`)

- [ ] Overview: GMV, orders today, active deliveries, MRR, delivery-fee revenue, sign-ups (`StatCard`, charts)
- [ ] Vendor approval queue with document viewer, approve/reject with reason; vendor list with status filters and detail page
- [ ] Rider approval queue; rider list with online status, trips, rating
- [ ] Customers list with ban/suspend
- [ ] All orders with filters, detail, manual rider reassignment
- [ ] Live map of online riders and active deliveries (`admin:live-map`)

**Done when:** an admin can approve a vendor and a rider and reassign an order on mocks.

### Phase 16 — Admin finance and operations (`features/payments`, `subscriptions`, `refunds`, `settings`, `support`)

- [ ] Payments: transactions, split amounts, settlement status, reconciliation flags
- [ ] Plans and prices editor; subscriptions list (trial, active, grace, expired), extend subscription
- [ ] Rider payout statements: review, approve, mark paid
- [ ] Refunds: all requests, full timeline, comment, escalate
- [ ] Moderation queue: reported comments and posts, hide/remove
- [ ] Support inbox: tickets, assign, reply, internal notes
- [ ] Settings: delivery fee formula, rider payout %, timeouts, trial/grace days, refund deadline and missed-deadline action, service areas, notification templates
- [ ] Admin users and roles/permissions editor; audit log with filters; CSV exports
- [ ] Every admin page wrapped in the right `RequirePermission`

**Done when:** each admin sub-role (Super admin, Support, Finance, Dispatch, Onboarding) sees only its permitted pages and can do its job on mocks.

## 7. Polish, sign-off and the real backend (phases 17–18)

### Phase 17 — Polish, tests and sign-off (weeks 13–14)

- [ ] Support tickets for customers, vendors and riders; customer–rider chat during delivery
- [ ] PWA with `vite-plugin-pwa`: installable, offline shell, update prompt
- [ ] Accessibility pass (axe, keyboard-only walkthrough of each role)
- [ ] Performance pass: route bundle sizes, image lazy-loading, virtualised long lists; Lighthouse 85+ on mobile
- [ ] Content pass against Frontend Guidelines section 9 (wording, formats, empty and error states)
- [ ] Playwright journeys on mocks: customer orders and tracks; vendor accepts and marks ready; rider delivers; admin approves vendor
- [ ] OpenAPI contract updated with every endpoint the mocks implement; handed to the backend team
- [ ] Deploy the mock build to a preview URL for stakeholders

**Done when:** **frontend sign-off** — the product owner clicks through every BRD "must have" on the preview and accepts it.

### Phase 18 — Switch to the real backend (weeks 15–28)

As each backend phase finishes, the matching mock handlers are deleted and that feature runs on the real staging API.

| Backend phase finishes | Frontend switches off mocks |
| --- | --- |
| Auth, roles and permissions | `features/auth`, profile, addresses, admin users |
| Onboarding, uploads, settings | Vendor and rider onboarding, admin approvals, settings |
| Plans and subscriptions | Plans, subscription pages, admin plans |
| Catalogue and social | Feed, search, storefront, menu management, likes, comments, moderation |
| Orders and payments + real time | Cart, checkout, orders for all roles, payments, live order queue |
| Dispatch, GPS, rider payouts | Rider app, live tracking, admin live map, payout statements |
| Refunds, support, notifications, reports | Refunds, support, notifications, admin reports, audit log |

For each switch:

1. Point staging at the real API for that feature (delete its handlers from `src/mocks/handlers/`).
2. Run the feature's component and Playwright tests against staging.
3. Fix any mismatch by updating the contract first, then whichever side was wrong.
4. When `src/mocks/handlers/` is empty, remove MSW from the production build entirely (**gate: all mocks removed**).
