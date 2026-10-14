/**
 * Albanian labels for the injuries table's enums. `health_status` on a player
 * uses a different wording, so this stays separate from `player-status.ts`.
 */
const INJURY_STATUS_LABELS: Record<string, string> = {
  injured: 'I lënduar',
  rehabilitation: 'Në rehabilitim',
  recovered: 'I shëruar',
};

const OCCURRED_DURING_LABELS: Record<string, string> = {
  training: 'Stërvitje',
  match: 'Ndeshje',
  other: 'Tjetër',
};

/** An injury `status` → Albanian label; an unknown value falls through. */
export function injuryStatusLabel(status: string): string {
  return INJURY_STATUS_LABELS[status] ?? status;
}

/** Where the injury happened; absent/unrecognised → a dash. */
export function occurredLabel(value: string | null): string {
  if (!value) return '—';
  return OCCURRED_DURING_LABELS[value] ?? value;
}
