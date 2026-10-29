import { resolveNextPath } from './next-path';

describe('resolveNextPath', () => {
  const customer = { role: 'customer' };
  const vendor = { role: 'vendor' };

  it('honours a safe next path for the right role', () => {
    expect(resolveNextPath(customer, '/account/orders')).toBe('/account/orders');
    expect(resolveNextPath(vendor, '/vendor/menu')).toBe('/vendor/menu');
  });

  it("ignores other roles' areas and unsafe values", () => {
    expect(resolveNextPath(customer, '/admin')).toBe('/');
    expect(resolveNextPath(vendor, '/account/orders')).toBe('/vendor');
    expect(resolveNextPath(customer, '//evil.example.com')).toBe('/');
    expect(resolveNextPath(customer, 'https://evil.example.com')).toBe('/');
    expect(resolveNextPath(vendor, null)).toBe('/vendor');
  });
});
