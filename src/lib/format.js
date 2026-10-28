import { TZDate } from '@date-fns/tz';
import { format, differenceInMinutes, differenceInHours } from 'date-fns';

export const TIME_ZONE = 'Africa/Lagos';

const nairaWhole = new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 });
const nairaKobo = new Intl.NumberFormat('en-NG', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formats an amount in kobo as naira: ₦8,500 or ₦1,250.50 (decimals only when kobo exist).
 * @param {number | null | undefined} kobo
 */
export function formatNaira(kobo) {
  if (kobo == null || Number.isNaN(Number(kobo))) return '—';
  const value = Math.round(Number(kobo));
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  const naira = abs / 100;
  const body = abs % 100 === 0 ? nairaWhole.format(naira) : nairaKobo.format(naira);
  return `${sign}₦${body}`;
}

/** Naira (as typed by a person) → integer kobo for the API. */
export const nairaToKobo = (naira) => Math.round(Number(naira) * 100);

/** Kobo → naira number, for form default values. */
export const koboToNaira = (kobo) => (kobo == null ? '' : Number(kobo) / 100);

const toLagos = (value) => new TZDate(new Date(value), TIME_ZONE);

const isValidDate = (value) => value != null && !Number.isNaN(new Date(value).getTime());

/** 28 Oct 2026 */
export function formatDate(value) {
  if (!isValidDate(value)) return '—';
  return format(toLagos(value), 'd MMM yyyy');
}

/** 2:45 pm */
export function formatTime(value) {
  if (!isValidDate(value)) return '—';
  return format(toLagos(value), 'h:mm aaa');
}

/** 28 Oct 2026, 2:45 pm */
export function formatDateTime(value) {
  if (!isValidDate(value)) return '—';
  return `${formatDate(value)}, ${formatTime(value)}`;
}

/**
 * "just now", "5 min ago", "3 h ago" for the last 24 hours, then the date.
 * @param {string | number | Date} value
 * @param {Date} [now]
 */
export function formatRelative(value, now = new Date()) {
  if (!isValidDate(value)) return '—';
  const date = new Date(value);
  const minutes = differenceInMinutes(now, date);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = differenceInHours(now, date);
  if (hours < 24) return `${hours} h ago`;
  return formatDate(date);
}

/**
 * Distance in metres → "2.4 km" (one decimal).
 * @param {number} metres
 */
export function formatDistance(metres) {
  if (metres == null || Number.isNaN(Number(metres))) return '—';
  return `${(Math.round(Number(metres) / 100) / 10).toFixed(1)} km`;
}

/** 25–35 min */
export function formatEta(minMinutes, maxMinutes) {
  if (minMinutes == null) return '—';
  const lo = Math.round(minMinutes);
  const hi = Math.round(maxMinutes ?? minMinutes);
  return lo === hi ? `${lo} min` : `${lo}–${hi} min`;
}

/**
 * Nigerian phone → "+234 803 123 4567". Accepts 0803..., 234803..., +234 803...
 * Returns the input unchanged when it isn't a Nigerian mobile number.
 */
export function formatPhone(phone) {
  if (!phone) return '—';
  const national = normalisePhone(phone);
  if (!national) return phone;
  const n = national.slice(4);
  return `+234 ${n.slice(0, 3)} ${n.slice(3, 6)} ${n.slice(6)}`;
}

/** Any Nigerian mobile format → "+2348031234567", or null when invalid. */
export function normalisePhone(phone) {
  const digits = String(phone).replace(/\D/g, '');
  let national;
  if (digits.length === 11 && digits.startsWith('0')) national = digits.slice(1);
  else if (digits.length === 13 && digits.startsWith('234')) national = digits.slice(3);
  else if (digits.length === 10) national = digits;
  else return null;
  return /^[789]/.test(national) ? `+234${national}` : null;
}

/** KJT-4F7Q2A */
export const formatOrderNumber = (code) => (code ? `KJT-${String(code).toUpperCase()}` : '—');

/** 1,234 */
export const formatCount = (n) => new Intl.NumberFormat('en-NG').format(n ?? 0);

/** 4.6 */
export const formatRating = (n) => (n ? Number(n).toFixed(1) : '—');

/** 12.5% */
export const formatPercent = (n, digits = 1) =>
  n == null ? '—' : `${Number(n).toFixed(digits).replace(/\.0+$/, '')}%`;
