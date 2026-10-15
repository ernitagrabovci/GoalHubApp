import { request } from '@/lib/api/client';
import type { TrainingLibraryResponse } from '@/lib/api/types';

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
