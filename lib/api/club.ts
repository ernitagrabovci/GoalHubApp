import { request } from '@/lib/api/client';
import type { ApiClubProfile, ApiSeason, ApiTrainingField } from '@/lib/api/types';

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
