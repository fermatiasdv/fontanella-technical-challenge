/**
 * Unit tests for src/shared/utils/dateUtils.ts
 * All functions are pure — no mocking needed.
 */

import { assertValidDate, nowUTC, toDateTimeString, rangesOverlap } from '../../shared/utils/dateUtils';
import { HttpError } from '../../shared/types';

// ─── assertValidDate ──────────────────────────────────────────────────────────

describe('assertValidDate', () => {
  it('does not throw for a valid ISO date string', () => {
    expect(() => assertValidDate('2025-06-15')).not.toThrow();
  });

  it('does not throw for a valid datetime string', () => {
    expect(() => assertValidDate('2025-06-15T13:00:00.000Z')).not.toThrow();
  });

  it('does not throw for a valid Date instance', () => {
    expect(() => assertValidDate(new Date('2025-06-15'))).not.toThrow();
  });

  it('throws HttpError 400 for an invalid string', () => {
    expect(() => assertValidDate('not-a-date')).toThrow(HttpError);
    expect(() => assertValidDate('not-a-date')).toThrow(/invalid/i);
  });

  it('throws HttpError 400 with the field name in the message', () => {
    try {
      assertValidDate('bad', 'startDate');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      expect((err as HttpError).statusCode).toBe(400);
      expect((err as HttpError).message).toContain('startDate');
    }
  });

  it('defaults fieldName to "date" in the error message', () => {
    try {
      assertValidDate('invalid');
    } catch (err) {
      expect((err as HttpError).message).toContain('date');
    }
  });
});

// ─── nowUTC ───────────────────────────────────────────────────────────────────

describe('nowUTC', () => {
  it('returns a valid ISO string', () => {
    const result = nowUTC();
    expect(typeof result).toBe('string');
    expect(() => new Date(result)).not.toThrow();
    expect(new Date(result).toISOString()).toBe(result);
  });

  it('ends with Z (UTC indicator)', () => {
    expect(nowUTC().endsWith('Z')).toBe(true);
  });
});

// ─── toDateTimeString ─────────────────────────────────────────────────────────

describe('toDateTimeString', () => {
  it('formats a Date to "YYYY-MM-DD HH:mm:ss"', () => {
    const date = new Date('2025-06-15T13:05:09.000Z');
    expect(toDateTimeString(date)).toBe('2025-06-15 13:05:09');
  });

  it('accepts an ISO string input', () => {
    expect(toDateTimeString('2025-01-01T00:00:00.000Z')).toBe('2025-01-01 00:00:00');
  });

  it('pads single-digit month, day, hour, minute, second', () => {
    const date = new Date('2025-03-05T08:07:06.000Z');
    expect(toDateTimeString(date)).toBe('2025-03-05 08:07:06');
  });

  it('throws HttpError 400 for an invalid date string', () => {
    expect(() => toDateTimeString('not-a-date')).toThrow(HttpError);
  });
});

// ─── rangesOverlap ────────────────────────────────────────────────────────────

describe('rangesOverlap', () => {
  const A = { start: '2025-06-15T10:00:00Z', end: '2025-06-15T11:00:00Z' };

  it('returns true when ranges overlap in the middle', () => {
    const B = { start: '2025-06-15T10:30:00Z', end: '2025-06-15T11:30:00Z' };
    expect(rangesOverlap(A, B)).toBe(true);
  });

  it('returns true when B is fully inside A', () => {
    const B = { start: '2025-06-15T10:15:00Z', end: '2025-06-15T10:45:00Z' };
    expect(rangesOverlap(A, B)).toBe(true);
  });

  it('returns true when A is fully inside B', () => {
    const B = { start: '2025-06-15T09:00:00Z', end: '2025-06-15T12:00:00Z' };
    expect(rangesOverlap(A, B)).toBe(true);
  });

  it('returns false when B starts exactly when A ends (adjacent)', () => {
    const B = { start: '2025-06-15T11:00:00Z', end: '2025-06-15T12:00:00Z' };
    expect(rangesOverlap(A, B)).toBe(false);
  });

  it('returns false when A starts exactly when B ends (adjacent)', () => {
    const B = { start: '2025-06-15T09:00:00Z', end: '2025-06-15T10:00:00Z' };
    expect(rangesOverlap(A, B)).toBe(false);
  });

  it('returns false when B is entirely before A', () => {
    const B = { start: '2025-06-15T08:00:00Z', end: '2025-06-15T09:00:00Z' };
    expect(rangesOverlap(A, B)).toBe(false);
  });

  it('returns false when B is entirely after A', () => {
    const B = { start: '2025-06-15T12:00:00Z', end: '2025-06-15T13:00:00Z' };
    expect(rangesOverlap(A, B)).toBe(false);
  });

  it('accepts Date instances as well as strings', () => {
    const B = {
      start: new Date('2025-06-15T10:30:00Z'),
      end: new Date('2025-06-15T10:45:00Z'),
    };
    expect(rangesOverlap(A, B)).toBe(true);
  });
});
