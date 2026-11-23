import { useCallback, useEffect, useRef, useState } from 'react';

import { clamp01, lerpPoint } from '@/lib/tactical/geometry';
import type { BoardDoc, MovementTrack, Vec2 } from '@/lib/tactical/types';

type Segment = {
  duration: number;
  from: Record<string, Vec2>;
  to: Record<string, Vec2>;
  tracks: Record<string, MovementTrack>;
};

function phaseAnchors(doc: BoardDoc, index: number): Record<string, Vec2> {
  const phase = doc.phases[index];
  const out: Record<string, Vec2> = {};
  for (const o of doc.objects) {
    const s = phase?.state[o.id];
    out[o.id] = s ? { x: s.x, y: s.y } : o.anchor;
  }
  return out;
}

function sampleFrames(frames: Vec2[], t: number): Vec2 {
  if (frames.length === 1) return frames[0];
  const pos = clamp01(t) * (frames.length - 1);
  const i = Math.min(Math.floor(pos), frames.length - 2);
  return lerpPoint(frames[i], frames[i + 1], pos - i);
}

function buildSegments(doc: BoardDoc): Segment[] {
  if (!doc.phases.length) return [];
  return doc.phases.map((phase, i) => ({
    duration: Math.max(160, phase.duration || 3000),
    from: phaseAnchors(doc, i),
    to: phaseAnchors(doc, Math.min(i + 1, doc.phases.length - 1)),
    tracks: doc.movements[i] ?? {},
  }));
}

/**
 * Plays every phase in order. While playing, the board renders the returned
 * anchor map instead of the stored object positions; stopping drops back to
 * the phase the trainer was editing.
 */
export function usePlayback(doc: BoardDoc) {
  const [anchors, setAnchors] = useState<Record<string, Vec2> | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(5);

  const docRef = useRef(doc);
  const speedRef = useRef(speed);
  const rafRef = useRef<number | null>(null);
  const playingRef = useRef(false);

  useEffect(() => {
    docRef.current = doc;
  }, [doc]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const stop = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    playingRef.current = false;
    setPlaying(false);
    setAnchors(null);
  }, []);

  const play = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);

    const segments = buildSegments(docRef.current);
    if (!segments.length) return;

    playingRef.current = true;
    setPlaying(true);

    const total = segments.reduce((sum, s) => sum + s.duration, 0);
    const startedAt = performance.now();

    const frame = (now: number) => {
      if (!playingRef.current) return;
      const elapsed = (now - startedAt) * speedRef.current;
      const clamped = Math.min(elapsed, total);

      let offset = 0;
      let segment = segments[segments.length - 1];
      let segmentStart = 0;
      for (const s of segments) {
        if (clamped < offset + s.duration) {
          segment = s;
          segmentStart = offset;
          break;
        }
        offset += s.duration;
      }

      const local = clamp01((clamped - segmentStart) / segment.duration);
      const out: Record<string, Vec2> = {};
      for (const [id, start] of Object.entries(segment.from)) {
        const track = segment.tracks[id];
        const end = segment.to[id] ?? start;
        if (track && track.frames.length >= 2) {
          const delay = Math.max(0, track.startDelay ?? 0) * 1000;
          const span = Math.max(1, segment.duration - delay);
          const t = clamp01((local * segment.duration - delay) / span);
          out[id] = sampleFrames(track.frames, t);
        } else {
          out[id] = lerpPoint(start, end, local);
        }
      }
      setAnchors(out);

      if (clamped >= total) {
        playingRef.current = false;
        setPlaying(false);
        setAnchors(null);
        rafRef.current = null;
        return;
      }
      rafRef.current = requestAnimationFrame(frame);
    };

    rafRef.current = requestAnimationFrame(frame);
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { playing, anchors, play, stop, speed, setSpeed };
}
