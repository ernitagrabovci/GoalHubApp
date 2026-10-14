const DEFAULT_API_URL = 'https://app.goalhub-eu.com/api/v1';

/**
 * Base URL for the versioned API. Override per-environment with
 * `EXPO_PUBLIC_API_URL` (inlined at build time — restart to pick up changes).
 */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/+$/, '');

/** How long a request may run before it is aborted. */
export const REQUEST_TIMEOUT_MS = 15000;
