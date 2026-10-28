# KJT Foodie — Frontend Guidelines

Oct 28, 2026 · @Lorem Backend

## 1. Stack and principles

The KJT Foodie web app is one React + Tailwind codebase serving four roles (customer, vendor, rider, admin), built feature by feature on top of a shared component library. It is built **before** the backend, against a mock API that follows the agreed API contract.

| Concern | Choice | Why |
| --- | --- | --- |
| Build tool | Vite | Fast dev server and builds |
| Language | JavaScript (ES2022) with JSDoc types; TypeScript optional later | Matches the team's React JS choice |
| UI | React 18 | Requested |
| Styling | Tailwind CSS 3 + `clsx` + `tailwind-merge` | Requested; safe class merging in reusable components |
| Routing | React Router 6 (data routers) | Nested layouts per role, route guards |
| Server state | TanStack Query (React Query) 5 | Caching, pagination, retries, background refresh |
| Client state | Zustand | Small global state: auth session, cart, UI |
| HTTP | Axios with one shared instance | Interceptors for token refresh and errors |
| Forms | React Hook Form + Zod | Fast forms, one schema for validation |
| Mock API | MSW (Mock Service Worker) + Faker | Build the full frontend before the backend exists |
| Maps / GPS | Google Maps JS API via `@vis.gl/react-google-maps` | Matches the BRD (NFR-10) |
| Real time | `socket.io-client` | Live rider location and order status |
| Icons | `lucide-react` | Consistent, tree-shakeable |
| Charts | Recharts | Dashboard charts |
| Dates | `date-fns` | Small, locale-aware |
| Tests | Vitest + React Testing Library; Playwright for end-to-end | Fast unit tests, real browser flows |
| Quality | ESLint, Prettier, Husky + lint-staged | Same style everywhere |

### Principles

1. **Feature first:** code lives with the feature it serves (orders, menu, riders), not by file type.
2. **Build once, reuse everywhere:** every button, input, table, modal and card comes from `src/components/ui`. Pages never style raw HTML elements directly.
3. **Pages are thin:** pages compose feature components and hooks; business logic sits in hooks and services.
4. **Server data stays in React Query;** Zustand holds only client state. Never copy API data into Zustand.
5. **Mobile first:** design for a 360 px phone, then scale up. Riders and most customers use phones.
6. **One API contract:** the mock API and the real backend return identical shapes, so switching is one environment variable.

## 2. Folder structure

Shared building blocks live at the top of `src/`; each business area is a self-contained folder under `src/features/`.

```text
kjt-foodie-web/
├─ public/                     # favicon, manifest, static images
├─ src/
│  ├─ app/
│  │  ├─ App.jsx               # providers + router
│  │  ├─ providers.jsx         # QueryClient, Theme, Toaster, Socket
│  │  └─ router.jsx            # all routes, lazy-loaded per role
│  ├─ components/
│  │  ├─ ui/                   # primitives: Button, Input, Select, Modal, Badge, Avatar...
│  │  ├─ data/                 # DataTable, Pagination, FilterBar, EmptyState, StatCard...
│  │  ├─ forms/                # FormField, FormInput, FormSelect, ImageUpload...
│  │  ├─ feedback/             # Spinner, Skeleton, Toast, ErrorState, ConfirmDialog
│  │  └─ maps/                 # MapView, RiderMarker, RouteLine, AddressPicker
│  ├─ layouts/
│  │  ├─ PublicLayout.jsx      # landing, auth pages
│  │  ├─ CustomerLayout.jsx    # top nav + bottom tab bar on mobile
│  │  ├─ DashboardLayout.jsx   # sidebar + header, used by vendor/rider/admin
│  │  └─ nav/                  # sidebar menus per role (config objects)
│  ├─ features/
│  │  ├─ auth/
│  │  ├─ catalogue/            # food items, menu management
│  │  ├─ feed/                 # home feed, likes, comments, follows
│  │  ├─ cart/
│  │  ├─ orders/
│  │  ├─ tracking/             # live map, socket events
│  │  ├─ vendors/              # onboarding, storefront, approvals
│  │  ├─ subscriptions/
│  │  ├─ payments/
│  │  ├─ refunds/
│  │  ├─ riders/               # jobs, earnings, payouts
│  │  ├─ reviews/
│  │  ├─ support/
│  │  ├─ notifications/
│  │  ├─ reports/              # dashboard stats and charts
│  │  └─ settings/             # admin settings, audit log
│  ├─ pages/                    # thin route screens, grouped by role
│  │  ├─ public/  customer/  vendor/  rider/  admin/
│  ├─ hooks/                    # shared hooks: useDebounce, useTableQuery, useGeolocation
│  ├─ lib/
│  │  ├─ api-client.js         # Axios instance + interceptors
│  │  ├─ query-client.js
│  │  ├─ socket.js
│  │  ├─ cn.js                 # clsx + tailwind-merge helper
│  │  └─ format.js             # formatNaira, formatDate, formatDistance
│  ├─ stores/                   # Zustand: auth-store, cart-store, ui-store
│  ├─ constants/                # roles, order statuses, query keys, routes
│  ├─ mocks/                    # MSW handlers + fake data (removed from prod build)
│  └─ styles/index.css          # Tailwind layers
├─ tests/e2e/                   # Playwright
├─ .env.example
└─ tailwind.config.js
```

Each feature folder has the same inside:

```text
features/orders/
├─ api/          # orders.api.js: plain functions that call the API
├─ hooks/        # useOrders, useOrder, useAcceptOrder (React Query)
├─ components/   # OrderCard, OrderStatusBadge, OrderTimeline
├─ schemas/      # Zod schemas for forms in this feature
├─ constants.js  # statuses, labels, colours
└─ index.js      # public exports; other features import only from here
```

Rule: a feature may import from `components/`, `hooks/`, `lib/` and another feature's `index.js`, never from another feature's internal files.

## 3. Component architecture

Code flows one way: pages use layouts and features, features use shared components and `lib`, and `lib` talks to the API. A lower layer never imports from a higher one.

&#91;embedded content: frontend layers · 6 levels\]

Because only `lib/api-client.js` knows where the API lives, the whole app is built against the mock API first and pointed at the Express backend later without touching any screen.

## 4. Reusable component catalogue

Build these first (sprint 1–2); every screen afterwards is assembled from them.

### UI primitives (`components/ui`)

| Component | Key props | Notes |
| --- | --- | --- |
| `Button` | `variant` (primary, secondary, outline, ghost, danger), `size` (sm, md, lg), `loading`, `leftIcon`, `asChild` | Shows a spinner and disables itself while `loading` |
| `IconButton` | `icon`, `label` (required for screen readers) |  |
| `Input`, `Textarea` | `label`, `error`, `hint`, `leftIcon` | Forward refs for React Hook Form |
| `Select`, `Combobox` | `options`, `value`, `onChange`, `searchable` |  |
| `Checkbox`, `Switch`, `RadioGroup` |  |  |
| `Badge` | `tone` (neutral, success, warning, danger, info) | Order and subscription statuses |
| `Avatar` | `src`, `name`, `size` | Falls back to initials |
| `Card` | `header`, `footer`, `padding` |  |
| `Modal`, `Drawer` | `open`, `onClose`, `title`, `size` | Drawer slides from the bottom on mobile |
| `Tabs` | `items`, `value`, `onChange` |  |
| `Dropdown` | `trigger`, `items` | Row actions menus |
| `Tooltip` |  |  |
| `Rating` | `value`, `readOnly`, `onChange` | Stars |
| `PriceTag` | `amount` (kobo) | Always formats as ₦ |

### Data components (`components/data`)

| Component | Purpose |
| --- | --- |
| `DataTable` | Columns config, sorting, row selection, row actions, loading skeleton, empty state; turns into cards on mobile |
| `Pagination` | Page numbers + page size; reads/writes `?page=&limit=` in the URL |
| `FilterBar` | Builds search box, selects, date range and status chips from a filters config |
| `StatCard` | KPI number, label, change vs last period |
| `ChartCard` | Card wrapper for Recharts charts |
| `EmptyState` | Icon, title, message, optional action |
| `InfiniteList` | Feed and comments with "load more" |
| `Timeline` | Order status history, refund history |

### Form components (`components/forms`)

`Form` (wraps React Hook Form provider), `FormField` (label + control + error), `FormInput`, `FormSelect`, `FormTextarea`, `FormSwitch`, `ImageUpload` (preview, size limit, multiple), `PhoneInput` (+234), `OtpInput`, `AddressPicker` (map pin + autocomplete), `MoneyInput` (₦).

### Feedback (`components/feedback`)

`Spinner`, `Skeleton`, `PageLoader`, `ErrorState` (with retry), `ConfirmDialog`, `Toaster` (success/error toasts), `OfflineBanner`.

### Feature components (examples)

`FoodCard`, `FoodPost` (photos, likes, comments), `VendorCard`, `CartDrawer`, `CheckoutSummary`, `OrderCard`, `OrderStatusBadge`, `LiveTrackingMap`, `RiderJobCard`, `PlanCard`, `RefundRequestCard`, `CommentThread`.

### Rules for a reusable component

- Accepts `className` and merges it with `cn()` so callers can adjust spacing without forking it.
- Styles come from variants (`cva` from `class-variance-authority`), not from `if` chains.
- No API calls inside `components/`; data arrives through props.
- Every interactive element is keyboard reachable and has a visible focus ring.
- Each component has a short usage example in a `*.stories.jsx` or the `/dev/ui` page (a living style guide route available only in development).

## 5. Routing, layouts and role-based access

Each role gets its own URL prefix and layout; a `RequireRole` guard checks the logged-in user's role (and admin permissions) before any page under that prefix loads.

| Prefix | Layout | Who | Main pages |
| --- | --- | --- | --- |
| `/` | PublicLayout / CustomerLayout | Everyone | Home feed, search, food detail, vendor storefront, login, sign-up, forgot password |
| `/account` | CustomerLayout | Customer | Cart, checkout, orders, order tracking, liked, following, refunds, addresses, profile |
| `/vendor` | DashboardLayout | Vendor (+ vendor staff) | Overview, live orders, menu, sales and payouts, engagement, refunds, subscription, store settings, onboarding |
| `/rider` | DashboardLayout (mobile-first) | Rider | Go online, job offers, active delivery, trips, earnings, payout statements, profile |
| `/admin` | DashboardLayout | Admin sub-roles | Overview, vendors, customers, riders, live map, orders, payments, subscriptions and plans, refunds, moderation, support, settings, admin users, audit log |

### Guards

```jsx
// app/router.jsx (excerpt)
{
  path: '/admin',
  element: <RequireRole roles={['admin']}><DashboardLayout nav={adminNav} /></RequireRole>,
  children: [
    { index: true, lazy: () => import('@/pages/admin/OverviewPage') },
    {
      path: 'plans',
      element: <RequirePermission permission="subscriptions.manage" />,
      children: [{ index: true, lazy: () => import('@/pages/admin/PlansPage') }],
    },
  ],
}
```

- `RequireAuth`: no session → redirect to `/login?next=<current path>`.
- `RequireRole`: wrong role → redirect to that user's own home (e.g. a rider going to `/admin` lands on `/rider`).
- `RequirePermission`: admin sub-role lacks the permission → show a 403 page.
- `RequireActiveSubscription` (vendor): expired or unpaid plan → only the Subscription page stays open, with a banner.
- `RequireApproved` (vendor, rider): pending approval → onboarding status page.

### Menus are config, not markup

Sidebar items are arrays in `layouts/nav/*.js` with `label`, `icon`, `to`, and optional `permission`. `DashboardLayout` renders whatever the role's config contains and hides items the user lacks permission for. Adding a page = one route + one nav entry.

### Hiding is not security

The frontend hides buttons the user cannot use (`<Can permission="refunds.escalate">`), but the backend always re-checks. Never rely on the UI alone.

## 6. API layer, server state and the mock API

All requests go through one Axios client, one React Query hook per endpoint, and — until the backend exists — MSW handlers that return the exact response shapes in the Backend Architecture document (section 5).

### Three layers per feature

```js
// features/orders/api/orders.api.js — plain functions, no React
export const ordersApi = {
  list: (params) => api.get('/orders', { params }).then((r) => r.data),
  get: (id) => api.get(`/orders/${id}`).then((r) => r.data.data),
  accept: (id) => api.post(`/orders/${id}/accept`).then((r) => r.data.data),
};

// features/orders/hooks/useOrders.js — React Query
export const useOrders = (params) =>
  useQuery({ queryKey: queryKeys.orders.list(params), queryFn: () => ordersApi.list(params), placeholderData: keepPreviousData });

export const useAcceptOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ordersApi.accept,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.orders.all }),
  });
};
```

### The shared Axios client (`lib/api-client.js`)

- `baseURL` from `VITE_API_URL` (e.g. `https://api.kjtfoodie.com/api/v1`).
- Request interceptor adds `Authorization: Bearer <accessToken>` from the auth store.
- Response interceptor: on `401` it calls `/auth/refresh` once (refresh token in an httpOnly cookie), retries the request, and logs the user out if refresh fails. Parallel 401s wait for the same refresh.
- Errors are normalised to `{ status, code, message, fieldErrors }` so forms and toasts read one shape.

### Query keys

All keys live in `constants/query-keys.js` (e.g. `orders.list(params)`, `orders.detail(id)`), so invalidation is never a guess.

### Real-time updates

`lib/socket.js` opens one Socket.IO connection after login. Hooks such as `useOrderLive(orderId)` subscribe to events (`order:status`, `rider:location`) and update the React Query cache with `setQueryData`, so pages re-render without refetching.

### Mock API (MSW) — how the frontend ships first

- `src/mocks/handlers/*.js` mirror every backend endpoint; `src/mocks/db.js` holds in-memory fake data built with Faker (Nigerian names, Lagos/Abuja addresses, ₦ prices).
- Mocks honour pagination, filters and sorting, return the same error shapes, and simulate delays (300–800 ms) and failures so loading and error states get built.
- A fake socket emitter moves a rider marker along a route so tracking can be built without the backend.
- Turned on with `VITE_USE_MOCKS=true`; the production build tree-shakes `src/mocks/` away.
- When a backend endpoint goes live, its handler is deleted. If the frontend still works, the contract was respected.

## 7. Forms, tables, pagination and filters

Every list screen (orders, vendors, riders, payments, refunds, audit log) is built the same way: a `FilterBar` and `DataTable` driven by one `useTableQuery` hook that keeps page, filters and sort in the URL.

### Forms

```jsx
const schema = z.object({
  name: z.string().min(2, 'Enter the food name'),
  price: z.coerce.number().positive('Price must be more than ₦0'),
  categoryId: z.string().min(1, 'Pick a category'),
});

<Form schema={schema} defaultValues={item} onSubmit={save.mutateAsync}>
  <FormInput name="name" label="Food name" />
  <MoneyInput name="price" label="Price" />
  <FormSelect name="categoryId" label="Category" options={categories} />
  <Button type="submit">Save item</Button>
</Form>
```

- One Zod schema per form in the feature's `schemas/` folder; reuse it for create and edit.
- Server field errors (`fieldErrors`) are mapped onto the matching inputs automatically by `Form`.
- The submit button shows `loading` while the mutation runs; double submits are blocked.
- Money is entered in naira and sent to the API in **kobo** (integer).

### Lists: `useTableQuery`

```jsx
const table = useTableQuery({ defaults: { limit: 20, sort: '-createdAt' } });
// table.params -> { page, limit, sort, search, status, from, to } synced to ?query string
const { data, isLoading } = useOrders(table.params);

<FilterBar
  value={table.filters}
  onChange={table.setFilters}
  fields={[
    { type: 'search', name: 'search', placeholder: 'Order no. or customer' },
    { type: 'select', name: 'status', options: ORDER_STATUS_OPTIONS },
    { type: 'dateRange', name: ['from', 'to'] },
  ]}
/>
<DataTable columns={orderColumns} rows={data?.data} loading={isLoading} sort={table.sort} onSortChange={table.setSort} />
<Pagination meta={data?.meta} onPageChange={table.setPage} onLimitChange={table.setLimit} />
```

- The URL is the source of truth, so refresh, back button and shared links keep the same view.
- Search input is debounced (400 ms); changing any filter resets to page 1.
- Query parameter names match the backend exactly: `page`, `limit`, `sort` (`-field` = descending), `search`, plus per-field filters like `status=pending,accepted` and `from` / `to` dates.
- Column definitions live in the feature (`features/orders/components/order-columns.jsx`) and are reused by the vendor and admin order pages.
- Feeds and comments use cursor pagination with `useInfiniteQuery` and `InfiniteList`.

## 8. Styling with Tailwind

Brand colours from the BRD (section 15) become named Tailwind tokens; components use the token names (`bg-primary`, `text-ink`), never raw hex values. The visual reference is the Figma **Food Delivery Website & App Design UI Kit** (Digital Forest, CC BY 4.0): match its layouts, button shapes and placement, colours and type, while following these guidelines for structure, accessibility and content.

```js
// tailwind.config.js (excerpt)
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#FC8A06', 50: '#FFF5E8', 100: '#FFE6C7', 600: '#E07A00', 700: '#A35900' }, // Orange
        secondary: { DEFAULT: '#028643', 50: '#E6F4EC', 600: '#016B35' },                         // Cart green
        accent: { DEFAULT: '#FFB703', 50: '#FFF8E1' },                                           // Rating yellow
        ink: { DEFAULT: '#03081F', muted: '#5B6070' },                                           // Deep navy
        surface: { DEFAULT: '#FFFFFF', page: '#FAFAFA', muted: '#F3F3F3', border: '#EEEEEE' },
        danger: '#DC2626', warning: '#D97706', info: '#2563EB',
      },
      fontFamily: { heading: ['Poppins', 'sans-serif'], sans: ['Poppins', 'sans-serif'] },
      borderRadius: { card: '0.75rem' },
      boxShadow: { card: '0 2px 8px rgb(3 8 31 / 0.06), 0 1px 2px rgb(3 8 31 / 0.04)' },
    },
  },
  plugins: [require('@tailwindcss/forms')], // line-clamp is built into Tailwind 3.3+
};
```

### Rules

- Use the `cn()` helper for conditional classes; never build class names with string concatenation (Tailwind cannot see them).
- Spacing scale: 4, 8, 12, 16, 24, 32 px (`p-1`, `p-2`, `p-3`, `p-4`, `p-6`, `p-8`). Page gutter `px-4` on mobile, `px-6` from `md`.
- Breakpoints: design at 360 px, check at `sm` 640, `md` 768, `lg` 1024, `xl` 1280.
- Poppins for all text. Body text `text-sm`/`text-base` in `text-ink`; secondary text `text-ink-muted`. Headings use `font-heading` and `font-semibold`/`font-bold`.
- White text on orange fails contrast: orange buttons, pills and badges use **navy text** (`bg-primary text-ink`). Dark buttons are navy with white text (`bg-ink text-white`). Orange text on white uses `text-primary-700`.
- Shapes follow the UI kit: buttons, nav items, tabs and filter chips are pills (`rounded-full`); the active item is a filled orange pill. Cards are white, `rounded-card` (12 px) with `shadow-card`, on a `surface-page` (light grey) background.
- Page patterns from the kit: a slim top bar (offer, delivery location, green cart button), then the main header (logo left, pill navigation in the middle, dark "Log in / Sign up" pill on the right); store pages open with a navy banner (name, rating box, hours, delivery info) and a sticky category pill strip; menu cards put text on the left and the photo on the right with a round "+" add button; the cart has a green header, orange quantity bubbles and a green checkout button; the customer footer is light grey with a navy bottom bar.
- Status colours are fixed: success = secondary green, warning = amber, danger = red, info = blue, neutral = gray. The same status always looks the same everywhere.
- Repeated class combinations become a component or a `cva` variant, not an `@apply` class.
- Dark mode is out of scope for release 1; keep colours in tokens so it can be added later.

## 9. Content guidelines

KJT Foodie speaks like a friendly Nigerian food vendor who is also very organised: warm, short, clear, never stiff and never slangy in places where money or safety is involved.

### Voice

| Do | Don't |
| --- | --- |
| "Your jollof is on the way 🚚" | "Order status updated to IN\_TRANSIT" |
| "Add to cart" | "Click here to add this item to your shopping cart" |
| "We couldn't take that payment. Try another card." | "Error 402: Payment failed" |
| "Accept order" / "Reject order" | "OK" / "Cancel" on a dialog about orders |
| "Your plan ends on 14 Nov. Renew to stay visible." | "Subscription expiring soon!!!" |

- Plain English first; local food names as people say them (jollof rice, amala, suya, small chops).
- Sentence case for buttons, headings and menu items ("Add new item", not "Add New Item").
- Buttons start with a verb and say what happens: "Place order – ₦8,500", "Mark as ready", "Approve vendor".
- Emoji only in customer-facing celebration moments (order placed, delivered), never in errors, money or admin screens.
- Address the user as "you"; refer to the platform as "KJT Foodie" or "we".

### Formats

| Thing | Format | Example |
| --- | --- | --- |
| Money | `formatNaira(kobo)`: ₦ sign, thousands comma, no decimals unless kobo exist | ₦8,500 · ₦1,250.50 |
| Dates | `d MMM yyyy` | 28 Oct 2026 |
| Times | 12-hour with am/pm | 2:45 pm |
| Relative times | under 24 h only | 5 min ago, 3 h ago, then the date |
| Distance | km with one decimal | 2.4 km |
| ETA | range in minutes | 25–35 min |
| Phone | +234 grouped | +234 803 123 4567 |
| Order number | prefix + 6 characters | KJT-4F7Q2A |
| Time zone | always Africa/Lagos (WAT) |  |

### Required states on every screen

| State | What to show |
| --- | --- |
| Loading | Skeletons shaped like the content (not a full-page spinner) |
| Empty | `EmptyState` with a reason and the next action: "No orders yet. Share your store link to get your first order." |
| Error | `ErrorState` saying what failed, in plain words, with a Retry button |
| No permission | "You don't have access to this page" + link to the user's home |
| Offline | `OfflineBanner`: "You're offline. We'll update when you're back." |
| Success | A toast for small actions; a full confirmation screen for orders and payments |

### Error messages

- Say what happened and what to do next: "That phone number is already registered. Log in instead?"
- Never blame the user, never show stack traces, codes or raw server text.
- Field errors sit under the field, in red, starting with what's needed: "Enter a valid email address".

### Images and media

- Food photos: 4:3, at least 800 × 600 px, under 2 MB; compressed and converted to WebP before upload.
- Every image has `alt` text: the food or vendor name ("Party jollof rice from Mama Put Kitchen").
- Placeholder images for vendors with no photo, never broken image icons.

### User-generated content

- Comments are plain text, max 500 characters, links not clickable, with a "Report" option on each.
- Vendor descriptions max 300 characters; food descriptions max 500.
- Show `Edited` on edited comments; deleted comments show "Comment removed".

## 10. Code conventions, accessibility, performance, testing

### Naming

| Thing | Convention | Example |
| --- | --- | --- |
| Components, pages, layouts | PascalCase file + export | `OrderCard.jsx`, `OrdersPage.jsx` |
| Hooks | `use` + camelCase | `useOrders.js` |
| API modules | `<feature>.api.js` | `orders.api.js` |
| Zustand stores | `<name>-store.js` | `cart-store.js` |
| Constants | UPPER\_SNAKE\_CASE | `ORDER_STATUS` |
| Folders | kebab-case | `features/live-tracking` |
| Imports | `@/` alias for `src/` | `import { Button } from '@/components/ui'` |

### Code rules

- Function components and hooks only; one component per file; files under \~200 lines (split when larger).
- Props destructured in the signature; booleans named `isX`/`hasX`; event props `onX`.
- No `useEffect` for data fetching (use React Query) or for derived values (compute them).
- Status values and role names come from `constants/`, never typed as raw strings.
- Every `index.js` barrel exports only the public parts of its folder.
- Git: branches `feat/`, `fix/`, `chore/`; Conventional Commits (`feat(orders): add accept button`); PRs need one review and green CI.

### Accessibility

- Semantic HTML (`button`, `nav`, `main`, headings in order); labels on every input.
- Focus visible on everything clickable; modals trap focus and close on Esc.
- Colour is never the only signal (status badges have text, not just colour).
- Tap targets at least 44 × 44 px (riders use the app on the move).
- Live order status updates announced with `aria-live="polite"`.

### Performance

- Routes are lazy-loaded per role, so customers never download admin code.
- Images lazy-load with `loading="lazy"` and explicit width/height; responsive sizes via the CDN.
- Lists over 100 rows use virtualisation (`@tanstack/react-virtual`).
- Budget: first load JS under 200 KB gzipped for customer pages; Lighthouse performance 85+ on a mid-range Android over 4G.
- The app is a PWA (installable, offline shell, cached static assets) via `vite-plugin-pwa`.
- Rider location is sent every 5–10 s only while on an active delivery, to save battery and data.

### Testing

| Level | Tool | What | Target |
| --- | --- | --- | --- |
| Unit | Vitest | `lib/format.js`, hooks, Zod schemas, stores | 90% of `lib/` |
| Component | React Testing Library | Every `components/ui` and `components/data` component; key feature components | All shared components |
| Integration | RTL + MSW | Page-level flows against mock handlers (filter a table, submit a form, see errors) | Main pages per role |
| End-to-end | Playwright | Customer orders and tracks; vendor accepts and marks ready; rider delivers; admin approves vendor | 4 critical journeys on every release |

CI (GitHub Actions) runs lint, unit and component tests on every PR, and Playwright on merge to `main`.
