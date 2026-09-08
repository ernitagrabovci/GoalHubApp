import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * Floating pill bottom navigation for the trainer dashboard.
 * Matches the reference: a centered floating container with only two
 * items — Home (active, pale-green capsule) and Chat.
 */

const C = {
  bg: '#FAFBFA',
  pillBg: '#FFFFFF',
  frame: '#000000',
  activeBg: '#DDF7E8',
  green: '#159447',
  muted: '#9A9A9A',
};

type MciName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type Item = { name: string; label: string; icon: MciName };

const ITEMS: Item[] = [
  { name: 'index', label: 'Home', icon: 'home-variant' },
  { name: 'chat', label: 'Chat', icon: 'chat-outline' },
  { name: 'profile', label: 'Profile', icon: 'account-outline' },
];

export function TrainerPillTabBar({ state, navigation, insets }: BottomTabBarProps) {
  return (
    <View style={[styles.area, { paddingBottom: Math.max(insets.bottom, 18) }]}>
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
                <MaterialCommunityIcons name={item.icon} size={I(22)} color={color} />
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
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.pillBg,
    borderWidth: 1,
    borderColor: C.frame,
    borderRadius: 16,
    paddingVertical: 9,
    paddingHorizontal: 16,
    gap: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
  wrap: {
    alignItems: 'center',
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    paddingVertical: 7,
    paddingHorizontal: 18,
    gap: 3,
  },
  itemActive: {
    backgroundColor: C.activeBg,
  },
  label: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
  },
}));
