import type { IconSymbolName } from '@/components/ui/icon-symbol';
import type { Role } from '@/lib/session';

export type ModuleDef = {
  label: string;
  icon: IconSymbolName;
  color: string;
  /** Route to a real screen; undefined means the module is coming soon. */
  route?: string;
};

/** Every module in the app. Roles get a filtered subset via modulesForRole(). */
/** Mid-tone brand greens — readable on both dark and light backgrounds. */
const MINT = '#1F6B4F';
const MINT_DIM = '#3C8669';

export const ALL_MODULES: ModuleDef[] = [
  { label: 'Players', icon: 'person.2.fill', color: MINT, route: '/players' },
  { label: 'Trainers', icon: 'graduationcap.fill', color: '#2E7D5B' },
  { label: 'Parents', icon: 'person.fill', color: '#5A50A8' },
  { label: 'Teams', icon: 'person.2.fill', color: '#185fa5', route: '/teams' },
  { label: 'Users', icon: 'person.fill', color: '#1a9e5c', route: '/users' },
  { label: 'Club', icon: 'trophy.fill', color: MINT_DIM, route: '/club' },
  { label: 'Matches', icon: 'figure.soccer', color: '#C97F0D', route: '/matches' },
  { label: 'Trainings', icon: 'calendar', color: '#1B5FA0', route: '/trainings' },
  { label: 'Academy', icon: 'trophy.fill', color: MINT_DIM, route: '/academy' },
  { label: 'Tactical Board', icon: 'map.fill', color: MINT_DIM, route: '/tactical' },
  { label: 'Drills', icon: 'fitness-center', color: '#1B5FA0', route: '/drills' },
  { label: 'Groups', icon: 'person.2.fill', color: '#5A50A8', route: '/groups' },
  { label: 'Medical', icon: 'stethoscope', color: '#D64040', route: '/medical' },
  { label: 'Competitions', icon: 'trophy.fill', color: '#C97F0D', route: '/competitions' },
  { label: 'Payments', icon: 'dollarsign.circle.fill', color: '#2E7D5B', route: '/fees' },
  { label: 'Finance', icon: 'dollarsign.circle.fill', color: '#2E7D5B', route: '/finance' },
  { label: 'Messages', icon: 'bubble.left.fill', color: '#1B5FA0', route: '/chat' },
  { label: 'Reports', icon: 'chart.bar.fill', color: '#C97F0D', route: '/reports' },
  { label: 'Settings', icon: 'gearshape.fill', color: '#6B887B', route: '/profile' },
  { label: 'Admin', icon: 'gearshape.fill', color: MINT, route: '/admin' },
];

/** Which modules each role can see. */
export const ROLE_MODULES: Record<Role, string[]> = {
  administrator: ['Players', 'Teams', 'Users', 'Competitions', 'Matches', 'Trainings', 'Medical', 'Finance', 'Club', 'Reports', 'Admin'],
  trainer: ['Players', 'Matches', 'Trainings', 'Medical', 'Academy', 'Tactical Board', 'Drills', 'Groups'],
  player: ['Matches', 'Trainings', 'Academy', 'Tactical Board', 'Groups', 'Payments'],
  parent: ['Matches', 'Trainings', 'Payments'],
  financier: ['Finance', 'Payments', 'Reports'],
};

export function modulesForRole(role: Role): ModuleDef[] {
  return ALL_MODULES.filter((m) => ROLE_MODULES[role].includes(m.label));
}
