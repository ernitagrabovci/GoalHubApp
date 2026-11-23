import {
  PITCH_PX_H,
  PITCH_PX_W,
  canvasToNorm,
  normToCanvasX,
  normToCanvasY,
} from '@/lib/tactical/geometry';
import { createEmptyDoc } from '@/lib/tactical/factories';
import type {
  BoardDoc,
  BoardMeta,
  BoardObject,
  MovementMap,
  MovementTrack,
  Phase,
  PhaseStateEntry,
  Team,
  Vec2,
} from '@/lib/tactical/types';

/**
 * The web editor stores the board as Fabric.js 5.3 JSON in `drill.data`:
 * `{ version, objects, phases, phaseMovements }` with canvas-pixel coordinates
 * (800×560 canvas, 25px pad). The mobile board keeps everything normalized;
 * this module converts both ways and preserves every Fabric property it does
 * not understand so a web-created drill survives a mobile edit.
 */

type Raw = Record<string, unknown>;
type WebTeam = 'red' | 'blue' | 'yellow';

const BASE = {
  version: '5.3.0',
  scaleX: 1,
  scaleY: 1,
  angle: 0,
  visible: true,
  opacity: 1,
} as const;

const PLAYER_PALETTE: Record<WebTeam, { j: string; s: string; t: string }> = {
  red: { j: '#e24b4a', s: '#8b1a1a', t: '#c0392b' },
  blue: { j: '#185fa5', s: '#0d3d7a', t: '#0d3d7a' },
  yellow: { j: '#f5a623', s: '#5a3e00', t: '#b7860b' },
};

const TEAM_TO_WEB: Record<Team, WebTeam> = { home: 'red', away: 'blue', gk: 'yellow' };

const SHIRT = [
  ['M', -6, -5], ['L', -12, -1], ['L', -13, 8], ['L', -9, 9], ['L', -6, 13],
  ['L', 6, 13], ['L', 9, 9], ['L', 13, 8], ['L', 12, -1], ['L', 6, -5],
  ['Q', 4, -7, 2.5, -9], ['A', 3, 3, 0, 0, 0, -2.5, -9], ['Q', -4, -7, -6, -5],
  ['Z'],
];

const SHORTS = [
  ['M', -8, 13], ['L', -9, 23], ['L', -2, 23], ['L', -2, 17], ['L', 2, 17],
  ['L', 2, 23], ['L', 9, 23], ['L', 8, 13], ['Z'],
];

function asRaw(value: unknown): Raw | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Raw)
    : null;
}

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function withAlpha(color: string, alpha: string): string {
  return /^#[0-9a-f]{6}$/i.test(color) ? `${color}${alpha}` : color;
}

/* ────────────────────────────── import ────────────────────────────── */

export function importBoardData(rawData: unknown, meta: Partial<BoardMeta> = {}): BoardDoc {
  let data: Raw | null = null;
  try {
    data = typeof rawData === 'string' ? asRaw(JSON.parse(rawData)) : asRaw(rawData);
  } catch {
    data = null;
  }

  const doc = createEmptyDoc(meta);
  if (!data) return doc;

  const objects: BoardObject[] = [];
  const unsupported: unknown[] = [];
  for (const item of list(data.objects)) {
    const raw = asRaw(item);
    if (!raw) continue;
    const result = importObject(raw);
    if (result === 'unsupported') unsupported.push(raw);
    else if (result) objects.push(result);
  }

  const rawPhases =
    Array.isArray(data.phases) && data.phases.length
      ? list(data.phases)
      : list(data.keyframes);
  const phases = rawPhases.length
    ? rawPhases.map((p, i) => importPhase(p, i))
    : doc.phases;

  const extras: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (['version', 'objects', 'phases', 'phaseMovements', 'keyframes'].includes(key)) continue;
    extras[key] = value;
  }

  if (unsupported.length) extras.__unsupported = unsupported;

  // `difficulty` has no API column, so the mobile app keeps it inside the board JSON.
  const difficulty = str((asRaw(data.mobileMeta) ?? {}).difficulty);

  return {
    ...doc,
    objects,
    phases,
    movements: importMovements(data.phaseMovements),
    meta: difficulty ? { ...doc.meta, difficulty } : doc.meta,
    webExtras: extras,
  };
}

function importObject(raw: Raw): BoardObject | 'unsupported' | null {
  const type = str(raw._type) ?? str(raw.type) ?? '';
  if (type === 'drag-line' || type === 'ctrl-point' || type === 'ghost') return null;

  const kfId = str(raw._kfId);
  if (!kfId) return 'unsupported';

  const anchor = canvasToNorm(num(raw.left), num(raw.top));
  const base = { id: kfId, kfId, anchor, raw };

  switch (type) {
    case 'player': {
      const rawTeam = str(raw._team);
      const team: Team =
        rawTeam === 'blue' ? 'away' : rawTeam === 'yellow' ? 'gk' : 'home';
      const number = typeof raw._num === 'number' ? raw._num : undefined;
      return { ...base, kind: team === 'gk' ? 'gk' : 'player', team, number };
    }
    case 'ball':
      return { ...base, kind: 'ball' };
    case 'cone':
      return { ...base, kind: 'cone' };
    case 'cone-small':
      return { ...base, kind: 'coneSmall' };
    case 'line':
    case 'arrow': {
      const radians = (num(raw.angle) * Math.PI) / 180;
      const width = Math.max(0, num(raw.width));
      const length = type === 'arrow' ? width + 2 : width;
      return {
        ...base,
        kind: type,
        dx: (Math.cos(radians) * length) / PITCH_PX_W,
        dy: (Math.sin(radians) * length) / PITCH_PX_H,
        style: str(raw._style) === 'dashed' ? 'dashed' : 'solid',
        color: str(raw._color) ?? '#FFFFFF',
      };
    }
    case 'zone': {
      const child = asRaw(list(raw.objects)[0]);
      return {
        ...base,
        kind: 'zone',
        w: Math.max(0, num(raw.width) - 2) / PITCH_PX_W,
        h: Math.max(0, num(raw.height) - 2) / PITCH_PX_H,
        color: str(child?.stroke) ?? str(raw._color) ?? '#FFFFFF',
      };
    }
    case 'defense-line':
      return {
        ...base,
        kind: 'line',
        dx: 0,
        dy: 1,
        style: 'dashed',
        color: str(raw._color) ?? '#F5A623',
      };
    case 'text':
      return {
        ...base,
        kind: 'text',
        text: str(raw.text) ?? 'Tekst',
        color: str(raw.fill) ?? '#FFFFFF',
      };
    default:
      return importLegacyPrimitive(raw, base, type);
  }
}

/** Fabric-only primitives from older data that map onto existing tools. */
function importLegacyPrimitive(
  raw: Raw,
  base: { id: string; kfId: string; anchor: Vec2; raw: Raw },
  type: string,
): BoardObject | 'unsupported' | null {
  if (type === 'i-text' || type === 'textbox') {
    return {
      ...base,
      kind: 'text',
      text: str(raw.text) ?? 'Tekst',
      color: str(raw.fill) ?? '#FFFFFF',
    };
  }

  if (type === 'rect' || type === 'ellipse') {
    return {
      ...base,
      kind: 'zone',
      w: Math.max(0, num(raw.width)) / PITCH_PX_W,
      h: Math.max(0, num(raw.height)) / PITCH_PX_H,
      color: str(raw.stroke) ?? '#FFFFFF',
    };
  }

  if (type === 'line') {
    const x1 = num(raw.x1);
    const y1 = num(raw.y1);
    const x2 = num(raw.x2);
    const y2 = num(raw.y2);
    return {
      ...base,
      anchor: canvasToNorm(x1, y1),
      kind: 'line',
      dx: (x2 - x1) / PITCH_PX_W,
      dy: (y2 - y1) / PITCH_PX_H,
      color: str(raw.stroke) ?? '#FFFFFF',
    };
  }

  return 'unsupported';
}

function importPhase(item: unknown, index: number): Phase {
  const raw = asRaw(item) ?? {};
  const source = asRaw(raw.state) ?? {};
  const state: Record<string, PhaseStateEntry> = {};

  for (const [id, value] of Object.entries(source)) {
    const entry = asRaw(value);
    if (!entry) continue;
    const point = canvasToNorm(num(entry.left), num(entry.top));
    state[id] = {
      ...point,
      visible: entry.visible !== false,
      angle: num(entry.angle),
      scaleX: num(entry.scaleX, 1),
      scaleY: num(entry.scaleY, 1),
    };
  }

  const extra: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (['id', 'label', 'duration', 'state'].includes(key)) continue;
    extra[key] = value;
  }

  return {
    id: str(raw.id) ?? `p${index + 1}`,
    label: str(raw.label) ?? `Faza ${index + 1}`,
    duration: Math.max(160, num(raw.duration, 3000)),
    state,
    extra: Object.keys(extra).length ? extra : undefined,
  };
}

function importMovements(source: unknown): MovementMap {
  const out: MovementMap = {};
  const map = asRaw(source);
  if (!map) return out;

  for (const [key, value] of Object.entries(map)) {
    const index = Number(key);
    if (!Number.isInteger(index) || index < 0) continue;
    const tracksRaw = asRaw(value);
    if (!tracksRaw) continue;

    const tracks: Record<string, MovementTrack> = {};
    for (const [id, trackValue] of Object.entries(tracksRaw)) {
      const trackRaw = asRaw(trackValue);
      const framesRaw = Array.isArray(trackValue)
        ? trackValue
        : list(trackRaw?.frames);
      const frames: Vec2[] = [];

      for (const frame of framesRaw) {
        const f = asRaw(frame);
        if (!f) continue;
        frames.push(canvasToNorm(num(f.left), num(f.top)));
      }
      if (!frames.length) continue;

      const track: MovementTrack = { objectId: id, frames };
      if (trackRaw) {
        if (typeof trackRaw.speed === 'number') track.speed = trackRaw.speed;
        if (typeof trackRaw.startDelay === 'number') track.startDelay = trackRaw.startDelay;
        if (typeof trackRaw.playerSpeed === 'number') track.playerSpeed = trackRaw.playerSpeed;

        const extra: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(trackRaw)) {
          if (['frames', 'speed', 'startDelay', 'playerSpeed'].includes(k)) continue;
          extra[k] = v;
        }
        if (Object.keys(extra).length) track.extra = extra;
      }
      tracks[id] = track;
    }

    if (Object.keys(tracks).length) out[index] = tracks;
  }

  return out;
}

/* ────────────────────────────── export ────────────────────────────── */

export function exportBoardData(doc: BoardDoc): string {
  const unsupported = list(doc.webExtras.__unsupported);
  const objects = [...doc.objects.map(exportObject), ...unsupported];

  const extras: Record<string, unknown> = { ...doc.webExtras };
  delete extras.__unsupported;

  return JSON.stringify({
    ...extras,
    version: '1.0',
    objects,
    phases: doc.phases.map(exportPhase),
    phaseMovements: exportMovements(doc.movements),
    mobileMeta: { difficulty: doc.meta.difficulty },
  });
}

function exportObject(object: BoardObject): Raw {
  if (!object.raw) return buildNative(object);

  const base = clone(object.raw);
  base.left = normToCanvasX(object.anchor.x);
  base.top = normToCanvasY(object.anchor.y);
  base._kfId = object.kfId;
  patchLoaded(base, object);
  return base;
}

function exportPhase(phase: Phase): Raw {
  const state: Record<string, Raw> = {};
  for (const [id, entry] of Object.entries(phase.state)) {
    state[id] = {
      left: normToCanvasX(entry.x),
      top: normToCanvasY(entry.y),
      angle: entry.angle ?? 0,
      scaleX: entry.scaleX ?? 1,
      scaleY: entry.scaleY ?? 1,
      visible: entry.visible !== false,
    };
  }

  return {
    ...(phase.extra ?? {}),
    id: phase.id,
    label: phase.label,
    duration: phase.duration,
    state,
  };
}

function exportMovements(movements: MovementMap): Raw {
  const out: Raw = {};

  for (const [index, tracks] of Object.entries(movements)) {
    const map: Raw = {};
    for (const [id, track] of Object.entries(tracks)) {
      if (!track.frames.length) continue;
      const entry: Raw = { ...(track.extra ?? {}) };
      entry.frames = track.frames.map((f) => ({
        left: normToCanvasX(f.x),
        top: normToCanvasY(f.y),
      }));
      if (track.speed != null) entry.speed = track.speed;
      if (track.startDelay != null) entry.startDelay = track.startDelay;
      if (track.playerSpeed != null) entry.playerSpeed = track.playerSpeed;
      map[id] = entry;
    }
    if (Object.keys(map).length) out[index] = map;
  }

  return out;
}

/** Patches trainer-editable properties back into a preserved Fabric object. */
function patchLoaded(base: Raw, object: BoardObject) {
  base._kfId = object.kfId;
  const kids = list(base.objects).map(asRaw);

  if (object.kind === 'player' || object.kind === 'gk') {
    const team: Team = object.kind === 'gk' ? 'gk' : object.team ?? 'home';
    const webTeam = TEAM_TO_WEB[team];
    const palette = PLAYER_PALETTE[webTeam];
    base._type = 'player';
    base._team = webTeam;
    if (object.number != null) base._num = object.number;

    const shirt = kids[0];
    if (shirt) {
      shirt.fill = object.color ?? palette.j;
      shirt.stroke = object.color ?? palette.t;
    }
    const shorts = kids[1];
    if (shorts) {
      shorts.fill = palette.s;
      shorts.stroke = palette.t;
    }
    const label = kids.find((k) => k && (k.type === 'text' || k.type === 'i-text'));
    if (label && object.number != null) {
      label.text = String(object.number);
      label.fontSize = object.number > 9 ? 10 : 14;
    }
    return;
  }

  if (object.kind === 'text') {
    base.text = object.text ?? '';
    if (object.color) base.fill = object.color;
    return;
  }

  if (object.kind === 'arrow' || object.kind === 'line' || object.kind === 'zone') {
    const color = object.color ?? '#FFFFFF';
    base._color = color;
    if (object.kind === 'arrow') base._style = object.style ?? 'solid';

    for (const child of kids) {
      if (!child) continue;
      if (child.type === 'line') {
        child.stroke = color;
        child.strokeDashArray =
          object.kind === 'arrow' && object.style === 'dashed' ? [6, 4] : [];
      } else if (child.type === 'triangle') {
        child.fill = color;
      } else if (child.type === 'rect' || child.type === 'ellipse') {
        child.stroke = color;
        child.fill = withAlpha(color, '33');
      }
    }
  }
}

/* ───────────────────────── native Fabric objects ───────────────────────── */

function buildNative(object: BoardObject): Raw {
  switch (object.kind) {
    case 'player':
    case 'gk':
      return nativePlayer(object);
    case 'ball':
      return nativeBall(object);
    case 'cone':
    case 'coneSmall':
      return nativeCone(object);
    case 'arrow':
    case 'line':
      return nativeLine(object);
    case 'zone':
      return nativeZone(object);
    case 'text':
      return nativeText(object);
    default:
      return nativeBall(object);
  }
}

function canvasAnchor(object: BoardObject): { left: number; top: number } {
  return {
    left: normToCanvasX(object.anchor.x),
    top: normToCanvasY(object.anchor.y),
  };
}

function nativePlayer(object: BoardObject): Raw {
  const team: Team = object.kind === 'gk' ? 'gk' : object.team ?? 'home';
  const webTeam = TEAM_TO_WEB[team];
  const palette = PLAYER_PALETTE[webTeam];
  const number = object.number ?? 1;
  const { left, top } = canvasAnchor(object);

  return {
    ...BASE,
    type: 'group',
    originX: 'center',
    originY: 'center',
    left,
    top,
    width: 27.5,
    height: 47,
    scaleX: 0.66,
    scaleY: 0.66,
    _kfId: object.kfId,
    _type: 'player',
    _team: webTeam,
    _num: number,
    objects: [
      {
        ...BASE,
        type: 'path',
        originX: 'center',
        originY: 'center',
        left: 0,
        top: 1.33,
        width: 26,
        height: 23.34,
        fill: object.color ?? palette.j,
        stroke: object.color ?? palette.t,
        strokeWidth: 1.5,
        path: SHIRT,
      },
      {
        ...BASE,
        type: 'path',
        originX: 'center',
        originY: 'center',
        left: 0,
        top: 18,
        width: 18,
        height: 10,
        fill: palette.s,
        stroke: palette.t,
        strokeWidth: 1,
        path: SHORTS,
      },
      {
        ...BASE,
        type: 'circle',
        originX: 'center',
        originY: 'center',
        left: 0,
        top: -17,
        width: 12,
        height: 12,
        radius: 6,
        fill: '#f0c8a0',
        stroke: '#c8a070',
        strokeWidth: 1,
      },
      {
        ...BASE,
        type: 'text',
        originX: 'center',
        originY: 'center',
        left: 0,
        top: 3,
        fill: '#fff',
        fontSize: number > 9 ? 10 : 14,
        fontWeight: 'bold',
        fontFamily: 'Arial',
        text: String(number),
        styles: {},
      },
    ],
  };
}

function nativeBall(object: BoardObject): Raw {
  const { left, top } = canvasAnchor(object);
  const spot = (x: number, y: number): Raw => ({
    ...BASE,
    type: 'circle',
    originX: 'center',
    originY: 'center',
    left: x,
    top: y,
    width: 3.2,
    height: 3.2,
    radius: 1.6,
    fill: '#2a2a2a',
    stroke: null,
    strokeWidth: 1,
  });

  return {
    ...BASE,
    type: 'group',
    originX: 'center',
    originY: 'center',
    left,
    top,
    width: 19.5,
    height: 19.5,
    scaleX: 0.66,
    scaleY: 0.66,
    _kfId: object.kfId,
    _type: 'ball',
    objects: [
      {
        ...BASE,
        type: 'circle',
        originX: 'center',
        originY: 'center',
        left: 0,
        top: 0,
        width: 18,
        height: 18,
        radius: 9,
        fill: '#f5f5f5',
        stroke: '#2a2a2a',
        strokeWidth: 1.5,
      },
      spot(0, -6),
      spot(5.7, -1.9),
      spot(3.5, 4.9),
      spot(-3.5, 4.9),
      spot(-5.7, -1.9),
    ],
  };
}

function nativeCone(object: BoardObject): Raw {
  const small = object.kind === 'coneSmall';
  const width = small ? 14 : 22;
  const height = small ? 17 : 26;
  const { left, top } = canvasAnchor(object);

  return {
    ...BASE,
    type: 'group',
    originX: 'center',
    originY: 'center',
    left,
    top,
    width: width + 1.5,
    height: height + 1.5,
    scaleX: 0.66,
    scaleY: 0.66,
    _kfId: object.kfId,
    _type: small ? 'cone-small' : 'cone',
    objects: [
      {
        ...BASE,
        type: 'triangle',
        originX: 'center',
        originY: 'center',
        left: 0,
        top: 0,
        width,
        height,
        fill: '#f5a623',
        stroke: '#c75c00',
        strokeWidth: 1.5,
      },
    ],
  };
}

function nativeLine(object: BoardObject): Raw {
  const color = object.color ?? '#FFFFFF';
  const x1 = normToCanvasX(object.anchor.x);
  const y1 = normToCanvasY(object.anchor.y);
  const x2 = normToCanvasX(object.anchor.x + (object.dx ?? 0));
  const y2 = normToCanvasY(object.anchor.y + (object.dy ?? 0));
  const length = Math.max(1, Math.hypot(x2 - x1, y2 - y1));
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;

  if (object.kind === 'line') {
    return {
      ...BASE,
      type: 'group',
      originX: 'left',
      originY: 'center',
      left: x1,
      top: y1,
      angle,
      width: length,
      height: 1.5,
      _kfId: object.kfId,
      _type: 'line',
      _color: color,
      objects: [
        {
          ...BASE,
          type: 'line',
          originX: 'left',
          originY: 'center',
          left: -length / 2,
          top: 0,
          width: length,
          height: 0,
          x1: 0,
          y1: 0,
          x2: length,
          y2: 0,
          stroke: color,
          strokeWidth: 1.5,
        },
      ],
    };
  }

  const headLength = 9;
  const lineLength = Math.max(1, length - headLength);
  const groupWidth = Math.max(1, length - 2);
  const dashed = object.style === 'dashed';

  return {
    ...BASE,
    type: 'group',
    originX: 'left',
    originY: 'center',
    left: x1,
    top: y1,
    angle,
    width: groupWidth,
    height: 11,
    _kfId: object.kfId,
    _type: 'arrow',
    _style: dashed ? 'dashed' : 'solid',
    _color: color,
    objects: [
      {
        ...BASE,
        type: 'line',
        originX: 'left',
        originY: 'center',
        left: -groupWidth / 2,
        top: 0,
        width: lineLength,
        height: 0,
        x1: 0,
        y1: 0,
        x2: lineLength,
        y2: 0,
        stroke: color,
        strokeWidth: 1.5,
        strokeDashArray: dashed ? [6, 4] : [],
      },
      {
        ...BASE,
        type: 'triangle',
        originX: 'center',
        originY: 'center',
        left: lineLength + 1 - groupWidth / 2,
        top: 0,
        width: 9,
        height: 11,
        angle: 90,
        fill: color,
        stroke: null,
      },
    ],
  };
}

function nativeZone(object: BoardObject): Raw {
  const color = object.color ?? '#FFFFFF';
  const width = Math.max(0, (object.w ?? 0) * PITCH_PX_W);
  const height = Math.max(0, (object.h ?? 0) * PITCH_PX_H);
  const groupWidth = width + 2;
  const groupHeight = height + 2;

  return {
    ...BASE,
    type: 'group',
    originX: 'left',
    originY: 'top',
    left: normToCanvasX(object.anchor.x),
    top: normToCanvasY(object.anchor.y),
    width: groupWidth,
    height: groupHeight,
    _kfId: object.kfId,
    _type: 'zone',
    objects: [
      {
        ...BASE,
        type: 'rect',
        originX: 'left',
        originY: 'top',
        left: -groupWidth / 2,
        top: -groupHeight / 2,
        width,
        height,
        rx: 3,
        ry: 3,
        fill: withAlpha(color, '33'),
        stroke: color,
        strokeWidth: 2,
      },
    ],
  };
}

function nativeText(object: BoardObject): Raw {
  return {
    ...BASE,
    type: 'i-text',
    originX: 'left',
    originY: 'top',
    left: normToCanvasX(object.anchor.x),
    top: normToCanvasY(object.anchor.y),
    fontFamily: 'Arial',
    fontWeight: 'bold',
    fontSize: 16,
    fill: object.color ?? '#FFFFFF',
    text: object.text ?? '',
    styles: {},
    _kfId: object.kfId,
    _type: 'text',
  };
}
