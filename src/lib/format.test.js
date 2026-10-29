import {
  formatCount,
  formatDate,
  formatDateTime,
  formatDistance,
  formatEta,
  formatNaira,
  formatOrderNumber,
  formatPercent,
  formatPhone,
  formatRelative,
  formatTime,
  koboToNaira,
  nairaToKobo,
  normalisePhone,
} from './format';

describe('formatNaira', () => {
  it('formats whole naira without decimals', () => {
    expect(formatNaira(850000)).toBe('₦8,500');
    expect(formatNaira(0)).toBe('₦0');
  });

  it('shows kobo only when present', () => {
    expect(formatNaira(125050)).toBe('₦1,250.50');
  });

  it('handles negatives and missing values', () => {
    expect(formatNaira(-50000)).toBe('-₦500');
    expect(formatNaira(null)).toBe('—');
    expect(formatNaira(undefined)).toBe('—');
  });
});

describe('naira ↔ kobo', () => {
  it('converts both ways', () => {
    expect(nairaToKobo('8500')).toBe(850000);
    expect(nairaToKobo(12.5)).toBe(1250);
    expect(koboToNaira(850000)).toBe(8500);
    expect(koboToNaira(null)).toBe('');
  });
});

describe('dates and times (Africa/Lagos)', () => {
  // 13:45 UTC = 2:45 pm WAT (UTC+1)
  const iso = '2026-10-28T13:45:00Z';

  it('formats dates as d MMM yyyy', () => {
    expect(formatDate(iso)).toBe('28 Oct 2026');
  });

  it('formats times as 12-hour with am/pm', () => {
    expect(formatTime(iso)).toBe('2:45 pm');
    expect(formatTime('2026-10-28T00:05:00Z')).toBe('1:05 am');
  });

  it('crosses midnight in Lagos time, not UTC', () => {
    expect(formatDate('2026-10-28T23:30:00Z')).toBe('29 Oct 2026');
  });

  it('combines date and time', () => {
    expect(formatDateTime(iso)).toBe('28 Oct 2026, 2:45 pm');
  });

  it('returns a dash for invalid input', () => {
    expect(formatDate('nope')).toBe('—');
    expect(formatTime(null)).toBe('—');
  });
});

describe('formatRelative', () => {
  const now = new Date('2026-10-28T12:00:00Z');

  it('uses minutes and hours within 24 hours', () => {
    expect(formatRelative('2026-10-28T11:59:40Z', now)).toBe('just now');
    expect(formatRelative('2026-10-28T11:55:00Z', now)).toBe('5 min ago');
    expect(formatRelative('2026-10-28T09:00:00Z', now)).toBe('3 h ago');
  });

  it('falls back to the date after 24 hours', () => {
    expect(formatRelative('2026-10-26T12:00:00Z', now)).toBe('26 Oct 2026');
  });
});

describe('formatDistance and formatEta', () => {
  it('shows km with one decimal', () => {
    expect(formatDistance(2400)).toBe('2.4 km');
    expect(formatDistance(350)).toBe('0.4 km');
    expect(formatDistance(null)).toBe('—');
  });

  it('shows an ETA range', () => {
    expect(formatEta(25, 35)).toBe('25–35 min');
    expect(formatEta(10)).toBe('10 min');
  });
});

describe('phones', () => {
  it('groups Nigerian numbers', () => {
    expect(formatPhone('08031234567')).toBe('+234 803 123 4567');
    expect(formatPhone('+2348031234567')).toBe('+234 803 123 4567');
    expect(formatPhone('234 803 123 4567')).toBe('+234 803 123 4567');
  });

  it('normalises to E.164 or null', () => {
    expect(normalisePhone('0803 123 4567')).toBe('+2348031234567');
    expect(normalisePhone('12345')).toBeNull();
    expect(normalisePhone('01234567890')).toBeNull();
  });

  it('leaves non-Nigerian numbers alone', () => {
    expect(formatPhone('+44 20 7946 0958')).toBe('+44 20 7946 0958');
    expect(formatPhone('')).toBe('—');
  });
});

describe('misc formatters', () => {
  it('formats order numbers, counts and percents', () => {
    expect(formatOrderNumber('4f7q2a')).toBe('KJT-4F7Q2A');
    expect(formatCount(12345)).toBe('12,345');
    expect(formatPercent(12.5)).toBe('12.5%');
    expect(formatPercent(70)).toBe('70%');
  });
});
