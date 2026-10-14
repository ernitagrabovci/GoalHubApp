import type { ApiInjury } from '@/lib/api/types';

/** One row of the medical log, as the medical screens render it. */
export type InjuryRow = {
  id: number;
  name: string;
  team: string;
  type: string;
  date: string;
  returnDate: string;
  status: string;
  during: string;
  serviceDate: string;
  desc: string;
  treatment: string;
};

/** API `status` → the Albanian label the log and its colour map use. */
const STATUS_SQ: Record<string, string> = {
  injured: 'I lënduar',
  rehabilitation: 'Në rehabilitim',
  recovered: 'I shëruar',
};

/** API `occurred_during` → the Albanian label. */
const DURING_SQ: Record<string, string> = {
  training: 'Stërvitje',
  match: 'Ndeshje',
  other: 'Tjetër',
};

/** `2026-08-18T00:00:00Z` → `18/08/2026` — the medical log's date format. */
export function shortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function statusSq(status: string | null | undefined): string {
  if (!status) return '—';
  return STATUS_SQ[status] ?? status;
}

function duringSq(during: string | null | undefined): string {
  if (!during) return '—';
  return DURING_SQ[during] ?? during;
}

export function toInjuryRow(inj: ApiInjury): InjuryRow {
  return {
    id: inj.id,
    name: inj.player?.name ?? '—',
    team: inj.team?.name ?? '—',
    type: inj.injury_type || '—',
    date: shortDate(inj.injury_date),
    returnDate: shortDate(inj.expected_return),
    status: statusSq(inj.status),
    during: duringSq(inj.occurred_during),
    serviceDate: shortDate(inj.created_at),
    desc: inj.description ?? '',
    treatment: inj.treatment ?? '',
  };
}
