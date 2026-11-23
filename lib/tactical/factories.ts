import { DEFAULT_META, type BoardDoc, type BoardMeta, type Team } from '@/lib/tactical/types';

let seq = 0;

/** A stable, collision-resistant key for a new board object. */
export function nextObjectId(): string {
  seq += 1;
  return `kf${Date.now().toString(36)}${seq.toString(36)}`;
}

export function teamColor(team: Team | undefined): string | undefined {
  if (team === 'home') return '#FF1717';
  if (team === 'away') return '#1677FF';
  if (team === 'gk') return '#FFE600';
  return undefined;
}

export function createEmptyDoc(meta: Partial<BoardMeta> = {}): BoardDoc {
  return {
    version: '1.0',
    pitchMode: 'full',
    objects: [],
    phases: [{ id: 'p1', label: 'Faza 1', duration: 3000, state: {} }],
    movements: {},
    meta: { ...DEFAULT_META, ...meta },
    webExtras: {},
  };
}
