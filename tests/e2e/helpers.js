import { expect } from '@playwright/test';

/**
 * Signs in through the development "Demo accounts" switcher (mock mode only).
 * The clock starts at midday Lagos time so every seeded store is open; time then runs normally.
 */
export async function signInAs(page, accountLabel) {
  await page.clock.install({ time: new Date('2026-10-28T12:00:00+01:00') });
  await page.goto('/');
  await page.getByRole('button', { name: 'Demo accounts' }).click();
  const dialog = page.getByRole('dialog', { name: 'Switch demo account' });
  await dialog.getByRole('button', { name: accountLabel }).click();
  await expect(dialog).toBeHidden();
}

/**
 * Makes the fake real-time server move fast so journeys finish in seconds.
 * Call it after the last full page load (page.goto resets it).
 */
export async function speedUpRealtime(page, opts = {}) {
  await page.waitForFunction(() => Boolean(window.__kjtMocks?.configureSimulation));
  await page.evaluate((o) => window.__kjtMocks.configureSimulation(o), {
    stepMs: 400,
    approachSteps: 2,
    deliverySteps: 2,
    offerDelayMs: 500,
    newOrderMs: 0,
    chatReplyMs: 0,
    ...opts,
  });
}
