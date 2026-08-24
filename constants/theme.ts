import { DarkTheme, type Theme } from '@react-navigation/native';

/**
 * GoalHub "Dark Mint" design system.
 * Matches the GoalHub webapp frontend: near-black green background,
 * mint foreground, emerald accents, forest borders.
 */

export const Colors = {
  // brand surfaces
  background: '#091413',
  surface: '#0D1F1C',
  surfaceAlt: '#112824',
  forest: '#285A48',
  border: '#285A48',
  borderSoft: '#1B3A31',

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

  // semantic / role colors (from the webapp identity)
  danger: '#E24B4A',
  warning: '#F5A623',
  info: '#185FA5',
  purple: '#534AB7',
  player: '#F5A623',
} as const;

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

/** React Navigation theme so headers/tabs match the GoalHub brand. */
export const navigationTheme: Theme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: Colors.mint,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.mint,
    border: Colors.border,
    notification: Colors.mint,
  },
};
