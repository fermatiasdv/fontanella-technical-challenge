/**
 * Base HTTP client.
 * All API calls go through `apiFetch` so error handling,
 * base URL and headers are centralized in one place.
 */

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

export class ApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name   = 'ApiError';
    this.status = status;
  }
}

/**
 * Thin wrapper around `fetch`.
 * - Prepends BASE_URL automatically.
 * - Unwraps the `{ data }` envelope the backend sends.
 * - Throws `ApiError` on non-2xx responses.
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

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message: string = body?.message ?? body?.error ?? `HTTP ${res.status}`;
    throw new ApiError(message, res.status);
  }

  return (body as { data: T }).data;
}
