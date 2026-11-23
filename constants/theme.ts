import { DarkTheme, type Theme } from 'expo-router';

/**
 * GoalHub design system.
 *
 * The canonical brand anchor is #2E7D5B. Every green in the app derives from
 * this ramp; semantic colours (success/warning/danger/info) are intentionally
 * distinct so colour alone never carries meaning.
 */

export const Brand = {
  50: '#F0F8F4',
  100: '#D9EEE2',
  200: '#B5DCC6',
  300: '#86C4A2',
  400: '#58A77E',
  500: '#398F68',
  600: '#2E7D5B',
  700: '#256649',
  800: '#1D513B',
  900: '#143B2B',
} as const;

/** WCAG-verified semantic tones for the light theme. */
export const Semantic = {
  success: '#15803D',
  successSoft: '#DCFCE7',
  warning: '#B45309',
  warningSoft: '#FEF3C7',
  danger: '#B91C1C',
  dangerSoft: '#FEE2E2',
  info: '#1D4ED8',
  infoSoft: '#DBEAFE',
} as const;

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
  /** Canonical brand colour for primary actions and links. */
  brand: string;
  /** Soft brand wash for selected/active backgrounds. */
  brandSoft: string;
  /** Pressed/hover brand tone. */
  brandStrong: string;
  /** Very light brand tint for surfaces. */
  brandTint: string;

  // text
  text: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;
  white: string;

  // semantic / role colors
  danger: string;
  warning: string;
  info: string;
  purple: string;
  player: string;

  // semantic surfaces
  success: string;
  successSoft: string;
  warningSoft: string;
  dangerSoft: string;
  infoSoft: string;

  // interaction
  focusRing: string;
  shadow: string;
  overlay: string;
};

/** Dark "Dark Mint" palette. */
export const DarkColors: ThemeColors = {
  // brand surfaces
  background: '#0A1512',
  surface: 'rgba(16, 36, 31, 0.72)',
  surfaceAlt: '#122A23',
  forest: '#2A5B48',
  border: '#2A5B48',
  borderSoft: '#1B3A31',
  glassBorder: 'rgba(176, 228, 204, 0.20)',

  // brand accents
  emerald: Brand[400],
  mint: '#B9E7D0',
  mintDim: '#8CC9AA',
  brand: Brand[400],
  brandSoft: 'rgba(88, 167, 126, 0.18)',
  brandStrong: Brand[300],
  brandTint: 'rgba(88, 167, 126, 0.10)',

  // text
  text: '#E6F4EC',
  textSecondary: '#A9C9B8',
  textMuted: '#7FA494',
  textOnPrimary: '#08120F',
  white: '#FFFFFF',

  // semantic / role colors
  danger: '#F87171',
  warning: '#FBBF24',
  info: '#60A5FA',
  purple: '#A78BFA',
  player: '#FBBF24',

  // semantic surfaces
  success: '#4ADE80',
  successSoft: 'rgba(74, 222, 128, 0.16)',
  warningSoft: 'rgba(251, 191, 36, 0.16)',
  dangerSoft: 'rgba(248, 113, 113, 0.16)',
  infoSoft: 'rgba(96, 165, 250, 0.16)',

  // interaction
  focusRing: '#B9E7D0',
  shadow: 'rgba(0, 0, 0, 0.45)',
  overlay: 'rgba(3, 10, 8, 0.62)',
};

/** Light "Light Mint" palette. */
export const LightColors: ThemeColors = {
  // brand surfaces
  background: '#F7F9F8',
  surface: 'rgba(255, 255, 255, 0.80)',
  surfaceAlt: '#EFF3F1',
  forest: '#DCE5DF',
  border: '#DCE5DF',
  borderSoft: '#E8EFEB',
  glassBorder: 'rgba(46, 125, 91, 0.16)',

  // brand accents
  emerald: Brand[600],
  mint: '#1F6B4F',
  mintDim: '#3C8669',
  brand: Brand[600],
  brandSoft: Brand[100],
  brandStrong: Brand[700],
  brandTint: Brand[50],

  // text
  text: '#17251E',
  textSecondary: '#52645A',
  textMuted: '#5F7268',
  textOnPrimary: '#FFFFFF',
  white: '#FFFFFF',

  // semantic / role colors
  danger: Semantic.danger,
  warning: Semantic.warning,
  info: Semantic.info,
  purple: '#6D28D9',
  player: '#A16207',

  // semantic surfaces
  success: Semantic.success,
  successSoft: Semantic.successSoft,
  warningSoft: Semantic.warningSoft,
  dangerSoft: Semantic.dangerSoft,
  infoSoft: Semantic.infoSoft,

  // interaction
  focusRing: Brand[600],
  shadow: 'rgba(11, 31, 23, 0.12)',
  overlay: 'rgba(10, 21, 18, 0.45)',
};

export type ThemeMode = 'dark' | 'light';

export const themes: Record<ThemeMode, ThemeColors> = {
  dark: DarkColors,
  light: LightColors,
};

/* Every screen reads its font through this map, so swapping the family here
   restyles the whole app. */
export const Fonts = {
  heading: 'Outfit_700Bold',
  headingSemiBold: 'Outfit_600SemiBold',
  body: 'Outfit_400Regular',
  bodyMedium: 'Outfit_500Medium',
  bodySemiBold: 'Outfit_600SemiBold',
  bodyBold: 'Outfit_700Bold',
  bodyBlack: 'Outfit_900Black',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  huge: 48,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/** Shared type scale. Sizes are dp; no text scales below 10. */
export const TypeScale = {
  display: { fontFamily: Fonts.heading, fontSize: 34, lineHeight: 40, letterSpacing: -0.8 },
  title: { fontFamily: Fonts.heading, fontSize: 28, lineHeight: 34, letterSpacing: -0.6 },
  h2: { fontFamily: Fonts.headingSemiBold, fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  h3: { fontFamily: Fonts.headingSemiBold, fontSize: 18, lineHeight: 24, letterSpacing: -0.2 },
  body: { fontFamily: Fonts.body, fontSize: 15, lineHeight: 22 },
  bodySm: { fontFamily: Fonts.body, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: Fonts.bodySemiBold, fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },
  overline: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase' as const,
  },
} as const;

/** Low-opacity elevation; never the only affordance for pressability. */
export const Elevation = {
  sm: {
    shadowColor: '#0B1F17',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#0B1F17',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0B1F17',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
} as const;

/* `background` is 'transparent' rather than the palette tone on purpose: the
   native stack paints it onto the ScreenStack container (nativeContainerStyle in
   NativeStackView), which sits ABOVE the root <AppBackground /> and would hide the
   wallpaper. Screens already paint their own backgrounds transparent. */
/** React Navigation theme so headers/tabs match the GoalHub brand (dark). */
export const darkNavigationTheme: Theme = {
  ...DarkTheme,
  dark: true,
  colors: {
    ...DarkTheme.colors,
    primary: DarkColors.mint,
    background: 'transparent',
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
    background: 'transparent',
    card: LightColors.surface,
    text: LightColors.text,
    border: LightColors.border,
    notification: LightColors.mint,
  },
};
