import config from '../../config';
import { HttpError } from '../../types';

const BASE_URL = config.timeapi.baseUrl;

/** Timeout for external HTTP calls (ms). */
const REQUEST_TIMEOUT_MS = 5_000;

// ─── timeapi.io response shapes ───────────────────────────────────────────────

interface TimeApiConversionResponse {
  conversionResult?: {
    dateTime: string;
    timeZone: string;
    dstActive: boolean;
  };
}

interface TimeApiCurrentTimeResponse {
  dateTime: string;
  timeZone: string;
  [key: string]: unknown;
}

type FetchOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
};

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function fetchWithTimeout(url: string, options: FetchOptions = {}): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    if (!res.ok) {
      const text = await res.text();
      throw new HttpError(`timeapi.io responded with ${res.status}: ${text}`, 502);
    }
    return res.json();
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new HttpError('timeapi.io request timed out', 504);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Retrieve current time information for a given IANA timezone.
 */
export async function getCurrentTime(timeZone: string): Promise<TimeApiCurrentTimeResponse> {
  const url = `${BASE_URL}/Time/current/zone?timeZone=${encodeURIComponent(timeZone)}`;
  return fetchWithTimeout(url) as Promise<TimeApiCurrentTimeResponse>;
}

/**
 * Convert a date-time string from one timezone to another.
 */
export async function convertTimezone({
  dateTime,
  fromZone,
  toZone,
  dstAmbiguity = '',
}: {
  dateTime: string;
  fromZone: string;
  toZone: string;
  dstAmbiguity?: string;
}): Promise<TimeApiConversionResponse> {
  const url = `${BASE_URL}/Conversion/ConvertTimeZone`;
  return fetchWithTimeout(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fromTimezone: fromZone,
      dateTime,
      toTimezone: toZone,
      dstAmbiguity,
    }),
  }) as Promise<TimeApiConversionResponse>;
}

/**
 * Normalize a local date-time string to a UTC ISO string ready for storage
 * in PostgreSQL TIMESTAMPTZ columns.
 *
 * Falls back to a pure JS conversion when timeapi.io is unreachable so
 * the app can still operate (with a warning) in degraded mode.
 *
 * @param localDateTime  - e.g. "2024-06-15 09:00:00"
 * @param sourceZone     - IANA timezone of the input (defaults to APP_TIMEZONE)
 * @returns              - UTC ISO string, e.g. "2024-06-15T12:00:00.000Z"
 */
export async function normalizeToUTC(
  localDateTime: string,
  sourceZone: string = config.app.timezone,
): Promise<string> {
  try {
    const result = await convertTimezone({
      dateTime: localDateTime,
      fromZone: sourceZone,
      toZone: 'UTC',
    });

    const converted = result?.conversionResult?.dateTime;
    if (!converted) {
      throw new Error('Unexpected response shape from timeapi.io');
    }

    const utcDate = new Date(converted);
    if (isNaN(utcDate.getTime())) {
      throw new Error(`Invalid date returned by timeapi.io: ${converted}`);
    }

    return utcDate.toISOString();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[timezoneService] Falling back to JS Date conversion. Reason: ${message}`);

    const fallback = new Date(localDateTime);
    if (isNaN(fallback.getTime())) {
      throw new HttpError(`Cannot parse datetime: "${localDateTime}"`, 400);
    }
    return fallback.toISOString();
  }
}

/**
 * Convert a UTC ISO string to a human-readable string in the given timezone.
 * Useful for display purposes in API responses.
 */
export async function toLocalTime(
  utcIso: string,
  targetZone: string = config.app.timezone,
): Promise<string> {
  const cleanDateTime = utcIso.replace('Z', '').replace('T', ' ').split('.')[0];

  const result = await convertTimezone({
    dateTime: cleanDateTime,
    fromZone: 'UTC',
    toZone: targetZone,
  });

  return result?.conversionResult?.dateTime ?? utcIso;
}
