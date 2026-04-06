/**
 * Unit tests for src/shared/services/timezone/timezoneService.ts
 * fetch is mocked globally so no real HTTP calls are made.
 */

jest.mock('../../shared/config', () => ({
  __esModule: true,
  default: {
    timeapi: { baseUrl: 'https://test-timeapi.io/api' },
    app: { timezone: 'America/Argentina/Buenos_Aires' },
  },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

import { getCurrentTime, convertTimezone, normalizeToUTC, toLocalTime } from '../../shared/services/timezone/timezoneService';
import { HttpError } from '../../shared/types';

// ─── helpers ──────────────────────────────────────────────────────────────────

function mockOkResponse(body: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  });
}

function mockErrorResponse(status: number, text = 'Bad Request') {
  return Promise.resolve({
    ok: false,
    status,
    json: () => Promise.resolve({ error: text }),
    text: () => Promise.resolve(text),
  });
}

beforeEach(() => {
  mockFetch.mockReset();
});

// ─── getCurrentTime ───────────────────────────────────────────────────────────

describe('getCurrentTime', () => {
  it('returns the parsed response for a valid timezone', async () => {
    const responseBody = {
      dateTime: '2025-06-15T13:00:00',
      timeZone: 'America/New_York',
      utcOffset: '-05:00',
    };
    mockFetch.mockReturnValue(mockOkResponse(responseBody));

    const result = await getCurrentTime('America/New_York');

    expect(result).toEqual(responseBody);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('America%2FNew_York'),
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('throws HttpError 502 when timeapi responds with non-2xx', async () => {
    mockFetch.mockReturnValue(mockErrorResponse(503, 'Service Unavailable'));

    await expect(getCurrentTime('America/New_York')).rejects.toMatchObject({
      statusCode: 502,
      message: expect.stringContaining('503'),
    });
  });

  it('throws HttpError 504 when the request times out (AbortError)', async () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    mockFetch.mockRejectedValue(abortError);

    await expect(getCurrentTime('America/New_York')).rejects.toMatchObject({
      statusCode: 504,
      message: expect.stringContaining('timed out'),
    });
  });

  it('re-throws non-abort errors unchanged', async () => {
    const originalError = new HttpError('custom error', 502);
    mockFetch.mockRejectedValue(originalError);

    await expect(getCurrentTime('UTC')).rejects.toThrow(originalError);
  });
});

// ─── convertTimezone ─────────────────────────────────────────────────────────

describe('convertTimezone', () => {
  it('calls the conversion endpoint with the correct payload', async () => {
    const responseBody = {
      conversionResult: {
        dateTime: '2025-06-15T09:00:00',
        timeZone: 'UTC',
        dstActive: false,
      },
    };
    mockFetch.mockReturnValue(mockOkResponse(responseBody));

    const result = await convertTimezone({
      dateTime: '2025-06-15 06:00:00',
      fromZone: 'America/Argentina/Buenos_Aires',
      toZone: 'UTC',
    });

    expect(result).toEqual(responseBody);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/Conversion/ConvertTimeZone'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: expect.stringContaining('America/Argentina/Buenos_Aires'),
      }),
    );
  });

  it('includes dstAmbiguity in the request body when provided', async () => {
    mockFetch.mockReturnValue(mockOkResponse({ conversionResult: { dateTime: '2025-01-01T00:00:00', timeZone: 'UTC', dstActive: false } }));

    await convertTimezone({
      dateTime: '2025-01-01 00:00:00',
      fromZone: 'America/New_York',
      toZone: 'UTC',
      dstAmbiguity: 'Earlier',
    });

    const calledBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(calledBody.dstAmbiguity).toBe('Earlier');
  });

  it('throws HttpError 502 on non-ok response', async () => {
    mockFetch.mockReturnValue(mockErrorResponse(400, 'Invalid timezone'));

    await expect(
      convertTimezone({ dateTime: '2025-01-01', fromZone: 'Invalid', toZone: 'UTC' }),
    ).rejects.toMatchObject({ statusCode: 502 });
  });
});

// ─── normalizeToUTC ───────────────────────────────────────────────────────────

describe('normalizeToUTC', () => {
  it('returns UTC ISO string from a successful timeapi conversion', async () => {
    mockFetch.mockReturnValue(
      mockOkResponse({
        conversionResult: {
          dateTime: '2025-06-15T12:00:00',
          timeZone: 'UTC',
          dstActive: false,
        },
      }),
    );

    const result = await normalizeToUTC('2025-06-15 09:00:00', 'America/Argentina/Buenos_Aires');

    expect(result).toBe(new Date('2025-06-15T12:00:00').toISOString());
  });

  it('falls back to JS Date conversion when timeapi fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    const result = await normalizeToUTC('2025-06-15T09:00:00.000Z');

    expect(result).toBe(new Date('2025-06-15T09:00:00.000Z').toISOString());
  });

  it('falls back when timeapi returns an unexpected shape (missing conversionResult)', async () => {
    mockFetch.mockReturnValue(mockOkResponse({}));

    const result = await normalizeToUTC('2025-06-15T09:00:00.000Z');

    expect(result).toBe(new Date('2025-06-15T09:00:00.000Z').toISOString());
  });

  it('falls back when timeapi returns an invalid date string', async () => {
    mockFetch.mockReturnValue(
      mockOkResponse({
        conversionResult: { dateTime: 'not-a-date', timeZone: 'UTC', dstActive: false },
      }),
    );

    const result = await normalizeToUTC('2025-06-15T09:00:00.000Z');
    expect(typeof result).toBe('string');
  });

  it('uses the default app timezone when sourceZone is omitted', async () => {
    mockFetch.mockReturnValue(
      mockOkResponse({
        conversionResult: { dateTime: '2025-06-15T12:00:00', timeZone: 'UTC', dstActive: false },
      }),
    );

    await normalizeToUTC('2025-06-15 09:00:00');

    const calledBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(calledBody.fromTimezone).toBe('America/Argentina/Buenos_Aires');
  });

  it('throws HttpError 400 in fallback when the input is not parseable at all', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    await expect(normalizeToUTC('not-a-date-at-all')).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining('Cannot parse datetime'),
    });
  });
});

// ─── toLocalTime ─────────────────────────────────────────────────────────────

describe('toLocalTime', () => {
  it('returns the converted local datetime string', async () => {
    mockFetch.mockReturnValue(
      mockOkResponse({
        conversionResult: {
          dateTime: '2025-06-15T09:00:00',
          timeZone: 'America/Argentina/Buenos_Aires',
          dstActive: false,
        },
      }),
    );

    const result = await toLocalTime('2025-06-15T12:00:00.000Z', 'America/Argentina/Buenos_Aires');

    expect(result).toBe('2025-06-15T09:00:00');
  });

  it('returns the original utcIso when conversionResult is absent', async () => {
    mockFetch.mockReturnValue(mockOkResponse({}));

    const utcIso = '2025-06-15T12:00:00.000Z';
    const result = await toLocalTime(utcIso);

    expect(result).toBe(utcIso);
  });

  it('strips the Z, T, and milliseconds before calling convertTimezone', async () => {
    mockFetch.mockReturnValue(
      mockOkResponse({
        conversionResult: { dateTime: '2025-06-15T09:00:00', timeZone: 'UTC', dstActive: false },
      }),
    );

    await toLocalTime('2025-06-15T12:00:00.000Z');

    const calledBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(calledBody.dateTime).toBe('2025-06-15 12:00:00');
  });
});
