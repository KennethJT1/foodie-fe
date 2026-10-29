import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { db } from '@/mocks/db';
import { configureOrderSimulation } from '@/mocks/realtime';
import { renderApp } from '@/test/utils';

const ADA = 'customer@kjtfoodie.test';
const adaActive = () =>
  db.orders.find((o) => o.customerId === 'usr_customer_ada' && o.status === 'picked_up');

describe('support tickets and delivery chat (phase 17)', () => {
  it('a customer asks for help, support replies and the customer marks it solved', async () => {
    const { queryClient } = await renderApp('/account/support', { as: ADA });
    await userEvent.click(
      (await screen.findAllByRole('button', { name: 'Ask for help' }, { timeout: 5000 }))[0],
    );
    const dialog = await screen.findByRole('dialog', { name: 'Ask for help' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send to support' }));
    expect(
      await within(dialog).findByText('Say what it is about in a few words'),
    ).toBeInTheDocument();
    await userEvent.type(
      within(dialog).getByLabelText('What is it about?'),
      'Payment debited twice',
    );
    await userEvent.type(
      within(dialog).getByLabelText('Tell us what happened'),
      'My card was charged two times for one order.',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send to support' }));
    expect(
      await screen.findByRole('heading', { name: 'Payment debited twice' }),
    ).toBeInTheDocument();
    const ticket = db.tickets[0];
    expect(ticket).toMatchObject({ userId: 'usr_customer_ada', status: 'open', priority: 'high' });

    // The support agent answers from the admin inbox (with an internal note the customer never sees)
    ticket.messages.push(
      {
        id: 'm1',
        authorRole: 'admin',
        authorName: 'Ifeoma Nwosu',
        body: 'Checked Paystack: one charge will reverse.',
        internal: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'm2',
        authorRole: 'admin',
        authorName: 'Ifeoma Nwosu',
        body: 'The second charge reverses within 24 hours.',
        internal: false,
        createdAt: new Date().toISOString(),
      },
    );
    ticket.status = 'pending';
    // The thread polls every 30 s; refresh it now
    await act(() => queryClient.invalidateQueries());
    expect(
      (await screen.findAllByText('The second charge reverses within 24 hours.')).length,
    ).toBeGreaterThan(0);
    expect(screen.queryAllByText(/one charge will reverse/)).toHaveLength(0);
    await userEvent.click(screen.getByRole('button', { name: 'My problem is solved' }));
    await waitFor(() => expect(ticket.status).toBe('resolved'));
  });

  it('opens a ticket about an order from the order page', async () => {
    const order = adaActive();
    const { router } = await renderApp(`/account/orders/${order.id}`, { as: ADA });
    await userEvent.click(
      await screen.findByRole('button', { name: 'Get help' }, { timeout: 5000 }),
    );
    const dialog = await screen.findByRole('dialog', { name: 'Ask for help' });
    await userEvent.type(within(dialog).getByLabelText('What is it about?'), 'Rider is lost');
    await userEvent.type(
      within(dialog).getByLabelText('Tell us what happened'),
      'The rider cannot find my street.',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Send to support' }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/account/support'));
    expect(db.tickets[0]).toMatchObject({ orderId: order.id, orderCode: order.code });
  });

  it('vendors have their own help page with their tickets', async () => {
    const { router } = await renderApp('/vendor/support', { as: 'vendor@kjtfoodie.test' });
    expect(
      await screen.findByRole('heading', { name: 'Help and support' }, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('list', { name: 'Your tickets' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/vendor/support');
  });

  it('the customer and rider chat while the food is on its way', async () => {
    configureOrderSimulation({ enabled: true, stepMs: 100000, chatReplyMs: 20 });
    const order = adaActive();
    await renderApp(`/account/orders/${order.id}`, { as: ADA });
    const box = await screen.findByRole(
      'textbox',
      { name: 'Message your rider' },
      { timeout: 5000 },
    );
    await userEvent.type(box, 'Blue gate opposite the church');
    await userEvent.click(screen.getByRole('button', { name: 'Send message' }));
    expect(await screen.findByText('Blue gate opposite the church')).toBeInTheDocument();
    // The rider (simulated) answers over the socket
    await waitFor(() =>
      expect(db.chatMessages.filter((m) => m.orderId === order.id)).toHaveLength(2),
    );
    const reply = db.chatMessages.at(-1);
    expect(reply.senderRole).toBe('rider');
    expect(await screen.findByText(reply.body)).toBeInTheDocument();
  });
});
