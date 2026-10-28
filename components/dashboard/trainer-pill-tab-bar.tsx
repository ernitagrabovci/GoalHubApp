import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter, type Href } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import type { ComponentProps } from 'react';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { badges } from '@/lib/api/notifications';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * Floating pill bottom navigation for the trainer dashboard.
 * Matches the admin bar: a full-width floating container with three items —
 * Home (active, pale-green capsule), Chat and Profile.
 *
 * "Chat" is not a tab — tapping it opens the messages page as a full-screen
 * root route, so the pill bar disappears and a back arrow returns. "Profile"
 * works the same way for the player, whose own page lives on a root route.
 */

const C = {
  bg: '#FAFBFA',
  pillBg: '#F5F5F5',
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

export function TrainerPillTabBar({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const router = useRouter();
  const { user, token } = useSession();
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

  /** Items that leave the tab bar behind and open a root route instead. */
  const fullScreens: Record<string, { path: Href; label: string }> = {
    chat: { path: '/mesazhet-trajner', label: 'Mesazhet' },
    // Profile is per-role; the player is the only role with a page of its own.
    ...(user?.role === 'player' ? { profile: { path: '/profili-lojtarit', label: 'Profili' } } : {}),
  };

  return (
    <View style={[styles.area, { paddingBottom: Math.max(insets.bottom, 18) }]}>
      <View style={styles.pill}>
        {ITEMS.map((item) => {
          // "Chat" opens the messages page of its own instead of switching to
          // the old themed tab.
          const full = fullScreens[item.name];
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
                    <MaterialCommunityIcons name={item.icon} size={I(22)} color={C.muted} />
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
            const event = emitter.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigateToTab(route.key);
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
    paddingVertical: 6,
    paddingHorizontal: 7,
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
    fontSize: 12,
  },
}));
