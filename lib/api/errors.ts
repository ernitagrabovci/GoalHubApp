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

/** Normalises any thrown value into an `ApiError`. */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (error instanceof Error && error.name === 'AbortError') {
    return new ApiError('The request timed out. Check your connection and try again.', 0);
  }
  return new ApiError('Could not reach the server. Check your connection and try again.', 0);
}
