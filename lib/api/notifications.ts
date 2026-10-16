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
