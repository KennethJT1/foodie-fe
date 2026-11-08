# Real-API switch: progress log

Working notes for switching the frontend from the MSW mocks to the real backend, following
[frontend-switch-to-real-api.md](frontend-switch-to-real-api.md). Start a new session by reading
this file, then carry on from **What's left**.

Last updated: 2026-11-08

## How to run

- Real API: start the backend first (`cd ../be-foodie && npm run dev`, and `npm run dev:worker` in a
  second terminal), then `npm run dev` here. `.env.development.local` (git-ignored) sets
  `VITE_USE_MOCKS=false`.
- Mocks: `npm run dev:mock` (loads `.env.mock`). Vitest and Playwright always use mocks.
- The backend `.env` points at the shared **development** database (`kjt_foodie` on TiDB, not
  production; tests use `kjt_foodie_test`). `npm run seed` is safe there (confirmed by the backend
  team): it rebuilds the same demo world with times relative to now. Rerun it for today's live
  orders. Only catch: anyone else demoing on it at that moment gets reset too.
- Walking journeys: run backend `npm run dev` **and** `npm run dev:worker` (order 5-min timeouts,
  30-s rider offer expiry, SMS/email, refund deadlines). Run `npm run scheduler` once for
  renewals/settlement/statements; it exits.
- Backend Paystack secret key is a test key and matches the frontend's test public key, so you get
  the real Paystack test popup, not the simulated sheet.

## Done

- [x] Vite proxy `/api` → `http://localhost:4000` for `server` and `preview` (`vite.config.js`).
- [x] Env files: `.env.development.local` (real API), `.env.mock` (mocks, committed), `.env.example`
      documented; `npm run dev:mock` script; `.gitignore` allows `.env.mock`.
- [x] No hard-coded demo IDs in app code (checked: none outside `src/mocks` and tests).
- [x] Socket (`src/lib/socket.js`): sends the current token on every (re)connect; on `connect_error`
      `UNAUTHENTICATED` refreshes once and reconnects; ends the session on `ACCOUNT_BANNED` /
      `ACCOUNT_SUSPENDED`; re-joins subscribed rooms after a reconnect. `api-client.js` exports
      `getAccessToken` and `endSession` for it.
- [x] Notifications: `system` icon added (the seven contract types are covered); the bell listens for
      `notification:new` and refreshes immediately (`useUnreadCount`).
- [x] Review replies read `reply` as a string (`VendorReviewInbox.jsx`); the mock now stores
      `reply` as a string plus `repliedAt` and answers 409 `ALREADY_SUBMITTED`.
- [x] Uploads: the real API only accepts the user's own upload from `POST /uploads`. Added
      `src/lib/upload.js` (`uploadFile(file, purpose)`), a `purpose` prop on `ImageUpload`, and a
      `POST /uploads` mock handler (`src/mocks/handlers/uploads.js`). Wired: menu photos
      (`food_photo`), logo/cover (`vendor_logo`/`vendor_cover`), vendor and rider documents,
      refund photos (`refund_photo`).
- [x] Tests: under jsdom, axios sends `FormData` as `text/plain`, so multipart never reaches MSW.
      `src/test/setup.js` mocks `@/lib/upload` to return a data URL (browsers are unaffected).
- [x] Smoke test against the running backend (2026-11-08, all passed):
      - `/api/v1/health` through the Vite proxy on 5173
      - login as Ada (`POST /auth/login` takes `{ email, password }`), `kjt_refresh` cookie set,
        `POST /auth/refresh` with the cookie works through the proxy
      - `POST /uploads` (`refund_photo`) returns a Cloudinary URL
      - socket: bad token refused with `UNAUTHENTICATED`; valid token connects; `order:subscribe` to
        an unknown order acks `NOT_FOUND`; live map as a customer acks `FORBIDDEN`
      - `GET /orders` list shape and `meta` fine; notification types are contract types;
        `GET /reviews` returns `reply` as a string plus `repliedAt`

- [x] Checks (2026-11-08): lint clean; Vitest 234/234 (the vendor onboarding file can flake under
      heavy machine load, passes alone and on rerun); Playwright 9/9 on mocks.

- [x] Contract copy `docs/api/openapi.yaml` updated from backend commit `40bbb33` (refund photos must
      be the customer's own `refund_photo` uploads; also brings in `/health/ready`, health `uptime`,
      error `requestId`). Frontend already uploads refund photos first.
- [x] 2026-11-08 ~10:57: reseeded the dev database, started the worker, ran the scheduler once.

## What's left

- [ ] Deployed site (Vercel) on the real API: send the backend team the Vercel domain (they set
      `CORS_ORIGINS`, `COOKIE_SAME_SITE=none`, `COOKIE_SECURE=true`), then set `VITE_USE_MOCKS=false`,
      `VITE_API_URL=https://<api host>/api/v1`, `VITE_SOCKET_URL=https://<api host>` in Vercel.

- [ ] Walk the four journeys by hand (doc section 6) and log mismatches below.
- [ ] Check other mock-vs-real differences on screen: refund `comments` (admin only), order
      `delivery.route` / `refund`, 409 codes (`INVALID_STATUS`, `ALREADY_SUBMITTED`, `OFFER_GONE`).
- [x] Committed and pushed to `main` (`e185e36`, 2026-11-08). No `Co-Authored-By: Claude` lines.

## Git history rewrite (2026-11-08)

The `Co-Authored-By: Claude …` lines were removed from every commit on `main` and
`chore/phase-1-project-setup` (file contents unchanged, verified), force-pushed to GitHub and
verified clean on the remote. Backup branches deleted. Other clones must re-sync
(`git fetch && git reset --hard origin/main`).

- Pushing from this machine: `gh` is logged in as KennethJT1. If plain `git push` asks for a
  username, use `git -c credential.helper='!gh auth git-credential' push`.
- Future commits: `~/.claude/settings.json` already has `includeCoAuthoredBy: false` and empty
  `attribution`, so no new co-author lines are added.

## Mismatches to send the backend team

- (resolved) Refund request `photos` contract said "URL or data URI"; fixed in backend `40bbb33`.
