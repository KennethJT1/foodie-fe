import { formatCountdown, secondsLeft } from './countdown';

describe('accept countdown', () => {
  it('counts whole seconds down to zero', () => {
    const now = Date.parse('2026-10-28T12:00:00Z');
    expect(secondsLeft('2026-10-28T12:04:05Z', now)).toBe(245);
    expect(secondsLeft('2026-10-28T11:59:00Z', now)).toBe(0);
  });

  it('formats minutes and seconds', () => {
    expect(formatCountdown(245)).toBe('4:05');
    expect(formatCountdown(9)).toBe('0:09');
    expect(formatCountdown(-3)).toBe('0:00');
  });
});
