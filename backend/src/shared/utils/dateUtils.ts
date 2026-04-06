import { HttpError } from '../types';

/**
 * Lightweight date utilities.
 * These are pure functions — no I/O, no side-effects.
 * For timezone-aware operations use timezoneService instead.
 */

/**
 * Asserts that a value is a valid ISO date string or Date instance.
 * Throws a 400 HttpError when invalid.
 */
export function assertValidDate(value: string | Date, fieldName = 'date'): void {
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) {
    throw new HttpError(`Invalid ${fieldName}: "${value}"`, 400);
  }
}

/**
 * Returns the current UTC timestamp as an ISO string.
 */
export function nowUTC(): string {
  return new Date().toISOString();
}

/**
 * Formats a Date (or ISO string) to "YYYY-MM-DD HH:mm:ss" without timezone offset.
 * Useful when feeding values to timeapi.io.
 */
export function toDateTimeString(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  assertValidDate(d);

  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
  );
}

export interface DateRange {
  start: Date | string;
  end: Date | string;
}

/**
 * Checks whether two date ranges overlap.
 * Useful for detecting appointment conflicts.
 */
export function rangesOverlap(a: DateRange, b: DateRange): boolean {
  const aStart = new Date(a.start).getTime();
  const aEnd = new Date(a.end).getTime();
  const bStart = new Date(b.start).getTime();
  const bEnd = new Date(b.end).getTime();

  return aStart < bEnd && bStart < aEnd;
}
