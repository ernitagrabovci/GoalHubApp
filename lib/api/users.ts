import { request } from '@/lib/api/client';
import type { ApiMember, MessageResponse, MutationResponse, Paginated } from '@/lib/api/types';

export type UserListParams = {
  page?: number;
  search?: string;
  role?: string;
  /** `active` or `inactive`. */
  status?: string;
  team_id?: number;
};

/** Builds `?a=1&b=2`, dropping undefined/empty values. */
function toQuery(params: Record<string, string | number | undefined>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

/** Club members, from `GET /users`. */
export function listUsers(token: string, params: UserListParams = {}, signal?: AbortSignal) {
  const query = toQuery({
    page: params.page,
    search: params.search?.trim() || undefined,
    role: params.role,
    status: params.status,
    team_id: params.team_id,
  });
  return request<Paginated<ApiMember>>(`/users${query}`, { token, signal });
}

/* ─────────────────────────────── Writes ─────────────────────────────── */

export type UserRole =
  | 'administrator'
  | 'trainer'
  | 'assistant_trainer'
  | 'technical_staff'
  | 'player'
  | 'parent'
  | 'financier';

export type UserWriteInput = {
  name: string;
  email: string;
  /** Required on create; omit on update to keep the current password. */
  password?: string;
  password_confirmation?: string;
  role: UserRole;
  role_label?: string | null;
  team_id?: number | null;
  /** Only for `parent` — the player ids this account looks after. */
  player_ids?: number[];
};

export function createUser(token: string, input: UserWriteInput, signal?: AbortSignal) {
  return request<MutationResponse<ApiMember>>('/users', {
    method: 'POST',
    body: input,
    token,
    signal,
  });
}

export function updateUser(
  token: string,
  id: number,
  input: UserWriteInput,
  signal?: AbortSignal,
) {
  return request<MutationResponse<ApiMember>>(`/users/${id}`, {
    method: 'PATCH',
    body: input,
    token,
    signal,
  });
}

export function changeUserRole(token: string, id: number, role: UserRole, signal?: AbortSignal) {
  return request<MutationResponse<ApiMember>>(`/users/${id}/role`, {
    method: 'POST',
    body: { role },
    token,
    signal,
  });
}

export function toggleUser(token: string, id: number, signal?: AbortSignal) {
  return request<MutationResponse<ApiMember>>(`/users/${id}/toggle`, {
    method: 'POST',
    token,
    signal,
  });
}

export function deleteUser(token: string, id: number, signal?: AbortSignal) {
  return request<MessageResponse>(`/users/${id}`, { method: 'DELETE', token, signal });
}
