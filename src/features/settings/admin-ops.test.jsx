import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { db, persist } from '@/mocks/db';
import { renderApp } from '@/test/utils';

const path = (router) => router.state.location.pathname;
const sidebar = () => screen.getAllByRole('navigation', { name: 'Main' })[0];
const navLabels = () =>
  within(sidebar())
    .getAllByRole('link')
    .map((a) => a.textContent.trim());
const rowFor = async (text) => (await screen.findAllByText(text))[0].closest('tr');
const openRowMenu = async (row) =>
  userEvent.click(within(row).getByRole('button', { name: /actions/i }));

const NAV = {
  'finance@kjtfoodie.test': [
    'Overview',
    'Orders',
    'Refunds',
    'Payments',
    'Subscriptions',
    'Plans and prices',
    'Rider payouts',
  ],
  'support@kjtfoodie.test': [
    'Overview',
    'Vendors',
    'Riders',
    'Customers',
    'Orders',
    'Refunds',
    'Moderation',
    'Support inbox',
  ],
  'dispatch@kjtfoodie.test': ['Overview', 'Riders', 'Orders', 'Live map'],
  'onboarding@kjtfoodie.test': [
    'Overview',
    'Vendor approvals',
    'Vendors',
    'Rider approvals',
    'Riders',
  ],
};

describe('admin finance and operations (phase 16 done-when)', () => {
  it.each(Object.entries(NAV))('%s sees only their pages', async (email, labels) => {
    const { router } = await renderApp('/admin', { as: email });
    await waitFor(() => expect(navLabels()).toEqual(labels), { timeout: 5000 });
    await act(() => router.navigate('/admin/settings'));
    expect(await screen.findByText("You don't have access to this page")).toBeInTheDocument();
  });

  it('Finance approves and pays a rider payout, extends a plan, reconciles a payment and edits a price', async () => {
    const statement =
      db.payoutStatements.find((s) => s.riderId === 'rid_tunde' && s.status !== 'paid') ??
      db.payoutStatements[0];
    Object.assign(statement, { status: 'draft', reference: null, paidAt: null, approvedAt: null });
    persist();
    const { router } = await renderApp('/admin/payouts', { as: 'finance@kjtfoodie.test' });
    await screen.findByRole('heading', { name: 'Rider payouts' }, { timeout: 5000 });
    await userEvent.type(screen.getByRole('searchbox'), statement.riderName);
    let row = (await screen.findAllByText(statement.riderName))
      .map((c) => c.closest('tr'))
      .find((tr) => tr && within(tr).queryByText('Draft'));
    await openRowMenu(row);
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Approve statement' }));
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Approve statement' }),
    );
    await waitFor(() => expect(statement.status).toBe('approved'));
    row = (await screen.findAllByText('Approved')).map((c) => c.closest('tr')).find(Boolean);
    await openRowMenu(row);
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Mark as paid' }));
    const pay = await screen.findByRole('dialog');
    await userEvent.type(within(pay).getByLabelText('Transfer reference'), 'TRF-2026-1101');
    await userEvent.click(within(pay).getByRole('button', { name: 'Mark as paid' }));
    await waitFor(() =>
      expect(statement).toMatchObject({ status: 'paid', reference: 'TRF-2026-1101' }),
    );

    // Extend the expired vendor's plan
    await act(() => router.navigate('/admin/subscriptions'));
    await userEvent.type(await screen.findByRole('searchbox'), 'Chidi Grills');
    await openRowMenu(await rowFor('Chidi Grills'));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Extend plan' }));
    const extend = await screen.findByRole('dialog', { name: "Extend Chidi Grills's plan" });
    await userEvent.type(within(extend).getByLabelText('Reason'), 'Paystack outage last week');
    await userEvent.click(within(extend).getByRole('button', { name: 'Extend plan' }));
    await waitFor(() =>
      expect(db.vendors.find((v) => v.id === 'ven_expired').subscriptionStatus).toBe('active'),
    );

    // Reconcile a flagged payment
    const flagged = db.payments.find((p) => p.type === 'order');
    flagged.flag = 'missing_webhook';
    persist();
    await act(() => router.navigate('/admin/payments?flagged=true'));
    await openRowMenu(await rowFor(flagged.reference));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Mark as reconciled' }));
    const rec = await screen.findByRole('dialog');
    await userEvent.type(
      within(rec).getByLabelText('How did you check it?'),
      'Matched in the Paystack dashboard',
    );
    await userEvent.click(within(rec).getByRole('button', { name: 'Mark as reconciled' }));
    await waitFor(() => expect(flagged).toMatchObject({ flag: null, reconciled: true }));

    // Change a plan price
    await act(() => router.navigate('/admin/plans'));
    await userEvent.click(await screen.findByRole('button', { name: 'Edit Basic' }));
    const dialog = await screen.findByRole('dialog', { name: 'Edit Basic' });
    const price = within(dialog).getByLabelText('Monthly price');
    await userEvent.clear(price);
    await userEvent.type(price, '6000');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save plan' }));
    await waitFor(() =>
      expect(db.plans.find((p) => p.id === 'plan_basic').monthlyPrice).toBe(600000),
    );
    expect(path(router)).toBe('/admin/plans');
  });

  it('Support moderates a comment, answers a ticket with a note and escalates a refund', async () => {
    const { router } = await renderApp('/admin/moderation', { as: 'support@kjtfoodie.test' });
    const open = () => db.reports.filter((r) => r.status === 'open').length;
    const before = open();
    const [card] = await screen.findAllByRole('article', { name: /^Report: / }, { timeout: 5000 });
    await userEvent.click(within(card).getByRole('button', { name: 'Hide' }));
    await waitFor(() => expect(open()).toBeLessThan(before));
    expect(db.reports.some((r) => r.action === 'hide' && r.resolvedBy === 'Ifeoma Nwosu')).toBe(
      true,
    );

    const ticket = db.tickets.find((t) => t.status === 'open');
    await act(() => router.navigate(`/admin/support?ticket=${ticket.id}`));
    expect(await screen.findByRole('heading', { name: ticket.subject })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox', { name: /Internal note/ }));
    await userEvent.type(screen.getByLabelText('Internal note'), 'Asked finance to check Paystack');
    await userEvent.click(screen.getByRole('button', { name: 'Add note' }));
    await waitFor(() => expect(ticket.messages.at(-1)).toMatchObject({ internal: true }));
    await userEvent.click(screen.getByRole('checkbox', { name: /Internal note/ }));
    await userEvent.type(
      screen.getByLabelText(`Reply to ${ticket.userName}`),
      'We are on it and will update you today.',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Send reply' }));
    await waitFor(() => expect(ticket.status).toBe('pending'));
    expect(ticket.assigneeId).toBe('usr_admin_support');

    const refund = db.refunds.find((r) => r.status === 'disputed');
    await act(() => router.navigate(`/admin/refunds/${refund.id}`));
    await userEvent.click(await screen.findByRole('button', { name: 'Escalate refund' }));
    const dialog = await screen.findByRole('dialog', { name: 'Escalate this refund?' });
    await userEvent.type(
      within(dialog).getByLabelText('Why are you escalating it?'),
      'Vendor not responding to the dispute',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Escalate refund' }));
    await waitFor(() => expect(refund.status).toBe('escalated'));
  });

  it('Super admin changes settings and a role, and sees it in the audit log', async () => {
    const { router } = await renderApp('/admin/settings', { as: 'super@kjtfoodie.test' });
    const payout = await screen.findByLabelText(
      'Rider payout (% of delivery fee)',
      {},
      { timeout: 5000 },
    );
    await userEvent.clear(payout);
    await userEvent.type(payout, '75');
    expect(screen.getByText(/A 2 km trip costs/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Save settings' }));
    await waitFor(() => expect(db.settings.riderPayoutPct).toBe(75));

    await act(() => router.navigate('/admin/admin-users'));
    await userEvent.click(await screen.findByRole('tab', { name: 'Roles and permissions' }));
    const dispatchCard = (
      await screen.findByRole('group', { name: 'Permissions for Dispatch' })
    ).closest('div.rounded-card');
    await userEvent.click(within(dispatchCard).getByRole('checkbox', { name: 'See the live map' }));
    await userEvent.click(
      within(dispatchCard).getByRole('button', { name: 'Save Dispatch permissions' }),
    );
    await waitFor(() =>
      expect(db.adminRoles.find((r) => r.id === 'dispatch').permissions).not.toContain(
        'live_map.view',
      ),
    );

    await act(() => router.navigate('/admin/audit-log'));
    expect((await screen.findAllByText('role.updated')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('settings.updated').length).toBeGreaterThan(0);
  });
});
