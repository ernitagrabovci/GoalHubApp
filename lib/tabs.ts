import type { IconSymbolName } from '@/components/ui/icon-symbol';

export type TabDef = {
  name: string;
  title: string;
  icon: IconSymbolName;
};

/** The single bottom bar every signed-in role sees — simple and consistent. */
export const MAIN_TABS: TabDef[] = [
  { name: 'index', title: 'Home', icon: 'house.fill' },
  { name: 'chat', title: 'Chat', icon: 'bubble.left.fill' },
  { name: 'profile', title: 'Profile', icon: 'person.fill' },
];

/** Administrator dashboard bar — rendered as a floating pill (see PillTabBar). */
export const ADMIN_TABS: TabDef[] = [
  { name: 'index', title: 'Home', icon: 'house.fill' },
  { name: 'users', title: 'Përdoruesit', icon: 'person.fill' },
  { name: 'fees', title: 'Pagesat', icon: 'dollarsign.circle.fill' },
  { name: 'chat', title: 'Chat', icon: 'bubble.left.fill' },
];

/** Trainer dashboard bar — Home | Chat, rendered as a floating pill (see TrainerPillTabBar). */
export const TRAINER_TABS: TabDef[] = [
  { name: 'index', title: 'Home', icon: 'house.fill' },
  { name: 'chat', title: 'Chat', icon: 'bubble.left.fill' },
];

/** Shown in the tab bar when nobody is signed in (transient state). */
export const SIGNED_OUT_TABS: TabDef[] = [
  { name: 'index', title: 'Home', icon: 'house.fill' },
  { name: 'explore', title: 'Modules', icon: 'square.grid.2x2.fill' },
];
