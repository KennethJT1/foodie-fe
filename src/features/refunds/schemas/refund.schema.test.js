import { refundRequestSchema } from './refund.schema';

describe('refundRequestSchema', () => {
  const schema = refundRequestSchema(500000); // ₦5,000 subtotal

  it('accepts up to the food subtotal', () => {
    const r = schema.safeParse({ reason: 'Missing items', amount: '5000', photos: [] });
    expect(r.success).toBe(true);
  });

  it('refuses more than the subtotal and a missing reason', () => {
    const r = schema.safeParse({ reason: '', amount: '5000.5' });
    expect(r.success).toBe(false);
    const messages = r.error.issues.map((i) => i.message);
    expect(messages).toContain('Pick a reason');
    expect(messages).toContain('You can ask for up to ₦5,000');
  });
});
