import { cn } from './cn';

describe('cn', () => {
  it('joins conditional classes', () => {
    expect(cn('a', null, undefined, { c: true, d: false })).toBe('a c');
  });

  it('lets later Tailwind classes win', () => {
    expect(cn('p-2 text-ink', 'p-4')).toBe('text-ink p-4');
  });
});
