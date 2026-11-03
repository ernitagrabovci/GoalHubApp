import type { IconSymbolName } from '@/components/ui/icon-symbol';

export type TabDef = {
  name: string;
  title: string;
  icon: IconSymbolName;
};

/**
 * Administrator dashboard bar — Home and the finance tab. "Përdoruesit",
 * "Mesazhet" and "Profili" are full-screen root routes drawn by PillTabBar,
 * so they are not tabs.
 */
export const ADMIN_TABS: TabDef[] = [
  { name: 'index', title: 'Home', icon: 'house.fill' },
  { name: 'pagesat', title: 'Pagesat', icon: 'dollarsign.circle.fill' },
];

/**
 * Every non-admin signed-in role's bar — Home plus Profile. Profile is a real
 * tab (the bar draws its own pill for it); Chat is a full-screen root route.
 * Keeping profile visible matters: hidden tabs are dropped from the state the
 * custom bar receives, which made its pill unclickable.
 */
export const PILL_TABS: TabDef[] = [
  { name: 'index', title: 'Home', icon: 'house.fill' },
  { name: 'profile', title: 'Profile', icon: 'person.fill' },
];

/** Shown in the tab bar when nobody is signed in (transient state). */
export const SIGNED_OUT_TABS: TabDef[] = [
  { name: 'index', title: 'Home', icon: 'house.fill' },
  { name: 'explore', title: 'Modules', icon: 'square.grid.2x2.fill' },
];
