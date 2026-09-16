/**
 * The demo's notion of "now".
 *
 * The generated timeline deliberately contains six months of FUTURE data so
 * forecasts can be scored against held-out ground truth. Nothing past today
 * may ever be rendered as if it had already happened, so every read path
 * clamps through the helpers here rather than filtering ad hoc at call sites.
 *
 */
/**
 * The demo clock is PINNED by default.
 *
 * Two reasons. Totals shift every day an unpinned clock advances, which would
 * silently invalidate the figures quoted in the scripted sample responses and
 * in the README. And screenshots or recorded walkthroughs would stop matching
 * the app. Override with NEXT_PUBLIC_DEMO_TODAY, or set it to "live" to track
 * the real clock.
 */
const DEFAULT_DEMO_TODAY = "2026-08-19";

export function today(): Date {
  const pinned = process.env.NEXT_PUBLIC_DEMO_TODAY ?? DEFAULT_DEMO_TODAY;
  if (/^\d{4}-\d{2}-\d{2}$/.test(pinned)) {
    const [y, m, d] = pinned.split("-").map(Number);
    return new Date(y, m - 1, d, 23, 59, 59);
  }
  return new Date();
}

export function todayISO(): string {
  // Formatted from LOCAL components, not toISOString(): that converts to UTC
  // and can roll the date forward, which would leak a day of "future" data
  // into the view for anyone west of Greenwich.
  const d = today();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Current month as "YYYY-MM". */
export function currentMonth(): string {
  return todayISO().slice(0, 7);
}

/** True when an ISO date string is today or earlier. */
export function isPast(dateISO: string | null | undefined): boolean {
  return !!dateISO && dateISO.slice(0, 10) <= todayISO();
}

/** True when a "YYYY-MM" month has started. */
export function monthHasStarted(month: string): boolean {
  return month <= currentMonth();
}

/** True when a "YYYY-MM" month is fully in the past (i.e. closed out). */
export function monthIsComplete(month: string): boolean {
  return month < currentMonth();
}

/** Drop any row dated after today. */
export function clampRows<T>(rows: T[], dateKey: keyof T): T[] {
  const cutoff = todayISO();
  return rows.filter((r) => {
    const v = r[dateKey] as unknown as string | null | undefined;
    return !v || v.slice(0, 10) <= cutoff;
  });
}

/** Keep only months that have started. */
export function clampMonths(months: string[]): string[] {
  const cutoff = currentMonth();
  return months.filter((m) => m <= cutoff);
}
