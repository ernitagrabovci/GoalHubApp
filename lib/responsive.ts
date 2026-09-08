/**
 * The dashboards are designed at fixed dp on the reference iPhone and must
 * render IDENTICALLY on every phone, regardless of screen size. SCALE is
 * therefore pinned to 1.0: no device ever grows or shrinks the layout.
 * A smaller/wider screen just shows the same content at the same sizes (a
 * shorter screen scrolls a bit more). Portrait-only app.
 */
export const DESIGN_WIDTH = 390;
export const SCALE = 1.0;

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
