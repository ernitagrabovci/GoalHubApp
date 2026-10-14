import { request } from '@/lib/api/client';
import type { ApiBadges, ApiNotification, MessageResponse, Paginated } from '@/lib/api/types';

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
