/**
 * Shared finance formatting. The financier screens all speak the same three
 * status colours and the same handful of shapes, so they live here rather than
 * being copied into each page (the way `lib/trainings.ts` serves the trainings
 * cluster).
 */

/** Green for what is settled, amber for what is owed, red for what is late. */
export const STATUS_TONE: Record<string, string> = {
  Paguar: '#159447',
  Papaguar: '#E4A000',
  Skaduar: '#E03131',
};

/** Backend fee status → the Albanian label the tones are keyed on. */
export const STATUS_LABEL: Record<string, string> = {
  paid: 'Paguar',
  unpaid: 'Papaguar',
  overdue: 'Skaduar',
};

export function statusLabel(status: string): string {
  return STATUS_LABEL[status] ?? status;
}

/** Unpaid first, then the overdue, then everything already settled. */
const RANK: Record<string, number> = { unpaid: 0, overdue: 1, paid: 2 };

export function statusRank(status: string): number {
  return RANK[status] ?? 3;
}

const MONTHS = [
  'Janar',
  'Shkurt',
  'Mars',
  'Prill',
  'Maj',
  'Qershor',
  'Korrik',
  'Gusht',
  'Shtator',
  'Tetor',
  'Nëntor',
  'Dhjetor',
];

/** 16840 → `€16,840` — grouped thousands, no cents. */
export function usd(n: number): string {
  return `€${Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/** The leading `YYYY-MM-DD` of an ISO date, or `null` when it is unusable. */
function dateParts(iso: string | null | undefined): [number, number, number] | null {
  if (!iso) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/** `2027-01-10` → `10/01/2027`; null/invalid → `—`. */
export function dmy(iso: string | null | undefined): string {
  const p = dateParts(iso);
  if (!p) return '—';
  const [y, m, d] = p;
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

/** `2027-01-01` → `Janar 2027`; null/invalid → `—`. */
export function monthLabel(iso: string | null | undefined): string {
  const p = dateParts(iso);
  if (!p) return '—';
  const [y, m] = p;
  return `${MONTHS[m - 1]} ${y}`;
}

/** Backend payment method → the Albanian label the tables show. */
const PAY_METHOD: Record<string, string> = {
  cash: 'Kesh',
  bank_transfer: 'Transfer bankar',
  card: 'Kartë bankare',
};

/** `cash` → `Kesh`; null/unknown → `—`. */
export function payMethod(method: string | null | undefined): string {
  if (!method) return '—';
  return PAY_METHOD[method] ?? method;
}
