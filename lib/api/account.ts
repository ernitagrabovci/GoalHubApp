import { request } from '@/lib/api/client';
import type { MessageResponse } from '@/lib/api/types';

/** Disable the caller's own account and revoke their tokens. */
export function deactivateAccount(token: string, signal?: AbortSignal) {
  return request<MessageResponse>('/profile/deactivate', { method: 'POST', token, signal });
}

/**
 * Permanently delete the caller's own account. The password is re-checked
 * server-side, so a stolen token alone cannot wipe the account.
 */
export function deleteAccount(token: string, password: string, signal?: AbortSignal) {
  return request<MessageResponse>('/profile', {
    method: 'DELETE',
    body: { password },
    token,
    signal,
  });
}

/** `POST /settings/subscription/cancel` — the club's Paddle subscription. */
export type CancelSubscriptionResponse = {
  message: string;
  subscription_status: string;
  subscription_ends_at: string;
};

export function cancelSubscription(token: string, signal?: AbortSignal) {
  return request<CancelSubscriptionResponse>('/settings/subscription/cancel', {
    method: 'POST',
    token,
    signal,
  });
}
