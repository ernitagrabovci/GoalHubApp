import type { IconSymbolName } from '@/components/ui/icon-symbol';
import type { Role } from '@/lib/session';

export type TabDef = {
  name: string;
  title: string;
  icon: IconSymbolName;
};

/** Tabs shown for each role — logging in as a different user changes the app. */
export const ROLE_TABS: Record<Role, TabDef[]> = {
  administrator: [
    { name: 'index', title: 'Home', icon: 'house.fill' },
    { name: 'players', title: 'Players', icon: 'person.2.fill' },
    { name: 'fees', title: 'Fees', icon: 'dollarsign.circle.fill' },
    { name: 'messages', title: 'Messages', icon: 'bubble.left.fill' },
  ],
  trainer: [
    { name: 'index', title: 'Home', icon: 'house.fill' },
    { name: 'trainings', title: 'Trainings', icon: 'calendar' },
    { name: 'medical', title: 'Medical', icon: 'stethoscope' },
    { name: 'messages', title: 'Messages', icon: 'bubble.left.fill' },
  ],
  player: [
    { name: 'index', title: 'Home', icon: 'house.fill' },
    { name: 'stats', title: 'My Stats', icon: 'chart.bar.fill' },
    { name: 'fees', title: 'Fees', icon: 'dollarsign.circle.fill' },
    { name: 'messages', title: 'Messages', icon: 'bubble.left.fill' },
  ],
  parent: [
    { name: 'index', title: 'Home', icon: 'house.fill' },
    { name: 'child', title: 'My Child', icon: 'person.fill' },
    { name: 'fees', title: 'Fees', icon: 'dollarsign.circle.fill' },
    { name: 'messages', title: 'Messages', icon: 'bubble.left.fill' },
  ],
  financier: [
    { name: 'index', title: 'Home', icon: 'house.fill' },
    { name: 'fees', title: 'Fees', icon: 'dollarsign.circle.fill' },
    { name: 'expenses', title: 'Expenses', icon: 'receipt' },
    { name: 'reports', title: 'Reports', icon: 'chart.bar.fill' },
  ],
};

/** Shown in the tab bar when nobody is signed in (transient state). */
export const SIGNED_OUT_TABS: TabDef[] = [
  { name: 'index', title: 'Home', icon: 'house.fill' },
  { name: 'explore', title: 'Modules', icon: 'square.grid.2x2.fill' },
];
