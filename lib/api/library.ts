import { request } from '@/lib/api/client';
import type {
  ApiTrainingMaterial,
  LibraryInput,
  MessageResponse,
  MutationResponse,
  TrainingLibraryResponse,
} from '@/lib/api/types';
import { buildUploadForm, type PickedFile } from '@/lib/api/upload';

export type LibraryListParams = {
  page?: number;
  /** The level as stored on the record (`beginner`, `intermediate`, `advanced`). */
  level?: string;
  /** The exact category label as stored on the record. */
  category?: string;
  search?: string;
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

/** The coaching library — the caller's own material plus shared items. */
export function listLibrary(
  token: string,
  params: LibraryListParams = {},
  signal?: AbortSignal,
) {
  const query = toQuery({
    page: params.page,
    level: params.level,
    category: params.category,
    search: params.search,
  });
  return request<TrainingLibraryResponse>(`/library${query}`, { token, signal });
}

/**
 * Add a library item, optionally attaching a file. The request goes out as
 * multipart when a file is present, JSON otherwise.
 */
export function createLibrary(
  token: string,
  input: LibraryInput,
  file?: PickedFile | null,
  signal?: AbortSignal,
) {
  const body = file
    ? buildUploadForm(
        {
          title: input.title,
          level: input.level,
          category: input.category,
          description: input.description,
          shared_team_id: input.shared_team_id,
        },
        file,
      )
    : input;

  return request<MutationResponse<ApiTrainingMaterial>>('/library', {
    method: 'POST',
    body,
    token,
    signal,
  });
}

/** Edit a library item's metadata (the file itself is immutable). */
export function updateLibrary(
  token: string,
  id: number,
  input: LibraryInput,
  signal?: AbortSignal,
) {
  return request<MutationResponse<ApiTrainingMaterial>>(`/library/${id}`, {
    method: 'PATCH',
    body: input,
    token,
    signal,
  });
}

export function deleteLibrary(token: string, id: number, signal?: AbortSignal) {
  return request<MessageResponse>(`/library/${id}`, { method: 'DELETE', token, signal });
}
