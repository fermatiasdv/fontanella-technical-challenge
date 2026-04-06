/**
 * Base HTTP client.
 * All API calls go through `apiFetch` so error handling,
 * base URL and headers are centralized in one place.
 */

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Thin wrapper around `fetch`.
 * - Prepends BASE_URL automatically.
 * - Unwraps the `{ data }` envelope the backend sends.
 * - Throws `ApiError` on non-2xx responses.
 * - Accepts an optional `AbortSignal` for cleanup.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // 204 No Content (e.g. DELETE) — nothing to parse
  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message: string = body?.message ?? body?.error ?? `HTTP ${res.status}`;
    throw new ApiError(message, res.status);
  }

  // Backend wraps every response in { data: ... }
  return (body as { data: T }).data;
}
