import { request } from '@/lib/api/client';
import type { ApiInjury, Paginated } from '@/lib/api/types';

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
