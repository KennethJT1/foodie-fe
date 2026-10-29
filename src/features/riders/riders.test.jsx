import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { db } from '@/mocks/db';
import { createJobOffer } from '@/mocks/realtime';
import { renderApp } from '@/test/utils';

const RIDER = 'rider@kjtfoodie.test';
const NEW_RIDER = 'new.rider@kjtfoodie.test';
const path = (router) => router.state.location.pathname;
const tunde = () => db.riders.find((r) => r.id === 'rid_tunde');

async function goOnline() {
  await userEvent.click(
    await screen.findByRole('switch', { name: 'Go online' }, { timeout: 5000 }),
  );
  await waitFor(() => expect(tunde().isOnline).toBe(true));
  expect(await screen.findByText('Looking for jobs near you')).toBeInTheDocument();
}

describe('rider app (phase 14 done-when)', () => {
  it('goes online, accepts a job offer and completes it with the code', async () => {
    const { router } = await renderApp('/rider', { as: RIDER });
    await goOnline();

    let offer;
    act(() => {
      offer = createJobOffer('rid_tunde');
    });
    const card = await screen.findByRole('article', { name: 'New delivery job' });
    expect(within(card).getByRole('timer')).toHaveAccessibleName(/seconds to accept$/);
    expect(within(card).getByText(`Pick up at ${offer.pickup.name}`)).toBeInTheDocument();

    await userEvent.click(within(card).getByRole('button', { name: 'Accept job' }));
    await waitFor(() => expect(path(router)).toBe('/rider/delivery'));
    const order = db.orders.find((o) => o.id === offer.orderId);
    expect(order).toMatchObject({ status: 'rider_assigned', riderId: 'rid_tunde' });

    expect(await screen.findByText('Pick up from')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Directions' })).toHaveAttribute(
      'href',
      expect.stringContaining('google.com/maps/dir'),
    );
    await userEvent.click(screen.getByRole('button', { name: "I've picked up the order" }));
    expect(await screen.findByText('Deliver to')).toBeInTheDocument();
    expect(order.status).toBe('picked_up');
    expect(screen.getByRole('link', { name: /^Call / })).toHaveAttribute(
      'href',
      `tel:${order.customerPhone}`,
    );

    // A wrong code is refused
    const boxes = screen.getAllByRole('textbox', { name: /^Digit \d of 4$/ });
    const wrong = order.deliveryCode === '0000' ? '1111' : '0000';
    for (const [i, d] of [...wrong].entries()) await userEvent.type(boxes[i], d);
    await userEvent.click(screen.getByRole('button', { name: 'Complete delivery' }));
    expect(await screen.findByText(/That code doesn't match/)).toBeInTheDocument();
    expect(order.status).toBe('picked_up');

    for (const box of boxes) await userEvent.clear(box);
    for (const [i, d] of [...order.deliveryCode].entries()) await userEvent.type(boxes[i], d);
    await userEvent.click(screen.getByRole('button', { name: 'Complete delivery' }));
    await waitFor(() => expect(order.status).toBe('delivered'));
    await waitFor(() => expect(path(router)).toBe('/rider'));
    const delivery = db.deliveries.find((d) => d.orderId === order.id);
    expect(delivery.riderEarning).toBe(Math.round((order.deliveryFee * 70) / 100));
  });

  it('declines an offer', async () => {
    await renderApp('/rider', { as: RIDER });
    await goOnline();
    let offer;
    act(() => {
      offer = createJobOffer('rid_tunde');
    });
    const card = await screen.findByRole('article', { name: 'New delivery job' });
    await userEvent.click(within(card).getByRole('button', { name: 'Decline' }));
    await waitFor(() => expect(offer.status).toBe('declined'));
    expect(screen.queryByRole('article', { name: 'New delivery job' })).not.toBeInTheDocument();
  });

  it('onboards a new rider up to the pending screen', async () => {
    const { router } = await renderApp('/rider', { as: NEW_RIDER });
    expect(
      await screen.findByRole('heading', { name: 'Become a KJT Foodie rider' }, { timeout: 5000 }),
    ).toBeInTheDocument();
    const next = () => userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await userEvent.click(screen.getByRole('radio', { name: /Motorbike/ }));
    await userEvent.type(screen.getByLabelText('Plate number'), 'LSR-482KJ');
    await userEvent.type(screen.getByLabelText('Licence number'), 'ABC1234567');
    await next();

    await screen.findByRole('heading', { name: 'Your guarantor' });
    await userEvent.type(screen.getByLabelText('Full name'), 'Femi Adebayo');
    await userEvent.type(screen.getByLabelText('Phone number'), '0803 111 2233');
    await userEvent.type(screen.getByLabelText('How do you know them?'), 'Uncle');
    await userEvent.type(screen.getByLabelText('Home address'), '5 Akoka Road, Yaba');
    await next();

    await screen.findByRole('heading', { name: 'Upload your documents' });
    for (const input of screen.getAllByLabelText(
      /^(Government ID|Driver|Vehicle papers|Signed guarantor form)/,
    ))
      if (input.type === 'file')
        await userEvent.upload(input, new File(['x'], 'doc.png', { type: 'image/png' }));
    await waitFor(() =>
      expect(db.riders.find((r) => r.id === 'rid_new').documents).toHaveLength(4),
    );
    await next();

    await screen.findByRole('heading', { name: 'Where should we pay you?' });
    await userEvent.selectOptions(screen.getByLabelText('Bank'), 'Kuda Bank');
    await userEvent.type(screen.getByLabelText('Account number'), '2012345678');
    expect(await screen.findByText('KEMI ADEBAYO')).toBeInTheDocument();
    await next();

    await screen.findByRole('heading', { name: 'Check your details' });
    await userEvent.click(screen.getByRole('button', { name: 'Submit for review' }));
    expect(
      await screen.findByRole('heading', { name: "We're checking your details" }),
    ).toBeInTheDocument();
    expect(path(router)).toBe('/rider/status');
    expect(db.riders.find((r) => r.id === 'rid_new')).toMatchObject({
      approvalStatus: 'pending',
      vehicleType: 'motorcycle',
      guarantor: expect.objectContaining({ phone: '+2348031112233' }),
    });
  });

  it('shows trips, earnings and payout statements', async () => {
    const { router } = await renderApp('/rider/trips', { as: RIDER });
    expect(
      await screen.findByRole('heading', { name: 'Trips' }, { timeout: 5000 }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('table', { name: 'Trips' })).toBeInTheDocument();
    await act(() => router.navigate('/rider/earnings'));
    expect(await screen.findByText(/You earn 70% of the delivery fee/)).toBeInTheDocument();
    expect((await screen.findAllByText(/trips$/)).length).toBeGreaterThan(0);
  });
});
