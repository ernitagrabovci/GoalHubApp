import type { IconSymbolName } from '@/components/ui/icon-symbol';
import type { Role } from '@/lib/session';

export type StatItem = {
  label: string;
  value: string;
  icon: IconSymbolName;
  tint: string;
};

export type ActionItem = {
  label: string;
  icon: IconSymbolName;
  tint: string;
};

export type EventItem = {
  day: string;
  month: string;
  title: string;
  meta: string;
  tone: 'emerald' | 'warning' | 'info' | 'purple' | 'mint';
};

export type RoleDashboard = {
  greeting: string;
  subtitle: string;
  stats: StatItem[];
  actions: ActionItem[];
  events: EventItem[];
};

export const ROLE_DASHBOARD: Record<Role, RoleDashboard> = {
  administrator: {
    greeting: 'your club, in one place',
    subtitle: 'Everything running at FC Prishtina today',
    stats: [
      { label: 'players', value: '42', icon: 'person.2.fill', tint: '#B0E4CC' },
      { label: 'matches', value: '28', icon: 'calendar', tint: '#408A71' },
      { label: 'fees collected', value: '€8,420', icon: 'dollarsign.circle.fill', tint: '#2fbf71' },
      { label: 'injuries', value: '3', icon: 'stethoscope', tint: '#E24B4A' },
    ],
    actions: [
      { label: 'new player', icon: 'person.fill', tint: '#B0E4CC' },
      { label: 'new team', icon: 'person.2.fill', tint: '#408A71' },
      { label: 'finance report', icon: 'chart.bar.fill', tint: '#2fbf71' },
      { label: 'broadcast', icon: 'notifications', tint: '#f5a623' },
    ],
    events: [
      { day: '28', month: 'AUG', title: 'Match vs. Ballkani', meta: 'Away · 17:00', tone: 'emerald' },
      { day: '01', month: 'SEP', title: 'Training', meta: 'Field 1 · 09:00', tone: 'mint' },
      { day: '04', month: 'SEP', title: 'Board meeting', meta: 'Club office · 18:00', tone: 'info' },
    ],
  },
  trainer: {
    greeting: 'your squad, ready',
    subtitle: 'Trainings, attendance and fitness at a glance',
    stats: [
      { label: 'players', value: '42', icon: 'person.2.fill', tint: '#B0E4CC' },
      { label: 'trainings', value: '6', icon: 'calendar', tint: '#408A71' },
      { label: 'attendance', value: '94%', icon: 'checkmark.circle.fill', tint: '#2fbf71' },
      { label: 'injuries', value: '2', icon: 'stethoscope', tint: '#E24B4A' },
    ],
    actions: [
      { label: 'new training', icon: 'clock.fill', tint: '#B0E4CC' },
      { label: 'register injury', icon: 'stethoscope', tint: '#E24B4A' },
      { label: 'attendance', icon: 'checkmark.circle.fill', tint: '#2fbf71' },
      { label: 'ratings', icon: 'star.fill', tint: '#f5a623' },
    ],
    events: [
      { day: '28', month: 'AUG', title: 'Match vs. Ballkani', meta: 'Away · 17:00', tone: 'emerald' },
      { day: '29', month: 'AUG', title: 'Training — tactics', meta: 'Field 1 · 09:00', tone: 'mint' },
      { day: '30', month: 'AUG', title: 'Recovery session', meta: 'Gym · 11:00', tone: 'info' },
    ],
  },
  player: {
    greeting: 'keep pushing, Ardit',
    subtitle: 'Your season at FC Prishtina',
    stats: [
      { label: 'rating', value: '7.8', icon: 'star.fill', tint: '#f5a623' },
      { label: 'goals', value: '12', icon: 'figure.soccer', tint: '#B0E4CC' },
      { label: 'assists', value: '8', icon: 'trophy.fill', tint: '#2fbf71' },
      { label: 'attendance', value: '96%', icon: 'checkmark.circle.fill', tint: '#408A71' },
    ],
    actions: [
      { label: 'confirm presence', icon: 'checkmark.circle.fill', tint: '#2fbf71' },
      { label: 'my stats', icon: 'chart.bar.fill', tint: '#B0E4CC' },
      { label: 'my fees', icon: 'dollarsign.circle.fill', tint: '#f5a623' },
      { label: 'messages', icon: 'bubble.left.fill', tint: '#408A71' },
    ],
    events: [
      { day: '28', month: 'AUG', title: 'Match vs. Ballkani', meta: 'Away · 17:00', tone: 'emerald' },
      { day: '29', month: 'AUG', title: 'Training — tactics', meta: 'Field 1 · 09:00', tone: 'mint' },
      { day: '02', month: 'SEP', title: 'Physio check', meta: 'Medical room · 12:30', tone: 'purple' },
    ],
  },
  parent: {
    greeting: 'agons journey, followed',
    subtitle: 'FC Prishtina Academy — your child at a glance',
    stats: [
      { label: 'rating', value: '6.9', icon: 'star.fill', tint: '#f5a623' },
      { label: 'goals', value: '5', icon: 'figure.soccer', tint: '#B0E4CC' },
      { label: 'attendance', value: '90%', icon: 'checkmark.circle.fill', tint: '#408A71' },
      { label: 'fee status', value: 'paid', icon: 'dollarsign.circle.fill', tint: '#2fbf71' },
    ],
    actions: [
      { label: 'child profile', icon: 'person.fill', tint: '#B0E4CC' },
      { label: 'attendance', icon: 'calendar', tint: '#408A71' },
      { label: 'message coach', icon: 'bubble.left.fill', tint: '#2fbf71' },
      { label: 'fee status', icon: 'dollarsign.circle.fill', tint: '#f5a623' },
    ],
    events: [
      { day: '28', month: 'AUG', title: 'Match — U17', meta: 'Home · 15:00', tone: 'emerald' },
      { day: '29', month: 'AUG', title: 'Training', meta: 'Field 2 · 16:00', tone: 'mint' },
      { day: '05', month: 'SEP', title: 'Parent meeting', meta: 'Academy hall · 18:00', tone: 'purple' },
    ],
  },
  financier: {
    greeting: 'finances, in focus',
    subtitle: 'Monthly overview for FC Prishtina',
    stats: [
      { label: 'collected', value: '€8,420', icon: 'dollarsign.circle.fill', tint: '#2fbf71' },
      { label: 'pending', value: '€2,140', icon: 'clock.fill', tint: '#f5a623' },
      { label: 'critical', value: '3', icon: 'warning', tint: '#E24B4A' },
      { label: 'expenses', value: '€1,200', icon: 'receipt', tint: '#408A71' },
    ],
    actions: [
      { label: 'register payment', icon: 'checkmark.circle.fill', tint: '#2fbf71' },
      { label: 'expenses', icon: 'receipt', tint: '#408A71' },
      { label: 'monthly report', icon: 'chart.bar.fill', tint: '#B0E4CC' },
      { label: 'export', icon: 'square.and.arrow.up', tint: '#5aa7e6' },
    ],
    events: [
      { day: '28', month: 'AUG', title: 'Match vs. Ballkani', meta: 'Away · 17:00', tone: 'emerald' },
      { day: '01', month: 'SEP', title: 'Fee deadline', meta: 'Monthly quotas', tone: 'warning' },
      { day: '04', month: 'SEP', title: 'Board meeting', meta: 'Club office · 18:00', tone: 'info' },
    ],
  },
};
