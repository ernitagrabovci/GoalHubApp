import { request } from '@/lib/api/client';
import type { ApiMatch, Paginated } from '@/lib/api/types';

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

/** `GET /matches/{match}` returns a single resource envelope. */
type MatchResponse = { data: ApiMatch };

export function getMatch(token: string, id: number, signal?: AbortSignal) {
  return request<MatchResponse>(`/matches/${id}`, { token, signal });
}
