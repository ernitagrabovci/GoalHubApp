import { request } from '@/lib/api/client';
import type {
  ApiFee,
  FinanceReports,
  FinanceStats,
  Paginated,
  PlayerPeriods,
} from '@/lib/api/types';
import { buildUploadForm, type PickedFile } from '@/lib/api/upload';

export type FeeListParams = {
  page?: number;
  player_id?: number;
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
    player_id: params.player_id,
    team_id: params.team_id,
    status: params.status,
    search: params.search?.trim() || undefined,
  });
  return request<Paginated<ApiFee>>(`/finance/fees${query}`, { token, signal });
}

export function financeReports(token: string, signal?: AbortSignal) {
  return request<FinanceReports>('/finance/reports', { token, signal });
}

/** One fee, from `GET /finance/fees/{id}` — wrapped in `{data}`. */
export function getFee(token: string, id: number, signal?: AbortSignal) {
  return request<{ data: ApiFee }>(`/finance/fees/${id}`, { token, signal });
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

/**
 * Settles one or more fees / future periods. When a `document` is attached the
 * request goes out as multipart (the backend accepts pdf/jpg/jpeg/png, ≤5 MB,
 * under the `document` field); otherwise it stays a plain JSON POST.
 */
export function registerPayment(
  token: string,
  input: RegisterPaymentInput,
  document?: PickedFile | null,
  signal?: AbortSignal
) {
  if (document) {
    const form = buildUploadForm(
      {
        player_id: input.player_id,
        fee_ids: input.fee_ids,
        new_periods: input.new_periods,
        paid_at: input.paid_at,
        payment_method: input.payment_method,
        invoice_number: input.invoice_number,
      },
      document,
      'document'
    );
    return request<{ message: string; count: number }>('/finance/payments', {
      method: 'POST',
      token,
      body: form,
      signal,
    });
  }

  return request<{ message: string; count: number }>('/finance/payments', {
    method: 'POST',
    token,
    body: input,
    signal,
  });
}
