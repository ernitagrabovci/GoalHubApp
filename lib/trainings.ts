import {
  MONTHS,
  type Booking,
  type TrainingDraft,
} from '@/components/trainings/training-form';
import type { ApiTraining, TrainingInput } from '@/lib/api/types';

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

/** The Albanian label → API `type` code — the inverse of `typeName`. */
export function typeCode(label: string | null | undefined): string {
  const entry = Object.entries(TYPE_SQ).find(([, sq]) => sq === label);
  return entry ? entry[0] : 'regular';
}

/** The form's draft → the API's training payload. */
export function draftToInput(d: TrainingDraft): TrainingInput {
  return {
    type: typeCode(d.type),
    field: d.field || null,
    scheduled_at: `${d.year}-${d.month}-${d.day} ${d.hour}:${d.minute}:00`,
    duration_minutes: Number(d.duration) || 90,
    notes: d.note.trim() || null,
  };
}

/** A loaded session → the slot the form's availability check understands. */
export function toBooking(t: ApiTraining): Booking | null {
  if (!t.scheduled_at) return null;
  const d = new Date(t.scheduled_at);
  if (Number.isNaN(d.getTime())) return null;
  return {
    field: t.field ?? '',
    year: String(d.getFullYear()),
    day: pad2(d.getDate()),
    mon: pad2(d.getMonth() + 1),
    start: `${pad2(d.getHours())}:${pad2(d.getMinutes())}`,
    minutes: t.duration_minutes ?? 90,
  };
}

/** The distinct pitch names across the loaded sessions. */
export function fieldNames(trainings: ApiTraining[]): string[] {
  const names = new Set<string>();
  for (const t of trainings) if (t.field) names.add(t.field);
  return [...names].sort((a, b) => a.localeCompare(b));
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
