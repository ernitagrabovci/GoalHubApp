import { request } from '@/lib/api/client';
import type {
  ApiTeam,
  ApiTeamDetail,
  MessageResponse,
  MutationResponse,
  TeamStats,
} from '@/lib/api/types';

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

/** The writable fields of a team — `POST`/`PATCH /teams`. */
export type TeamInput = {
  name: string;
  /** `#RRGGBB`. */
  color_hex: string;
  trainer_id?: number | null;
  assistant_trainer_id?: number | null;
  season: string;
};

export function createTeam(token: string, input: TeamInput, signal?: AbortSignal) {
  return request<MutationResponse<ApiTeam>>('/teams', {
    method: 'POST',
    body: input,
    token,
    signal,
  });
}

export function updateTeam(
  token: string,
  id: number,
  input: TeamInput,
  signal?: AbortSignal,
) {
  return request<MutationResponse<ApiTeam>>(`/teams/${id}`, {
    method: 'PATCH',
    body: input,
    token,
    signal,
  });
}

/** Delete an empty team — a team with players, trainings or matches is refused (422). */
export function deleteTeam(token: string, id: number, signal?: AbortSignal) {
  return request<MessageResponse>(`/teams/${id}`, { method: 'DELETE', token, signal });
}
