import { Tabs } from 'expo-router';
import { StyleSheet } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts } from '@/constants/theme';

export default function TabLayout() {
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
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={26} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Modules',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="square.grid.2x2.fill" color={color} />
          ),
        }}
      />
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
