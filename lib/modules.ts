import type { IconSymbolName } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import type { Role } from '@/lib/session';

export type ModuleDef = {
  label: string;
  icon: IconSymbolName;
  color: string;
  /** Route to a real screen; undefined means the module is coming soon. */
  route?: string;
};

/** Every module in the app. Roles get a filtered subset via modulesForRole(). */
export const ALL_MODULES: ModuleDef[] = [
  { label: 'Players', icon: 'person.2.fill', color: Colors.mint, route: '/players' },
  { label: 'Trainers', icon: 'graduationcap.fill', color: Colors.emerald },
  { label: 'Parents', icon: 'person.fill', color: Colors.purple },
  { label: 'Teams', icon: 'person.2.fill', color: '#185fa5', route: '/teams' },
  { label: 'Users', icon: 'person.fill', color: '#1a9e5c', route: '/users' },
  { label: 'Club', icon: 'trophy.fill', color: Colors.mintDim, route: '/club' },
  { label: 'Matches', icon: 'figure.soccer', color: Colors.warning, route: '/matches' },
  { label: 'Trainings', icon: 'calendar', color: Colors.info, route: '/trainings' },
  { label: 'Academy', icon: 'trophy.fill', color: Colors.mintDim, route: '/academy' },
  { label: 'Tactical Board', icon: 'map.fill', color: Colors.mintDim, route: '/tactical' },
  { label: 'Drills', icon: 'fitness-center', color: Colors.info, route: '/drills' },
  { label: 'Groups', icon: 'person.2.fill', color: Colors.purple, route: '/groups' },
  { label: 'Medical', icon: 'stethoscope', color: Colors.danger, route: '/medical' },
  { label: 'Competitions', icon: 'trophy.fill', color: '#f5a623', route: '/competitions' },
  { label: 'Payments', icon: 'dollarsign.circle.fill', color: Colors.emerald, route: '/fees' },
  { label: 'Finance', icon: 'dollarsign.circle.fill', color: Colors.emerald, route: '/finance' },
  { label: 'Messages', icon: 'bubble.left.fill', color: Colors.info, route: '/chat' },
  { label: 'Reports', icon: 'chart.bar.fill', color: Colors.warning, route: '/reports' },
  { label: 'Settings', icon: 'gearshape.fill', color: Colors.textMuted, route: '/profile' },
  { label: 'Admin', icon: 'gearshape.fill', color: Colors.mint, route: '/admin' },
];

/** Which modules each role can see. */
export const ROLE_MODULES: Record<Role, string[]> = {
  administrator: ['Players', 'Teams', 'Users', 'Competitions', 'Matches', 'Trainings', 'Medical', 'Finance', 'Club', 'Reports', 'Messages', 'Settings', 'Admin'],
  trainer: ['Players', 'Matches', 'Trainings', 'Medical', 'Academy', 'Tactical Board', 'Drills', 'Groups', 'Messages', 'Settings'],
  player: ['Matches', 'Trainings', 'Academy', 'Tactical Board', 'Groups', 'Payments', 'Messages', 'Settings'],
  parent: ['Matches', 'Trainings', 'Payments', 'Messages', 'Settings'],
  financier: ['Finance', 'Payments', 'Reports', 'Messages', 'Settings'],
};

export function modulesForRole(role: Role): ModuleDef[] {
  return ALL_MODULES.filter((m) => ROLE_MODULES[role].includes(m.label));
}
