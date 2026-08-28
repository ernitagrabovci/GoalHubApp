import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, type ThemeColors } from '@/constants/theme';
import { useLanguage } from '@/lib/i18n';
import { useTheme, useThemedStyles } from '@/lib/theme';
import { MAIN_TABS, SIGNED_OUT_TABS } from '@/lib/tabs';
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
  'teams',
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
  const tabs = user ? MAIN_TABS : SIGNED_OUT_TABS;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.mint,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarButton: HapticTab,
        tabBarStyle: [
          styles.tabBar,
          { backgroundColor: isDark ? 'rgba(13, 31, 28, 0.9)' : 'rgba(238, 244, 240, 0.92)' },
        ],
        tabBarLabelStyle: styles.tabBarLabel,
        sceneStyle: { backgroundColor: colors.background },
      }}>
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
      {HIDDEN_ROUTES.map((name) => (
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
