import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { api } from '@/lib/api-client';
import { formatOrderNumber } from '@/lib/format';
import { db } from '@/mocks/db';
import { sessionUser } from '@/mocks/utils/auth';
import { useCartStore } from '@/stores/cart-store';
import { renderApp, signInAs } from '@/test/utils';

const ADA = 'customer@kjtfoodie.test';
const ALL_DAY = [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, open: '00:00', close: '23:59' }));
const path = (router) => router.state.location.pathname;

function mamaPut() {
  return db.vendors.find((v) => v.id === 'ven_mama_put');
}

/** Puts one Mama Put dish (with its required options) in the cart. */
function fillCart() {
  const v = mamaPut();
  v.openingHours = ALL_DAY;
  v.deliveryRadiusKm = 15;
  const item = db.foodItems.find((f) => f.vendorId === v.id && f.isAvailable);
  const options = item.optionGroups
    .filter((g) => g.required)
    .map((g) => ({
      groupId: g.id,
      groupName: g.name,
      optionId: g.options[0].id,
      name: g.options[0].name,
      price: g.options[0].price,
    }));
  useCartStore.getState().addItem(
    { id: v.id, name: v.name, slug: v.slug, logo: null },
    {
      foodItemId: item.id,
      name: item.name,
      photo: null,
      unitPrice: item.price,
      quantity: 2,
      options,
    },
  );
  return item;
}

const signIn = (email) => signInAs(sessionUser(db.users.find((u) => u.email === email)));

describe('orders API (phase 10)', () => {
  it('scopes /orders by role', async () => {
    signIn('vendor@kjtfoodie.test');
    const vendor = await api.get('/orders', { params: { limit: 100 } });
    expect(vendor.data.data.every((o) => o.vendorId === 'ven_mama_put')).toBe(true);
    expect(vendor.data.data[0].deliveryCode).toBeUndefined();
    expect(vendor.data.data[0].items[0].photo).toMatch(/^data:image/);

    signIn(ADA);
    const mine = await api.get('/orders', { params: { limit: 100 } });
    expect(mine.data.data.every((o) => o.customerId === 'usr_customer_ada')).toBe(true);

    signIn('super@kjtfoodie.test');
    const all = await api.get('/orders', { params: { limit: 1 } });
    expect(all.data.meta.total).toBe(db.orders.length);
  });

  it('prices the cart on the server and refuses far-away addresses', async () => {
    signIn(ADA);
    const item = fillCart();
    const line = useCartStore.getState().lines[0];
    const body = {
      vendorId: 'ven_mama_put',
      items: [{ foodItemId: item.id, quantity: 2, optionIds: line.options.map((o) => o.optionId) }],
      addressId: 'adr_ada_home',
    };
    const { data } = await api.post('/checkout/quote', body);
    expect(data.data.total).toBe(
      data.data.subtotal + data.data.deliveryFee + data.data.processingFee,
    );
    expect(data.data.subtotal).toBe(
      (item.price + line.options.reduce((s, o) => s + o.price, 0)) * 2,
    );
    await expect(
      api.post('/checkout/quote', {
        ...body,
        addressId: undefined,
        address: { line1: 'x', area: 'Wuse', city: 'Abuja', lat: 9.07, lng: 7.39 },
      }),
    ).rejects.toMatchObject({ code: 'OUT_OF_RANGE' });
  });
});

describe('cart, checkout and orders (phase 10 done-when)', () => {
  it('places and pays for an order, then sees it in the history', async () => {
    fillCart();
    const before = db.orders.length;
    const { router } = await renderApp('/account/checkout', { as: ADA });
    expect(await screen.findByText('Payment processing fee')).toBeInTheDocument();
    const pay = await screen.findByRole('button', { name: /^Pay ₦/ });
    await waitFor(() => expect(pay).toBeEnabled());
    await userEvent.click(pay);

    const sheet = await screen.findByRole('dialog', { name: 'Paystack (test mode)' });
    await userEvent.click(within(sheet).getByRole('button', { name: /^Pay ₦/ }));

    await waitFor(() => expect(path(router)).toMatch(/\/account\/orders\/.+\/confirmed$/));
    expect(await screen.findByRole('heading', { name: 'Order placed' })).toBeInTheDocument();
    expect(db.orders).toHaveLength(before + 1);
    const order = db.orders[0];
    expect(order).toMatchObject({ customerId: 'usr_customer_ada', status: 'paid' });
    expect(db.payments.find((p) => p.orderId === order.id)?.status).toBe('success');
    expect(useCartStore.getState().lines).toHaveLength(0);

    await userEvent.click(screen.getByRole('link', { name: 'Track your order' }));
    expect(
      await screen.findByRole('heading', { name: `Order ${formatOrderNumber(order.code)}` }),
    ).toBeInTheDocument();
    expect(screen.getByText(order.deliveryCode)).toBeInTheDocument();

    await router.navigate('/account/orders');
    expect((await screen.findAllByText(formatOrderNumber(order.code))).length).toBeGreaterThan(0);
  });

  it('keeps the cart and creates no order when the payment fails', async () => {
    fillCart();
    const before = db.orders.length;
    await renderApp('/account/checkout', { as: ADA });
    const pay = await screen.findByRole('button', { name: /^Pay ₦/ });
    await waitFor(() => expect(pay).toBeEnabled());
    await userEvent.click(pay);
    await userEvent.click(await screen.findByRole('button', { name: 'Simulate a failed payment' }));
    expect(await screen.findByText(/We couldn't take that payment/)).toBeInTheDocument();
    expect(db.orders).toHaveLength(before);
    expect(useCartStore.getState().lines).toHaveLength(1);
  });

  it('asks for a later time when the vendor is closed', async () => {
    fillCart();
    mamaPut().openingHours = ALL_DAY.map((d) => ({ ...d, closed: true }));
    await renderApp('/account/checkout', { as: ADA });
    expect(await screen.findByText(/is closed right now/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pay' })).toBeDisabled();
  });

  it('shows the cart in the drawer from the header', async () => {
    fillCart();
    await renderApp('/', { as: ADA });
    await userEvent.click(await screen.findByRole('button', { name: /^Cart, 2 items/ }));
    const drawer = await screen.findByRole('dialog', { name: 'Your cart' });
    expect(within(drawer).getByRole('link', { name: /Go to checkout/ })).toBeInTheDocument();
    await userEvent.click(within(drawer).getByRole('button', { name: 'Decrease quantity' }));
    expect(useCartStore.getState().lines[0].quantity).toBe(1);
  });

  it('cancels an order before the vendor accepts', async () => {
    const order = db.orders.find((o) => o.customerId === 'usr_customer_ada');
    order.status = 'paid';
    order.statusHistory = [{ status: 'paid', at: new Date().toISOString(), by: 'system' }];
    await renderApp(`/account/orders/${order.id}`, { as: ADA });
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel order' }));
    const dialog = await screen.findByRole('dialog', { name: 'Cancel this order?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel order' }));
    expect((await screen.findAllByText('This order was cancelled')).length).toBeGreaterThan(0);
    expect(order.status).toBe('cancelled');
  });

  it('manages saved addresses', async () => {
    await renderApp('/account/addresses', { as: ADA });
    expect(await screen.findByRole('heading', { name: 'Work' })).toBeInTheDocument();
    const [, deleteWork] = screen.getAllByRole('button', { name: 'Delete' });
    await userEvent.click(deleteWork);
    await userEvent.click(await screen.findByRole('button', { name: 'Delete address' }));
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Work' })).not.toBeInTheDocument(),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Edit' }));
    await userEvent.click(await screen.findByLabelText('Other'));
    await userEvent.click(screen.getByRole('button', { name: 'Save address' }));
    expect(await screen.findByRole('heading', { name: 'Other' })).toBeInTheDocument();
  });

  it('edits the profile', async () => {
    await renderApp('/account/profile', { as: ADA });
    const first = await screen.findByLabelText('First name');
    await userEvent.clear(first);
    await userEvent.type(first, 'Adaeze');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() =>
      expect(db.users.find((u) => u.id === 'usr_customer_ada').firstName).toBe('Adaeze'),
    );
  });

  it('lists payments', async () => {
    await renderApp('/account/payments', { as: ADA });
    expect((await screen.findAllByText('Paid')).length).toBeGreaterThan(0);
  });
});
