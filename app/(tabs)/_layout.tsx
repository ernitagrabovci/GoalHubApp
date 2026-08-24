import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts } from '@/constants/theme';
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
  'academy',
  'academy-create',
  'tactical',
  'tactical-editor',
  'drills',
  'drill',
  'groups',
  'medical',
  'injury',
  'injury-create',
  'fees',
  'reports',
  'stats',
  'child',
  'expenses',
  'channel',
  'notifications',
];

export default function TabLayout() {
  const { user } = useSession();
  const tabs = user ? MAIN_TABS : SIGNED_OUT_TABS;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.mint,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarButton: HapticTab,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        sceneStyle: { backgroundColor: Colors.background },
      }}>
      {tabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
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

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopColor: Colors.borderSoft,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabBarLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
  },
});
