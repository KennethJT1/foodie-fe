import {
  formatClock,
  isOpenAt,
  lagosClock,
  nextOpening,
  openingLabel,
  weeklyHours,
} from './opening-hours';

const hours = [
  { day: 0, open: '12:00', close: '20:00', closed: true },
  { day: 1, open: '09:00', close: '21:00' },
  { day: 2, open: '09:00', close: '21:00' },
  { day: 3, open: '09:00', close: '21:00' },
  { day: 4, open: '09:00', close: '21:00' },
  { day: 5, open: '18:00', close: '02:00' },
  { day: 6, open: '10:00', close: '22:00' },
];

// 2026-10-28 is a Wednesday. Lagos is UTC+1.
const at = (iso) => new Date(iso);

describe('opening hours (Africa/Lagos)', () => {
  it('reads the Lagos day and time', () => {
    expect(lagosClock(at('2026-10-28T23:30:00Z'))).toEqual({ day: 4, minutes: 30 });
  });

  it('is open inside the hours and closed outside', () => {
    expect(isOpenAt(hours, at('2026-10-28T08:00:00Z'))).toBe(true); // 9:00 am WAT
    expect(isOpenAt(hours, at('2026-10-28T07:59:00Z'))).toBe(false); // 8:59 am WAT
    expect(isOpenAt(hours, at('2026-10-28T20:00:00Z'))).toBe(false); // 9:00 pm WAT
  });

  it('handles hours that run past midnight', () => {
    expect(isOpenAt(hours, at('2026-10-30T23:00:00Z'))).toBe(true); // Sat 0:00 WAT
    expect(isOpenAt(hours, at('2026-10-31T00:30:00Z'))).toBe(true); // Sat 1:30 WAT
    expect(isOpenAt(hours, at('2026-10-31T01:30:00Z'))).toBe(false); // Sat 2:30 WAT
  });

  it('respects closed days', () => {
    expect(isOpenAt(hours, at('2026-11-01T14:00:00Z'))).toBe(false); // Sunday
  });

  it('finds the next opening and labels it', () => {
    const lateWed = at('2026-10-28T21:00:00Z'); // 10 pm WAT
    expect(nextOpening(hours, lateWed)).toEqual({ day: 4, open: '09:00', inDays: 1 });
    expect(openingLabel(hours, {}, lateWed)).toBe('Opens 9:00 am tomorrow');
    expect(openingLabel(hours, {}, at('2026-10-28T10:00:00Z'))).toBe('Closes 9:00 pm');
    expect(openingLabel(hours, { isPaused: true })).toBe('Not taking orders right now');
  });

  it('formats clock times and the weekly table', () => {
    expect(formatClock('00:00')).toBe('12:00 am');
    expect(formatClock('12:30')).toBe('12:30 pm');
    const week = weeklyHours(hours);
    expect(week[0]).toMatchObject({ name: 'Monday', label: '9:00 am – 9:00 pm' });
    expect(week[6]).toMatchObject({ name: 'Sunday', label: 'Closed' });
  });
});
