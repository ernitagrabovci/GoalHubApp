import { useTheme } from '@/lib/theme';

/**
 * Theme-aware values for the frosted "glass" panes (blur tint + specular
 * gradients). Light mode keeps the original white/neutral recipe byte for
 * byte; dark mode swaps the specular whites for the app's mint hairline
 * family so the same frost reads as glass on the dark page.
 */
export type GlassStyle = {
  tint: 'light' | 'dark';
  gloss: readonly [string, string, string];
  sheen: readonly [string, string];
  highlight: readonly [string, string, string];
  sweep: readonly [string, string, string, string];
  sweepSoft: readonly [string, string, string];
};

const LIGHT: GlassStyle = {
  tint: 'light',
  gloss: ['rgba(180,188,201,0.30)', 'rgba(216,222,231,0.15)', 'rgba(245,245,245,0.80)'],
  sheen: ['rgba(245,245,245,0.55)', 'rgba(245,245,245,0.00)'],
  highlight: ['rgba(255,255,255,0.38)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0.24)'],
  sweep: [
    'rgba(255,255,255,0)',
    'rgba(255,255,255,0.78)',
    'rgba(255,255,255,0.55)',
    'rgba(255,255,255,0)',
  ],
  sweepSoft: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.55)', 'rgba(255,255,255,0)'],
};

const DARK: GlassStyle = {
  tint: 'dark',
  gloss: ['rgba(176,228,204,0.14)', 'rgba(176,228,204,0.06)', 'rgba(18,42,35,0.55)'],
  sheen: ['rgba(176,228,204,0.10)', 'rgba(176,228,204,0.00)'],
  highlight: ['rgba(176,228,204,0.16)', 'rgba(176,228,204,0.02)', 'rgba(176,228,204,0.09)'],
  sweep: [
    'rgba(176,228,204,0)',
    'rgba(176,228,204,0.22)',
    'rgba(176,228,204,0.14)',
    'rgba(176,228,204,0)',
  ],
  sweepSoft: ['rgba(176,228,204,0)', 'rgba(176,228,204,0.14)', 'rgba(176,228,204,0)'],
};

export function useGlass(): GlassStyle {
  const { isDark } = useTheme();
  return isDark ? DARK : LIGHT;
}
