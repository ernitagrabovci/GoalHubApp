import { request } from '@/lib/api/client';
import type {
  ApiInjury,
  MessageResponse,
  MutationResponse,
  Paginated,
} from '@/lib/api/types';

export type InjuryListParams = {
  page?: number;
  team_id?: number;
  player_id?: number;
  /** `injured`, `rehabilitation` or `recovered`. */
  status?: string;
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

export function listInjuries(token: string, params: InjuryListParams = {}, signal?: AbortSignal) {
  const query = toQuery({
    page: params.page,
    team_id: params.team_id,
    player_id: params.player_id,
    status: params.status,
  });
  return request<Paginated<ApiInjury>>(`/injuries${query}`, { token, signal });
}

/** `GET /injuries/{injury}` returns a single resource envelope. */
type InjuryResponse = { data: ApiInjury };

export function getInjury(token: string, id: number, signal?: AbortSignal) {
  return request<InjuryResponse>(`/injuries/${id}`, { token, signal });
}

/** The writable fields when registering an injury — `POST /players/{player}/injuries`. */
export type CreateInjuryInput = {
  injury_type: string;
  occurred_during: 'training' | 'match' | 'other';
  /** `YYYY-MM-DD`. */
  injury_date: string;
  expected_return?: string | null;
  status: 'injured' | 'rehabilitation' | 'recovered';
  description?: string | null;
};

export function createInjury(
  token: string,
  playerId: number,
  input: CreateInjuryInput,
  signal?: AbortSignal,
) {
  return request<MessageResponse>(`/players/${playerId}/injuries`, {
    method: 'POST',
    body: input,
    token,
    signal,
  });
}

/** The writable fields of an injury — `PATCH /injuries/{injury}` (full object). */
export type InjuryInput = {
  injury_type: string;
  occurred_during: 'training' | 'match' | 'other';
  /** `YYYY-MM-DD`. */
  injury_date: string;
  expected_return?: string | null;
  status: 'injured' | 'rehabilitation' | 'recovered';
  description?: string | null;
  treatment?: string | null;
};

export function updateInjury(
  token: string,
  id: number,
  input: InjuryInput,
  signal?: AbortSignal,
) {
  return request<MutationResponse<ApiInjury>>(`/injuries/${id}`, {
    method: 'PATCH',
    body: input,
    token,
    signal,
  });
}

export function deleteInjury(token: string, id: number, signal?: AbortSignal) {
  return request<MessageResponse>(`/injuries/${id}`, { method: 'DELETE', token, signal });
}
