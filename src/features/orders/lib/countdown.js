/** Whole seconds until `deadline` (0 once it has passed). */
export const secondsLeft = (deadline, now = Date.now()) =>
  Math.max(0, Math.ceil((new Date(deadline).getTime() - now) / 1000));

/** 245 → "4:05" */
export function formatCountdown(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
