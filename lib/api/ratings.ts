import { request } from '@/lib/api/client';
import type { PlayerRatingRow } from '@/lib/api/types';

export type RatingListParams = {
  team_id?: number;
  player_id?: number;
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

/** Averaged coach ratings per player, from `GET /ratings`. */
export function listRatings(token: string, params: RatingListParams = {}, signal?: AbortSignal) {
  const query = toQuery({ team_id: params.team_id, player_id: params.player_id });
  return request<{ data: PlayerRatingRow[] }>(`/ratings${query}`, { token, signal });
}
