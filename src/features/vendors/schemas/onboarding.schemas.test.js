import { accountNumberSchema, businessSchema } from './onboarding.schemas';

describe('onboarding schemas', () => {
  it('needs a business name and a Nigerian phone number', () => {
    const result = businessSchema.safeParse({ name: 'A', phone: '123' });
    expect(result.success).toBe(false);
    const messages = result.error.issues.map((i) => i.message);
    expect(messages).toContain('Enter your business name');
    expect(messages).toContain('Enter a valid Nigerian phone number');
  });

  it('normalises the phone number', () => {
    const result = businessSchema.parse({ name: "Tolu's Pot", phone: '0803 000 0004' });
    expect(result.phone).toBe('+2348030000004');
  });

  it('checks account numbers have 10 digits', () => {
    expect(accountNumberSchema.safeParse('0123456789').success).toBe(true);
    expect(accountNumberSchema.safeParse('12345').success).toBe(false);
  });
});
