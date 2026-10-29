import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { PillTabBar } from '@/components/dashboard/pill-tab-bar';
import { TrainerPillTabBar } from '@/components/dashboard/trainer-pill-tab-bar';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, type ThemeColors } from '@/constants/theme';
import { useLanguage } from '@/lib/i18n';
import { useTheme, useThemedStyles } from '@/lib/theme';
import { ADMIN_TABS, PILL_TABS, SIGNED_OUT_TABS } from '@/lib/tabs';
import { useSession } from '@/lib/session';

/** Screens present in the navigator but never shown in the tab bar. */
const HIDDEN_ROUTES = ['admin', 'pagesat', 'profile'];

export default function TabLayout() {
  const { user } = useSession();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);

  const isAdmin = user?.role === 'administrator';
  // Every signed-in role uses a custom floating pill; only the administrator's
  // has a real second tab (Pagesat).
  const pillNav = !!user;
  const tabs = !user ? SIGNED_OUT_TABS : isAdmin ? ADMIN_TABS : PILL_TABS;
  const visible = new Set(tabs.map((tab) => tab.name));

  const hiddenRoutes = HIDDEN_ROUTES.filter((name) => !visible.has(name));

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
            ? // Floating pill: the strip behind it is transparent so the app
              // wallpaper shows through and only the pill frame is visible.
              { backgroundColor: 'transparent', borderTopWidth: 0 }
            : { backgroundColor: isDark ? 'rgba(13, 31, 28, 0.9)' : 'rgba(238, 244, 240, 0.92)' },
        ],
        tabBarLabelStyle: styles.tabBarLabel,
        sceneStyle: { backgroundColor: 'transparent' },
      }}
      tabBar={
        isAdmin ? (props) => <PillTabBar {...props} />
        : user ? (props) => <TrainerPillTabBar {...props} />
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
      {/* explore is a visible tab when signed out, hidden-but-reachable when signed in */}
      {user ? [<Tabs.Screen key="explore" name="explore" options={{ href: null }} />] : []}
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
