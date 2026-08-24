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

export type Match = {
  id: string;
  day: string;
  month: string;
  opponent: string;
  competition: string;
  venue: 'home' | 'away';
  status: 'upcoming' | 'played' | 'cancelled';
  score?: string;
  time?: string;
  color: string;
};

export const ALL_MATCHES: Match[] = [
  { id: 'ma1', day: '20', month: 'AUG', opponent: 'FC Ballkani', competition: 'Superliga', venue: 'home', status: 'played', score: '2 – 1', color: '#B0E4CC' },
  { id: 'ma2', day: '16', month: 'AUG', opponent: 'KF Drita', competition: 'Superliga', venue: 'away', status: 'played', score: '1 – 1', color: '#408A71' },
  { id: 'ma3', day: '27', month: 'AUG', opponent: 'KF Llapi', competition: 'Superliga', venue: 'home', status: 'upcoming', time: '19:00', color: '#86C2A4' },
  { id: 'ma4', day: '31', month: 'AUG', opponent: 'KF Feronikeli', competition: 'Cup', venue: 'away', status: 'upcoming', time: '17:00', color: '#f5a623' },
  { id: 'ma5', day: '10', month: 'AUG', opponent: 'KF Gjilani', competition: 'Superliga', venue: 'home', status: 'played', score: '3 – 0', color: '#5aa7e6' },
];

export type Drill = {
  id: string;
  title: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  players: string;
  focus: string;
  color: string;
};

export const ALL_DRILLS: Drill[] = [
  { id: 'd1', title: 'Rondo 4v2', category: 'Possession', level: 'intermediate', duration: '15 min', players: '6–10', focus: 'Passing under pressure', color: '#B0E4CC' },
  { id: 'd2', title: 'Finishing lanes', category: 'Shooting', level: 'beginner', duration: '20 min', players: '8–12', focus: 'Striking accuracy', color: '#f5a623' },
  { id: 'd3', title: 'Transition 3v3v3', category: 'Tactical', level: 'advanced', duration: '25 min', players: '9–15', focus: 'Fast transitions', color: '#86C2A4' },
  { id: 'd4', title: 'Sprint + recovery', category: 'Fitness', level: 'intermediate', duration: '12 min', players: 'Whole team', focus: 'Sprint capacity', color: '#5aa7e6' },
  { id: 'd5', title: 'Build-up from the back', category: 'Tactical', level: 'intermediate', duration: '20 min', players: '8–11', focus: 'Playing out under pressure', color: '#8f86e8' },
  { id: 'd6', title: 'Crossing & headers', category: 'Shooting', level: 'advanced', duration: '18 min', players: '10–14', focus: 'Delivery + finishing', color: '#E24B4A' },
];

export type GroupMember = { initials: string; color: string; name: string };

export type Group = {
  id: string;
  name: string;
  type: string;
  color: string;
  members: GroupMember[];
};

export const ALL_GROUPS: Group[] = [
  {
    id: 'g1', name: 'Attackers', type: 'Position group', color: '#f5a623',
    members: [
      { initials: 'AL', color: '#B0E4CC', name: 'Ardit Llapashtica' },
      { initials: 'MB', color: '#408A71', name: 'Mergim Berisha' },
      { initials: 'AG', color: '#8f86e8', name: 'Agon Gashi' },
      { initials: 'EZ', color: '#E24B4A', name: 'Erion Zeka' },
    ],
  },
  {
    id: 'g2', name: 'Defensive unit', type: 'Position group', color: '#5aa7e6',
    members: [
      { initials: 'DH', color: '#2fbf71', name: 'Dren Hyseni' },
      { initials: 'BS', color: '#f5a623', name: 'Bekim Shala' },
      { initials: 'LK', color: '#5aa7e6', name: 'Luan Kryeziu' },
    ],
  },
  {
    id: 'g3', name: 'Set-piece takers', type: 'Specialist', color: '#86C2A4',
    members: [
      { initials: 'AL', color: '#B0E4CC', name: 'Ardit Llapashtica' },
      { initials: 'FB', color: '#86C2A4', name: 'Fatos Bytyqi' },
    ],
  },
  {
    id: 'g4', name: 'U19 prospects', type: 'Development', color: '#8f86e8',
    members: [{ initials: 'AG', color: '#8f86e8', name: 'Agon Gashi' }],
  },
];

export type AcademyItem = {
  id: string;
  title: string;
  category: string;
  level: string;
  duration: string;
  type: 'video' | 'session';
  isShared: boolean;
  color: string;
};

export const ALL_ACADEMY: AcademyItem[] = [
  { id: 'a1', title: 'Pressing triggers in a 4-3-3', category: 'Tactical', level: 'Advanced', duration: '12:40', type: 'video', isShared: true, color: '#B0E4CC' },
  { id: 'a2', title: 'Rondo progressions — U17', category: 'Possession', level: 'Intermediate', duration: '09:15', type: 'video', isShared: true, color: '#5aa7e6' },
  { id: 'a3', title: 'Recovery runs: video analysis', category: 'Fitness', level: 'All', duration: '07:30', type: 'video', isShared: false, color: '#f5a623' },
  { id: 'a4', title: 'Midweek tactical session plan', category: 'Tactical', level: 'Intermediate', duration: '45 min', type: 'session', isShared: true, color: '#86C2A4' },
  { id: 'a5', title: 'Finishing circuit — high tempo', category: 'Shooting', level: 'Advanced', duration: '60 min', type: 'session', isShared: false, color: '#E24B4A' },
];

export type TacticalRoster = { initials: string; number: number; name: string; color: string };

/** Eleven-man first-team roster used to populate the tactical board. */
export const TACTICAL_ROSTER: TacticalRoster[] = [
  { initials: 'LK', number: 1, name: 'Luan Kryeziu', color: '#5aa7e6' },
  { initials: 'DH', number: 5, name: 'Dren Hyseni', color: '#2fbf71' },
  { initials: 'BS', number: 3, name: 'Bekim Shala', color: '#f5a623' },
  { initials: 'MB', number: 8, name: 'Mergim Berisha', color: '#408A71' },
  { initials: 'FB', number: 6, name: 'Fatos Bytyqi', color: '#86C2A4' },
  { initials: 'AL', number: 9, name: 'Ardit Llapashtica', color: '#B0E4CC' },
  { initials: 'AG', number: 7, name: 'Agon Gashi', color: '#8f86e8' },
  { initials: 'EZ', number: 11, name: 'Erion Zeka', color: '#E24B4A' },
  { initials: 'LX', number: 4, name: 'Lorik Fejzullahu', color: '#185FA5' },
  { initials: 'AN', number: 2, name: 'Arian Neziri', color: '#B0E4CC' },
  { initials: 'BK', number: 10, name: 'Blerim Kotori', color: '#86C2A4' },
];

export type TacticalScene = {
  id: string;
  name: string;
  formation: string;
  players: { id: string; x: number; y: number }[];
};

export const DEFAULT_SCENES: TacticalScene[] = [
  { id: 'ts1', name: 'Starters vs Ballkani', formation: '4-3-3', players: [] },
  { id: 'ts2', name: 'Counter template', formation: '4-2-3-1', players: [] },
];

/** Formation templates: 11 normalized slot positions per formation (y grows from opponent goal → own goal). */
export const FORMATION_SLOTS: Record<string, { x: number; y: number }[]> = {
  '4-3-3': [
    { x: 0.5, y: 0.92 }, { x: 0.13, y: 0.79 }, { x: 0.36, y: 0.82 }, { x: 0.64, y: 0.82 }, { x: 0.87, y: 0.79 },
    { x: 0.2, y: 0.58 }, { x: 0.5, y: 0.62 }, { x: 0.8, y: 0.58 }, { x: 0.1, y: 0.3 }, { x: 0.5, y: 0.16 }, { x: 0.9, y: 0.3 },
  ],
  '4-4-2': [
    { x: 0.5, y: 0.92 }, { x: 0.13, y: 0.79 }, { x: 0.36, y: 0.82 }, { x: 0.64, y: 0.82 }, { x: 0.87, y: 0.79 },
    { x: 0.12, y: 0.56 }, { x: 0.38, y: 0.6 }, { x: 0.62, y: 0.6 }, { x: 0.88, y: 0.56 }, { x: 0.38, y: 0.22 }, { x: 0.62, y: 0.22 },
  ],
  '3-5-2': [
    { x: 0.5, y: 0.92 }, { x: 0.28, y: 0.82 }, { x: 0.5, y: 0.84 }, { x: 0.72, y: 0.82 },
    { x: 0.12, y: 0.64 }, { x: 0.34, y: 0.58 }, { x: 0.5, y: 0.66 }, { x: 0.66, y: 0.58 }, { x: 0.88, y: 0.64 },
    { x: 0.4, y: 0.2 }, { x: 0.6, y: 0.2 },
  ],
  '4-2-3-1': [
    { x: 0.5, y: 0.92 }, { x: 0.13, y: 0.79 }, { x: 0.36, y: 0.82 }, { x: 0.64, y: 0.82 }, { x: 0.87, y: 0.79 },
    { x: 0.34, y: 0.62 }, { x: 0.66, y: 0.62 }, { x: 0.1, y: 0.42 }, { x: 0.5, y: 0.38 }, { x: 0.9, y: 0.42 }, { x: 0.5, y: 0.16 },
  ],
};

export const ALL_MESSAGES: Message[] = [
  { id: 'm1', sender: 'Rexhep Hyseni', initials: 'RH', preview: 'Training moved to 09:00 tomorrow — be on time.', time: '09:42', unread: true, color: '#2fbf71' },
  { id: 'm2', sender: 'FC Prishtina Admin', initials: 'FP', preview: 'Your match tickets for Ballkani are ready.', time: '08:15', unread: true, color: '#B0E4CC' },
  { id: 'm3', sender: 'Physio Dept', initials: 'PD', preview: 'Physio check confirmed for Tuesday 12:30.', time: 'Yesterday', unread: false, color: '#5aa7e6' },
  { id: 'm4', sender: 'Rexhep Hyseni', initials: 'RH', preview: 'Great session today — review the tactical clip.', time: 'Yesterday', unread: false, color: '#2fbf71' },
  { id: 'm5', sender: 'Finance', initials: 'FN', preview: 'Monthly fee invoice for September is available.', time: 'Mon', unread: true, color: '#8f86e8' },
];

export type ChatBubble = {
  id: string;
  text: string;
  time: string;
  mine: boolean;
};

/** Message threads keyed by message id — mixed mine/theirs so the thread feels real. */
export const CONVERSATIONS: Record<string, ChatBubble[]> = {
  m1: [
    { id: 'c1a', text: "Morning coach — is tomorrow's training still on?", time: '09:20', mine: true },
    { id: 'c1b', text: "Morning! Yes, but it's moved to 09:00 instead of 10:30.", time: '09:38', mine: false },
    { id: 'c1c', text: 'Got it, Agon will be there on time.', time: '09:40', mine: true },
    { id: 'c1d', text: 'Training moved to 09:00 tomorrow — be on time.', time: '09:42', mine: false },
  ],
  m2: [
    { id: 'c2a', text: 'Hi, will tickets for the Ballkani match be available at the gate?', time: '08:02', mine: true },
    { id: 'c2b', text: 'Your match tickets for Ballkani are ready.', time: '08:15', mine: false },
    { id: 'c2c', text: 'You can collect them at the club office or at the entrance.', time: '08:16', mine: false },
  ],
  m3: [
    { id: 'c3a', text: 'When was Agon’s last physio check scheduled?', time: 'Tue', mine: true },
    { id: 'c3b', text: 'Physio check confirmed for Tuesday 12:30.', time: 'Tue', mine: false },
    { id: 'c3c', text: 'Perfect, thanks for confirming.', time: 'Tue', mine: true },
  ],
  m4: [
    { id: 'c4a', text: 'That was a great session — well done Agon.', time: 'Yesterday', mine: false },
    { id: 'c4b', text: 'Thank you coach! He really enjoyed it.', time: 'Yesterday', mine: true },
    { id: 'c4c', text: 'Great session today — review the tactical clip.', time: 'Yesterday', mine: false },
  ],
  m5: [
    { id: 'c5a', text: 'Hello, just checking on the September invoice.', time: 'Mon', mine: true },
    { id: 'c5b', text: 'Monthly fee invoice for September is available.', time: 'Mon', mine: false },
    { id: 'c5c', text: 'It is paid — thank you!', time: 'Mon', mine: true },
  ],
};
