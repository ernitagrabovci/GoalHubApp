import { request } from '@/lib/api/client';
import type {
  ApiBadges,
  ApiNotification,
  ApiNotificationPreferences,
  MessageResponse,
  NotificationPreferencesResponse,
  Paginated,
} from '@/lib/api/types';

/** Newest first, 20 per page. */
export function listNotifications(
  token: string,
  params: { page?: number } = {},
  signal?: AbortSignal,
) {
  const query = params.page && params.page > 1 ? `?page=${params.page}` : '';
  return request<Paginated<ApiNotification>>(`/notifications${query}`, { token, signal });
}

/** Marks every unread notification as read (the API has no per-item variant). */
export function markNotificationsRead(token: string, signal?: AbortSignal) {
  return request<MessageResponse>('/notifications/read', { method: 'POST', token, signal });
}

export function badges(token: string, signal?: AbortSignal) {
  return request<ApiBadges>('/badges', { token, signal });
}

/** Who a club-wide broadcast should reach. */
export type BroadcastRole = 'player' | 'trainer' | 'parent';

export type BroadcastInput = {
  title: string;
  body?: string | null;
  /** `all` — every club member; `filtered` — the chosen teams/roles. */
  target_type: 'all' | 'filtered';
  team_ids?: number[];
  roles?: BroadcastRole[];
};

export type BroadcastResponse = {
  message: string;
  sent: number;
};

/** An administrator's club-wide notice — only their own club's teams are valid. */
export function sendNotification(
  token: string,
  input: BroadcastInput,
  signal?: AbortSignal,
) {
  return request<BroadcastResponse>('/notifications', {
    method: 'POST',
    body: input,
    token,
    signal,
  });
}

/** The signed-in user's platform-notification switches. */
export function getNotificationPreferences(token: string, signal?: AbortSignal) {
  return request<NotificationPreferencesResponse>('/notifications/preferences', { token, signal });
}

/** Save the switches; the server answers with the full, merged set. */
export function updateNotificationPreferences(
  token: string,
  preferences: ApiNotificationPreferences,
  signal?: AbortSignal,
) {
  return request<NotificationPreferencesResponse>('/notifications/preferences', {
    method: 'PATCH',
    body: { preferences },
    token,
    signal,
  });
}
