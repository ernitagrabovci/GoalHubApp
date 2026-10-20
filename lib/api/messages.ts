import { request } from '@/lib/api/client';
import type {
  ApiMessage,
  ApiMessageReaction,
  ConversationsResponse,
  CreateGroupResponse,
  GroupThreadResponse,
  ThreadResponse,
} from '@/lib/api/types';

/** Existing conversations (DMs + accessible groups) plus the contact roster. */
export function listConversations(token: string, signal?: AbortSignal) {
  return request<ConversationsResponse>('/conversations', { token, signal });
}

/**
 * One direct thread. Fetching it also marks the partner's messages read.
 * Pass `afterId` to fetch only what arrived since the last poll.
 */
export function getThread(
  token: string,
  userId: number,
  signal?: AbortSignal,
  afterId?: number,
) {
  const query = afterId ? `?after_id=${afterId}` : '';
  return request<ThreadResponse>(`/conversations/${userId}${query}`, { token, signal });
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

export type CreateGroupInput = {
  name: string;
  member_ids: number[];
  /** Coaching staff only; defaults to their own team. */
  team_id?: number | null;
};

/**
 * Create a group. Administrators are always added as a member; coaching staff
 * must pass the team they manage (or omit it to use their own team).
 */
export function createGroup(token: string, input: CreateGroupInput, signal?: AbortSignal) {
  return request<CreateGroupResponse>('/groups', {
    method: 'POST',
    body: input,
    token,
    signal,
  });
}

/**
 * One group thread. Fetching it also marks the group's messages read.
 * Pass `afterId` to fetch only what arrived since the last poll.
 */
export function getGroupThread(
  token: string,
  groupId: number,
  signal?: AbortSignal,
  afterId?: number,
) {
  const query = afterId ? `?after_id=${afterId}` : '';
  return request<GroupThreadResponse>(`/groups/${groupId}${query}`, { token, signal });
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

/** Edit one of your own messages. */
export function updateMessage(
  token: string,
  messageId: number,
  body: string,
  signal?: AbortSignal,
) {
  return request<{ message: ApiMessage }>(`/messages/${messageId}`, {
    method: 'PATCH',
    token,
    body: { body },
    signal,
  });
}

/** Soft-delete one of your own messages. */
export function deleteMessage(token: string, messageId: number, signal?: AbortSignal) {
  return request<{ message: ApiMessage }>(`/messages/${messageId}`, {
    method: 'DELETE',
    token,
    signal,
  });
}

/** Toggle or replace your reaction on a message. */
export function reactToMessage(
  token: string,
  messageId: number,
  reaction: string,
  signal?: AbortSignal,
) {
  return request<{ id: number; reactions: ApiMessageReaction[] }>(
    `/messages/${messageId}/reactions`,
    {
      method: 'POST',
      token,
      body: { reaction },
      signal,
    },
  );
}
