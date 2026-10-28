import { orderTimeline } from './timeline';

const at = '2026-10-28T10:00:00Z';

describe('orderTimeline', () => {
  it('marks done, current and upcoming steps', () => {
    const items = orderTimeline({
      statusHistory: [
        { status: 'paid', at },
        { status: 'accepted', at },
      ],
    });
    expect(items.map((i) => [i.title, i.state])).toEqual([
      ['Paid', 'done'],
      ['Accepted', 'current'],
      ['Preparing', 'upcoming'],
      ['Ready for pickup', 'upcoming'],
      ['Rider assigned', 'upcoming'],
      ['On the way', 'upcoming'],
      ['Delivered', 'upcoming'],
    ]);
    expect(items[1].description).toBe('The vendor has your order');
  });

  it('ends cancelled orders without upcoming steps', () => {
    const items = orderTimeline({
      statusHistory: [
        { status: 'paid', at },
        { status: 'cancelled', at },
      ],
    });
    expect(items.map((i) => i.state)).toEqual(['done', 'danger']);
  });

  it('shows a delivered order as complete', () => {
    const flow = [
      'paid',
      'accepted',
      'preparing',
      'ready_for_pickup',
      'rider_assigned',
      'picked_up',
      'delivered',
    ];
    const items = orderTimeline({ statusHistory: flow.map((status) => ({ status, at })) });
    expect(items.every((i) => i.state === 'done')).toBe(true);
  });
});
