import { request } from '@/lib/api/client';
import type { DashboardStats } from '@/lib/api/types';

export function dashboardStats(token: string, signal?: AbortSignal) {
  return request<DashboardStats>('/dashboard/stats', { token, signal });
}
