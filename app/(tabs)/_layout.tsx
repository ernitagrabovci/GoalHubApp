import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts } from '@/constants/theme';
import { ROLE_TABS, SIGNED_OUT_TABS } from '@/lib/tabs';
import { useSession } from '@/lib/session';

export default function TabLayout() {
  const { user } = useSession();
  const tabs = user ? ROLE_TABS[user.role] : SIGNED_OUT_TABS;

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
