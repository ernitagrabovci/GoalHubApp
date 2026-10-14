import { request } from '@/lib/api/client';
import type {
  ApiMessage,
  ConversationsResponse,
  GroupThreadResponse,
  ThreadResponse,
} from '@/lib/api/types';

/** Existing conversations (DMs + accessible groups) plus the contact roster. */
export function listConversations(token: string, signal?: AbortSignal) {
  return request<ConversationsResponse>('/conversations', { token, signal });
}

/** One direct thread. Fetching it also marks the partner's messages read. */
export function getThread(token: string, userId: number, signal?: AbortSignal) {
  return request<ThreadResponse>(`/conversations/${userId}`, { token, signal });
}

export function sendMessage(
  token: string,
  userId: number,
  body: string,
  signal?: AbortSignal,
) {
  return request<{ message: ApiMessage }>(`/conversations/${userId}`, {
    method: 'POST',
    token,
    body: { body },
    signal,
  });
}

/** One group thread. Fetching it also marks the group's messages read. */
export function getGroupThread(token: string, groupId: number, signal?: AbortSignal) {
  return request<GroupThreadResponse>(`/groups/${groupId}`, { token, signal });
}

export function sendGroupMessage(
  token: string,
  groupId: number,
  body: string,
  signal?: AbortSignal,
) {
  return request<{ message: ApiMessage }>(`/groups/${groupId}`, {
    method: 'POST',
    token,
    body: { body },
    signal,
  });
}
