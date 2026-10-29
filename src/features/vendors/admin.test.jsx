import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { formatOrderNumber } from '@/lib/format';
import { db, persist } from '@/mocks/db';
import { renderApp } from '@/test/utils';

const ONBOARDING = 'onboarding@kjtfoodie.test';
const DISPATCH = 'dispatch@kjtfoodie.test';
const SUPER = 'super@kjtfoodie.test';
const path = (router) => router.state.location.pathname;

describe('admin core (phase 15 done-when)', () => {
  it('approves a pending vendor from the approval queue', async () => {
    const { router } = await renderApp('/admin/vendors/approvals', { as: ONBOARDING });
    expect(await screen.findByRole('heading', { name: 'Vendor approvals' })).toBeInTheDocument();
    const vendor = db.vendors
      .filter((v) => v.approvalStatus === 'pending')
      .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))[0];
    const [link] = await screen.findAllByRole('link', { name: vendor.name });
    await userEvent.click(link);
    await waitFor(() => expect(path(router)).toBe(`/admin/vendors/${vendor.id}`));
    expect(await screen.findByRole('heading', { name: 'Documents' })).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: /Government ID/ }).length).toBeGreaterThan(0);

    await userEvent.click(screen.getByRole('button', { name: 'Approve vendor' }));
    const dialog = await screen.findByRole('dialog', { name: `Approve ${vendor.name}?` });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Approve vendor' }));
    await waitFor(() => expect(vendor.approvalStatus).toBe('approved'));
    expect(
      db.notifications.some(
        (n) => n.userId === vendor.ownerId && n.title === 'Your store is approved',
      ),
    ).toBe(true);
    expect(db.auditLog[0]).toMatchObject({ action: 'vendor.approve', targetId: vendor.id });
  });

  it('approves one rider and rejects another with a reason', async () => {
    const [first, second] = db.riders.filter((r) => r.approvalStatus === 'pending');
    const { router } = await renderApp(`/admin/riders/${first.id}`, { as: ONBOARDING });
    await userEvent.click(
      await screen.findByRole('button', { name: 'Approve rider' }, { timeout: 5000 }),
    );
    await userEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Approve rider' }),
    );
    await waitFor(() => expect(first.approvalStatus).toBe('approved'));

    await act(() => router.navigate(`/admin/riders/${second.id}`));
    await userEvent.click(await screen.findByRole('button', { name: 'Reject rider' }));
    const dialog = await screen.findByRole('dialog', { name: `Reject ${second.name}?` });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reject rider' }));
    expect(await within(dialog).findByText('Give a reason')).toBeInTheDocument();
    await userEvent.type(
      within(dialog).getByLabelText('What needs fixing?'),
      'The licence photo is blurry.',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reject rider' }));
    await waitFor(() => expect(second.approvalStatus).toBe('rejected'));
    expect(second.rejectionReason).toBe('The licence photo is blurry.');
  });

  it('reassigns an order to another rider', async () => {
    const order = db.orders.find(
      (o) => o.vendorId === 'ven_mama_put' && o.status === 'rider_assigned',
    );
    const before = order.riderId;
    const free = db.riders.find(
      (r) =>
        r.approvalStatus === 'approved' &&
        r.city === 'Lagos' &&
        r.id !== before &&
        !db.orders.some(
          (o) => o.riderId === r.id && ['rider_assigned', 'picked_up'].includes(o.status),
        ),
    );
    free.isOnline = true;
    persist();

    await renderApp(`/admin/orders/${order.id}`, { as: DISPATCH });
    expect(
      await screen.findByRole(
        'heading',
        { name: `Order ${formatOrderNumber(order.code)}` },
        { timeout: 5000 },
      ),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reassign rider' }));
    const dialog = await screen.findByRole('dialog', {
      name: `Reassign ${formatOrderNumber(order.code)}`,
    });
    expect(within(dialog).getByRole('button', { name: 'Reassign order' })).toBeDisabled();
    await userEvent.click(
      await within(dialog).findByRole('radio', { name: new RegExp(free.name) }),
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reassign order' }));
    await waitFor(() => expect(order.riderId).toBe(free.id));
    expect(db.deliveries.find((d) => d.orderId === order.id).riderId).toBe(free.id);
    expect(db.auditLog[0]).toMatchObject({ action: 'order.reassign', targetId: order.id });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('shows the overview, customers (with ban) and the live map to a super admin', async () => {
    const { router } = await renderApp('/admin', { as: SUPER });
    expect(
      await screen.findByRole('heading', { name: 'Overview' }, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(await screen.findByText('GMV today')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Vendors to approve/ })).toBeInTheDocument();

    await act(() => router.navigate('/admin/customers'));
    const customer = db.users.find(
      (u) => u.role === 'customer' && u.status === 'active' && u.id !== 'usr_customer_ada',
    );
    await userEvent.type(await screen.findByRole('searchbox'), customer.email);
    const [cell] = await screen.findAllByText(customer.name);
    await userEvent.click(within(cell.closest('tr')).getByRole('button', { name: /actions/i }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Ban customer' }));
    const dialog = await screen.findByRole('dialog', { name: `Ban ${customer.name}?` });
    await userEvent.type(within(dialog).getByLabelText('Reason'), 'Repeated fake refund claims');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Ban customer' }));
    await waitFor(() => expect(customer.status).toBe('banned'));

    await act(() => router.navigate('/admin/live-map'));
    expect(await screen.findByRole('region', { name: 'Live map of Lagos' })).toBeInTheDocument();
    expect(screen.getByText('Riders online')).toBeInTheDocument();
  });

  it('keeps each admin sub-role to its own pages', async () => {
    const { router } = await renderApp('/admin/orders', { as: ONBOARDING });
    expect(
      await screen.findByText("You don't have access to this page", {}, { timeout: 5000 }),
    ).toBeInTheDocument();
    await act(() => router.navigate('/admin/vendors/approvals'));
    expect(await screen.findByRole('heading', { name: 'Vendor approvals' })).toBeInTheDocument();
  });
});
