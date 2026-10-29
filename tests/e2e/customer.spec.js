import { expect, test } from '@playwright/test';

import { signInAs, speedUpRealtime } from './helpers';

test('customer adds food from a storefront and pays with Paystack', async ({ page }) => {
  await signInAs(page, 'Customer — Ada Okafor');
  await page.goto('/v/mama-put-kitchen');
  await expect(page.getByRole('heading', { name: 'Mama Put Kitchen', exact: true })).toBeVisible();
  await page
    .getByRole('button', { name: /^Add .+ to cart$/ })
    .first()
    .click();

  await page.goto('/account/checkout');
  const pay = page.getByRole('button', { name: /^Pay ₦/ });
  await expect(pay).toBeEnabled();
  await pay.click();
  const sheet = page.getByRole('dialog', { name: 'Paystack (test mode)' });
  await sheet.getByRole('button', { name: /^Pay ₦/ }).click();
  await expect(page).toHaveURL(/\/account\/orders\/.+\/confirmed$/);
  await expect(page.getByRole('heading', { name: 'Order placed' })).toBeVisible();
});

test('customer tracks the order on its way until it is delivered, then rates it', async ({
  page,
}) => {
  await signInAs(page, 'Customer — Ada Okafor');
  await page.goto('/account/orders?status=picked_up');
  await speedUpRealtime(page);
  await page.getByRole('link', { name: /^KJT-/ }).first().click();
  await expect(page.getByRole('region', { name: 'Live delivery map' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'How was it?' })).toBeVisible({ timeout: 20_000 });
});
