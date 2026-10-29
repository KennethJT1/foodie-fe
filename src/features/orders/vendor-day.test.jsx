import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { formatOrderNumber } from '@/lib/format';
import { db, persist } from '@/mocks/db';
import { configureOrderSimulation, simulateIncomingOrder } from '@/mocks/realtime';
import { renderApp } from '@/test/utils';

const VENDOR = 'vendor@kjtfoodie.test';
const MAMA_PUT = 'ven_mama_put';
const path = (router) => router.state.location.pathname;
const card = (order) =>
  screen.findByRole('article', { name: `Order ${formatOrderNumber(order.code)}` });

describe('vendor operations (phase 13 done-when)', () => {
  it('receives a new order live, accepts, prepares and hands it to a rider', async () => {
    configureOrderSimulation({ enabled: true, stepMs: 20, approachSteps: 2, deliverySteps: 2 });
    await renderApp('/vendor/orders', { as: VENDOR });
    expect(
      await screen.findByRole('heading', { name: 'Live orders' }, { timeout: 5000 }),
    ).toBeInTheDocument();

    let order;
    act(() => {
      order = simulateIncomingOrder(MAMA_PUT);
    });
    const incoming = await card(order);
    expect(within(incoming).getByRole('timer')).toHaveAccessibleName(/left to accept$/);

    await userEvent.click(within(incoming).getByRole('button', { name: 'Accept order' }));
    await waitFor(() => expect(order.status).toBe('accepted'));
    // While the vendor is at the dashboard, nothing moves on its own
    await new Promise((r) => setTimeout(r, 100));
    expect(order.status).toBe('accepted');

    await userEvent.click(
      within(await card(order)).getByRole('button', { name: 'Start preparing' }),
    );
    await waitFor(() => expect(order.status).toBe('preparing'));
    await userEvent.click(within(await card(order)).getByRole('button', { name: 'Mark as ready' }));
    await waitFor(() => expect(order.status).toBe('ready_for_pickup'));

    // Dispatch assigns a rider, who arrives and picks it up
    await waitFor(() => expect(order.status).toBe('picked_up'), { timeout: 4000 });
    expect(order.riderId).toBeTruthy();
    await waitFor(() =>
      expect(
        screen.queryByRole('article', { name: `Order ${formatOrderNumber(order.code)}` }),
      ).not.toBeInTheDocument(),
    );
  });

  it('rejects an order with a reason and refunds the customer', async () => {
    const { router } = await renderApp('/vendor/orders', { as: VENDOR });
    await screen.findByRole('heading', { name: 'Live orders' }, { timeout: 5000 });
    const order = db.orders.find((o) => o.vendorId === MAMA_PUT && o.status === 'paid');
    await userEvent.click(within(await card(order)).getByRole('button', { name: 'Reject order' }));
    const dialog = await screen.findByRole('dialog', { name: /^Reject order/ });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reject order' }));
    expect(await within(dialog).findByText('Tell the customer why')).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Item sold out' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Reject order' }));
    await waitFor(() => expect(order.status).toBe('rejected'));
    expect(order.cancelReason).toBe('Item sold out');
    expect(db.payments.find((p) => p.orderId === order.id).status).toBe('refunded');
    expect(path(router)).toBe('/vendor/orders');
  });

  it('rejects and refunds orders nobody accepted in time', async () => {
    const order = db.orders.find((o) => o.vendorId === MAMA_PUT && o.status === 'paid');
    order.acceptDeadline = new Date(Date.now() - 1000).toISOString();
    persist();
    await renderApp('/vendor/orders', { as: VENDOR });
    await screen.findByRole('heading', { name: 'Live orders' }, { timeout: 5000 });
    await waitFor(() => expect(order.status).toBe('rejected'));
    expect(order.cancelReason).toBe('Not accepted in time');
    expect(
      screen.queryByRole('article', { name: `Order ${formatOrderNumber(order.code)}` }),
    ).not.toBeInTheDocument();
  });

  it('adds a menu item and marks another sold out', async () => {
    const { router } = await renderApp('/vendor/menu/new', { as: VENDOR });
    expect(
      await screen.findByRole('heading', { name: 'Add new item' }, { timeout: 5000 }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Add item' }));
    expect(await screen.findByText('Enter the food name')).toBeInTheDocument();
    expect(screen.getByText('Add at least one photo')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Food name'), 'Ofada rice and ayamase');
    await userEvent.selectOptions(screen.getByLabelText('Category'), 'cat-rice');
    await userEvent.type(screen.getByLabelText('Price'), '4500');
    await userEvent.upload(
      screen.getByLabelText('Food photos'),
      new File(['x'], 'ofada.png', { type: 'image/png' }),
    );
    await screen.findByRole('img', { name: 'photo 1' });
    await userEvent.click(screen.getByRole('button', { name: 'Add a choice group' }));
    await userEvent.type(screen.getByLabelText('Group name'), 'Protein');
    await userEvent.type(screen.getByLabelText('Option'), 'Assorted meat');
    await userEvent.click(screen.getByRole('button', { name: 'Add item' }));

    await waitFor(() => expect(path(router)).toBe('/vendor/menu'));
    const item = db.foodItems.find((f) => f.name === 'Ofada rice and ayamase');
    expect(item).toMatchObject({ vendorId: MAMA_PUT, price: 450000, isAvailable: true });
    expect(item.optionGroups[0]).toMatchObject({
      name: 'Protein',
      options: [expect.objectContaining({ name: 'Assorted meat', price: 0 })],
    });

    const [link] = await screen.findAllByRole('link', { name: 'Ofada rice and ayamase' });
    await userEvent.click(within(link.closest('tr')).getByRole('switch', { name: /on sale/ }));
    await waitFor(() => expect(item.isAvailable).toBe(false));
  });

  it('answers a refund request and marks it paid', async () => {
    const refund = db.refunds.find((r) => r.vendorId === MAMA_PUT);
    Object.assign(refund, { status: 'requested', vendorResponse: null, paymentReference: null });
    persist();
    await renderApp(`/vendor/refunds/${refund.id}`, { as: VENDOR });
    await screen.findByRole('heading', { name: /^Refund for/ }, { timeout: 5000 });
    await userEvent.click(screen.getByRole('radio', { name: 'Refund part of it' }));
    const amount = screen.getByLabelText('Amount to refund');
    await userEvent.clear(amount);
    await userEvent.type(amount, '1000');
    await userEvent.click(screen.getByRole('button', { name: 'Accept refund' }));
    await waitFor(() => expect(refund.status).toBe('accepted'));
    expect(refund.amount).toBe(100000);

    await userEvent.click(await screen.findByRole('button', { name: 'Mark as paid' }));
    expect(
      await screen.findByText('Enter the transfer or Paystack refund reference'),
    ).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Payment reference'), 'TRF-778899');
    await userEvent.click(screen.getByRole('button', { name: 'Mark as paid' }));
    await waitFor(() => expect(refund.status).toBe('paid'));
    expect(await screen.findByText(/Waiting for .+ to confirm/)).toBeInTheDocument();
  });

  it('shows the overview, sales, engagement and settings screens', async () => {
    const { router } = await renderApp('/vendor', { as: VENDOR });
    expect(
      await screen.findByRole('heading', { name: 'Overview' }, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/orders? (is|are) waiting for you to accept/),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Top dishes' })).toBeInTheDocument();

    await act(() => router.navigate('/vendor/sales'));
    expect(await screen.findByRole('heading', { name: 'Sales and payouts' })).toBeInTheDocument();
    expect(await screen.findByText('Settled to your bank')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'By day' }));
    expect(await screen.findByRole('table', { name: /Sales by day/ })).toBeInTheDocument();

    await act(() => router.navigate('/vendor/engagement'));
    const comment = await screen.findAllByRole('textbox', { name: /^Reply to / });
    await userEvent.type(comment[0], 'Thank you! See you soon.');
    await userEvent.click(screen.getAllByRole('button', { name: 'Send reply' })[0]);
    await waitFor(() =>
      expect(
        db.comments.some((c) => c.isVendorReply && c.body === 'Thank you! See you soon.'),
      ).toBe(true),
    );

    await act(() => router.navigate('/vendor/settings'));
    await userEvent.click(await screen.findByRole('switch', { name: /Pause new orders/ }));
    await waitFor(() => expect(db.vendors.find((v) => v.id === MAMA_PUT).isPaused).toBe(true));
  });
});
