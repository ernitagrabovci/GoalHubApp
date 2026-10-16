import { API_URL, REQUEST_TIMEOUT_MS } from '@/lib/api/config';
import { ApiError, toApiError } from '@/lib/api/errors';
import type { FieldErrors } from '@/lib/api/types';

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

type RequestOptions = {
  method?: Method;
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
};

type ErrorBody = { message?: string; errors?: FieldErrors };

/**
 * Single JSON entry point for the API. Attaches the bearer token when given,
 * aborts after the timeout, and turns any non-2xx into an `ApiError`.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, signal } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  // FormData must go out untouched: fetch sets its own multipart boundary, and
  // an explicit Content-Type would strip that boundary and break the upload.
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && !isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: isFormData ? body : body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    throw toApiError(error);
  } finally {
    clearTimeout(timeout);
  }

  const text = await response.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorBody = (data ?? {}) as ErrorBody;
    throw new ApiError(
      errorBody.message || `Request failed (${response.status}).`,
      response.status,
      errorBody.errors
    );
  }

  return data as T;
}
