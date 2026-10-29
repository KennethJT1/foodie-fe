import { toCsv } from './csv';

describe('toCsv', () => {
  it('writes a header row and quotes awkward cells', () => {
    const csv = toCsv(
      [
        { code: 'ABC123', note: 'Extra pepper, no onions', amount: 350000 },
        { code: 'XYZ789', note: 'Say "hi"', amount: null },
      ],
      [
        { header: 'Order', value: (r) => `KJT-${r.code}` },
        { header: 'Note', value: (r) => r.note },
        { header: 'Amount (₦)', value: (r) => (r.amount == null ? '' : r.amount / 100) },
      ],
    );
    expect(csv.split('\r\n')).toEqual([
      'Order,Note,Amount (₦)',
      'KJT-ABC123,"Extra pepper, no onions",3500',
      'KJT-XYZ789,"Say ""hi""",',
    ]);
  });
});
