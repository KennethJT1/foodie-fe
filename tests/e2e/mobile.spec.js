import { expect, test } from '@playwright/test';

import { signInAs } from './helpers';

/** Every main screen fits a 360 px phone: nothing scrolls sideways. */
const ROLES = [
  [
    'Customer — Ada Okafor',
    [
      '/',
      '/search',
      '/v/mama-put-kitchen',
      '/account/orders',
      '/account/checkout',
      '/account/support',
    ],
  ],
  [
    'Vendor — Mama Put Kitchen (Pro)',
    [
      '/vendor',
      '/vendor/orders',
      '/vendor/menu',
      '/vendor/menu/new',
      '/vendor/sales',
      '/vendor/subscription',
      '/vendor/plans',
      '/vendor/settings',
    ],
  ],
  ['Rider — Tunde Bakare', ['/rider', '/rider/trips', '/rider/earnings', '/rider/profile']],
  [
    'Admin — Super admin',
    [
      '/admin',
      '/admin/vendors',
      '/admin/orders',
      '/admin/live-map',
      '/admin/payments',
      '/admin/support',
      '/admin/settings',
      '/admin/admin-users',
    ],
  ],
];

for (const [account, routes] of ROLES) {
  test(`${account}: main screens fit 360 px`, async ({ page }) => {
    await signInAs(page, account);
    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator('main h1').first()).toBeVisible();
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, `${route} scrolls sideways by ${overflow}px`).toBeLessThanOrEqual(0);
    }
  });
}
