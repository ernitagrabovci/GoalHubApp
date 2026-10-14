import { request } from '@/lib/api/client';
import type { ApiPlayer, Paginated, PlayerStats } from '@/lib/api/types';

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
