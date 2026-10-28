import { expect, test } from '@playwright/test';

import { signInAs } from './helpers';

test('onboarding admin approves a vendor', async ({ page }) => {
  await signInAs(page, 'Admin — Onboarding');
  await page.goto('/admin/vendors/approvals');
  await expect(page.getByRole('heading', { name: 'Vendor approvals' })).toBeVisible();
  const row = page
    .getByRole('row')
    .filter({ has: page.getByRole('link') })
    .first();
  const name = (await row.getByRole('link').first().textContent()).trim();
  await row.getByRole('link').first().click();
  await expect(page.getByRole('heading', { name })).toBeVisible();
  await page.getByRole('button', { name: 'Approve vendor' }).click();
  await page
    .getByRole('dialog', { name: `Approve ${name}?` })
    .getByRole('button', { name: 'Approve vendor' })
    .click();
  await expect(page.getByText(`${name} approved`)).toBeVisible();
  await expect(page.getByText('Approved', { exact: true }).first()).toBeVisible();
});
