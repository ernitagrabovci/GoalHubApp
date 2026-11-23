import { useCallback, useReducer } from 'react';

import { clampNorm } from '@/lib/tactical/geometry';
import { nextObjectId, teamColor } from '@/lib/tactical/factories';
import type {
  BoardDoc,
  BoardMeta,
  BoardObject,
  MovementTrack,
  ObjKind,
  PitchMode,
  Team,
  Tool,
  Vec2,
} from '@/lib/tactical/types';

type AddKind = Extract<ObjKind, 'player' | 'gk' | 'ball' | 'cone' | 'coneSmall'>;
type ShapeKind = Extract<ObjKind, 'arrow' | 'line' | 'zone'>;

type Action =
  | { type: 'load'; doc: BoardDoc }
  | { type: 'tool'; tool: Tool }
  | { type: 'select'; id: string | null }
  | { type: 'addKind'; id: string; kind: AddKind; team?: Team; anchor: Vec2 }
  | {
      type: 'addShape';
      id: string;
      kind: ShapeKind;
      style?: 'solid' | 'dashed';
      anchor: Vec2;
      dx?: number;
      dy?: number;
      w?: number;
      h?: number;
    }
  | { type: 'addText'; id: string; anchor: Vec2; text: string }
  | { type: 'move'; id: string; anchor: Vec2 }
  | { type: 'recordMovement'; id: string; from: Vec2; to: Vec2 }
  | { type: 'update'; id: string; patch: Partial<BoardObject> }
  | { type: 'track'; id: string; patch: Partial<MovementTrack> }
  | { type: 'delete'; id: string }
  | { type: 'phase'; index: number }
  | { type: 'addPhase' }
  | { type: 'deletePhase'; index: number }
  | { type: 'meta'; patch: Partial<BoardMeta> }
  | { type: 'pitchMode'; mode: PitchMode }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'saved' };

export type BoardState = {
  doc: BoardDoc;
  currentPhase: number;
  selectedId: string | null;
  tool: Tool;
  past: BoardDoc[];
  future: BoardDoc[];
  dirty: boolean;
  /** Coalescing key of the last edit so typing produces one undo step. */
  editKey: string | null;
};

const HISTORY_LIMIT = 50;

function initialState(doc: BoardDoc): BoardState {
  return {
    doc,
    currentPhase: 0,
    selectedId: null,
    tool: 'select',
    past: [],
    future: [],
    dirty: false,
    editKey: null,
  };
}

function withDoc(
  state: BoardState,
  doc: BoardDoc,
  opts: { history?: boolean; dirty?: boolean; editKey?: string } = {},
): BoardState {
  const history = opts.history ?? true;
  const editKey = opts.editKey ?? null;
  const coalesce = editKey !== null && editKey === state.editKey;
  return {
    ...state,
    doc,
    past: history
      ? coalesce
        ? state.past
        : [...state.past, state.doc].slice(-HISTORY_LIMIT)
      : state.past,
    future: history ? [] : state.future,
    dirty: opts.dirty ?? true,
    editKey,
  };
}

function nextNumber(objects: BoardObject[], team: Team | undefined): number {
  if (team === 'gk') return 1;
  const used = new Set(
    objects
      .filter((o) => o.team === team && (o.kind === 'player' || o.kind === 'gk'))
      .map((o) => o.number ?? 0),
  );
  let n = 1;
  while (used.has(n)) n += 1;
  return n;
}

function phaseAnchors(doc: BoardDoc, index: number): Record<string, Vec2> {
  const phase = doc.phases[index];
  const out: Record<string, Vec2> = {};
  for (const o of doc.objects) {
    const s = phase?.state[o.id];
    out[o.id] = s ? { x: s.x, y: s.y } : o.anchor;
  }
  return out;
}

/** Applies a phase's saved anchors to the live objects (a view operation). */
function applyPhase(doc: BoardDoc, index: number): BoardDoc {
  const anchors = phaseAnchors(doc, index);
  return {
    ...doc,
    objects: doc.objects.map((o) =>
      anchors[o.id] ? { ...o, anchor: anchors[o.id] } : o,
    ),
  };
}

function anchorInto(doc: BoardDoc, index: number, id: string, anchor: Vec2): BoardDoc {
  return {
    ...doc,
    objects: doc.objects.map((o) => (o.id === id ? { ...o, anchor } : o)),
    phases: doc.phases.map((p, i) =>
      i === index
        ? { ...p, state: { ...p.state, [id]: { x: anchor.x, y: anchor.y, visible: true } } }
        : p,
    ),
  };
}

function objectIntoAllPhases(doc: BoardDoc, object: BoardObject): BoardDoc {
  return {
    ...doc,
    phases: doc.phases.map((p) => ({
      ...p,
      state: {
        ...p.state,
        [object.id]: { x: object.anchor.x, y: object.anchor.y, visible: true },
      },
    })),
  };
}

function reducer(state: BoardState, action: Action): BoardState {
  switch (action.type) {
    case 'load':
      return initialState(action.doc);

    case 'tool':
      return { ...state, tool: action.tool, editKey: null };

    case 'select':
      return { ...state, selectedId: action.id, editKey: null };

    case 'addKind': {
      const number =
        action.kind === 'player' || action.kind === 'gk'
          ? nextNumber(state.doc.objects, action.team)
          : undefined;
      const object: BoardObject = {
        id: action.id,
        kfId: action.id,
        kind: action.kind,
        team: action.team,
        number,
        color: teamColor(action.team),
        anchor: action.anchor,
        native: true,
      };
      const doc = objectIntoAllPhases(
        { ...state.doc, objects: [...state.doc.objects, object] },
        object,
      );
      return { ...withDoc(state, doc), selectedId: object.id };
    }

    case 'addShape': {
      const object: BoardObject = {
        id: action.id,
        kfId: action.id,
        kind: action.kind,
        color: '#FFFFFF',
        anchor: action.anchor,
        dx: action.dx,
        dy: action.dy,
        w: action.w,
        h: action.h,
        style: action.style,
        native: true,
      };
      const doc = objectIntoAllPhases(
        { ...state.doc, objects: [...state.doc.objects, object] },
        object,
      );
      return { ...withDoc(state, doc), selectedId: object.id };
    }

    case 'addText': {
      const object: BoardObject = {
        id: action.id,
        kfId: action.id,
        kind: 'text',
        text: action.text,
        color: '#FFFFFF',
        anchor: action.anchor,
        native: true,
      };
      const doc = objectIntoAllPhases(
        { ...state.doc, objects: [...state.doc.objects, object] },
        object,
      );
      return { ...withDoc(state, doc), selectedId: object.id };
    }

    case 'move': {
      const anchor = clampNorm(action.anchor);
      const doc = anchorInto(state.doc, state.currentPhase, action.id, anchor);
      return withDoc(state, doc);
    }

    case 'recordMovement': {
      const tracks = { ...(state.doc.movements[state.currentPhase] ?? {}) };
      const existing = tracks[action.id];
      const track: MovementTrack = {
        objectId: action.id,
        frames: [action.from, action.to],
        speed: existing?.speed,
        startDelay: existing?.startDelay,
        playerSpeed: existing?.playerSpeed,
      };
      const movements = {
        ...state.doc.movements,
        [state.currentPhase]: { ...tracks, [action.id]: track },
      };
      // The next phase begins where this movement ends, so playback flows on.
      const phases = state.doc.phases.map((p, i) =>
        i === state.currentPhase + 1
          ? {
              ...p,
              state: {
                ...p.state,
                [action.id]: { x: action.to.x, y: action.to.y, visible: true },
              },
            }
          : p,
      );
      return withDoc(state, { ...state.doc, movements, phases });
    }

    case 'update': {
      const doc = {
        ...state.doc,
        objects: state.doc.objects.map((o) =>
          o.id === action.id ? { ...o, ...action.patch } : o,
        ),
      };
      return withDoc(state, doc, { editKey: `update:${action.id}` });
    }

    case 'track': {
      const tracks = state.doc.movements[state.currentPhase] ?? {};
      const existing = tracks[action.id];
      if (!existing) return state;
      const movements = {
        ...state.doc.movements,
        [state.currentPhase]: {
          ...tracks,
          [action.id]: { ...existing, ...action.patch },
        },
      };
      return withDoc(state, { ...state.doc, movements }, { editKey: `track:${action.id}` });
    }

    case 'delete': {
      const objects = state.doc.objects.filter((o) => o.id !== action.id);
      const phases = state.doc.phases.map((p) => {
        const next = { ...p.state };
        delete next[action.id];
        return { ...p, state: next };
      });
      const movements: BoardDoc['movements'] = {};
      for (const [idx, tracks] of Object.entries(state.doc.movements)) {
        const next = { ...tracks };
        delete next[action.id];
        movements[Number(idx)] = next;
      }
      return {
        ...withDoc(state, { ...state.doc, objects, phases, movements }),
        selectedId: null,
      };
    }

    case 'phase': {
      const index = Math.max(0, Math.min(action.index, state.doc.phases.length - 1));
      return {
        ...state,
        currentPhase: index,
        doc: applyPhase(state.doc, index),
        editKey: null,
      };
    }

    case 'addPhase': {
      const anchors = phaseAnchors(state.doc, state.currentPhase);
      const stateMap: BoardDoc['phases'][number]['state'] = {};
      for (const o of state.doc.objects) {
        const a = anchors[o.id];
        stateMap[o.id] = { x: a.x, y: a.y, visible: true };
      }
      const label = `Faza ${state.doc.phases.length + 1}`;
      const phases = [
        ...state.doc.phases,
        { id: `p${state.doc.phases.length + 1}`, label, duration: 2000, state: stateMap },
      ];
      return {
        ...withDoc(state, { ...state.doc, phases }),
        currentPhase: phases.length - 1,
      };
    }

    case 'deletePhase': {
      if (state.doc.phases.length <= 1) return state;
      const phases = state.doc.phases.filter((_, i) => i !== action.index);
      const movements: BoardDoc['movements'] = {};
      for (const [idx, tracks] of Object.entries(state.doc.movements)) {
        const n = Number(idx);
        if (n === action.index) continue;
        movements[n > action.index ? n - 1 : n] = tracks;
      }
      const currentPhase = Math.max(
        0,
        Math.min(
          state.currentPhase > action.index ? state.currentPhase - 1 : state.currentPhase,
          phases.length - 1,
        ),
      );
      const doc = applyPhase({ ...state.doc, phases, movements }, currentPhase);
      return { ...withDoc(state, doc), currentPhase };
    }

    case 'meta': {
      const doc = { ...state.doc, meta: { ...state.doc.meta, ...action.patch } };
      return withDoc(state, doc, { history: true, editKey: `meta:${Object.keys(action.patch).join(',')}` });
    }

    case 'pitchMode': {
      return withDoc(state, { ...state.doc, pitchMode: action.mode }, { history: false });
    }

    case 'undo': {
      if (!state.past.length) return state;
      const doc = state.past[state.past.length - 1];
      return {
        ...state,
        doc,
        past: state.past.slice(0, -1),
        future: [state.doc, ...state.future].slice(0, HISTORY_LIMIT),
        dirty: true,
        editKey: null,
        selectedId:
          state.selectedId && doc.objects.some((o) => o.id === state.selectedId)
            ? state.selectedId
            : null,
        currentPhase: Math.max(0, Math.min(state.currentPhase, doc.phases.length - 1)),
      };
    }

    case 'redo': {
      if (!state.future.length) return state;
      const doc = state.future[0];
      return {
        ...state,
        doc,
        past: [...state.past, state.doc].slice(-HISTORY_LIMIT),
        future: state.future.slice(1),
        dirty: true,
        editKey: null,
        selectedId:
          state.selectedId && doc.objects.some((o) => o.id === state.selectedId)
            ? state.selectedId
            : null,
        currentPhase: Math.max(0, Math.min(state.currentPhase, doc.phases.length - 1)),
      };
    }

    case 'saved':
      return { ...state, dirty: false };

    default:
      return state;
  }
}

export function useBoardDocument(initialDoc: BoardDoc) {
  const [state, dispatch] = useReducer(reducer, initialDoc, initialState);

  const setTool = useCallback((tool: Tool) => dispatch({ type: 'tool', tool }), []);
  const select = useCallback((id: string | null) => dispatch({ type: 'select', id }), []);

  const addKind = useCallback((kind: AddKind, anchor: Vec2, team?: Team) => {
    dispatch({ type: 'addKind', id: nextObjectId(), kind, team, anchor });
  }, []);

  const addShape = useCallback(
    (
      kind: ShapeKind,
      anchor: Vec2,
      opts: { dx?: number; dy?: number; w?: number; h?: number; style?: 'solid' | 'dashed' },
    ) => {
      dispatch({ type: 'addShape', id: nextObjectId(), kind, anchor, ...opts });
    },
    [],
  );

  const addText = useCallback((anchor: Vec2, text: string) => {
    dispatch({ type: 'addText', id: nextObjectId(), anchor, text });
  }, []);

  const move = useCallback((id: string, anchor: Vec2) => {
    dispatch({ type: 'move', id, anchor });
  }, []);

  const recordMovement = useCallback((id: string, from: Vec2, to: Vec2) => {
    dispatch({ type: 'recordMovement', id, from, to });
  }, []);

  const update = useCallback((id: string, patch: Partial<BoardObject>) => {
    dispatch({ type: 'update', id, patch });
  }, []);

  const updateTrack = useCallback((id: string, patch: Partial<MovementTrack>) => {
    dispatch({ type: 'track', id, patch });
  }, []);

  const remove = useCallback((id: string) => dispatch({ type: 'delete', id }), []);

  const goToPhase = useCallback((index: number) => dispatch({ type: 'phase', index }), []);
  const addPhase = useCallback(() => dispatch({ type: 'addPhase' }), []);
  const deletePhase = useCallback(
    (index: number) => dispatch({ type: 'deletePhase', index }),
    [],
  );

  const setMeta = useCallback(
    (patch: Partial<BoardMeta>) => dispatch({ type: 'meta', patch }),
    [],
  );

  const setPitchMode = useCallback(
    (mode: PitchMode) => dispatch({ type: 'pitchMode', mode }),
    [],
  );

  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const redo = useCallback(() => dispatch({ type: 'redo' }), []);
  const markSaved = useCallback(() => dispatch({ type: 'saved' }), []);

  const selected = state.doc.objects.find((o) => o.id === state.selectedId) ?? null;

  return {
    ...state,
    selected,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    setTool,
    select,
    addKind,
    addShape,
    addText,
    move,
    recordMovement,
    update,
    updateTrack,
    remove,
    goToPhase,
    addPhase,
    deletePhase,
    setMeta,
    setPitchMode,
    undo,
    redo,
    markSaved,
  };
}

export type BoardDocument = ReturnType<typeof useBoardDocument>;
