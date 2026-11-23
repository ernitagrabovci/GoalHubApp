import type { FieldErrors } from '@/lib/api/types';

/** Every API failure surfaces as one of these. `status` is 0 for network/timeout. */
export class ApiError extends Error {
  status: number;
  fieldErrors?: FieldErrors;

  constructor(message: string, status: number, fieldErrors?: FieldErrors) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

/**
 * Copy for a failed load, naming the two cases the user can act on: the server
 * is unreachable, or this account lacks the role the page needs. Anything else
 * falls back to the caller's own copy.
 */
export function loadErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return 'Nuk mund të lidhemi me serverin. Kontrollo lidhjen.';
    if (error.status === 403) return 'Nuk ke leje për këtë faqe. Kontakto administratorin.';
  }
  return fallback;
}

/** Normalises any thrown value into an `ApiError`. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof Error && error.name === 'AbortError') {
    return new ApiError('The request timed out. Check your connection and try again.', 0);
  }
  return new ApiError('Could not reach the server. Check your connection and try again.', 0);
}
