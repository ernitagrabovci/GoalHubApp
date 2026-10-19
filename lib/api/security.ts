import { request } from '@/lib/api/client';
import type { SecuritySessionsResponse } from '@/lib/api/types';

/** The caller's current session metadata plus their personal access tokens. */
export function getSecuritySessions(token: string, signal?: AbortSignal) {
  return request<SecuritySessionsResponse>('/security/sessions', { token, signal });
}
