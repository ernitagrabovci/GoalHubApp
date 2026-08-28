import { DarkTheme, type Theme } from '@react-navigation/native';

/**
 * GoalHub "Mint" design system — two palettes (dark + light).
 * Matches the GoalHub webapp frontend: green background, mint foreground,
 * emerald accents, forest borders.
 */

export type ThemeColors = {
  // brand surfaces
  background: string;
  /** Translucent glass surface — cards/rows over the ambient background read as frosted glass. */
  surface: string;
  surfaceAlt: string;
  forest: string;
  border: string;
  borderSoft: string;

  /** Mint glass edge for frosted panels, matches the Home glassmorphism. */
  glassBorder: string;

  // brand accents
  emerald: string;
  mint: string;
  mintDim: string;

  // text
  text: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;
  white: string;

  // semantic / role colors (from the webapp identity)
  danger: string;
  warning: string;
  info: string;
  purple: string;
  player: string;
};

/** Dark "Dark Mint" palette. */
export const DarkColors: ThemeColors = {
  // brand surfaces
  background: '#091413',
  surface: 'rgba(13, 31, 28, 0.6)',
  surfaceAlt: '#112824',
  forest: '#285A48',
  border: '#285A48',
  borderSoft: '#1B3A31',
  glassBorder: 'rgba(176, 228, 204, 0.18)',

  // brand accents
  emerald: '#408A71',
  mint: '#B0E4CC',
  mintDim: '#86C2A4',

  // text
  text: '#B0E4CC',
  textSecondary: '#408A71',
  textMuted: '#4F8A70',
  textOnPrimary: '#091413',
  white: '#FFFFFF',

  // semantic / role colors
  danger: '#E24B4A',
  warning: '#F5A623',
  info: '#185FA5',
  purple: '#534AB7',
  player: '#F5A623',
};

/** Light "Light Mint" palette. */
export const LightColors: ThemeColors = {
  // brand surfaces
  background: '#EEF4F0',
  surface: 'rgba(255, 255, 255, 0.72)',
  surfaceAlt: '#E3ECE7',
  forest: '#B7CDC2',
  border: '#C0D6CB',
  borderSoft: '#D7E5DE',
  glassBorder: 'rgba(40, 90, 72, 0.18)',

  // brand accents
  emerald: '#2E7D5B',
  mint: '#1F6B4F',
  mintDim: '#3C8669',

  // text
  text: '#0C251B',
  textSecondary: '#2E7D5B',
  textMuted: '#6B887B',
  textOnPrimary: '#FFFFFF',
  white: '#FFFFFF',

  // semantic / role colors
  danger: '#D64040',
  warning: '#C97F0D',
  info: '#1B5FA0',
  purple: '#5A50A8',
  player: '#D18A12',
};

export type ThemeMode = 'dark' | 'light';

export const themes: Record<ThemeMode, ThemeColors> = {
  dark: DarkColors,
  light: LightColors,
};

/** Back-compat alias — screens migrate to useTheme()/useThemedStyles() over time. */
export const Colors = DarkColors;

export const Fonts = {
  heading: 'SpaceGrotesk_700Bold',
  headingSemiBold: 'SpaceGrotesk_600SemiBold',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/** React Navigation theme so headers/tabs match the GoalHub brand (dark). */
export const darkNavigationTheme: Theme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: DarkColors.mint,
    background: DarkColors.background,
    card: DarkColors.surface,
    text: DarkColors.mint,
    border: DarkColors.border,
    notification: DarkColors.mint,
  },
};

/** React Navigation theme for light mode. */
export const lightNavigationTheme: Theme = {
  ...DarkTheme,
  dark: false,
  colors: {
    ...DarkTheme.colors,
    primary: LightColors.mint,
    background: LightColors.background,
    card: LightColors.surface,
    text: LightColors.text,
    border: LightColors.border,
    notification: LightColors.mint,
  },
};

/** Back-compat alias — _layout.tsx migrates to the pair of nav themes. */
export const navigationTheme = darkNavigationTheme;
