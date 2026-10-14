/**
 * Albanian labels for the backend's `health_status` enum, shared by the
 * players list and a team's roster. An unrecognised value falls back to the
 * raw string so it never renders blank.
 */
const STATUS_LABELS: Record<string, string> = {
  active: 'Aktiv',
  injured: 'I lënduar',
  rehabilitation: 'Rehab',
  suspended: 'I pezulluar',
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}
