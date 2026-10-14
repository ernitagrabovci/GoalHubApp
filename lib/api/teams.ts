import { request } from '@/lib/api/client';
import type { ApiTeam, ApiTeamDetail, TeamStats } from '@/lib/api/types';

/** `GET /teams` returns a plain resource collection envelope. */
type TeamListResponse = { data: ApiTeam[] };

/** `GET /teams/{team}` returns a single resource envelope. */
type TeamDetailResponse = { data: ApiTeamDetail };

export function teamStats(token: string, signal?: AbortSignal) {
  return request<TeamStats>('/teams/stats', { token, signal });
}

export function listTeams(token: string, signal?: AbortSignal) {
  return request<TeamListResponse>('/teams', { token, signal });
}

export function getTeam(token: string, id: number, signal?: AbortSignal) {
  return request<TeamDetailResponse>(`/teams/${id}`, { token, signal });
}
