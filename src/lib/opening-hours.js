/**
 * Opening hours in Africa/Lagos (WAT, UTC+1 all year, no daylight saving).
 * `hours`: [{ day: 0–6 (Sunday = 0), open: 'HH:MM', close: 'HH:MM', closed?: boolean }]
 */

const LAGOS_OFFSET_MS = 60 * 60 * 1000;

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

/** Day of week and minutes since midnight in Lagos. */
export function lagosClock(date = new Date()) {
  const d = new Date(new Date(date).getTime() + LAGOS_OFFSET_MS);
  return { day: d.getUTCDay(), minutes: d.getUTCHours() * 60 + d.getUTCMinutes() };
}

const toMinutes = (hhmm) => {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + (m || 0);
};

/** "09:00" → "9:00 am", "21:30" → "9:30 pm" */
export function formatClock(hhmm) {
  const total = toMinutes(hhmm);
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  const suffix = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

const dayEntry = (hours, day) => hours?.find((h) => h.day === day && !h.closed) ?? null;

/** True when the vendor's hours cover `date` (Lagos time). Handles closing after midnight. */
export function isOpenAt(hours = [], date = new Date()) {
  const { day, minutes } = lagosClock(date);
  const today = dayEntry(hours, day);
  if (today) {
    const open = toMinutes(today.open);
    const close = toMinutes(today.close);
    if (close > open ? minutes >= open && minutes < close : minutes >= open) return true;
  }
  const yesterday = dayEntry(hours, (day + 6) % 7);
  if (yesterday) {
    const open = toMinutes(yesterday.open);
    const close = toMinutes(yesterday.close);
    if (close <= open && minutes < close) return true;
  }
  return false;
}

/**
 * Next time the vendor opens after `date`: { day, open, inDays } or null when never open.
 * `inDays` is 0 for later today, 1 for tomorrow…
 */
export function nextOpening(hours = [], date = new Date()) {
  const { day, minutes } = lagosClock(date);
  for (let i = 0; i < 8; i += 1) {
    const d = (day + i) % 7;
    const entry = dayEntry(hours, d);
    if (!entry) continue;
    if (i === 0 && toMinutes(entry.open) <= minutes) continue;
    return { day: d, open: entry.open, inDays: i };
  }
  return null;
}

/** "Closes 9:00 pm" when open, "Opens 9:00 am tomorrow" / "Opens Monday 9:00 am" when closed. */
export function openingLabel(hours = [], { isOpen, isPaused } = {}, date = new Date()) {
  if (isPaused) return 'Not taking orders right now';
  const open = isOpen ?? isOpenAt(hours, date);
  if (open) {
    const today = dayEntry(hours, lagosClock(date).day);
    return today ? `Closes ${formatClock(today.close)}` : 'Open now';
  }
  const next = nextOpening(hours, date);
  if (!next) return 'Closed';
  const when =
    next.inDays === 0 ? 'today' : next.inDays === 1 ? 'tomorrow' : `on ${DAY_NAMES[next.day]}`;
  return `Opens ${formatClock(next.open)} ${when}`;
}

/** Hours sorted Monday first, for a weekly table. */
export function weeklyHours(hours = []) {
  return [1, 2, 3, 4, 5, 6, 0].map((day) => {
    const entry = hours.find((h) => h.day === day);
    return {
      day,
      name: DAY_NAMES[day],
      label:
        !entry || entry.closed
          ? 'Closed'
          : `${formatClock(entry.open)} – ${formatClock(entry.close)}`,
    };
  });
}
