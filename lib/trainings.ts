import { MONTHS } from '@/components/trainings/training-form';
import type { ApiTraining } from '@/lib/api/types';

/**
 * The squad size a session's turnout is measured against. The trainings API
 * carries no squad total, so the design's fixed 24 stands in for it.
 */
export const SQUAD_SIZE = 24;

/** One row of the training list, as the list screen renders it. */
export type TrainingRow = {
  id?: number;
  date: string;
  time: string;
  type: string;
  field: string;
  duration: string;
  presence: string;
  status: 'Prezenca u regjistrua' | 'Pret regjistrim';
  team?: string;
};

/** One line of a session's attendance, as its own page renders it. */
export type AttendanceRow = {
  playerId: number;
  name: string;
  nr: string;
  pos: string;
  status: AttendanceStatus;
};

export type AttendanceStatus = 'Prezent' | 'Mungon' | 'Papërcaktuar';

/** API `type` → the Albanian label the list and its colour map use. */
const TYPE_SQ: Record<string, string> = {
  regular: 'Rregullt',
  tactical: 'Taktike',
  physical: 'Fizike',
  recovery: 'Rikuperim',
};

/** API attendance `status` → the Albanian label. */
const ATTENDANCE_SQ: Record<string, AttendanceStatus> = {
  present: 'Prezent',
  absent: 'Mungon',
  unconfirmed: 'Papërcaktuar',
};

const pad2 = (n: number) => String(n).padStart(2, '0');

/** `2026-08-18T17:00:00Z` → `18 Aug 2026` — the trainings list's date format. */
export function trainingDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** `2026-08-18T17:00:00Z` → `17:00`. */
export function trainingTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** API `type` → Albanian, falling back to whatever the API sent. */
export function typeName(type: string | null | undefined): string {
  if (!type) return '—';
  return TYPE_SQ[type] ?? type;
}

/** Minutes as the screens show them: `90 min`, or the placeholder when absent. */
export function durationLabel(minutes: number | null | undefined): string {
  return minutes != null ? `${minutes} min` : '—';
}

/** API attendance `status` → the label the player's own screens show. A status
 *  that is not one of the two settled ones reads as the placeholder, which the
 *  training detail then spells out as "not yet finalized". */
export function attendanceLabel(status: string | null | undefined): string {
  if (status === 'present') return 'Prezent';
  if (status === 'absent') return 'Mungesë';
  return '—';
}

export function toTrainingRow(t: ApiTraining): TrainingRow {
  return {
    id: t.id,
    date: trainingDate(t.scheduled_at),
    time: trainingTime(t.scheduled_at),
    type: typeName(t.type),
    field: t.field ?? '—',
    duration: durationLabel(t.duration_minutes),
    presence: `${t.present_count ?? 0} /${SQUAD_SIZE}`,
    status: t.attendance_finalized ? 'Prezenca u regjistrua' : 'Pret regjistrim',
    team: t.team?.name,
  };
}

export function toAttendanceRows(t: ApiTraining): AttendanceRow[] {
  return (t.attendances ?? []).map((a) => ({
    playerId: a.player_id,
    name: a.player_name ?? '—',
    /* The API carries no shirt number or position on an attendance line. */
    nr: '—',
    pos: '—',
    status: ATTENDANCE_SQ[a.status] ?? 'Papërcaktuar',
  }));
}
