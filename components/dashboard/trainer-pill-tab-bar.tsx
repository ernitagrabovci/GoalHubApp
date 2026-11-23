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
import { useLanguage } from '@/lib/i18n';
import { scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * Floating pill bottom navigation for every non-admin signed-in role.
 *
 * "Chat" is not a tab — tapping it opens the messages page as a full-screen
 * root route, so the pill bar disappears and a back arrow returns. "Profile"
 * works the same way for the player, whose own page lives on a root route.
 */

type Item = { name: string; labelKey: string; icon: NavIconName };

const ITEMS: Item[] = [
  { name: 'index', labelKey: 'tabs.index', icon: 'home-variant' },
  { name: 'chat', labelKey: 'module.Messages', icon: 'chat-outline' },
  { name: 'profile', labelKey: 'tabs.profile', icon: 'account-outline' },
];

export function TrainerPillTabBar({ state, emitter, navigateToTab, insets }: BottomTabBarProps) {
  const C = useAppColors(NavC);
  const styles = usePaletteStyles(createStyles, C);
  const router = useRouter();
  const { t } = useLanguage();
  const { user, token } = useSession();
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

  /** Items that leave the tab bar behind and open a root route instead. */
  const fullScreens: Record<string, { path: Href; label: string }> = {
    chat: { path: '/mesazhet-trajner', label: 'Mesazhet' },
    // Profile is per-role; the player is the only role with a page of its own.
    ...(user?.role === 'player' ? { profile: { path: '/profili-lojtarit', label: 'Profili' } } : {}),
  };

  /* Aligns the pill with each dashboard's own horizontal page inset. */
  const sidePad = user?.role === 'financier' ? 24 : 28;

  return (
    <View
      style={[
        styles.area,
        { paddingBottom: Math.max(insets.bottom, 18), paddingHorizontal: sidePad },
      ]}>
      {onHome ? (
        <View pointerEvents="none" style={styles.backdrop}>
          {/* Same flat green as the home scene. */}
          <HomeBackdrop />
        </View>
      ) : null}
      <View style={styles.pill}>
        {ITEMS.map((item) => {
          // "Chat" opens the messages page of its own instead of switching to
          // the old themed tab.
          const full = fullScreens[item.name];
          if (full) {
            return (
              <NavPillItem
                key={item.name}
                label={t(item.labelKey)}
                icon={item.icon}
                focused={false}
                unread={item.name === 'chat' ? unread : 0}
                onPress={() => router.push(full.path)}
                iconSize={22}
                labelSize={12}
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
              label={t(item.labelKey)}
              icon={item.icon}
              focused={focused}
              onPress={onPress}
              iconSize={22}
              labelSize={12}
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
