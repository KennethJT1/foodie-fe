import { refundTimeline } from './timeline';

const at = '2026-10-28T10:00:00Z';

describe('refundTimeline', () => {
  it('marks the latest step as current', () => {
    const items = refundTimeline({
      timeline: [
        { status: 'requested', at },
        { status: 'paid', at, note: 'Reference RF_1' },
      ],
    });
    expect(items.map((i) => i.state)).toEqual(['done', 'current']);
    expect(items[1]).toMatchObject({
      title: 'Vendor marked it paid',
      description: 'Reference RF_1',
    });
  });

  it('ends confirmed refunds as done and disputes as danger', () => {
    expect(refundTimeline({ timeline: [{ status: 'confirmed', at }] })[0].state).toBe('done');
    expect(refundTimeline({ timeline: [{ status: 'disputed', at }] })[0].state).toBe('danger');
  });
});
