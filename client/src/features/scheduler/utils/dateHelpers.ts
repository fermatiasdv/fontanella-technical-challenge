import { MONTHS_ES } from '@/features/scheduler/constants/scheduler.constants';

/** Returns the Monday of the ISO week that contains `date`. */
export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow  = d.getDay(); // 0 = Sun
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return d;
}

/** Returns the 7 Date objects [Mon … Sun] for the week starting at `monday`. */
export function getWeekDates(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/** Returns true when two Date objects fall on the same calendar day. */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

/**
 * Produces a human-readable month / year label for a 7-day week.
 * Handles cross-month and cross-year weeks gracefully.
 */
export function formatWeekLabel(dates: Date[]): string {
  const first = dates[0]!;
  const last  = dates[6]!;
  const m1    = MONTHS_ES[first.getMonth()]!;
  const m2    = MONTHS_ES[last.getMonth()]!;
  const y1    = first.getFullYear();
  const y2    = last.getFullYear();

  if (y1 !== y2) return `${m1} ${y1} – ${m2} ${y2}`;
  if (m1 !== m2) return `${m1} – ${m2} ${y1}`;
  return `${m1} ${y1}`;
}

/** Returns the date as "YYYY-MM-DD" using local time (matches VacationAPI format). */
export function toDateStr(date: Date): string {
  return date.toLocaleDateString('en-CA');
}
