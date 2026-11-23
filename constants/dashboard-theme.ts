import { Brand, Semantic } from '@/constants/theme';

/**
 * Palette for the light-only role dashboards (admin, trainer, player, parent,
 * financier) and the floating pill navigation.
 *
 * These screens predate the token layer and consumed a local `C` object each.
 * They now share one derived palette so the five homes read as one product.
 * Keys are a superset of every field the dashboards referenced.
 */
export const DashboardC = {
  bg: '#F7F9F8',
  line: 'rgba(23, 37, 30, 0.03)',

  cardBorder: 'rgba(23, 37, 30, 0.12)',
  statBorder: Brand[300],
  border: '#DCE5DF',

  white: '#FFFFFF',
  text: '#17251E',
  text2: '#52645A',
  gray: '#52645A',
  muted: '#5F7268',
  faint: '#5F7268',

  /* Hero, stat and card text that used to be raw literals on the homes. */
  heroMuted: 'rgba(12,37,27,0.65)',
  heroSub: 'rgba(12,37,27,0.7)',
  statLabel: '#3F5A50',
  statLabelSoft: '#5B6663',
  statDownSub: '#C25454',
  statSubLabel: '#4E6A5F',
  statSubValue: '#2A5040',
  seeAll: '#1F6B4F',
  teamRowName: '#3A3042',
  teamName: '#3A3A3A',
  featTitle: '#1E1A45',
  promoIcon: '#7B4F8E',

  /* Pastel promo surfaces the raw styles still carry. */
  eventIconBg: '#E2F5E9',
  chipAktivBg: '#DDF8E9',
  featCardBg: '#E7E4FA',
  featCardBorder: '#C9C2ED',

  green: Brand[600],
  greenDark: Brand[700],
  greenDeep: Brand[800],
  greenBorder: Brand[400],
  lightGreen: Brand[100],
  veryLightGreen: Brand[50],
  matchBg: '#F4FAF7',
  matchBorder: Brand[200],
  profileBg: Brand[100],

  red: Semantic.danger,
  orange: Semantic.warning,
  gold: Semantic.warning,

  glassBase: 'rgba(255,255,255,0.12)',
  glassEdge: 'rgba(255,255,255,0.95)',
  glassDivider: 'rgba(16,51,38,0.18)',

  lavenderBg: '#F4F0FA',
  lavenderBorder: '#CDBEDD',
  beigeBg: '#F7F0E4',
  beigeBorder: '#E2C89B',
  promoBg: '#FDF1EB',
  promoBorder: 'rgba(185, 28, 28, 0.18)',
} as const;

/** Cockpit palette for the floating bottom navigation. */
export const NavC = {
  bg: '#F7F9F8',
  pillBg: '#FFFFFF',
  frame: 'rgba(23, 37, 30, 0.14)',
  activeBg: Brand[100],
  green: Brand[600],
  muted: '#5F7268',
  text: '#17251E',
  badge: Semantic.danger,
} as const;
