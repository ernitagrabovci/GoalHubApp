import { request } from '@/lib/api/client';
import type { ApiCompetition, MessageResponse, MutationResponse } from '@/lib/api/types';

/** Competitions, from `GET /competitions` (platform-wide). */
export function listCompetitions(token: string, signal?: AbortSignal) {
  return request<{ data: ApiCompetition[] }>('/competitions', { token, signal });
}

/* ─────────────────────────────── Writes ─────────────────────────────── */

export type CompetitionWriteInput = {
  name: string;
  type: 'league' | 'cup' | 'friendly';
};

export function createCompetition(
  token: string,
  input: CompetitionWriteInput,
  signal?: AbortSignal,
) {
  return request<MutationResponse<ApiCompetition>>('/competitions', {
    method: 'POST',
    body: input,
    token,
    signal,
  });
}

export function toggleCompetition(token: string, id: number, signal?: AbortSignal) {
  return request<MutationResponse<ApiCompetition>>(`/competitions/${id}/toggle`, {
    method: 'POST',
    token,
    signal,
  });
}

export function deleteCompetition(token: string, id: number, signal?: AbortSignal) {
  return request<MessageResponse>(`/competitions/${id}`, { method: 'DELETE', token, signal });
}
