/**
 * Calendar dates as YYYY-MM-DD in the user's own timezone.
 *
 * `date.toISOString().slice(0, 10)` converts to UTC first. In Bacolod
 * (UTC+8) a local midnight is 16:00 the previous day in UTC, so every
 * computed due date slipped back one day — and a rent period starting on
 * the 1st was billed to the previous month. Format the local fields instead.
 */
export function toLocalIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayIso(): string {
  return toLocalIso(new Date());
}
