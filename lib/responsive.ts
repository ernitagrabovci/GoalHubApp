import { Dimensions } from 'react-native';

/**
 * The dashboards are laid out in fixed dp on the reference phone and every
 * numeric style runs through `scaled()`, which multiplies it by SCALE. SCALE is
 * the device width over DESIGN_WIDTH, so the same design stretches to fit any
 * screen instead of overflowing into a scroll on narrower phones.
 *
 * DESIGN_WIDTH is the width the screens were tuned at — the iPhone 17 Pro Max
 * (440 dp) — so that phone renders at its authored size (SCALE 1.0) and every
 * other device grows or shrinks proportionally. Portrait-only app.
 */
export const DESIGN_WIDTH = 440;

const { width: WINDOW_WIDTH } = Dimensions.get('window');

export const SCALE = WINDOW_WIDTH / DESIGN_WIDTH;

// Numeric style values that are NOT lengths and must stay unscaled.
const NO_SCALE = new Set([
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
  'opacity',
  'shadowOpacity',
  'zIndex',
  'elevation',
  'shadowOffset',
  'transform',
  'fontWeight',
  'aspectRatio',
]);

const s = (n: number) => Math.round(n * SCALE * 100) / 100;

/**
 * Deep-copies a StyleSheet object, multiplying every numeric value by SCALE.
 * Blacklisted keys (and their whole subtree, e.g. shadowOffset/transform) pass
 * through untouched; strings/booleans (colors, '48%', null) are left as-is.
 */
export function scaled<T extends object>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v == null || typeof v === 'string' || typeof v === 'boolean' || NO_SCALE.has(k)) {
      out[k] = v;
      continue;
    }
    out[k] = typeof v === 'number' ? s(v) : scaled(v as object);
  }
  return out as T;
}

/** Inline helper for vector-icon `size` props, which bypass StyleSheet. */
export const I = (n: number) => Math.round(s(n));
