import { request } from '@/lib/api/client';
import type {
  ApiPlayer,
  ApiPosition,
  MessageResponse,
  MutationResponse,
  Paginated,
  PlayerStats,
  PlayerStatisticsResponse,
} from '@/lib/api/types';

export type PlayerListParams = {
  page?: number;
  search?: string;
  team_id?: number;
  position?: string;
  health_status?: string;
  /** `active` (default server-side) or `inactive`. */
  account_status?: string;
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

export function listPlayers(token: string, params: PlayerListParams = {}, signal?: AbortSignal) {
  const query = toQuery({
    page: params.page,
    search: params.search?.trim() || undefined,
    team_id: params.team_id,
    position: params.position,
    health_status: params.health_status,
    account_status: params.account_status,
  });
  return request<Paginated<ApiPlayer>>(`/players${query}`, { token, signal });
}

export function playerStats(token: string, signal?: AbortSignal) {
  return request<PlayerStats>('/players/stats', { token, signal });
}

/** `GET /players/{player}` returns a single resource envelope. */
type PlayerResponse = { data: ApiPlayer };

export function getPlayer(token: string, id: number, signal?: AbortSignal) {
  return request<PlayerResponse>(`/players/${id}`, { token, signal });
}

/** Season totals per player, from `GET /players/statistics`. */
export function playerStatistics(
  token: string,
  params: { team_id?: number } = {},
  signal?: AbortSignal,
) {
  const query = toQuery({ team_id: params.team_id });
  return request<PlayerStatisticsResponse>(`/players/statistics${query}`, { token, signal });
}

/* ─────────────────────────────── Writes ─────────────────────────────── */

/** Fields accepted by `POST /players` and `PATCH /players/{player}`. */
export type PlayerWriteInput = {
  name: string;
  email: string;
  /** Required on create; omit on update to keep the current password. */
  password?: string;
  password_confirmation?: string;
  team_id: number;
  jersey_number?: number | null;
  position: string;
  date_of_birth?: string | null;
  nationality?: string | null;
  contract_start?: string | null;
  contract_end?: string | null;
  ffk_license?: string | null;
  health_status?: string;
  contract_type: 'anetare' | 'kontraktual';
  monthly_amount: number;
  payment_deadline_days: number;
  billing_cycle: 'anniversary' | 'calendar_month';
};

export function createPlayer(token: string, input: PlayerWriteInput, signal?: AbortSignal) {
  return request<MutationResponse<ApiPlayer>>('/players', {
    method: 'POST',
    body: input,
    token,
    signal,
  });
}

export function updatePlayer(
  token: string,
  id: number,
  input: PlayerWriteInput,
  signal?: AbortSignal,
) {
  return request<MutationResponse<ApiPlayer>>(`/players/${id}`, {
    method: 'PATCH',
    body: input,
    token,
    signal,
  });
}

export function deletePlayer(token: string, id: number, signal?: AbortSignal) {
  return request<MessageResponse>(`/players/${id}`, { method: 'DELETE', token, signal });
}

/** Move a player to another team of the same club. */
export function transferPlayer(token: string, id: number, teamId: number, signal?: AbortSignal) {
  return request<MutationResponse<ApiPlayer>>(`/players/${id}/transfer`, {
    method: 'POST',
    body: { team_id: teamId },
    token,
    signal,
  });
}

export type PlayerRatingInput = {
  technique: number;
  physical: number;
  tactics: number;
  consistency: number;
  teamwork: number;
  comment?: string | null;
  rated_at?: string | null;
};

export function ratePlayer(token: string, id: number, input: PlayerRatingInput, signal?: AbortSignal) {
  return request<MessageResponse>(`/players/${id}/ratings`, {
    method: 'POST',
    body: input,
    token,
    signal,
  });
}

export type InjuryInput = {
  injury_type: string;
  occurred_during: 'training' | 'match' | 'other';
  injury_date: string;
  expected_return?: string | null;
  status: 'injured' | 'rehabilitation' | 'recovered';
  description?: string | null;
};

export function injurePlayer(token: string, id: number, input: InjuryInput, signal?: AbortSignal) {
  return request<MessageResponse>(`/players/${id}/injuries`, {
    method: 'POST',
    body: input,
    token,
    signal,
  });
}

export function updatePlayerHealth(
  token: string,
  id: number,
  healthStatus: string,
  signal?: AbortSignal,
) {
  return request<MutationResponse<ApiPlayer>>(`/players/${id}/health`, {
    method: 'PATCH',
    body: { health_status: healthStatus },
    token,
    signal,
  });
}

/** Playable positions, from `GET /positions`. */
export function listPositions(token: string, signal?: AbortSignal) {
  return request<{ data: ApiPosition[] }>('/positions', { token, signal });
}

/** Add a new position (the form's "e re" action). */
export function createPosition(token: string, name: string, signal?: AbortSignal) {
  return request<MutationResponse<ApiPosition>>('/positions', {
    method: 'POST',
    body: { name },
    token,
    signal,
  });
}
