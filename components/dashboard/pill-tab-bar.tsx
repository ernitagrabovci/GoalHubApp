import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * Floating pill bottom navigation for the administrator dashboard.
 * Matches the reference: rounded floating container with Home (active,
 * pale-green capsule) / Përdoruesit / Pagesat / Chat.
 */

const C = {
  bg: '#FAFBFA',
  pillBg: '#FFFFFF',
  frame: '#000000',
  activeBg: '#DDF8E9',
  green: '#159447',
  muted: '#9A9A9A',
  text: '#111111',
};

type MciName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type Item = { name: string; label: string; icon: MciName };

const ITEMS: Item[] = [
  { name: 'index', label: 'Home', icon: 'home-variant' },
  { name: 'users', label: 'Përdoruesit', icon: 'account-group-outline' },
  { name: 'fees', label: 'Pagesat', icon: 'cash-multiple' },
  { name: 'chat', label: 'Chat', icon: 'chat-outline' },
  { name: 'profile', label: 'Profili', icon: 'account-outline' },
];

export function PillTabBar({ state, navigation, insets }: BottomTabBarProps) {
  return (
    <View style={[styles.area, { paddingBottom: Math.max(insets.bottom, 14) }]}>
      <View style={styles.pill}>
        {ITEMS.map((item) => {
          const route = state.routes.find((r) => r.name === item.name);
          const focused = !!route && state.index === state.routes.indexOf(route);
          const color = focused ? C.green : C.muted;
          const onPress = () => {
            if (!route) return;
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };
          return (
            <Pressable key={item.name} onPress={onPress} style={styles.wrap} accessibilityRole="button">
              <View style={[styles.item, focused && styles.itemActive]}>
                <MaterialCommunityIcons name={item.icon} size={I(21)} color={color} />
                <Text style={[styles.label, { color }]} numberOfLines={1}>
                  {item.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create(scaled({
  area: {
    backgroundColor: C.bg,
    paddingTop: 8,
    paddingHorizontal: 24,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.pillBg,
    borderWidth: 1,
    borderColor: C.frame,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  wrap: {
    flex: 1,
    alignItems: 'center',
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 6,
    gap: 2,
  },
  itemActive: {
    backgroundColor: C.activeBg,
  },
  label: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 9.5,
  },
}));
