import { useRouter, type Href } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { HomeBackdrop } from '@/components/dashboard/home-backdrop';
import { NavPillItem, type NavIconName } from '@/components/dashboard/nav-pill-item';
import { NavC } from '@/constants/dashboard-theme';
import { useAppColors, usePaletteStyles, type AppColorsOf } from '@/lib/app-theme';
import { Elevation } from '@/constants/theme';
import { badges } from '@/lib/api/notifications';
import { scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * Floating pill bottom navigation for the administrator dashboard.
 *
 * "Përdoruesit", "Profili" and "Mesazhet" are not tabs — tapping them opens a
 * full-screen root route, so the pill bar disappears and a back arrow returns.
 */

type Item = { name: string; label: string; icon: NavIconName };

const ITEMS: Item[] = [
  { name: 'index', label: 'Kryesorja', icon: 'home-variant' },
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

export function PillTabBar({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const C = useAppColors(NavC);
  const styles = usePaletteStyles(createStyles, C);
  const router = useRouter();
  const { token } = useSession();
  const [unread, setUnread] = useState(0);
  const onHome = state.routes[state.index]?.name === 'index';

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
      {onHome ? (
        <View pointerEvents="none" style={styles.backdrop}>
          {/* Same flat green as the home scene. */}
          <HomeBackdrop />
        </View>
      ) : null}
      <View style={styles.pill}>
        {ITEMS.map((item) => {
          // "Profili" and "Mesazhet" open full-screen pages of their own
          // instead of switching to the old themed tabs.
          const full = FULL_SCREEN[item.name];
          if (full) {
            return (
              <NavPillItem
                key={item.name}
                label={item.label}
                icon={item.icon}
                focused={false}
                unread={item.name === 'chat' ? unread : 0}
                onPress={() => router.push(full.path)}
                iconSize={21}
                labelSize={9.5}
              />
            );
          }

          const route = state.routes.find((r) => r.name === item.name);
          const focused = !!route && state.index === state.routes.indexOf(route);
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
            <NavPillItem
              key={item.name}
              label={item.label}
              icon={item.icon}
              focused={focused}
              onPress={onPress}
              iconSize={21}
              labelSize={9.5}
            />
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (C: AppColorsOf<typeof NavC>) => StyleSheet.create(scaled({
  area: {
    paddingTop: 8,
    paddingHorizontal: 27,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: C.pillBgFill,
    borderWidth: 1,
    borderColor: C.frameBorder,
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 6,
    ...Elevation.md,
  },
}));
