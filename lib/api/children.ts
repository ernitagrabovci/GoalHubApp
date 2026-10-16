import { request } from '@/lib/api/client';
import type {
  ApiChildAttendance,
  ApiChildRating,
  ApiFee,
  ApiInjury,
  ApiMatch,
  ApiTraining,
  ChildrenResponse,
  ChildResponse,
  Paginated,
} from '@/lib/api/types';

/** Builds `?a=1&b=2`, dropping undefined/empty values. */
function toQuery(params: Record<string, string | number | undefined>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

/** The signed-in parent's children, plus the family totals for the home cards. */
export function listMyChildren(token: string, signal?: AbortSignal) {
  return request<ChildrenResponse>('/my/children', { token, signal });
}

/** One child's player record plus the dashboard summary block. */
export function getChild(token: string, childId: number, signal?: AbortSignal) {
  return request<ChildResponse>(`/my/children/${childId}`, { token, signal });
}

/** A child's team's training sessions, each with the child's own attendance. */
export function listChildTrainings(
  token: string,
  childId: number,
  params: { page?: number; status?: string } = {},
  signal?: AbortSignal,
) {
  const query = toQuery({ page: params.page, status: params.status });
  return request<Paginated<ApiTraining>>(`/my/children/${childId}/trainings${query}`, {
    token,
    signal,
  });
}

/** A child's team's fixtures. */
export function listChildMatches(
  token: string,
  childId: number,
  params: { page?: number; status?: string } = {},
  signal?: AbortSignal,
) {
  const query = toQuery({ page: params.page, status: params.status });
  return request<Paginated<ApiMatch>>(`/my/children/${childId}/matches${query}`, { token, signal });
}

/** A child's attendance history. */
export function listChildAttendance(
  token: string,
  childId: number,
  params: { page?: number } = {},
  signal?: AbortSignal,
) {
  const query = toQuery({ page: params.page });
  return request<Paginated<ApiChildAttendance>>(`/my/children/${childId}/attendance${query}`, {
    token,
    signal,
  });
}

/** A child's coach ratings. */
export function listChildRatings(
  token: string,
  childId: number,
  params: { page?: number } = {},
  signal?: AbortSignal,
) {
  const query = toQuery({ page: params.page });
  return request<Paginated<ApiChildRating>>(`/my/children/${childId}/ratings${query}`, {
    token,
    signal,
  });
}

/** A child's membership fees. */
export function listChildFees(
  token: string,
  childId: number,
  params: { page?: number } = {},
  signal?: AbortSignal,
) {
  const query = toQuery({ page: params.page });
  return request<Paginated<ApiFee>>(`/my/children/${childId}/fees${query}`, { token, signal });
}

/** A child's injury history. */
export function listChildInjuries(
  token: string,
  childId: number,
  params: { page?: number } = {},
  signal?: AbortSignal,
) {
  const query = toQuery({ page: params.page });
  return request<Paginated<ApiInjury>>(`/my/children/${childId}/injuries${query}`, { token, signal });
}
