import { request } from '@/lib/api/client';
import type { ApiMatch, MessageResponse, MutationResponse, Paginated } from '@/lib/api/types';

export type MatchListParams = {
  /** `upcoming` = scheduled in the future, `played` = in the past. */
  status?: 'upcoming' | 'played' | 'finished';
  page?: number;
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

export function listMatches(token: string, params: MatchListParams = {}, signal?: AbortSignal) {
  const query = toQuery({ status: params.status, page: params.page });
  return request<Paginated<ApiMatch>>(`/matches${query}`, { token, signal });
}

/** The signed-in player's own team's matches — read-only, any role may ask. */
export function listMyMatches(token: string, params: MatchListParams = {}, signal?: AbortSignal) {
  const query = toQuery({ status: params.status, page: params.page });
  return request<Paginated<ApiMatch>>(`/my/matches${query}`, { token, signal });
}

/** `GET /matches/{match}` returns a single resource envelope. */
type MatchResponse = { data: ApiMatch };

export function getMatch(token: string, id: number, signal?: AbortSignal) {
  return request<MatchResponse>(`/matches/${id}`, { token, signal });
}

/* ─────────────────────────────── Writes ─────────────────────────────── */

export type MatchWriteInput = {
  /** Omitted → the caller's own team is used. */
  team_id?: number;
  opponent: string;
  competition?: string | null;
  venue: 'home' | 'away';
  scheduled_at: string;
  transport_at?: string | null;
  notes?: string | null;
  status?: 'upcoming' | 'cancelled';
};

export function createMatch(token: string, input: MatchWriteInput, signal?: AbortSignal) {
  return request<MutationResponse<ApiMatch>>('/matches', {
    method: 'POST',
    body: input,
    token,
    signal,
  });
}

export function updateMatch(
  token: string,
  id: number,
  input: MatchWriteInput,
  signal?: AbortSignal,
) {
  return request<MutationResponse<ApiMatch>>(`/matches/${id}`, {
    method: 'PATCH',
    body: input,
    token,
    signal,
  });
}

export function deleteMatch(token: string, id: number, signal?: AbortSignal) {
  return request<MessageResponse>(`/matches/${id}`, { method: 'DELETE', token, signal });
}

/** Per-player line in the final result. */
export type MatchStatInput = {
  goals?: number;
  assists?: number;
  minutes_played?: number | null;
  yellow_cards?: number;
  red_cards?: number;
  rating?: number | null;
};

/** Final score (and optional per-player stats) — marks the match as played. */
export function saveMatchResult(
  token: string,
  id: number,
  input: { goals_for: number; goals_against: number; stats?: Record<number, MatchStatInput> },
  signal?: AbortSignal,
) {
  return request<MutationResponse<ApiMatch>>(`/matches/${id}/result`, {
    method: 'POST',
    body: input,
    token,
    signal,
  });
}

export type LineupEntry = {
  type: 'starter' | 'substitute' | 'out';
  position?: string | null;
};

export function saveMatchLineup(
  token: string,
  id: number,
  lineup: Record<number, LineupEntry>,
  signal?: AbortSignal,
) {
  return request<MutationResponse<ApiMatch>>(`/matches/${id}/lineup`, {
    method: 'POST',
    body: { lineup },
    token,
    signal,
  });
}
