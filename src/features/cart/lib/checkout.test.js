import { lagosLocalMin, lagosLocalToIso, toQuoteItems } from './checkout';

describe('checkout helpers', () => {
  it('sends item ids, quantities and option ids only', () => {
    const lines = [
      {
        key: 'f1|o1',
        foodItemId: 'f1',
        name: 'Jollof',
        unitPrice: 250000,
        quantity: 2,
        options: [{ groupId: 'g', groupName: 'Size', optionId: 'o1', name: 'Large', price: 1 }],
      },
    ];
    expect(toQuoteItems(lines)).toEqual([{ foodItemId: 'f1', quantity: 2, optionIds: ['o1'] }]);
  });

  it('reads scheduled times as Lagos time', () => {
    expect(lagosLocalToIso('2026-10-28T19:30')).toBe('2026-10-28T18:30:00.000Z');
    expect(lagosLocalToIso('')).toBeNull();
    expect(lagosLocalMin(30, new Date('2026-10-28T10:00:00Z'))).toBe('2026-10-28T11:30');
  });
});
