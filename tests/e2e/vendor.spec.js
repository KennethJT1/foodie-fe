import { expect, test } from '@playwright/test';

import { signInAs, speedUpRealtime } from './helpers';

test('vendor accepts a new order, prepares it and marks it ready', async ({ page }) => {
  await signInAs(page, 'Vendor — Mama Put Kitchen (Pro)');
  await page.goto('/vendor/orders');
  await speedUpRealtime(page);
  await expect(page.getByRole('heading', { name: 'Live orders' })).toBeVisible();

  const card = page
    .getByRole('article', { name: /^Order KJT-/ })
    .filter({ has: page.getByRole('button', { name: 'Accept order' }) })
    .first();
  const name = await card.getAttribute('aria-label');
  await card.getByRole('button', { name: 'Accept order' }).click();
  const same = page.getByRole('article', { name });
  await same.getByRole('button', { name: 'Start preparing' }).click();
  await same.getByRole('button', { name: 'Mark as ready' }).click();
  await expect(page.getByText(/is ready\. We're finding a rider/)).toBeVisible();
});
