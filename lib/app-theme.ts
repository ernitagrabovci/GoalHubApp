import { useMemo } from 'react';

import { useTheme } from '@/lib/theme';

/**
 * Central dark mapping for the screens that carry their own light palette
 * (the `const C = {...}` objects in app/ and the dashboard palettes).
 *
 * Each screen keeps its exact light values; `useAppColors` swaps every value
 * for its dark counterpart when the theme is dark. Colors are resolved by
 * key first (semantic names such as `page` or `green`), then by exact light
 * value, then by a luminance heuristic for anything unknown.
 *
 * Every key also gets `…Text`, `…Fill` and `…Border` aliases, because one key
 * is often used in all three roles (e.g. `green` is both heading text and a
 * button fill). Light mode aliases equal the original value, so the light
 * design is byte-for-byte unchanged.
 */
export type Palette = Record<string, string>;

export type AppColorsOf<L extends Palette> = L & {
  [K in keyof L as `${K & string}Text`]: string;
} & {
  [K in keyof L as `${K & string}Fill`]: string;
} & {
  [K in keyof L as `${K & string}Border`]: string;
};

const HAIRLINE = 'rgba(176, 228, 204, 0.14)';
const HAIRLINE_SOFT = 'rgba(176, 228, 204, 0.10)';
const HAIRLINE_STRONG = 'rgba(176, 228, 204, 0.22)';
const DARK_PAGE = '#0A1512';
const DARK_SURFACE = '#122A23';

/** Dark value per palette key (fill/surface role). */
const DARK_BY_KEY: Palette = {
  // surfaces
  page: DARK_PAGE,
  bg: DARK_PAGE,
  background: DARK_PAGE,
  fill: DARK_PAGE,
  input: '#0F211C',
  card: DARK_SURFACE,
  surface: DARK_SURFACE,
  surfaceAlt: '#0F211C',
  cardBg: 'rgba(96, 165, 250, 0.12)',
  headBg: DARK_SURFACE,
  thBg: DARK_SURFACE,
  tray: '#2E7D5B',
  swatchAway: DARK_SURFACE,
  pillBg: DARK_SURFACE,
  activeBg: 'rgba(88, 167, 126, 0.22)',
  mint: 'rgba(88, 167, 126, 0.14)',
  mintBorder: HAIRLINE_STRONG,

  // text
  text: '#E6F4EC',
  ink: '#E6F4EC',
  gray: '#A9C9B8',
  text2: '#A9C9B8',
  sub: '#A9C9B8',
  hint: '#7FA494',
  faint: '#7FA494',
  muted: '#7FA494',
  placeholder: '#7FA494',
  ghost: '#7FA494',
  ph: '#7FA494',
  label: '#9FB5AA',
  chevron: '#7FA494',
  white: '#FFFFFF',
  textOnPrimary: '#FFFFFF',

  // lines / borders
  line: HAIRLINE,
  headLine: 'rgba(176, 228, 204, 0.16)',
  rowLine: HAIRLINE_SOFT,
  divider: 'rgba(176, 228, 204, 0.16)',
  tableLine: HAIRLINE_SOFT,
  cardBorder: HAIRLINE_STRONG,
  frame: HAIRLINE,
  inputBorder: 'rgba(176, 228, 204, 0.24)',
  border: 'rgba(176, 228, 204, 0.20)',
  selectBorder: 'rgba(176, 228, 204, 0.32)',
  ghostLine: HAIRLINE,
  borderSoft: HAIRLINE_SOFT,
  glassBorder: HAIRLINE,
  hintSoft: 'rgba(176, 228, 204, 0.12)',
  track: 'rgba(176, 228, 204, 0.12)',
  statBorder: 'rgba(88, 167, 126, 0.35)',
  matchBorder: 'rgba(88, 167, 126, 0.32)',
  greenLine: '#2E7D5B',
  greenBorder: '#2E7D5B',
  q1Line: '#2E7D5B',

  // brand greens (fills keep the existing brand tone; text aliases brighten)
  green: '#2E7D5B',
  greenBtn: '#2E7D5B',
  greenBright: '#2E7D5B',
  greenDark: '#2E7D5B',
  greenDeep: '#2E7D5B',
  q1Btn: '#2E7D5B',
  greenSoft: 'rgba(88, 167, 126, 0.16)',
  greenTint: 'rgba(88, 167, 126, 0.12)',
  green20: 'rgba(88, 167, 126, 0.16)',
  green10: 'rgba(88, 167, 126, 0.10)',
  lightGreen: 'rgba(88, 167, 126, 0.16)',
  veryLightGreen: 'rgba(88, 167, 126, 0.10)',
  cardGreen: 'rgba(88, 167, 126, 0.14)',
  matchBg: 'rgba(88, 167, 126, 0.08)',
  profileBg: 'rgba(88, 167, 126, 0.16)',
  q1Bg: 'rgba(88, 167, 126, 0.10)',

  // semantic fills
  red: '#C22B2B',
  danger: '#C22B2B',
  redSoft: 'rgba(194, 43, 43, 0.18)',
  redDark: '#E05C5C',
  badge: '#F87171',
  orange: '#B45309',
  warning: '#B45309',
  gold: '#B45309',
  yellow: '#FBBF24',
  amber: '#DDA15E',
  ok: '#22C55E',
  blue: '#2F80ED',
  blueBtn: '#2F80ED',
  dateBlue: '#2F80ED',
  blue1: 'rgba(96, 165, 250, 0.16)',
  blue2: 'rgba(96, 165, 250, 0.16)',
  blueSoft: 'rgba(96, 165, 250, 0.16)',

  // frosted-glass pane (base fill, backdrop, veil, specular rim, divider)
  glassBase: 'rgba(176, 228, 204, 0.05)',
  glassBack: 'rgba(18, 42, 35, 0.55)',
  glassVeil: 'rgba(10, 21, 18, 0.45)',
  glassEdge: 'rgba(176, 228, 204, 0.10)',
  glassRim: 'rgba(176, 228, 204, 0.18)',
  glassDivider: 'rgba(176, 228, 204, 0.20)',

  // decorative tints
  lavenderBg: 'rgba(167, 139, 250, 0.14)',
  lavenderBorder: 'rgba(167, 139, 250, 0.35)',
  beigeBg: 'rgba(226, 200, 155, 0.14)',
  beigeBorder: 'rgba(226, 200, 155, 0.35)',
  promoBg: 'rgba(248, 113, 113, 0.10)',
  promoBorder: 'rgba(248, 113, 113, 0.24)',
};

/** Brighter tone for keys used as text/icons on the dark page. */
const ACCENT_TEXT: Palette = {
  green: '#58A77E',
  greenBtn: '#58A77E',
  greenBright: '#58A77E',
  greenDark: '#86C4A2',
  greenDeep: '#B9E7D0',
  q1Btn: '#58A77E',
  tray: '#58A77E',
  greenLine: '#58A77E',
  greenBorder: '#86C4A2',
  mint: '#B9E7D0',
  ok: '#4ADE80',
  red: '#F87171',
  danger: '#F87171',
  redDark: '#FCA5A5',
  badge: '#F87171',
  orange: '#FBBF24',
  warning: '#FBBF24',
  gold: '#FBBF24',
  yellow: '#FBBF24',
  amber: '#E7B26A',
  blue: '#60A5FA',
  blueBtn: '#8CC9FA',
  dateBlue: '#60A5FA',
  blue1: '#60A5FA',
  blue2: '#60A5FA',
  blueSoft: '#60A5FA',
  white: '#FFFFFF',
};

/** Exact light-value fallback for palette keys not in DARK_BY_KEY. */
const DARK_BY_VALUE: Palette = {
  '#F7F9F8': DARK_PAGE,
  '#FFFFFF': DARK_SURFACE,
  '#F4F7F5': '#0F211C',
  '#F1FBF5': DARK_SURFACE,
  '#17251E': '#E6F4EC',
  '#52645A': '#A9C9B8',
  '#5F7268': '#7FA494',
  '#6E6E6E': '#7FA494',
  '#737373': '#9FB5AA',
  '#666666': '#9FB5AA',
  '#A8A8A8': '#7FA494',
  '#9E9E9E': '#7FA494',
  '#2E7D5B': '#2E7D5B',
  '#059A55': '#2E7D5B',
  '#0E7A00': '#2E7D5B',
  '#4DBB7B': '#2E7D5B',
  '#69C994': '#2E7D5B',
  '#7DCB9E': '#2E7D5B',
  '#B91C1C': '#C22B2B',
  '#9E1B1B': '#E05C5C',
  '#B45309': '#B45309',
  '#2F80ED': '#2F80ED',
  '#0766D8': '#2F80ED',
  '#1749B8': '#2F80ED',
  '#86BCFD': '#2F80ED',
  '#1B6FBF': '#2F80ED',
  '#4E90D8': '#2F80ED',
  '#DCE5DF': HAIRLINE,
  '#D8ECE1': HAIRLINE,
  '#E7EEE9': HAIRLINE,
  '#E2E2E2': HAIRLINE,
  '#D6D6D6': HAIRLINE,
  '#D9DEDB': HAIRLINE,
  '#E4E7E9': HAIRLINE,
  '#777777': 'rgba(176, 228, 204, 0.32)',
  '#E3EEFB': 'rgba(96, 165, 250, 0.16)',
  '#EFF6FF': 'rgba(96, 165, 250, 0.12)',
  '#E7F1F8': DARK_SURFACE,
  '#DDF6E7': 'rgba(88, 167, 126, 0.16)',
  '#DCEEE8': 'rgba(88, 167, 126, 0.14)',
  '#F0F8F4': 'rgba(88, 167, 126, 0.10)',
  '#D9EEE2': 'rgba(88, 167, 126, 0.16)',
  '#B5DCC6': 'rgba(88, 167, 126, 0.24)',
  '#F2FBF5': 'rgba(88, 167, 126, 0.10)',
  '#F2EFE9': DARK_SURFACE,
  '#FFC800': '#FBBF24',
  '#DDA15E': '#DDA15E',
  '#08A600': '#22C55E',
  '#000000': HAIRLINE_STRONG,

  /* Text and icons the light screens drew with raw literals. */
  'rgba(12,37,27,0.65)': 'rgba(230, 244, 236, 0.65)',
  'rgba(12,37,27,0.7)': 'rgba(230, 244, 236, 0.72)',
  '#3F5A50': '#A9C9B8',
  '#5B6663': '#A9C9B8',
  '#C25454': '#F87171',
  '#4E6A5F': '#B9D7C7',
  '#2A5040': '#B9E7D0',
  '#1F6B4F': '#86C4A2',
  '#3A3042': '#D8C9EA',
  '#3A3A3A': '#C9D6CF',
  '#1E1A45': '#C7C3F2',
  '#7B4F8E': '#C9A7DC',
  '#0F3D2E': '#B9E7D0',
  '#4A4A4A': '#C9D6CF',
  '#222222': '#E6F4EC',
  '#333333': '#D9E6DF',
  '#111111': '#E6F4EC',
  '#080808': '#E6F4EC',
  '#0A0A0A': '#E6F4EC',

  /* Pastel promo surfaces that raw styles still carry. */
  '#E8F3FF': 'rgba(96, 165, 250, 0.12)',
  '#C6E0FA': 'rgba(96, 165, 250, 0.32)',
  '#F8EBD8': 'rgba(226, 200, 155, 0.14)',
  '#F0D9AE': 'rgba(226, 200, 155, 0.35)',
  '#FDEBEB': 'rgba(248, 113, 113, 0.10)',
  '#F2C2C2': 'rgba(248, 113, 113, 0.24)',
  '#FBF0DC': 'rgba(226, 200, 155, 0.14)',
  '#EFD6A6': 'rgba(226, 200, 155, 0.35)',
  '#E2F5E9': 'rgba(88, 167, 126, 0.14)',
  '#DDF8E9': 'rgba(88, 167, 126, 0.16)',
  '#E7E4FA': 'rgba(167, 139, 250, 0.14)',
  '#C9C2ED': 'rgba(167, 139, 250, 0.35)',

  /* Menu-card washes still carried as raw literals in card data. */
  '#FFF2F2': 'rgba(248, 113, 113, 0.10)',
  '#F6CFCF': 'rgba(248, 113, 113, 0.24)',
  '#F6D5D5': 'rgba(248, 113, 113, 0.24)',
  '#FBF0ED': 'rgba(248, 113, 113, 0.10)',
  '#F0D2CC': 'rgba(248, 113, 113, 0.24)',
  '#FDECF2': 'rgba(236, 72, 153, 0.12)',
  '#F3C2D2': 'rgba(236, 72, 153, 0.30)',
  '#EFE9FB': 'rgba(167, 139, 250, 0.14)',
  '#D9C9F2': 'rgba(167, 139, 250, 0.35)',
  '#E7F6EC': 'rgba(88, 167, 126, 0.14)',
  '#BFE7CD': 'rgba(88, 167, 126, 0.32)',
  '#CCE6D6': 'rgba(88, 167, 126, 0.16)',
  '#EBE8FA': 'rgba(167, 139, 250, 0.14)',
};

type Rgb = { r: number; g: number; b: number; a: number };

function parse(value: string): Rgb | null {
  const v = value.trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v);
  if (hex) {
    const h = hex[1];
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
      a: 1,
    };
  }
  const rgba = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(v);
  if (rgba) {
    return {
      r: Number(rgba[1]),
      g: Number(rgba[2]),
      b: Number(rgba[3]),
      a: rgba[4] == null ? 1 : Number(rgba[4]),
    };
  }
  return null;
}

function rgbaOf({ r, g, b }: Rgb, a: number): string {
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function luminance({ r, g, b }: Rgb): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function mixWithLight(c: Rgb, amount: number): string {
  const target = { r: 230, g: 244, b: 236 };
  return `rgb(${Math.round(c.r + (target.r - c.r) * amount)}, ${Math.round(
    c.g + (target.g - c.g) * amount,
  )}, ${Math.round(c.b + (target.b - c.b) * amount)})`;
}

/** Best-effort mapping for values the tables above do not know. */
function fallback(value: string): string {
  if (value === 'transparent' || value === 'none') return value;
  const c = parse(value);
  if (!c) return value;

  if (value.toLowerCase().startsWith('rgba')) {
    // Black/white veils (image overlays) stay as they are.
    const neutral = Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b) < 12;
    if (neutral && (c.r < 40 || c.r > 235)) return value;
    return rgbaOf({ r: 176, g: 228, b: 204, a: 1 }, Math.min(c.a * 0.7, 0.2));
  }

  const lum = luminance(c);
  const sat = Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b);
  if (lum > 0.62) {
    return sat > 18 ? rgbaOf(c, 0.16) : HAIRLINE_SOFT;
  }
  if (lum < 0.16) {
    return mixWithLight(c, 0.45);
  }
  return mixWithLight(c, 0.35);
}

function darkFill(key: string, base: string): string {
  if (key === 'white') return DARK_SURFACE;
  return base;
}

function darkText(key: string, base: string): string {
  const accent = ACCENT_TEXT[key];
  if (accent) return accent;
  const c = parse(base);
  if (c && luminance(c) < 0.2) return mixWithLight(c, 0.4);
  return base;
}

function darkBorder(key: string, base: string): string {
  const accent = ACCENT_TEXT[key];
  if (accent) {
    const c = parse(accent);
    return c ? rgbaOf(c, 0.45) : HAIRLINE_STRONG;
  }
  if (base.startsWith('rgba')) return base;
  const c = parse(base);
  if (c && luminance(c) < 0.35) return rgbaOf(c, 0.45);
  return HAIRLINE_STRONG;
}

export function darkPalette<L extends Palette>(light: L): AppColorsOf<L> {
  const out: Palette = {};
  for (const key of Object.keys(light)) {
    const value = light[key];
    const base = DARK_BY_KEY[key] ?? DARK_BY_VALUE[value] ?? fallback(value);
    out[key] = base;
    out[`${key}Text`] = darkText(key, base);
    out[`${key}Fill`] = darkFill(key, base);
    out[`${key}Border`] = darkBorder(key, base);
  }
  return out as AppColorsOf<L>;
}

function lightPalette<L extends Palette>(light: L): AppColorsOf<L> {
  const out: Palette = {};
  for (const key of Object.keys(light)) {
    const value = light[key];
    out[key] = value;
    out[`${key}Text`] = value;
    out[`${key}Fill`] = value;
    out[`${key}Border`] = value;
  }
  return out as AppColorsOf<L>;
}

/** The screen's light palette, swapped to the active theme. */
export function useAppColors<L extends Palette>(light: L): AppColorsOf<L> {
  const { isDark } = useTheme();
  return useMemo(
    () => (isDark ? darkPalette(light) : lightPalette(light)),
    [isDark, light],
  );
}

/**
 * Maps a raw light literal to its dark counterpart through the same tables the
 * palettes use. Identity in light mode, so screens that carry card colors as
 * module-level strings can theme those surfaces without rewriting their data.
 */
export function useThemedColor(): (light: string) => string {
  const { isDark } = useTheme();
  return useMemo(
    () => (isDark ? (value: string) => DARK_BY_VALUE[value] ?? fallback(value) : (value: string) => value),
    [isDark],
  );
}

/** Memoized StyleSheet factory bound to the active palette. */
export function usePaletteStyles<C, S>(factory: (colors: C) => S, colors: C): S {
  return useMemo(() => factory(colors), [factory, colors]);
}
