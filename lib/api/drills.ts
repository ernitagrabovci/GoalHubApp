import { request } from '@/lib/api/client';
import type {
  ApiDrill,
  DrillInput,
  MessageResponse,
  MutationResponse,
  Paginated,
} from '@/lib/api/types';

/** Builds `?page=2`, dropping undefined values. */
function toQuery(params: Record<string, string | number | undefined>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

/** The caller's own drills, newest first — `GET /drills` (paginated). */
export function listDrills(
  token: string,
  params: { page?: number } = {},
  signal?: AbortSignal,
) {
  return request<Paginated<ApiDrill>>(`/drills${toQuery({ page: params.page })}`, {
    token,
    signal,
  });
}

/** A drill with its full board schema — `GET /drills/{drill}`. */
export function getDrill(token: string, id: number, signal?: AbortSignal) {
  return request<{ data: ApiDrill }>(`/drills/${id}`, { token, signal });
}

export function createDrill(token: string, input: DrillInput, signal?: AbortSignal) {
  return request<MutationResponse<ApiDrill>>('/drills', {
    method: 'POST',
    body: input,
    token,
    signal,
  });
}

export function updateDrill(
  token: string,
  id: number,
  input: DrillInput,
  signal?: AbortSignal,
) {
  return request<MutationResponse<ApiDrill>>(`/drills/${id}`, {
    method: 'PATCH',
    body: input,
    token,
    signal,
  });
}

export function deleteDrill(token: string, id: number, signal?: AbortSignal) {
  return request<MessageResponse>(`/drills/${id}`, { method: 'DELETE', token, signal });
}
