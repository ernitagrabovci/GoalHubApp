import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { PillTabBar } from '@/components/dashboard/pill-tab-bar';
import { TrainerPillTabBar } from '@/components/dashboard/trainer-pill-tab-bar';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, type ThemeColors } from '@/constants/theme';
import { useLanguage } from '@/lib/i18n';
import { useTheme, useThemedStyles } from '@/lib/theme';
import { ADMIN_TABS, MAIN_TABS, SIGNED_OUT_TABS, TRAINER_TABS } from '@/lib/tabs';
import { useSession } from '@/lib/session';

/** Secondary feature screens — reachable from Home but hidden from the tab bar. */
const HIDDEN_ROUTES = [
  'players',
  'player',
  'rate',
  'ratings',
  'attendance',
  'trainings',
  'training',
  'matches',
  'match',
  'lineup',
  'admin',
  'academy',
  'academy-create',
  'academy-item',
  'tactical',
  'tactical-editor',
  'drills',
  'drill',
  'group',
  'groups',
  'medical',
  'injury',
  'injury-create',
  'fees',
  'fee',
  'finance',
  'reports',
  'users',
  'user',
  'team',
  'club',
  'competitions',
  'transfers',
  'stats',
  'child',
  'child-attendance',
  'child-ratings',
  'expenses',
  'channel',
  'notifications',
];

export default function TabLayout() {
  const { user } = useSession();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);

  const isAdmin = user?.role === 'administrator';
  const isTrainer = user?.role === 'trainer';
  const isPlayer = user?.role === 'player';
  const isParent = user?.role === 'parent';
  const isFinancier = user?.role === 'financier';
  // Roles with the two-item Home | Chat floating pill (trainer style).
  const twoTabPill = isTrainer || isPlayer || isParent || isFinancier;
  const pillNav = isAdmin || twoTabPill;
  const tabs = !user
    ? SIGNED_OUT_TABS
    : isAdmin
      ? ADMIN_TABS
      : twoTabPill
        ? TRAINER_TABS
        : MAIN_TABS;
  const visible = new Set(tabs.map((tab) => tab.name));

  // Routes present in the navigator but hidden from the bar. Administrator,
  // trainer, player and parent use a custom floating pill; profile stays
  // reachable (header avatar) but hidden.
  const hiddenRoutes = HIDDEN_ROUTES.filter((name) => !visible.has(name));
  const extraHidden = user && pillNav ? ['profile'] : [];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.mint,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarButton: HapticTab,
        tabBarStyle: [
          styles.tabBar,
          pillNav
            ? // Floating pill: the strip behind it blends with the white dashboard,
              // so only the pill frame is visible — no gray band.
              { backgroundColor: '#FAFBFA', borderTopWidth: 0 }
            : { backgroundColor: isDark ? 'rgba(13, 31, 28, 0.9)' : 'rgba(238, 244, 240, 0.92)' },
        ],
        tabBarLabelStyle: styles.tabBarLabel,
        sceneStyle: { backgroundColor: pillNav ? '#FAFBFA' : colors.background },
      }}
      tabBar={
        isAdmin ? (props) => <PillTabBar {...props} />
        : twoTabPill ? (props) => <TrainerPillTabBar {...props} />
        : undefined
      }>
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: t(`tabs.${tab.name}`),
            tabBarIcon: ({ color }) => <IconSymbol size={26} name={tab.icon} color={color} />,
          }}
        />
      ))}
      {hiddenRoutes.map((name) => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
      {extraHidden.map((name) => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
      {/* explore is a visible tab when signed out, hidden-but-reachable when signed in */}
      {user ? <Tabs.Screen name="explore" options={{ href: null }} /> : null}
    </Tabs>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  tabBar: {
    borderTopColor: colors.borderSoft,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabBarLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
  },
});
