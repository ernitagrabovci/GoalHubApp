import { request } from '@/lib/api/client';
import type { ApiFee, FinanceStats, Paginated, PlayerPeriods } from '@/lib/api/types';

export type FeeListParams = {
  page?: number;
  team_id?: number;
  status?: 'paid' | 'unpaid' | 'overdue';
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

export function financeStats(token: string, signal?: AbortSignal) {
  return request<FinanceStats>('/finance/stats', { token, signal });
}

export function listFees(token: string, params: FeeListParams = {}, signal?: AbortSignal) {
  const query = toQuery({
    page: params.page,
    team_id: params.team_id,
    status: params.status,
    search: params.search?.trim() || undefined,
  });
  return request<Paginated<ApiFee>>(`/finance/fees${query}`, { token, signal });
}

/** A player's outstanding and upcoming periods, for the register dialog. */
export function playerUnpaidPeriods(token: string, playerId: number, signal?: AbortSignal) {
  return request<PlayerPeriods>(`/finance/players/${playerId}/unpaid`, { token, signal });
}

export type RegisterPaymentInput = {
  player_id: number;
  /** Existing unpaid/overdue fee rows to settle. */
  fee_ids?: number[];
  /** Future periods (`"YYYY-MM-DD|YYYY-MM-DD"`) to create and settle at once. */
  new_periods?: string[];
  /** `YYYY-MM-DD`, no later than today. */
  paid_at: string;
  payment_method: 'cash' | 'bank_transfer' | 'card';
  invoice_number?: string;
};

export function registerPayment(token: string, input: RegisterPaymentInput, signal?: AbortSignal) {
  return request<{ message: string; count: number }>('/finance/payments', {
    method: 'POST',
    token,
    body: input,
    signal,
  });
}
