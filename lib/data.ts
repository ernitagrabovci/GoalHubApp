import type { StatusTone } from '@/components/status-chip';
import type { Role } from '@/lib/session';

export type Health = 'active' | 'injured' | 'rehabilitation' | 'suspended';

export type Player = {
  id: string;
  name: string;
  initials: string;
  position: string;
  number: number;
  age: number;
  rating: number;
  health: Health;
  color: string;
};

export type Training = {
  id: string;
  day: string;
  month: string;
  type: string;
  field: string;
  time: string;
  present: number;
  total: number;
  tone: StatusTone;
};

export type Injury = {
  id: string;
  player: string;
  initials: string;
  type: string;
  status: 'injured' | 'rehabilitation' | 'recovered';
  expected: string;
  color: string;
};

export type FeeStatus = 'paid' | 'unpaid' | 'delayed' | 'critical';

export type Fee = {
  id: string;
  name: string;
  initials: string;
  month: string;
  amount: string;
  status: FeeStatus;
  color: string;
};

export type Message = {
  id: string;
  sender: string;
  initials: string;
  preview: string;
  time: string;
  unread: boolean;
  color: string;
};

export const ALL_PLAYERS: Player[] = [
  { id: 'p1', name: 'Ardit Llapashtica', initials: 'AL', position: 'FW', number: 9, age: 21, rating: 7.8, health: 'active', color: '#B0E4CC' },
  { id: 'p2', name: 'Mergim Berisha', initials: 'MB', position: 'ML', number: 8, age: 22, rating: 7.2, health: 'active', color: '#408A71' },
  { id: 'p3', name: 'Dren Hyseni', initials: 'DH', position: 'CB', number: 5, age: 23, rating: 7.5, health: 'active', color: '#2fbf71' },
  { id: 'p4', name: 'Agon Gashi', initials: 'AG', position: 'ML', number: 7, age: 16, rating: 6.9, health: 'active', color: '#8f86e8' },
  { id: 'p5', name: 'Luan Kryeziu', initials: 'LK', position: 'GK', number: 1, age: 24, rating: 7.1, health: 'active', color: '#5aa7e6' },
  { id: 'p6', name: 'Bekim Shala', initials: 'BS', position: 'CB', number: 3, age: 20, rating: 6.8, health: 'rehabilitation', color: '#f5a623' },
  { id: 'p7', name: 'Fatos Bytyqi', initials: 'FB', position: 'CM', number: 6, age: 22, rating: 7.0, health: 'active', color: '#86C2A4' },
  { id: 'p8', name: 'Erion Zeka', initials: 'EZ', position: 'ML', number: 11, age: 19, rating: 6.6, health: 'injured', color: '#E24B4A' },
];

export const ALL_TRAININGS: Training[] = [
  { id: 't1', day: '29', month: 'AUG', type: 'Tactical', field: 'Field 1', time: '09:00', present: 38, total: 42, tone: 'mint' },
  { id: 't2', day: '30', month: 'AUG', type: 'Physical', field: 'Gym', time: '11:00', present: 40, total: 42, tone: 'info' },
  { id: 't3', day: '01', month: 'SEP', type: 'Recovery', field: 'Pool', time: '09:00', present: 35, total: 42, tone: 'emerald' },
  { id: 't4', day: '02', month: 'SEP', type: 'Regular', field: 'Field 2', time: '16:00', present: 39, total: 42, tone: 'purple' },
  { id: 't5', day: '03', month: 'SEP', type: 'Tactical', field: 'Field 1', time: '09:00', present: 41, total: 42, tone: 'mint' },
];

export const ALL_INJURIES: Injury[] = [
  { id: 'i1', player: 'Erion Zeka', initials: 'EZ', type: 'Hamstring strain', status: 'injured', expected: 'Sep 20', color: '#E24B4A' },
  { id: 'i2', player: 'Bekim Shala', initials: 'BS', type: 'Ankle sprain', status: 'rehabilitation', expected: 'Sep 14', color: '#f5a623' },
  { id: 'i3', player: 'Dardan Morina', initials: 'DM', type: 'Muscle strain', status: 'recovered', expected: '—', color: '#2fbf71' },
  { id: 'i4', player: 'Luan Kryeziu', initials: 'LK', type: 'Shoulder issue', status: 'recovered', expected: '—', color: '#2fbf71' },
];

const FEE_TEMPLATES: Omit<Fee, 'month' | 'status'>[] = [
  { id: 'f1', name: 'Ardit Llapashtica', initials: 'AL', amount: '€150', color: '#B0E4CC' },
  { id: 'f2', name: 'Mergim Berisha', initials: 'MB', amount: '€150', color: '#408A71' },
  { id: 'f3', name: 'Dren Hyseni', initials: 'DH', amount: '€150', color: '#2fbf71' },
  { id: 'f4', name: 'Agon Gashi', initials: 'AG', amount: '€120', color: '#8f86e8' },
  { id: 'f5', name: 'Luan Kryeziu', initials: 'LK', amount: '€150', color: '#5aa7e6' },
  { id: 'f6', name: 'Bekim Shala', initials: 'BS', amount: '€150', color: '#f5a623' },
];

const FEE_STATUS: Record<string, { status: FeeStatus; month: string }[]> = {
  'Ardit Llapashtica': [
    { status: 'paid', month: 'Sep' },
    { status: 'paid', month: 'Aug' },
    { status: 'paid', month: 'Jul' },
  ],
  'Mergim Berisha': [
    { status: 'paid', month: 'Sep' },
    { status: 'delayed', month: 'Aug' },
    { status: 'paid', month: 'Jul' },
  ],
  'Dren Hyseni': [
    { status: 'unpaid', month: 'Sep' },
    { status: 'paid', month: 'Aug' },
    { status: 'paid', month: 'Jul' },
  ],
  'Agon Gashi': [
    { status: 'paid', month: 'Sep' },
    { status: 'unpaid', month: 'Aug' },
    { status: 'paid', month: 'Jul' },
  ],
  'Luan Kryeziu': [
    { status: 'paid', month: 'Sep' },
    { status: 'paid', month: 'Aug' },
    { status: 'critical', month: 'Jul' },
  ],
  'Bekim Shala': [
    { status: 'unpaid', month: 'Sep' },
    { status: 'critical', month: 'Aug' },
    { status: 'delayed', month: 'Jul' },
  ],
};

/** Fees visible to each role: admin/financier see everyone, player sees own, parent sees child. */
export function feesForRole(role: Role): Fee[] {
  const owner = role === 'player' ? 'Ardit Llapashtica' : role === 'parent' ? 'Agon Gashi' : null;
  const templates = owner ? FEE_TEMPLATES.filter((f) => f.name === owner) : FEE_TEMPLATES;
  return templates.flatMap((t) =>
    FEE_STATUS[t.name].map((s, i) => ({
      id: `${t.id}-${i}`,
      name: t.name,
      initials: t.initials,
      month: s.month,
      amount: t.amount,
      status: s.status,
      color: t.color,
    }))
  );
}

export const ALL_MESSAGES: Message[] = [
  { id: 'm1', sender: 'Rexhep Hyseni', initials: 'RH', preview: 'Training moved to 09:00 tomorrow — be on time.', time: '09:42', unread: true, color: '#2fbf71' },
  { id: 'm2', sender: 'FC Prishtina Admin', initials: 'FP', preview: 'Your match tickets for Ballkani are ready.', time: '08:15', unread: true, color: '#B0E4CC' },
  { id: 'm3', sender: 'Physio Dept', initials: 'PD', preview: 'Physio check confirmed for Tuesday 12:30.', time: 'Yesterday', unread: false, color: '#5aa7e6' },
  { id: 'm4', sender: 'Rexhep Hyseni', initials: 'RH', preview: 'Great session today — review the tactical clip.', time: 'Yesterday', unread: false, color: '#2fbf71' },
  { id: 'm5', sender: 'Finance', initials: 'FN', preview: 'Monthly fee invoice for September is available.', time: 'Mon', unread: true, color: '#8f86e8' },
];
