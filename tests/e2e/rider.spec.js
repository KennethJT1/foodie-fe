import { expect, test } from '@playwright/test';

import { signInAs, speedUpRealtime } from './helpers';

test('rider goes online, accepts a job and delivers it with the code (360 px)', async ({
  page,
}) => {
  await signInAs(page, 'Rider — Tunde Bakare');
  await page.goto('/rider');
  await speedUpRealtime(page);
  await page.getByRole('switch', { name: 'Go online' }).click();

  const offer = page.getByRole('article', { name: 'New delivery job' });
  await expect(offer).toBeVisible({ timeout: 15_000 });
  await offer.getByRole('button', { name: 'Accept job' }).click();
  await expect(page).toHaveURL(/\/rider\/delivery$/);

  await page.getByRole('button', { name: "I've picked up the order" }).click();
  await expect(page.getByText('Deliver to')).toBeVisible();

  const heading = await page.getByRole('heading', { name: /^Order KJT-/ }).textContent();
  const orderCode = heading.trim().replace('Order KJT-', '');
  const code = await page.evaluate((c) => window.__kjtMocks.deliveryCode(c), orderCode);
  expect(code).toMatch(/^\d{4}$/);
  for (const [i, d] of [...code].entries())
    await page.getByRole('textbox', { name: `Digit ${i + 1} of 4` }).fill(d);
  await page.getByRole('button', { name: 'Complete delivery' }).click();
  await expect(page).toHaveURL(/\/rider$/);
  await expect(page.getByText(/^Delivered\. You earned ₦/)).toBeVisible();

  // Nothing scrolls sideways on a 360 px phone
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
