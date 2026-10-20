import { request } from '@/lib/api/client';
import type {
  MessageResponse,
  SecuritySessionsResponse,
  TwoFactorConfirmResponse,
  TwoFactorSetupResponse,
  TwoFactorStatus,
} from '@/lib/api/types';

/** The caller's current session metadata plus their personal access tokens. */
export function getSecuritySessions(token: string, signal?: AbortSignal) {
  return request<SecuritySessionsResponse>('/security/sessions', { token, signal });
}

/** Whether the account has a confirmed authenticator app. */
export function getTwoFactorStatus(token: string, signal?: AbortSignal) {
  return request<TwoFactorStatus>('/auth/two-factor/status', { token, signal });
}

/**
 * Start enrollment: rotates any pending secret and returns the secret plus an
 * `otpauth://` URL for the authenticator app.
 */
export function setupTwoFactor(token: string, signal?: AbortSignal) {
  return request<TwoFactorSetupResponse>('/auth/two-factor/setup', {
    method: 'POST',
    token,
    signal,
  });
}

/** Confirm enrollment with a code; returns the one-time recovery codes. */
export function confirmTwoFactor(token: string, code: string, signal?: AbortSignal) {
  return request<TwoFactorConfirmResponse>('/auth/two-factor/confirm', {
    method: 'POST',
    token,
    body: { code },
    signal,
  });
}

/** Disable 2FA — requires both the account password and a valid code. */
export function disableTwoFactor(
  token: string,
  password: string,
  code: string,
  signal?: AbortSignal,
) {
  return request<MessageResponse>('/auth/two-factor/disable', {
    method: 'POST',
    token,
    body: { password, code },
    signal,
  });
}
