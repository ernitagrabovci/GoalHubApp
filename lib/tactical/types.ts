/**
 * The tactical board document. Everything positional is stored normalized to
 * the pitch (0..1 across 105m × 68m), so the same drill renders correctly at
 * any screen size, in half-pitch view, and after a device rotation.
 */

export type Vec2 = { x: number; y: number };

export type PitchMode = 'full' | 'half';

export type Team = 'home' | 'away' | 'gk';

export type ObjKind =
  | 'player'
  | 'gk'
  | 'ball'
  | 'cone'
  | 'coneSmall'
  | 'arrow'
  | 'line'
  | 'zone'
  | 'text';

export type Tool =
  | 'select'
  | 'animate'
  | 'home'
  | 'away'
  | 'gk'
  | 'cone'
  | 'coneSmall'
  | 'ball'
  | 'text'
  | 'move'
  | 'pass'
  | 'line'
  | 'zone';

export type BoardObject = {
  /** Stable key used by phases and movement tracks. */
  id: string;
  kfId: string;
  kind: ObjKind;
  team?: Team;
  number?: number;
  text?: string;
  /** Overrides the team/default colour when the trainer picks one. */
  color?: string;
  /** Normalized anchor: centre for tokens, start point for lines, top-left for zones. */
  anchor: Vec2;
  /** Normalized offset for arrows/lines (end = anchor + d). */
  dx?: number;
  dy?: number;
  /** Normalized size for zones. */
  w?: number;
  h?: number;
  style?: 'solid' | 'dashed';
  /** True when the object was created in the mobile app. */
  native?: boolean;
  /** The original Fabric.js object, kept for a lossless round-trip. */
  raw?: Record<string, unknown>;
};

export type PhaseStateEntry = {
  x: number;
  y: number;
  visible: boolean;
  /** Preserved from web data for shapes that carry rotation/scale. */
  angle?: number;
  scaleX?: number;
  scaleY?: number;
};

export type Phase = {
  id: string;
  label: string;
  /** Milliseconds at 1× playback speed. */
  duration: number;
  /** Object id → anchor in this phase. */
  state: Record<string, PhaseStateEntry>;
  /** Unknown phase keys from web data, preserved on save. */
  extra?: Record<string, unknown>;
};

export type MovementTrack = {
  objectId: string;
  frames: Vec2[];
  speed?: number;
  /** Seconds to wait before this object starts moving. */
  startDelay?: number;
  /** Optional real-world speed in m/s (used by the web editor). */
  playerSpeed?: number;
  /** Fabric-only movement fields (ctrlPts, ballFollow, …) preserved on save. */
  extra?: Record<string, unknown>;
};

/** Phase index → object id → movement. */
export type MovementMap = Record<number, Record<string, MovementTrack>>;

export type BoardMeta = {
  title: string;
  description: string;
  category: string;
  minutes: number | null;
  reps: number | null;
  difficulty: string;
};

export type BoardDoc = {
  version: '1.0';
  pitchMode: PitchMode;
  objects: BoardObject[];
  phases: Phase[];
  movements: MovementMap;
  meta: BoardMeta;
  /** Unknown top-level keys from web/AI data, preserved on save. */
  webExtras: Record<string, unknown>;
};

export type CategoryOption = { value: string; label: string };

export const CATEGORIES: CategoryOption[] = [
  { value: '', label: '— Zgjidh —' },
  { value: 'passing', label: 'Pasim' },
  { value: 'shooting', label: 'Goditje' },
  { value: 'dribbling', label: 'Dribling' },
  { value: 'defense', label: 'Mbrojtje' },
  { value: 'fitness', label: 'Fizik' },
  { value: 'possession', label: 'Topmbajtje' },
  { value: 'coordination', label: 'Koordinim' },
  { value: 'other', label: 'Tjetër' },
];

export const DIFFICULTIES = ['Fillestar', 'Mesatar', 'Avancuar'] as const;

export const DEFAULT_META: BoardMeta = {
  title: '',
  description: '',
  category: '',
  minutes: 10,
  reps: 5,
  difficulty: 'Mesatar',
};
