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
