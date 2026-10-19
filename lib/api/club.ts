import { request } from '@/lib/api/client';
import type {
  ApiClubProfile,
  ApiFieldAvailability,
  ApiSeason,
  ApiTrainingField,
  MessageResponse,
  MutationResponse,
  SeasonInput,
} from '@/lib/api/types';

/** Editable club fields accepted by `PATCH /club` (`name` is the only required one). */
export type ClubUpdateInput = {
  name: string;
  abbreviation?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  founded_year?: number | null;
  federation?: string | null;
  category?: string | null;
  license_number?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  youtube?: string | null;
  twitter?: string | null;
  description?: string | null;
  fee_due_day?: number | null;
  fee_grace_days?: number | null;
};

/** `GET`/`PATCH /club` return a single resource envelope. */
type ClubResponse = { data: ApiClubProfile };

export function getClub(token: string, signal?: AbortSignal) {
  return request<ClubResponse>('/club', { token, signal });
}

export function updateClub(token: string, input: ClubUpdateInput, signal?: AbortSignal) {
  return request<ClubResponse>('/club', { method: 'PATCH', token, body: input, signal });
}

/** The club's seasons, newest first — `GET /club/seasons`. */
export function getSeasons(token: string, signal?: AbortSignal) {
  return request<{ data: ApiSeason[] }>('/club/seasons', { token, signal });
}

/** The club's training fields, by name — `GET /club/fields`. */
export function getFields(token: string, signal?: AbortSignal) {
  return request<{ data: ApiTrainingField[] }>('/club/fields', { token, signal });
}

/** The writable fields of a training field — `POST`/`PATCH /club/fields`. */
export type FieldInput = {
  name: string;
  type: 'artificial' | 'natural' | 'indoor';
  status: 'active' | 'inactive' | 'maintenance';
  address?: string | null;
  capacity?: number | null;
  dimensions?: string | null;
  has_lighting?: boolean;
  locker_rooms?: number | null;
  /** Days omitted are stored closed, `07:00`–`22:00`. */
  availability?: ApiFieldAvailability | null;
  notes?: string | null;
};

export function createField(token: string, input: FieldInput, signal?: AbortSignal) {
  return request<MutationResponse<ApiTrainingField>>('/club/fields', {
    method: 'POST',
    body: input,
    token,
    signal,
  });
}

export function updateField(
  token: string,
  id: number,
  input: FieldInput,
  signal?: AbortSignal,
) {
  return request<MutationResponse<ApiTrainingField>>(`/club/fields/${id}`, {
    method: 'PATCH',
    body: input,
    token,
    signal,
  });
}

export function deleteField(token: string, id: number, signal?: AbortSignal) {
  return request<MessageResponse>(`/club/fields/${id}`, { method: 'DELETE', token, signal });
}

/** Create a season (inactive until activated) — `POST /club/seasons`. */
export function createSeason(token: string, input: SeasonInput, signal?: AbortSignal) {
  return request<MutationResponse<ApiSeason>>('/club/seasons', {
    method: 'POST',
    body: input,
    token,
    signal,
  });
}

/** Make one season the club's active one, deactivating the rest. */
export function activateSeason(token: string, id: number, signal?: AbortSignal) {
  return request<MutationResponse<ApiSeason>>(`/club/seasons/${id}/activate`, {
    method: 'PATCH',
    token,
    signal,
  });
}

/** Delete a season — the active one is refused with a 422. */
export function deleteSeason(token: string, id: number, signal?: AbortSignal) {
  return request<MessageResponse>(`/club/seasons/${id}`, { method: 'DELETE', token, signal });
}
