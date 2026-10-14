/**
 * Albanian labels for the backend's `position` codes (config/positions.php).
 * The API returns the raw code, so clients format the label themselves.
 */
const POSITION_LABELS: Record<string, string> = {
  PO: 'Portier',
  BDJ: 'Bek Djathtas',
  QBM: 'Qendërmbrojtës',
  BSI: 'Bek Sinistër',
  MMB: 'Mesfushor Mbrojtës',
  MQ: 'Mesfushor Qendror',
  MO: 'Mesfushor Ofensiv',
  KDJ: 'Krahësor Djathtas',
  KSI: 'Krahësor Sinistër',
  SU: 'Sulmues',
  SS: 'Sulmues i Dytë',
};

/** Every position as `{ code, label }`, in display order. */
export const POSITIONS: { code: string; label: string }[] = Object.entries(POSITION_LABELS).map(
  ([code, label]) => ({ code, label }),
);

/** A position code → Albanian label; an unknown/absent code falls through. */
export function positionLabel(code: string | null): string {
  if (!code) return '—';
  return POSITION_LABELS[code] ?? code;
}
