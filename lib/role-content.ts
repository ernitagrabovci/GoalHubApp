import type { Role } from '@/lib/session';

export type RoleDashboard = {
  greeting: string;
  subtitle: string;
};

export const ROLE_DASHBOARD: Record<Role, RoleDashboard> = {
  administrator: {
    greeting: 'your club, in one place',
    subtitle: 'Everything running at FC Prishtina today',
  },
  trainer: {
    greeting: 'your squad, ready',
    subtitle: 'Trainings, attendance and fitness at a glance',
  },
  player: {
    greeting: 'keep pushing, Ardit',
    subtitle: 'Your season at FC Prishtina',
  },
  parent: {
    greeting: 'agons journey, followed',
    subtitle: 'FC Prishtina Academy — your child at a glance',
  },
  financier: {
    greeting: 'finances, in focus',
    subtitle: 'Monthly overview for FC Prishtina',
  },
};
