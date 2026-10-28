import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { formatOrderNumber } from '@/lib/format';
import { db, persist } from '@/mocks/db';
import { configureOrderSimulation } from '@/mocks/realtime';
import { renderApp } from '@/test/utils';

const ADA = 'customer@kjtfoodie.test';
const path = (router) => router.state.location.pathname;

/** Ada's seeded order that a rider is bringing to her. */
function adaActiveOrder() {
  return db.orders.find((o) => o.customerId === 'usr_customer_ada' && o.status === 'picked_up');
}

describe('tracking, reviews and refunds (phase 11 done-when)', () => {
  it('watches a paid order reach delivered on the live map, rates it and asks for a refund', async () => {
    const order = adaActiveOrder();
    order.status = 'paid';
    order.statusHistory = [{ status: 'paid', at: new Date().toISOString(), by: 'system' }];
    db.refunds = db.refunds.filter((r) => r.orderId !== order.id);
    persist();
    configureOrderSimulation({ enabled: true, stepMs: 20, approachSteps: 2, deliverySteps: 2 });

    const { router } = await renderApp(`/account/orders/${order.id}`, { as: ADA });
    expect(await screen.findByRole('region', { name: 'Live delivery map' })).toBeInTheDocument();
    expect(screen.getByText(order.deliveryCode)).toBeInTheDocument();

    // The mock socket assigns a rider and moves them along the route
    expect(await screen.findByText(/Your rider is heading to/)).toBeInTheDocument();
    expect(await screen.findByText(/Your rider is .+ away · arrives in/)).toBeInTheDocument();

    // Delivered: the map goes away and the rating card appears
    await screen.findByRole('heading', { name: 'How was it?' }, { timeout: 4000 });
    expect(order.status).toBe('delivered');
    expect(screen.queryByRole('region', { name: 'Live delivery map' })).not.toBeInTheDocument();
    const [vendorSubmit, riderSubmit] = screen.getAllByRole('button', { name: 'Submit rating' });
    await userEvent.click(vendorSubmit);
    expect(await screen.findByText('Pick 1 to 5 stars')).toBeInTheDocument();
    await userEvent.click(
      within(screen.getByRole('radiogroup', { name: `Rate ${order.vendorName}` })).getByRole(
        'radio',
        { name: '5 stars' },
      ),
    );
    await userEvent.click(vendorSubmit);
    await waitFor(() => expect(order.ratedVendor).toBe(true));

    await userEvent.click(
      within(screen.getByRole('radiogroup', { name: /^Rate your rider/ })).getByRole('radio', {
        name: '4 stars',
      }),
    );
    await userEvent.click(riderSubmit);
    expect(await screen.findByRole('heading', { name: 'Thanks for rating' })).toBeInTheDocument();
    expect(db.reviews.filter((r) => r.orderId === order.id)).toHaveLength(2);

    // Refund request
    await userEvent.click(screen.getByRole('button', { name: 'Request a refund' }));
    const dialog = await screen.findByRole('dialog', { name: 'Request a refund' });
    await userEvent.selectOptions(
      within(dialog).getByLabelText('What went wrong?'),
      'Food arrived cold',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send request' }));

    await waitFor(() => expect(path(router)).toMatch(/^\/account\/refunds\/.+/));
    expect(
      await screen.findByRole('heading', {
        name: `Refund for ${formatOrderNumber(order.code)}`,
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Refund requested').length).toBeGreaterThan(0);
    const refund = db.refunds.find((r) => r.orderId === order.id);
    expect(refund).toMatchObject({ status: 'requested', amount: order.subtotal });
  });

  it('shows the moving rider on an order that is already picked up', async () => {
    const order = adaActiveOrder();
    configureOrderSimulation({ enabled: true, stepMs: 20, deliverySteps: 3 });
    await renderApp(`/account/orders/${order.id}`, { as: ADA });
    expect(await screen.findByRole('region', { name: 'Live delivery map' })).toBeInTheDocument();
    expect(await screen.findByText(/arrives in/)).toBeInTheDocument();
    const map = screen.getByRole('region', { name: 'Live delivery map' }).parentElement;
    expect(within(map).getByRole('link', { name: /^Call / })).toHaveAttribute(
      'href',
      expect.stringMatching(/^tel:/),
    );
  });

  it('confirms a paid refund or disputes it', async () => {
    const refund = db.refunds.find((r) => r.customerId === 'usr_customer_ada');
    refund.status = 'paid';
    refund.paymentReference = 'TRF-1234';
    persist();
    await renderApp(`/account/refunds/${refund.id}`, { as: ADA });
    await userEvent.click(await screen.findByRole('button', { name: "I didn't get it" }));
    const dialog = await screen.findByRole('dialog', { name: 'Dispute this refund' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send dispute' }));
    expect(await within(dialog).findByText('Tell us what went wrong')).toBeInTheDocument();
    await userEvent.type(within(dialog).getByLabelText('What went wrong?'), 'No money came in');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send dispute' }));
    await waitFor(() => expect(refund.status).toBe('disputed'));
  });

  it('lists refunds', async () => {
    await renderApp('/account/refunds', { as: ADA });
    const mine = db.refunds.find((r) => r.customerId === 'usr_customer_ada');
    expect((await screen.findAllByText(formatOrderNumber(mine.orderCode))).length).toBeGreaterThan(
      0,
    );
  });

  it('opens a notification, marks it read and follows its link', async () => {
    const order = adaActiveOrder();
    const { router } = await renderApp('/account/notifications', { as: ADA });
    await userEvent.click(await screen.findByRole('button', { name: /Your food is on the way/ }));
    await waitFor(() => expect(path(router)).toBe(`/account/orders/${order.id}`));
    const note = db.notifications.find(
      (n) => n.userId === 'usr_customer_ada' && n.link === `/account/orders/${order.id}`,
    );
    await waitFor(() => expect(note.readAt).not.toBeNull());
  });

  it('shows the empty state when everything is read', async () => {
    db.notifications
      .filter((n) => n.userId === 'usr_customer_ada')
      .forEach((n) => (n.readAt = new Date().toISOString()));
    persist();
    await renderApp('/account/notifications?unread=true', { as: ADA });
    expect(await screen.findByText("You're all caught up")).toBeInTheDocument();
  });
});
