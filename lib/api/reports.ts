import { request } from '@/lib/api/client';
import type { ActivityReport, FinanceReport, MatchesReport, PlayersReport } from '@/lib/api/types';

/** Builds `?a=1&b=2`, dropping undefined/empty values. */
function toQuery(params: Record<string, string | number | undefined>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

export function playersReport(
  token: string,
  params: { team_id?: number; position?: string } = {},
  signal?: AbortSignal,
) {
  const query = toQuery({ team_id: params.team_id, position: params.position });
  return request<PlayersReport>(`/reports/players${query}`, { token, signal });
}

export function matchesReport(
  token: string,
  params: { team_id?: number; result?: 'win' | 'draw' | 'loss' } = {},
  signal?: AbortSignal,
) {
  const query = toQuery({ team_id: params.team_id, result: params.result });
  return request<MatchesReport>(`/reports/matches${query}`, { token, signal });
}

export function financeReport(token: string, signal?: AbortSignal) {
  return request<FinanceReport>('/reports/finance', { token, signal });
}

export function activityReport(token: string, signal?: AbortSignal) {
  return request<ActivityReport>('/reports/activity', { token, signal });
}
