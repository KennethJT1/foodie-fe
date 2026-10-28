/** Cart lines → the item list the API prices (prices are always recomputed on the server). */
export const toQuoteItems = (lines = []) =>
  lines.map((l) => ({
    foodItemId: l.foodItemId,
    quantity: l.quantity,
    optionIds: l.options.map((o) => o.optionId),
  }));

/** "2026-10-28T19:30" typed in a datetime-local box, read as Lagos time (UTC+1) → ISO. */
export function lagosLocalToIso(value) {
  if (!value) return null;
  const date = new Date(`${value}:00+01:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** The earliest value for a datetime-local input: now + `minutes`, in Lagos time. */
export function lagosLocalMin(minutes = 30, now = new Date()) {
  const lagos = new Date(now.getTime() + minutes * 60000 + 3600000);
  return lagos.toISOString().slice(0, 16);
}
