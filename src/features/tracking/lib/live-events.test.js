import { applyLocationEvent, applyStatusEvent } from './live-events';

const order = {
  id: 'o1',
  status: 'preparing',
  isActive: true,
  statusHistory: [{ status: 'paid' }],
  rider: null,
  delivery: null,
  etaMins: [30, 40],
};

describe('live order events', () => {
  it('applies a status change and the assigned rider', () => {
    const out = applyStatusEvent(order, {
      orderId: 'o1',
      status: 'rider_assigned',
      statusHistory: [{ status: 'paid' }, { status: 'rider_assigned' }],
      rider: { id: 'r1', name: 'Tunde', lat: 6.5, lng: 3.3 },
      delivery: { id: 'd1', route: [] },
    });
    expect(out).toMatchObject({ status: 'rider_assigned', riderId: 'r1', isActive: true });
    expect(out.rider.name).toBe('Tunde');
    expect(applyStatusEvent(out, { orderId: 'o1', status: 'delivered' }).isActive).toBe(false);
  });

  it('moves the rider and keeps the trail', () => {
    const withRider = { ...order, rider: { id: 'r1', name: 'Tunde' }, delivery: { route: [] } };
    const out = applyLocationEvent(withRider, {
      orderId: 'o1',
      riderId: 'r1',
      lat: 6.51,
      lng: 3.37,
      heading: 90,
      etaMins: [5, 10],
    });
    expect(out.rider).toMatchObject({ name: 'Tunde', lat: 6.51, lng: 3.37, heading: 90 });
    expect(out.delivery.route).toEqual([{ lat: 6.51, lng: 3.37 }]);
    expect(out.etaMins).toEqual([5, 10]);
  });

  it('ignores events for other orders', () => {
    expect(applyLocationEvent(order, { orderId: 'other', lat: 1, lng: 1 })).toBe(order);
    expect(applyStatusEvent(undefined, { orderId: 'o1' })).toBeUndefined();
  });
});
