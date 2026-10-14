import { request } from '@/lib/api/client';
import type { ApiTraining, Paginated } from '@/lib/api/types';

export type TrainingListParams = {
  page?: number;
  team_id?: number;
  /** The training type as stored on the record (`regular`, `tactical`, …). */
  type?: string;
  /** `upcoming`, `finished`, `finalized` or `pending`. */
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

export function listTrainings(
  token: string,
  params: TrainingListParams = {},
  signal?: AbortSignal,
) {
  const query = toQuery({
    page: params.page,
    team_id: params.team_id,
    type: params.type,
    status: params.status,
  });
  return request<Paginated<ApiTraining>>(`/trainings${query}`, { token, signal });
}

/** `GET /trainings/{training}` returns a single resource envelope. */
type TrainingResponse = { data: ApiTraining };

export function getTraining(token: string, id: number, signal?: AbortSignal) {
  return request<TrainingResponse>(`/trainings/${id}`, { token, signal });
}
