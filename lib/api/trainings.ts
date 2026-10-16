import { request } from '@/lib/api/client';
import type {
  ApiTraining,
  MessageResponse,
  MutationResponse,
  Paginated,
  TrainingInput,
} from '@/lib/api/types';

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

/** The signed-in player's own team's sessions, each with their own attendance. */
export function listMyTrainings(
  token: string,
  params: Pick<TrainingListParams, 'page' | 'status'> = {},
  signal?: AbortSignal,
) {
  const query = toQuery({ page: params.page, status: params.status });
  return request<Paginated<ApiTraining>>(`/my/trainings${query}`, { token, signal });
}

/** `GET /trainings/{training}` returns a single resource envelope. */
type TrainingResponse = { data: ApiTraining };

export function getTraining(token: string, id: number, signal?: AbortSignal) {
  return request<TrainingResponse>(`/trainings/${id}`, { token, signal });
}

/* ─────────────────────────────── Writes ─────────────────────────────── */

/** Schedule a new session for the trainer's own team. */
export function createTraining(token: string, input: TrainingInput, signal?: AbortSignal) {
  return request<MutationResponse<ApiTraining>>('/trainings', {
    method: 'POST',
    body: input,
    token,
    signal,
  });
}

/** Edit a session — omit `scheduled_at` on a finalized one (it is frozen). */
export function updateTraining(
  token: string,
  id: number,
  input: TrainingInput,
  signal?: AbortSignal,
) {
  return request<MutationResponse<ApiTraining>>(`/trainings/${id}`, {
    method: 'PATCH',
    body: input,
    token,
    signal,
  });
}

export function deleteTraining(token: string, id: number, signal?: AbortSignal) {
  return request<MessageResponse>(`/trainings/${id}`, { method: 'DELETE', token, signal });
}

/** One player's attendance line: `present`, `absent` or `unconfirmed`. */
export type AttendanceEntry = {
  status: 'present' | 'absent' | 'unconfirmed';
  reason?: string | null;
};

/**
 * Save attendance for a training session. `finalize` (default) also marks the
 * session as graded; pass `false` to update an already-finalized sheet.
 */
export function saveAttendance(
  token: string,
  trainingId: number,
  attendance: Record<number, AttendanceEntry>,
  finalize = true,
  signal?: AbortSignal,
) {
  return request<MutationResponse<ApiTraining>>(`/trainings/${trainingId}/attendance`, {
    method: finalize ? 'POST' : 'PUT',
    body: { attendance },
    token,
    signal,
  });
}
