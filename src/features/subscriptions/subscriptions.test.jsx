import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { db, persist } from '@/mocks/db';
import { renderApp } from '@/test/utils';

const EXPIRED = 'expired.vendor@kjtfoodie.test';
const VENDOR = 'vendor@kjtfoodie.test';
const path = (router) => router.state.location.pathname;
const subOf = (vendorId) => db.subscriptions.find((s) => s.vendorId === vendorId);

describe('vendor subscription (phase 12 done-when)', () => {
  it('locks an expired vendor out until they renew with Paystack', async () => {
    const before = db.invoices.filter((i) => i.vendorId === 'ven_expired').length;
    const { router } = await renderApp('/vendor/menu', { as: EXPIRED });

    // Lock: every page except Plans / Subscription sends them to Subscription
    expect(
      await screen.findByRole('heading', { name: 'Subscription' }, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(path(router)).toBe('/vendor/subscription');
    expect(
      await screen.findByText(/Your plan has expired, so customers can't see your store/),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Expired').length).toBeGreaterThan(0);

    // A failed card leaves the plan expired
    await userEvent.click(screen.getByRole('button', { name: /^Renew Basic – ₦/ }));
    let sheet = await screen.findByRole('dialog', { name: 'Paystack (test mode)' });
    await userEvent.click(within(sheet).getByRole('button', { name: 'Simulate a failed payment' }));
    expect(await screen.findByText(/couldn't take that payment/)).toBeInTheDocument();
    expect(db.vendors.find((v) => v.id === 'ven_expired').subscriptionStatus).toBe('expired');

    // Renew
    await userEvent.click(screen.getByRole('button', { name: /^Renew Basic – ₦/ }));
    sheet = await screen.findByRole('dialog', { name: 'Paystack (test mode)' });
    await userEvent.click(within(sheet).getByRole('button', { name: /^Pay ₦/ }));
    expect(await screen.findByText(/^Renews on /)).toBeInTheDocument();
    expect(screen.queryByText(/Your plan has expired/)).not.toBeInTheDocument();
    expect(db.vendors.find((v) => v.id === 'ven_expired').subscriptionStatus).toBe('active');
    expect(db.invoices.filter((i) => i.vendorId === 'ven_expired')).toHaveLength(before + 1);
    expect(await screen.findAllByText('Paid')).not.toHaveLength(0);

    // The rest of the dashboard opens again
    router.navigate('/vendor/menu');
    await waitFor(() => expect(path(router)).toBe('/vendor/menu'));
  });

  it('cancels at period end, keeps the plan, and schedules a downgrade', async () => {
    await renderApp('/vendor/subscription', { as: VENDOR });
    expect(await screen.findByText(/^Renews on /)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel plan' }));
    const dialog = await screen.findByRole('dialog', { name: 'Cancel your plan?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel plan' }));
    expect(await screen.findByText('Ends at period end')).toBeInTheDocument();
    expect(subOf('ven_mama_put').cancelAtPeriodEnd).toBe(true);
    // Mama Put's plan ends in 9 days, so no banner yet
    await userEvent.click(screen.getByRole('button', { name: 'Keep my plan' }));
    await waitFor(() => expect(subOf('ven_mama_put').cancelAtPeriodEnd).toBe(false));

    await userEvent.click(screen.getByRole('link', { name: 'Change plan' }));
    const basic = await screen.findByRole('article', { name: 'Basic' });
    expect(
      within(screen.getByRole('article', { name: 'Pro' })).getByRole('button', {
        name: 'Current plan',
      }),
    ).toBeDisabled();
    await userEvent.click(within(basic).getByRole('button', { name: 'Switch at renewal' }));
    const confirm = await screen.findByRole('dialog', { name: 'Switch to Basic at renewal?' });
    await userEvent.click(within(confirm).getByRole('button', { name: 'Switch to Basic' }));
    expect(await within(basic).findByRole('button', { name: 'Starts at renewal' })).toBeDisabled();
    expect(subOf('ven_mama_put').scheduledChange).toEqual({
      planId: 'plan_basic',
      interval: 'monthly',
    });
  });

  it('warns when the trial is about to end', async () => {
    const sub = subOf('ven_mama_put');
    const vendor = db.vendors.find((v) => v.id === 'ven_mama_put');
    vendor.subscriptionStatus = 'trial';
    sub.trialEndsAt = new Date(Date.now() + 2 * 86400000).toISOString();
    persist();
    await renderApp('/vendor/subscription', { as: VENDOR });
    expect(
      await screen.findByText(/^Your free trial ends on .+ Pick a plan to stay visible\.$/),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Choose a plan' })).toHaveAttribute(
      'href',
      '/vendor/plans',
    );
  });
});
