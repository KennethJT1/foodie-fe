import { createBrowserRouter } from 'react-router-dom';

import { PERMISSIONS as P } from '@/constants/permissions';
import { ROLES } from '@/constants/roles';
import {
  RedirectIfAuthenticated,
  RequireActiveSubscription,
  RequireApproved,
  RequireAuth,
  RequirePermission,
  RequireRole,
} from '@/features/auth';
import CustomerLayout from '@/layouts/CustomerLayout';
import DashboardLayout from '@/layouts/DashboardLayout';
import { adminNav } from '@/layouts/nav/admin';
import { riderNav, riderTabs } from '@/layouts/nav/rider';
import { vendorNav } from '@/layouts/nav/vendor';
import PublicLayout from '@/layouts/PublicLayout';
import { env } from '@/lib/env';

import { RootLayout } from './RootLayout';
import { RouteError } from './RouteError';

/** Lazy route: each page is its own chunk, so customers never download admin code. */
const page = (load) => ({ lazy: () => load().then((m) => ({ Component: m.default })) });

/** Wraps children in an admin permission check. */
const can = (permission, children) => ({
  element: <RequirePermission permission={permission} />,
  children,
});

export const routes = [
  {
    element: <RootLayout />,
    errorElement: <RouteError />,
    children: [
      // ── Auth pages ──────────────────────────────────────────────────────────
      {
        element: <PublicLayout />,
        children: [
          {
            element: <RedirectIfAuthenticated />,
            children: [
              { path: 'login', ...page(() => import('@/pages/public/LoginPage')) },
              { path: 'signup/:role?', ...page(() => import('@/pages/public/SignupPage')) },
              {
                path: 'forgot-password',
                ...page(() => import('@/pages/public/ForgotPasswordPage')),
              },
              { path: 'reset-password', ...page(() => import('@/pages/public/ResetPasswordPage')) },
            ],
          },
          { path: 'verify', ...page(() => import('@/pages/public/VerifyOtpPage')) },
          { path: '403', ...page(() => import('@/pages/public/ForbiddenPage')) },
        ],
      },

      // ── Customer and public browsing ────────────────────────────────────────
      {
        element: <CustomerLayout />,
        children: [
          { index: true, ...page(() => import('@/pages/public/HomePage')) },
          { path: 'search', ...page(() => import('@/pages/public/SearchPage')) },
          { path: 'food/:foodId', ...page(() => import('@/pages/public/FoodDetailPage')) },
          { path: 'v/:vendorSlug', ...page(() => import('@/pages/public/StorefrontPage')) },
          {
            path: 'account',
            element: (
              <RequireAuth>
                <RequireRole roles={[ROLES.CUSTOMER]} />
              </RequireAuth>
            ),
            children: [
              { index: true, ...page(() => import('@/pages/customer/AccountPage')) },
              { path: 'cart', ...page(() => import('@/pages/customer/CartPage')) },
              { path: 'checkout', ...page(() => import('@/pages/customer/CheckoutPage')) },
              { path: 'orders', ...page(() => import('@/pages/customer/OrdersPage')) },
              {
                path: 'orders/:orderId',
                ...page(() => import('@/pages/customer/OrderDetailPage')),
              },
              {
                path: 'orders/:orderId/confirmed',
                ...page(() => import('@/pages/customer/OrderConfirmedPage')),
              },
              { path: 'liked', ...page(() => import('@/pages/customer/LikedPage')) },
              { path: 'following', ...page(() => import('@/pages/customer/FollowingPage')) },
              { path: 'refunds', ...page(() => import('@/pages/customer/RefundsPage')) },
              {
                path: 'refunds/:refundId',
                ...page(() => import('@/pages/customer/RefundDetailPage')),
              },
              { path: 'addresses', ...page(() => import('@/pages/customer/AddressesPage')) },
              { path: 'payments', ...page(() => import('@/pages/customer/PaymentsPage')) },
              { path: 'profile', ...page(() => import('@/pages/customer/ProfilePage')) },
              {
                path: 'notifications',
                ...page(() => import('@/pages/customer/NotificationsPage')),
              },
              { path: 'support', ...page(() => import('@/pages/customer/SupportPage')) },
            ],
          },
        ],
      },

      // ── Vendor ────────────────────────────────────────────────────────────────
      {
        path: 'vendor',
        element: (
          <RequireAuth>
            <RequireRole roles={[ROLES.VENDOR]}>
              <DashboardLayout
                nav={vendorNav}
                subtitle="Vendor"
                home="/vendor"
                notificationsTo="/vendor/notifications"
                profileTo="/vendor/settings"
              />
            </RequireRole>
          </RequireAuth>
        ),
        children: [
          { path: 'onboarding', ...page(() => import('@/pages/vendor/OnboardingPage')) },
          { path: 'status', ...page(() => import('@/pages/vendor/StatusPage')) },
          { path: 'notifications', ...page(() => import('@/pages/vendor/NotificationsPage')) },
          { path: 'support', ...page(() => import('@/pages/vendor/SupportPage')) },
          {
            element: <RequireApproved />,
            children: [
              // Always open so an expired vendor can renew
              { path: 'plans', ...page(() => import('@/pages/vendor/PlansPage')) },
              { path: 'subscription', ...page(() => import('@/pages/vendor/SubscriptionPage')) },
              {
                element: <RequireActiveSubscription />,
                children: [
                  { index: true, ...page(() => import('@/pages/vendor/OverviewPage')) },
                  { path: 'orders', ...page(() => import('@/pages/vendor/LiveOrdersPage')) },
                  {
                    path: 'orders/history',
                    ...page(() => import('@/pages/vendor/OrderHistoryPage')),
                  },
                  {
                    path: 'orders/:orderId',
                    ...page(() => import('@/pages/vendor/OrderDetailPage')),
                  },
                  { path: 'menu', ...page(() => import('@/pages/vendor/MenuPage')) },
                  { path: 'menu/new', ...page(() => import('@/pages/vendor/MenuItemFormPage')) },
                  {
                    path: 'menu/:itemId',
                    ...page(() => import('@/pages/vendor/MenuItemFormPage')),
                  },
                  { path: 'sales', ...page(() => import('@/pages/vendor/SalesPage')) },
                  { path: 'engagement', ...page(() => import('@/pages/vendor/EngagementPage')) },
                  { path: 'refunds', ...page(() => import('@/pages/vendor/RefundsPage')) },
                  { path: 'settings', ...page(() => import('@/pages/vendor/SettingsPage')) },
                ],
              },
            ],
          },
        ],
      },

      // ── Rider ─────────────────────────────────────────────────────────────────
      {
        path: 'rider',
        element: (
          <RequireAuth>
            <RequireRole roles={[ROLES.RIDER]}>
              <DashboardLayout
                nav={riderNav}
                tabs={riderTabs}
                subtitle="Rider"
                home="/rider"
                notificationsTo="/rider/notifications"
                profileTo="/rider/profile"
              />
            </RequireRole>
          </RequireAuth>
        ),
        children: [
          { path: 'onboarding', ...page(() => import('@/pages/rider/OnboardingPage')) },
          { path: 'status', ...page(() => import('@/pages/rider/StatusPage')) },
          { path: 'notifications', ...page(() => import('@/pages/rider/NotificationsPage')) },
          { path: 'support', ...page(() => import('@/pages/rider/SupportPage')) },
          {
            element: <RequireApproved />,
            children: [
              { index: true, ...page(() => import('@/pages/rider/HomePage')) },
              { path: 'delivery', ...page(() => import('@/pages/rider/ActiveDeliveryPage')) },
              { path: 'trips', ...page(() => import('@/pages/rider/TripsPage')) },
              { path: 'earnings', ...page(() => import('@/pages/rider/EarningsPage')) },
              { path: 'profile', ...page(() => import('@/pages/rider/ProfilePage')) },
            ],
          },
        ],
      },

      // ── Admin ─────────────────────────────────────────────────────────────────
      {
        path: 'admin',
        element: (
          <RequireAuth>
            <RequireRole roles={[ROLES.ADMIN]}>
              <DashboardLayout nav={adminNav} subtitle="Admin" home="/admin" />
            </RequireRole>
          </RequireAuth>
        ),
        children: [
          { index: true, ...page(() => import('@/pages/admin/OverviewPage')) },
          can(P.VENDORS_APPROVE, [
            {
              path: 'vendors/approvals',
              ...page(() => import('@/pages/admin/VendorApprovalsPage')),
            },
          ]),
          can(P.VENDORS_VIEW, [
            { path: 'vendors', ...page(() => import('@/pages/admin/VendorsPage')) },
            { path: 'vendors/:vendorId', ...page(() => import('@/pages/admin/VendorDetailPage')) },
          ]),
          can(P.RIDERS_APPROVE, [
            { path: 'riders/approvals', ...page(() => import('@/pages/admin/RiderApprovalsPage')) },
          ]),
          can(P.RIDERS_VIEW, [
            { path: 'riders', ...page(() => import('@/pages/admin/RidersPage')) },
            { path: 'riders/:riderId', ...page(() => import('@/pages/admin/RiderDetailPage')) },
          ]),
          can(P.CUSTOMERS_VIEW, [
            { path: 'customers', ...page(() => import('@/pages/admin/CustomersPage')) },
          ]),
          can(P.ORDERS_VIEW, [
            { path: 'orders', ...page(() => import('@/pages/admin/OrdersPage')) },
            { path: 'orders/:orderId', ...page(() => import('@/pages/admin/OrderDetailPage')) },
          ]),
          can(P.LIVE_MAP_VIEW, [
            { path: 'live-map', ...page(() => import('@/pages/admin/LiveMapPage')) },
          ]),
          can(P.PAYMENTS_VIEW, [
            { path: 'payments', ...page(() => import('@/pages/admin/PaymentsPage')) },
          ]),
          can(P.SUBSCRIPTIONS_VIEW, [
            { path: 'subscriptions', ...page(() => import('@/pages/admin/SubscriptionsPage')) },
          ]),
          can(P.SUBSCRIPTIONS_MANAGE, [
            { path: 'plans', ...page(() => import('@/pages/admin/PlansPage')) },
          ]),
          can(P.PAYOUTS_MANAGE, [
            { path: 'payouts', ...page(() => import('@/pages/admin/PayoutsPage')) },
          ]),
          can(P.REFUNDS_VIEW, [
            { path: 'refunds', ...page(() => import('@/pages/admin/RefundsPage')) },
            { path: 'refunds/:refundId', ...page(() => import('@/pages/admin/RefundDetailPage')) },
          ]),
          can(P.MODERATION_MANAGE, [
            { path: 'moderation', ...page(() => import('@/pages/admin/ModerationPage')) },
          ]),
          can(P.SUPPORT_MANAGE, [
            { path: 'support', ...page(() => import('@/pages/admin/SupportPage')) },
          ]),
          can(P.SETTINGS_MANAGE, [
            { path: 'settings', ...page(() => import('@/pages/admin/SettingsPage')) },
          ]),
          can(P.ADMIN_USERS_MANAGE, [
            { path: 'admin-users', ...page(() => import('@/pages/admin/AdminUsersPage')) },
          ]),
          can(P.AUDIT_LOG_VIEW, [
            { path: 'audit-log', ...page(() => import('@/pages/admin/AuditLogPage')) },
          ]),
        ],
      },

      // ── Development only ────────────────────────────────────────────────────
      ...(env.isDev
        ? [
            { path: 'dev/ui', ...page(() => import('@/pages/dev/DevUiPage')) },
            { path: 'dev/tokens', ...page(() => import('@/pages/dev/TokensPage')) },
            { path: 'dev/table', ...page(() => import('@/pages/dev/DevTablePage')) },
            { path: 'dev/form', ...page(() => import('@/pages/dev/DevFormPage')) },
          ]
        : []),

      {
        element: <PublicLayout />,
        children: [{ path: '*', ...page(() => import('@/pages/public/NotFoundPage')) }],
      },
    ],
  },
];

export const router = createBrowserRouter(routes);
