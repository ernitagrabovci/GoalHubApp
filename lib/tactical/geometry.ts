import type { PitchMode, Vec2 } from '@/lib/tactical/types';

/** The web editor's reference canvas and pitch size. */
export const CANVAS_W = 800;
export const CANVAS_H = 560;
export const CANVAS_PAD = 25;

export const PITCH_W = 105;
export const PITCH_H = 68;

export const PITCH_PX_W = CANVAS_W - CANVAS_PAD * 2; // 750
export const PITCH_PX_H = CANVAS_H - CANVAS_PAD * 2; // 510

/** Just beyond each goal, so the goal boxes are fully visible. */
export const GOAL_DEPTH = 2.44;

/** What the SVG shows. Includes a small margin for corner arcs and goals. */
export type PitchView = { x: number; y: number; w: number; h: number };

export const FULL_VIEW: PitchView = { x: -2.6, y: -0.6, w: 110.2, h: 69.2 };

/** The right half, with its halfway line at the left edge. */
export const HALF_VIEW: PitchView = { x: 52.3, y: -0.6, w: 55.3, h: 69.2 };

export function viewFor(mode: PitchMode): PitchView {
  return mode === 'half' ? HALF_VIEW : FULL_VIEW;
}

export function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

export function clampNorm(p: Vec2): Vec2 {
  return { x: clamp01(p.x), y: clamp01(p.y) };
}

/** A normalized pitch point → viewBox units. */
export function normToView(p: Vec2): Vec2 {
  return { x: p.x * PITCH_W, y: p.y * PITCH_H };
}

/** A normalized pitch point → pixels inside a rendered pitch. */
export function normToScreen(p: Vec2, view: PitchView, width: number, height: number): Vec2 {
  return {
    x: ((p.x * PITCH_W - view.x) / view.w) * width,
    y: ((p.y * PITCH_H - view.y) / view.h) * height,
  };
}

/** A touch point inside a rendered pitch → normalized pitch coordinates. */
export function screenToNorm(
  px: number,
  py: number,
  view: PitchView,
  width: number,
  height: number,
): Vec2 {
  const x = ((px / Math.max(1, width)) * view.w + view.x) / PITCH_W;
  const y = ((py / Math.max(1, height)) * view.h + view.y) / PITCH_H;
  return clampNorm({ x, y });
}

/** Web canvas pixels → normalized pitch coordinates. */
export function canvasToNorm(left: number, top: number): Vec2 {
  return {
    x: clamp01((left - CANVAS_PAD) / PITCH_PX_W),
    y: clamp01((top - CANVAS_PAD) / PITCH_PX_H),
  };
}

/** Normalized pitch coordinates → web canvas pixels. */
export function normToCanvasX(x: number): number {
  return CANVAS_PAD + x * PITCH_PX_W;
}

export function normToCanvasY(y: number): number {
  return CANVAS_PAD + y * PITCH_PX_H;
}

/** Fits a pitch view into an available box, preserving its aspect ratio. */
export function fitPitch(
  availW: number,
  availH: number,
  mode: PitchMode,
): { width: number; height: number } {
  const view = viewFor(mode);
  const aspect = view.w / view.h;
  let width = Math.max(0, availW);
  let height = width / aspect;
  if (height > availH) {
    height = Math.max(0, availH);
    width = height * aspect;
  }
  return { width, height };
}

/** Objects left of the halfway line are clipped out in half-pitch view. */
export function visibleInMode(x: number, mode: PitchMode): boolean {
  return mode === 'full' || x >= 0.5;
}

export function distance(a: Vec2, b: Vec2): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpPoint(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

/** Eases a 0..1 progress with the same curve the web editor samples. */
export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}

/** An arrowhead polygon in viewBox units, pointing from `a` to `b`. */
export function arrowHead(a: Vec2, b: Vec2, size = 1.35): string {
  const angle = Math.atan2(b.y - a.y, b.x - a.x);
  const back = angle + Math.PI;
  const left = { x: b.x + Math.cos(back + 0.5) * size, y: b.y + Math.sin(back + 0.5) * size };
  const right = { x: b.x + Math.cos(back - 0.5) * size, y: b.y + Math.sin(back - 0.5) * size };
  return `${b.x},${b.y} ${left.x},${left.y} ${right.x},${right.y}`;
}
