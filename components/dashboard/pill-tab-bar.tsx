import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter, type Href } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { badges } from '@/lib/api/notifications';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * Floating pill bottom navigation for the administrator dashboard.
 * Matches the reference: rounded floating container with Home (active,
 * pale-green capsule) / Përdoruesit / Pagesat / Chat / Profili.
 *
 * "Përdoruesit", "Profili" and "Mesazhet" are not tabs — tapping them opens a
 * full-screen root route, so the pill bar disappears and a back arrow returns.
 */

const C = {
  bg: '#FAFBFA',
  pillBg: '#F5F5F5',
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
  { name: 'pagesat', label: 'Pagesat', icon: 'cash-multiple' },
  { name: 'chat', label: 'Mesazhet', icon: 'chat-outline' },
  { name: 'profile', label: 'Profili', icon: 'account-outline' },
];

/** Items that leave the tab bar behind and open a root route instead. */
const FULL_SCREEN: Record<string, { path: Href; label: string }> = {
  users: { path: '/perdoruesit', label: 'Lista e përdoruesve' },
  chat: { path: '/mesazhet', label: 'Mesazhet' },
  profile: { path: '/club-profile', label: 'Profili i klubit' },
};

export function PillTabBar({ state, navigation, insets }: BottomTabBarProps) {
  const router = useRouter();
  const { token } = useSession();
  const [unread, setUnread] = useState(0);

  /* Keeps the Chat pill's counter current without opening the messages page. */
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    const refresh = () => {
      badges(token, controller.signal)
        .then((res) => {
          if (!controller.signal.aborted) setUnread(res.messages);
        })
        .catch(() => {});
    };

    refresh();
    const timer = setInterval(refresh, 15000);
    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, [token, state.index]);

  // "Pagesat" is a full-screen page with its own back arrow, so the pill only
  // steals vertical space there.
  if (state.routes[state.index]?.name === 'pagesat') return null;

  return (
    <View style={[styles.area, { paddingBottom: Math.max(insets.bottom, 14) }]}>
      <View style={styles.pill}>
        {ITEMS.map((item) => {
          // "Profili" and "Mesazhet" open full-screen pages of their own
          // instead of switching to the old themed tabs.
          const full = FULL_SCREEN[item.name];
          if (full) {
            return (
              <Pressable
                key={item.name}
                onPress={() => router.push(full.path)}
                style={styles.wrap}
                accessibilityRole="button"
                accessibilityLabel={full.label}
              >
                <View style={styles.item}>
                  <View style={styles.iconWrap}>
                    <MaterialCommunityIcons name={item.icon} size={I(21)} color={C.muted} />
                    {item.name === 'chat' && unread > 0 ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>
                          {unread > 99 ? '99+' : unread}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.label, { color: C.muted }]} numberOfLines={1}>
                    {item.label}
                  </Text>
                </View>
              </Pressable>
            );
          }

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
  iconWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -9,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: '#E03131',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 8,
    lineHeight: 10,
    color: '#FFFFFF',
  },
  label: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 9.5,
  },
}));
