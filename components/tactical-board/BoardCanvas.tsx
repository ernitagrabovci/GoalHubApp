/* eslint-disable react-hooks/refs -- the single gesture surface is memoized
   once; its handlers read the latest board/drag state through refs at event
   time (never during render) so an active drag survives re-renders. */
import { Fragment, useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle, Line, Polygon, Rect } from 'react-native-svg';

import { PitchSvg } from '@/components/tactical-board/PitchSvg';
import { Tactical } from '@/constants/tactical-theme';
import {
  arrowHead,
  clampNorm,
  distance,
  fitPitch,
  normToScreen,
  normToView,
  PITCH_H,
  PITCH_W,
  screenToNorm,
  viewFor,
  type PitchView,
} from '@/lib/tactical/geometry';
import { teamColor } from '@/lib/tactical/factories';
import type { BoardObject, Phase, Vec2 } from '@/lib/tactical/types';
import type { BoardDocument } from '@/lib/tactical/use-board-document';

type Props = {
  board: BoardDocument;
  width: number;
  height: number;
  onTextRequest: (at: Vec2) => void;
  /** Playback anchors; while set, the board is read-only and renders these. */
  anchors?: Record<string, Vec2> | null;
};

type Drag = {
  id: string;
  mode: 'move' | 'animate';
  from: Vec2;
  anchor: Vec2;
};

type DraftTool = 'move' | 'pass' | 'line' | 'zone';
type Draft = { tool: DraftTool; start: Vec2; end: Vec2 };

type Snapshot = {
  board: BoardDocument;
  view: PitchView;
  phase: Phase | undefined;
  width: number;
  height: number;
  anchors: Record<string, Vec2> | null;
};

function resolveAnchor(o: BoardObject, phase: Phase | undefined): Vec2 {
  const s = phase?.state[o.id];
  return s ? { x: s.x, y: s.y } : o.anchor;
}

function isHidden(o: BoardObject, phase: Phase | undefined): boolean {
  const s = phase?.state[o.id];
  return s ? s.visible === false : false;
}

function tokenColor(o: BoardObject): string {
  if (o.color) return o.color;
  const team = teamColor(o.team);
  if (team) return team;
  if (o.kind === 'cone' || o.kind === 'coneSmall') return Tactical.cone;
  if (o.kind === 'ball') return Tactical.ball;
  return Tactical.white;
}

function tokenSize(pitchWidth: number): number {
  return Math.max(20, Math.min(34, pitchWidth * 0.055));
}

function distToSegment(p: Vec2, a: Vec2, b: Vec2): number {
  const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * (b.x - a.x)), p.y - (a.y + t * (b.y - a.y)));
}

function hitTest(snap: Snapshot, px: number, py: number): BoardObject | null {
  const { board, view, phase, width, height } = snap;
  const size = tokenSize(width);
  const point = { x: px, y: py };

  for (let i = board.doc.objects.length - 1; i >= 0; i -= 1) {
    const o = board.doc.objects[i];
    if (isHidden(o, phase)) continue;
    const anchor = resolveAnchor(o, phase);
    if (board.doc.pitchMode === 'half' && anchor.x < 0.5) continue;

    if (o.kind === 'arrow' || o.kind === 'line') {
      const a = normToScreen(anchor, view, width, height);
      const b = normToScreen(
        { x: anchor.x + (o.dx ?? 0), y: anchor.y + (o.dy ?? 0) },
        view,
        width,
        height,
      );
      if (distToSegment(point, a, b) <= 14) return o;
      continue;
    }

    if (o.kind === 'zone') {
      const a = normToScreen(anchor, view, width, height);
      const b = normToScreen(
        { x: anchor.x + (o.w ?? 0), y: anchor.y + (o.h ?? 0) },
        view,
        width,
        height,
      );
      if (
        px >= Math.min(a.x, b.x) - 6 &&
        px <= Math.max(a.x, b.x) + 6 &&
        py >= Math.min(a.y, b.y) - 6 &&
        py <= Math.max(a.y, b.y) + 6
      ) {
        return o;
      }
      continue;
    }

    const p = normToScreen(anchor, view, width, height);
    if (Math.hypot(p.x - px, p.y - py) <= Math.max(18, size * 0.8)) return o;
  }

  return null;
}

function commitDraft(board: BoardDocument, draft: Draft) {
  const { tool, start, end } = draft;
  if (tool === 'zone') {
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const w = Math.abs(end.x - start.x);
    const h = Math.abs(end.y - start.y);
    if (w * PITCH_W < 2 && h * PITCH_H < 2) return;
    board.addShape('zone', { x, y }, { w, h });
    return;
  }

  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (Math.hypot(dx * PITCH_W, dy * PITCH_H) < 1.5) return;

  if (tool === 'line') {
    board.addShape('line', start, { dx, dy });
    return;
  }
  board.addShape('arrow', start, {
    dx,
    dy,
    style: tool === 'pass' ? 'dashed' : 'solid',
  });
}

export function BoardCanvas({ board, width, height, onTextRequest, anchors = null }: Props) {
  const mode = board.doc.pitchMode;
  const view = useMemo(() => viewFor(mode), [mode]);
  const fitted = useMemo(() => fitPitch(width, height, mode), [width, height, mode]);

  const [drag, setDrag] = useState<Drag | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);

  const dragRef = useRef<Drag | null>(null);
  const draftRef = useRef<Draft | null>(null);

  const phase = board.doc.phases[board.currentPhase];

  const snapRef = useRef<Snapshot>({
    board,
    view,
    phase,
    width: fitted.width,
    height: fitted.height,
    anchors,
  });
  snapRef.current = {
    board,
    view,
    phase,
    width: fitted.width,
    height: fitted.height,
    anchors,
  };

  const textRequestRef = useRef(onTextRequest);
  textRequestRef.current = onTextRequest;

  const beginPan = useCallback((px: number, py: number) => {
    const snap = snapRef.current;
    if (snap.anchors) return;
    const tool = snap.board.tool;

    if (tool === 'select' || tool === 'animate') {
      const target = hitTest(snap, px, py);
      if (!target) return;
      const anchor = resolveAnchor(target, snap.phase);
      const next: Drag = {
        id: target.id,
        mode: tool === 'animate' ? 'animate' : 'move',
        from: anchor,
        anchor,
      };
      dragRef.current = next;
      setDrag(next);
      return;
    }

    if (tool === 'move' || tool === 'pass' || tool === 'line' || tool === 'zone') {
      const start = screenToNorm(px, py, snap.view, snap.width, snap.height);
      const next: Draft = { tool, start, end: start };
      draftRef.current = next;
      setDraft(next);
    }
  }, []);

  const movePan = useCallback((px: number, py: number) => {
    const snap = snapRef.current;
    if (snap.anchors) return;

    if (dragRef.current) {
      const anchor = clampNorm(
        screenToNorm(px, py, snap.view, snap.width, snap.height),
      );
      const next = { ...dragRef.current, anchor };
      dragRef.current = next;
      setDrag(next);
      return;
    }

    if (draftRef.current) {
      const end = screenToNorm(px, py, snap.view, snap.width, snap.height);
      const next = { ...draftRef.current, end };
      draftRef.current = next;
      setDraft(next);
    }
  }, []);

  const endPan = useCallback(() => {
    const snap = snapRef.current;
    if (snap.anchors) {
      dragRef.current = null;
      draftRef.current = null;
      setDrag(null);
      setDraft(null);
      return;
    }
    const active = dragRef.current;
    const pending = draftRef.current;
    dragRef.current = null;
    draftRef.current = null;
    setDrag(null);
    setDraft(null);

    if (active) {
      if (distance(active.from, active.anchor) < 0.004) return;
      if (active.mode === 'animate') {
        snap.board.recordMovement(active.id, active.from, active.anchor);
      } else {
        snap.board.move(active.id, active.anchor);
      }
      return;
    }

    if (pending) commitDraft(snap.board, pending);
  }, []);

  const cancelPan = useCallback(() => {
    if (!dragRef.current && !draftRef.current) return;
    dragRef.current = null;
    draftRef.current = null;
    setDrag(null);
    setDraft(null);
  }, []);

  const handleTap = useCallback((px: number, py: number) => {
    const snap = snapRef.current;
    if (snap.anchors) return;
    const target = snap.board;
    const at = screenToNorm(px, py, snap.view, snap.width, snap.height);

    switch (target.tool) {
      case 'select': {
        const hit = hitTest(snap, px, py);
        target.select(hit ? hit.id : null);
        return;
      }
      case 'animate': {
        const hit = hitTest(snap, px, py);
        if (hit) target.select(hit.id);
        return;
      }
      case 'home':
        target.addKind('player', at, 'home');
        return;
      case 'away':
        target.addKind('player', at, 'away');
        return;
      case 'gk':
        target.addKind('gk', at, 'gk');
        return;
      case 'cone':
        target.addKind('cone', at);
        return;
      case 'coneSmall':
        target.addKind('coneSmall', at);
        return;
      case 'ball':
        target.addKind('ball', at);
        return;
      case 'text':
        textRequestRef.current(at);
        return;
      default:
        return;
    }
  }, []);

  const gesture = useMemo(() => {
    const pan = Gesture.Pan()
      .minDistance(4)
      .runOnJS(true)
      .onStart((e) => beginPan(e.x, e.y))
      .onUpdate((e) => movePan(e.x, e.y))
      .onEnd(() => endPan())
      .onFinalize((_e, success) => {
        if (!success) cancelPan();
      });

    const tap = Gesture.Tap()
      .maxDistance(12)
      .runOnJS(true)
      .onEnd((e, success) => {
        if (success) handleTap(e.x, e.y);
      });

    return Gesture.Race(pan, tap);
  }, [beginPan, movePan, endPan, cancelPan, handleTap]);

  const size = tokenSize(fitted.width);
  const draggedId = drag?.id ?? null;

  return (
    <View style={[styles.wrap, { width, height }]}>
      <GestureDetector gesture={gesture}>
        <View style={{ width: fitted.width, height: fitted.height }}>
          <PitchSvg mode={mode} width={fitted.width} height={fitted.height} />

          <Svg
            pointerEvents="none"
            style={StyleSheet.absoluteFill}
            width={fitted.width}
            height={fitted.height}
            viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
            preserveAspectRatio="xMidYMid meet"
          >
            {anchors ? null : <MovementTracks board={board} phase={phase} />}
            <Shapes
              board={board}
              phase={phase}
              selectedId={board.selectedId}
              anchors={anchors}
            />
            {drag && drag.mode === 'animate' ? (
              <AnimatePreview from={drag.from} to={drag.anchor} />
            ) : null}
            {draft ? <DraftPreview draft={draft} /> : null}
          </Svg>

          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {board.doc.objects.map((o) => {
              if (isHidden(o, phase)) return null;
              if (o.kind === 'line' || o.kind === 'arrow' || o.kind === 'zone') return null;
              const anchor =
                anchors?.[o.id] ??
                (drag && drag.mode === 'move' && drag.id === o.id
                  ? drag.anchor
                  : resolveAnchor(o, phase));
              if (board.doc.pitchMode === 'half' && anchor.x < 0.5) return null;
              const p = normToScreen(anchor, view, fitted.width, fitted.height);
              const selected = board.selectedId === o.id && draggedId !== o.id;

              if (o.kind === 'text') {
                const fontSize = Math.max(10, Math.min(16, fitted.width * 0.032));
                return (
                  <Text
                    key={o.id}
                    style={[
                      styles.text,
                      {
                        left: p.x,
                        top: p.y,
                        fontSize,
                        color: o.color ?? Tactical.white,
                        backgroundColor: selected ? 'rgba(182,255,106,0.20)' : 'transparent',
                      },
                    ]}
                  >
                    {o.text || 'Tekst'}
                  </Text>
                );
              }

              return (
                <View
                  key={o.id}
                  style={[
                    styles.token,
                    {
                      left: p.x - size / 2,
                      top: p.y - size / 2,
                      width: size,
                      height: size,
                    },
                    selected && styles.tokenSelected,
                  ]}
                >
                  <TokenBody object={o} size={size} selected={selected} />
                </View>
              );
            })}
          </View>
        </View>
      </GestureDetector>
    </View>
  );
}

function TokenBody({
  object,
  size,
  selected,
}: {
  object: BoardObject;
  size: number;
  selected: boolean;
}) {
  const ring = selected ? Tactical.selected : 'rgba(0,0,0,0.30)';

  if (object.kind === 'ball') {
    const d = size * 0.52;
    return (
      <View
        style={{
          width: d,
          height: d,
          borderRadius: d / 2,
          backgroundColor: '#FDFDFD',
          borderWidth: selected ? 2.5 : 1.5,
          borderColor: ring,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: d * 0.3,
            height: d * 0.3,
            borderRadius: d * 0.15,
            backgroundColor: '#101820',
          }}
        />
      </View>
    );
  }

  if (object.kind === 'cone' || object.kind === 'coneSmall') {
    const d = size * (object.kind === 'cone' ? 0.62 : 0.44);
    return (
      <View
        style={{
          width: d,
          height: d,
          borderRadius: 3,
          backgroundColor: Tactical.cone,
          borderWidth: selected ? 2.5 : 1.5,
          borderColor: ring,
          transform: [{ rotate: '45deg' }],
        }}
      />
    );
  }

  const fill = tokenColor(object);
  const ink = object.team === 'gk' ? '#171200' : '#FFFFFF';
  const d = object.kind === 'gk' ? size * 0.9 : size;

  return (
    <View
      style={{
        width: d,
        height: d,
        borderRadius: d / 2,
        backgroundColor: fill,
        borderWidth: selected ? 2.5 : 1.5,
        borderColor: ring,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {object.number != null ? (
        <Text style={[styles.jersey, { fontSize: d * 0.42, color: ink }]}>
          {object.number}
        </Text>
      ) : null}
    </View>
  );
}

function Shapes({
  board,
  phase,
  selectedId,
  anchors,
}: {
  board: BoardDocument;
  phase: Phase | undefined;
  selectedId: string | null;
  anchors: Record<string, Vec2> | null;
}) {
  return (
    <>
      {board.doc.objects.map((o) => {
        if (o.kind !== 'arrow' && o.kind !== 'line' && o.kind !== 'zone') return null;
        if (isHidden(o, phase)) return null;
        const anchor = anchors?.[o.id] ?? resolveAnchor(o, phase);
        if (board.doc.pitchMode === 'half' && anchor.x < 0.5) return null;

        const selected = selectedId === o.id;
        const color = selected ? Tactical.selected : o.color ?? Tactical.white;

        if (o.kind === 'zone') {
          const a = normToView(anchor);
          const w = (o.w ?? 0) * PITCH_W;
          const h = (o.h ?? 0) * PITCH_H;
          return (
            <Rect
              key={o.id}
              x={a.x}
              y={a.y}
              width={w}
              height={h}
              rx={0.7}
              fill={color}
              fillOpacity={0.16}
              stroke={color}
              strokeWidth={selected ? 0.8 : 0.5}
              strokeDasharray="1.6 1.2"
            />
          );
        }

        const a = normToView(anchor);
        const b = normToView({ x: anchor.x + (o.dx ?? 0), y: anchor.y + (o.dy ?? 0) });
        return (
          <Fragment key={o.id}>
            <Line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={color}
              strokeWidth={selected ? 0.85 : 0.55}
              strokeLinecap="round"
              strokeDasharray={o.style === 'dashed' ? '2 1.6' : undefined}
            />
            {o.kind === 'arrow' ? <Polygon points={arrowHead(a, b)} fill={color} /> : null}
          </Fragment>
        );
      })}
    </>
  );
}

function MovementTracks({ board, phase }: { board: BoardDocument; phase: Phase | undefined }) {
  const tracks = board.doc.movements[board.currentPhase] ?? {};
  const byId = new Map(board.doc.objects.map((o) => [o.id, o]));

  return (
    <>
      {Object.entries(tracks).map(([id, track]) => {
        const o = byId.get(id);
        if (!o || track.frames.length < 2) return null;
        if (isHidden(o, phase)) return null;
        const a = normToView(track.frames[0]);
        const b = normToView(track.frames[track.frames.length - 1]);
        const color = tokenColor(o);
        return (
          <Fragment key={`track-${id}`}>
            <Line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={color}
              strokeOpacity={0.85}
              strokeWidth={0.36}
              strokeDasharray="1.3 1.3"
              strokeLinecap="round"
            />
            <Circle cx={b.x} cy={b.y} r={0.4} fill={color} fillOpacity={0.9} />
          </Fragment>
        );
      })}
    </>
  );
}

function AnimatePreview({ from, to }: { from: Vec2; to: Vec2 }) {
  const a = normToView(from);
  const b = normToView(to);
  return (
    <>
      <Line
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke={Tactical.selected}
        strokeWidth={0.5}
        strokeDasharray="1.6 1.2"
        strokeLinecap="round"
      />
      <Polygon points={arrowHead(a, b)} fill={Tactical.selected} />
      <Circle
        cx={b.x}
        cy={b.y}
        r={0.55}
        fill="none"
        stroke={Tactical.selected}
        strokeWidth={0.3}
      />
    </>
  );
}

function DraftPreview({ draft }: { draft: Draft }) {
  if (draft.tool === 'zone') {
    const a = normToView({
      x: Math.min(draft.start.x, draft.end.x),
      y: Math.min(draft.start.y, draft.end.y),
    });
    const w = Math.abs(draft.end.x - draft.start.x) * PITCH_W;
    const h = Math.abs(draft.end.y - draft.start.y) * PITCH_H;
    return (
      <Rect
        x={a.x}
        y={a.y}
        width={w}
        height={h}
        rx={0.7}
        fill={Tactical.selected}
        fillOpacity={0.14}
        stroke={Tactical.selected}
        strokeWidth={0.55}
        strokeDasharray="1.6 1.2"
      />
    );
  }

  const a = normToView(draft.start);
  const b = normToView(draft.end);
  return (
    <>
      <Line
        x1={a.x}
        y1={a.y}
        x2={b.x}
        y2={b.y}
        stroke={Tactical.selected}
        strokeWidth={0.6}
        strokeLinecap="round"
        strokeDasharray={draft.tool === 'pass' ? '2 1.6' : undefined}
      />
      {draft.tool === 'pass' || draft.tool === 'move' ? (
        <Polygon points={arrowHead(a, b)} fill={Tactical.selected} />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  token: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenSelected: {
    shadowColor: Tactical.selected,
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  jersey: {
    fontWeight: '800',
  },
  text: {
    position: 'absolute',
    fontWeight: '700',
    paddingHorizontal: 2,
    paddingVertical: 1,
  },
});
