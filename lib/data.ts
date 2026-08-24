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

export type MessageScope = 'trainer' | 'admin' | 'club';

export type Message = {
  id: string;
  sender: string;
  initials: string;
  preview: string;
  time: string;
  unread: boolean;
  color: string;
  /** Who the conversation is with — players/parents only message trainer & admin. */
  scope: MessageScope;
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
  shared: boolean;
  created: string;
  modified: string;
};

export const DEFAULT_SCENES: TacticalScene[] = [
  { id: 'ts1', name: 'Starters vs Ballkani', formation: '4-3-3', players: [], shared: true, created: 'Aug 12', modified: 'Aug 20' },
  { id: 'ts2', name: 'Counter template', formation: '4-2-3-1', players: [], shared: false, created: 'Aug 15', modified: 'Aug 15' },
  { id: 'ts3', name: 'High press vs Drita', formation: '3-5-2', players: [], shared: true, created: 'Aug 16', modified: 'Aug 18' },
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
  { id: 'm1', sender: 'Rexhep Hyseni', initials: 'RH', preview: 'Training moved to 09:00 tomorrow — be on time.', time: '09:42', unread: true, color: '#2fbf71', scope: 'trainer' },
  { id: 'm2', sender: 'FC Prishtina Admin', initials: 'FP', preview: 'Your match tickets for Ballkani are ready.', time: '08:15', unread: true, color: '#B0E4CC', scope: 'admin' },
  { id: 'm3', sender: 'Physio Dept', initials: 'PD', preview: 'Physio check confirmed for Tuesday 12:30.', time: 'Yesterday', unread: false, color: '#5aa7e6', scope: 'club' },
  { id: 'm4', sender: 'Rexhep Hyseni', initials: 'RH', preview: 'Great session today — review the tactical clip.', time: 'Yesterday', unread: false, color: '#2fbf71', scope: 'trainer' },
  { id: 'm5', sender: 'Finance', initials: 'FN', preview: 'Monthly fee invoice for September is available.', time: 'Mon', unread: true, color: '#8f86e8', scope: 'club' },
];

/** Player/parent only talk to trainer & admin; staff roles see everyone. */
export function messagesForRole(role: Role): Message[] {
  if (role === 'player' || role === 'parent') {
    return ALL_MESSAGES.filter((m) => m.scope === 'trainer' || m.scope === 'admin');
  }
  return ALL_MESSAGES;
}

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

/* ---------- Trainer detail data (parity with the GoalHub webapp) ---------- */

export type PlayerSeason = {
  goals: number;
  assists: number;
  minutes: number;
  yellow: number;
  red: number;
  matches: number;
};

export const PLAYER_SEASON: Record<string, PlayerSeason> = {
  'Ardit Llapashtica': { goals: 12, assists: 6, minutes: 2140, yellow: 2, red: 0, matches: 24 },
  'Mergim Berisha': { goals: 5, assists: 9, minutes: 1980, yellow: 4, red: 0, matches: 22 },
  'Dren Hyseni': { goals: 2, assists: 1, minutes: 2160, yellow: 5, red: 1, matches: 24 },
  'Agon Gashi': { goals: 7, assists: 4, minutes: 1540, yellow: 1, red: 0, matches: 20 },
  'Luan Kryeziu': { goals: 0, assists: 0, minutes: 2160, yellow: 1, red: 0, matches: 24 },
  'Bekim Shala': { goals: 1, assists: 0, minutes: 1080, yellow: 3, red: 0, matches: 15 },
  'Fatos Bytyqi': { goals: 3, assists: 7, minutes: 1750, yellow: 3, red: 0, matches: 21 },
  'Erion Zeka': { goals: 4, assists: 2, minutes: 640, yellow: 1, red: 0, matches: 12 },
};

export type PlayerProfile = {
  birth: string;
  nationality: string;
  license: string;
  contract: string;
  contractEnd: string;
  team: string;
};

export const PLAYER_PROFILES: Record<string, PlayerProfile> = {
  'Ardit Llapashtica': { birth: '2003-05-14', nationality: 'Kosovo', license: 'FFK-1023', contract: '2023-01-01', contractEnd: '2026-06-30', team: 'First Team' },
  'Mergim Berisha': { birth: '2002-11-02', nationality: 'Kosovo', license: 'FFK-0987', contract: '2022-07-01', contractEnd: '2025-12-31', team: 'First Team' },
  'Dren Hyseni': { birth: '2001-03-21', nationality: 'Kosovo', license: 'FFK-0911', contract: '2021-08-01', contractEnd: '2026-06-30', team: 'First Team' },
  'Agon Gashi': { birth: '2008-06-09', nationality: 'Kosovo', license: 'FFK-1140', contract: '2024-02-01', contractEnd: '2027-06-30', team: 'U19' },
  'Luan Kryeziu': { birth: '2000-01-30', nationality: 'Kosovo', license: 'FFK-0855', contract: '2020-07-01', contractEnd: '2025-06-30', team: 'First Team' },
  'Bekim Shala': { birth: '2004-09-17', nationality: 'Kosovo', license: 'FFK-1205', contract: '2024-01-15', contractEnd: '2026-12-31', team: 'First Team' },
  'Fatos Bytyqi': { birth: '2002-04-11', nationality: 'Kosovo', license: 'FFK-1042', contract: '2023-01-01', contractEnd: '2026-06-30', team: 'First Team' },
  'Erion Zeka': { birth: '2005-12-03', nationality: 'Kosovo', license: 'FFK-1318', contract: '2024-08-01', contractEnd: '2027-06-30', team: 'U21' },
};

export type Rating = {
  id: string;
  player: string;
  initials: string;
  color: string;
  technique: number;
  physical: number;
  tactics: number;
  consistency: number;
  teamwork: number;
  average: number;
  comment: string;
  by: string;
  rated: string;
};

export const ALL_RATINGS: Rating[] = [
  { id: 'r1', player: 'Dren Hyseni', initials: 'DH', color: '#2fbf71', technique: 7.2, physical: 8.3, tactics: 8.1, consistency: 8.0, teamwork: 8.5, average: 8.0, comment: 'Leader at the back, dominant in the air.', by: 'Rexhep Hyseni', rated: 'Aug 20' },
  { id: 'r2', player: 'Ardit Llapashtica', initials: 'AL', color: '#B0E4CC', technique: 8.4, physical: 7.6, tactics: 7.8, consistency: 7.9, teamwork: 8.0, average: 7.9, comment: 'Best finisher in the squad — keep the work-rate up.', by: 'Rexhep Hyseni', rated: 'Aug 19' },
  { id: 'r3', player: 'Luan Kryeziu', initials: 'LK', color: '#5aa7e6', technique: 7.0, physical: 7.5, tactics: 8.0, consistency: 7.8, teamwork: 8.2, average: 7.7, comment: 'Reliable distribution, commands his box well.', by: 'Rexhep Hyseni', rated: 'Aug 18' },
  { id: 'r4', player: 'Mergim Berisha', initials: 'MB', color: '#408A71', technique: 7.8, physical: 7.4, tactics: 7.6, consistency: 7.2, teamwork: 8.2, average: 7.6, comment: 'Smart off the ball, dangerous in the half-spaces.', by: 'Rexhep Hyseni', rated: 'Aug 17' },
  { id: 'r5', player: 'Fatos Bytyqi', initials: 'FB', color: '#86C2A4', technique: 7.9, physical: 7.0, tactics: 7.5, consistency: 7.4, teamwork: 8.1, average: 7.6, comment: 'Engine of the midfield, always an option.', by: 'Rexhep Hyseni', rated: 'Aug 16' },
  { id: 'r6', player: 'Agon Gashi', initials: 'AG', color: '#8f86e8', technique: 7.6, physical: 6.8, tactics: 7.2, consistency: 6.9, teamwork: 7.8, average: 7.3, comment: 'Huge potential — needs to impose himself more.', by: 'Rexhep Hyseni', rated: 'Aug 15' },
  { id: 'r7', player: 'Bekim Shala', initials: 'BS', color: '#f5a623', technique: 6.8, physical: 7.2, tactics: 7.0, consistency: 6.5, teamwork: 7.4, average: 7.0, comment: 'Solid, improving in possession.', by: 'Rexhep Hyseni', rated: 'Aug 14' },
  { id: 'r8', player: 'Erion Zeka', initials: 'EZ', color: '#E24B4A', technique: 7.5, physical: 7.1, tactics: 6.9, consistency: 6.4, teamwork: 7.3, average: 7.0, comment: 'Exciting on the ball, needs to track back more.', by: 'Rexhep Hyseni', rated: 'Aug 13' },
];

export type AttendanceStatus = 'present' | 'absent' | 'unconfirmed';

export type AttRow = {
  player: string;
  initials: string;
  color: string;
  status: AttendanceStatus;
  reason?: string;
};

function att(overrides: Record<string, { status: AttendanceStatus; reason?: string }> = {}): AttRow[] {
  return ALL_PLAYERS.map((p) => {
    const o = overrides[p.initials];
    return o
      ? { player: p.name, initials: p.initials, color: p.color, status: o.status, reason: o.reason }
      : { player: p.name, initials: p.initials, color: p.color, status: 'present' as AttendanceStatus };
  });
}

export const TRAINING_ATTENDANCE: Record<string, AttRow[]> = {
  t1: att({ EZ: { status: 'absent', reason: 'Hamstring — medical' }, BS: { status: 'unconfirmed' } }),
  t2: att({ EZ: { status: 'absent', reason: 'Hamstring — medical' }, BS: { status: 'present' }, AG: { status: 'present' } }),
  t3: att({ EZ: { status: 'absent', reason: 'Hamstring — medical' }, LK: { status: 'absent', reason: 'Shoulder — medical' }, BS: { status: 'present' } }),
  t4: att({ EZ: { status: 'present' }, BS: { status: 'present' }, AG: { status: 'unconfirmed' } }),
  t5: att({ EZ: { status: 'unconfirmed' }, BS: { status: 'present' } }),
};

export type MatchStat = {
  player: string;
  initials: string;
  color: string;
  goals: number;
  assists: number;
  minutes: number;
  yellow: number;
  red: number;
  rating: number;
};

export type MatchDetail = {
  matchId: string;
  transport?: string;
  lineup: string[];
  stats: MatchStat[];
};

export const MATCH_DETAILS: Record<string, MatchDetail> = {
  ma1: {
    matchId: 'ma1',
    lineup: ['LK', 'DH', 'BS', 'MB', 'FB', 'AL', 'AG', 'EZ', 'LX', 'AN', 'BK'],
    stats: [
      { player: 'Ardit Llapashtica', initials: 'AL', color: '#B0E4CC', goals: 1, assists: 1, minutes: 90, yellow: 0, red: 0, rating: 8.2 },
      { player: 'Mergim Berisha', initials: 'MB', color: '#408A71', goals: 1, assists: 0, minutes: 90, yellow: 0, red: 0, rating: 7.4 },
      { player: 'Dren Hyseni', initials: 'DH', color: '#2fbf71', goals: 0, assists: 0, minutes: 90, yellow: 1, red: 0, rating: 7.8 },
      { player: 'Fatos Bytyqi', initials: 'FB', color: '#86C2A4', goals: 0, assists: 1, minutes: 90, yellow: 0, red: 0, rating: 7.6 },
      { player: 'Luan Kryeziu', initials: 'LK', color: '#5aa7e6', goals: 0, assists: 0, minutes: 90, yellow: 0, red: 0, rating: 7.1 },
      { player: 'Agon Gashi', initials: 'AG', color: '#8f86e8', goals: 0, assists: 0, minutes: 30, yellow: 0, red: 0, rating: 6.9 },
      { player: 'Bekim Shala', initials: 'BS', color: '#f5a623', goals: 0, assists: 0, minutes: 12, yellow: 0, red: 0, rating: 6.5 },
    ],
  },
  ma2: {
    matchId: 'ma2',
    transport: 'Bus departs club 15:30',
    lineup: ['LK', 'DH', 'BS', 'MB', 'FB', 'AL', 'AG', 'EZ', 'LX', 'AN', 'BK'],
    stats: [
      { player: 'Ardit Llapashtica', initials: 'AL', color: '#B0E4CC', goals: 1, assists: 0, minutes: 90, yellow: 0, red: 0, rating: 7.9 },
      { player: 'Dren Hyseni', initials: 'DH', color: '#2fbf71', goals: 0, assists: 0, minutes: 90, yellow: 1, red: 0, rating: 7.5 },
      { player: 'Fatos Bytyqi', initials: 'FB', color: '#86C2A4', goals: 0, assists: 0, minutes: 90, yellow: 0, red: 0, rating: 7.2 },
      { player: 'Luan Kryeziu', initials: 'LK', color: '#5aa7e6', goals: 0, assists: 0, minutes: 90, yellow: 0, red: 0, rating: 7.0 },
      { player: 'Mergim Berisha', initials: 'MB', color: '#408A71', goals: 0, assists: 0, minutes: 74, yellow: 0, red: 0, rating: 6.8 },
      { player: 'Agon Gashi', initials: 'AG', color: '#8f86e8', goals: 0, assists: 0, minutes: 20, yellow: 0, red: 0, rating: 6.6 },
      { player: 'Bekim Shala', initials: 'BS', color: '#f5a623', goals: 0, assists: 0, minutes: 16, yellow: 0, red: 0, rating: 6.3 },
    ],
  },
  ma3: {
    matchId: 'ma3',
    lineup: ['LK', 'DH', 'BS', 'MB', 'FB', 'AL', 'AG', 'EZ', 'LX', 'AN', 'BK'],
    stats: [],
  },
  ma4: {
    matchId: 'ma4',
    transport: 'Bus departs club 18:30',
    lineup: ['LK', 'DH', 'BS', 'MB', 'FB', 'AL', 'AG', 'EZ', 'LX', 'AN', 'BK'],
    stats: [],
  },
  ma5: {
    matchId: 'ma5',
    lineup: ['LK', 'DH', 'BS', 'MB', 'FB', 'AL', 'AG', 'EZ', 'LX', 'AN', 'BK'],
    stats: [
      { player: 'Ardit Llapashtica', initials: 'AL', color: '#B0E4CC', goals: 2, assists: 0, minutes: 90, yellow: 0, red: 0, rating: 8.8 },
      { player: 'Mergim Berisha', initials: 'MB', color: '#408A71', goals: 1, assists: 1, minutes: 90, yellow: 0, red: 0, rating: 8.0 },
      { player: 'Fatos Bytyqi', initials: 'FB', color: '#86C2A4', goals: 0, assists: 1, minutes: 90, yellow: 0, red: 0, rating: 7.7 },
      { player: 'Dren Hyseni', initials: 'DH', color: '#2fbf71', goals: 0, assists: 0, minutes: 90, yellow: 0, red: 0, rating: 7.6 },
      { player: 'Luan Kryeziu', initials: 'LK', color: '#5aa7e6', goals: 0, assists: 0, minutes: 90, yellow: 0, red: 0, rating: 7.2 },
      { player: 'Agon Gashi', initials: 'AG', color: '#8f86e8', goals: 0, assists: 0, minutes: 24, yellow: 0, red: 0, rating: 6.8 },
    ],
  },
};

export type InjuryDetail = {
  injuryId: string;
  occurredDuring: string;
  date: string;
  description: string;
  treatment: string;
  history: { date: string; change: string }[];
};

export const INJURY_DETAILS: Record<string, InjuryDetail> = {
  i1: {
    injuryId: 'i1',
    occurredDuring: 'match',
    date: 'Aug 18',
    description: 'Hamstring strain during a sprint in the 60th minute against Ballkani.',
    treatment: 'Ice therapy twice daily, physio sessions, no sprint work for 10 days.',
    history: [
      { date: 'Aug 18', change: 'Injury registered — status set to injured, admin notified.' },
      { date: 'Aug 20', change: 'Follow-up: swelling reduced, expected return Sep 20.' },
    ],
  },
  i2: {
    injuryId: 'i2',
    occurredDuring: 'training',
    date: 'Aug 22',
    description: 'Ankle sprain landing from a jump at the end of the recovery session.',
    treatment: 'RICE protocol, ankle strapped, gym work permitted, return to pitch pending.',
    history: [
      { date: 'Aug 22', change: 'Injury registered — status set to rehabilitation.' },
      { date: 'Aug 23', change: 'Physio check confirmed, no fracture.' },
    ],
  },
  i3: {
    injuryId: 'i3',
    occurredDuring: 'training',
    date: 'Aug 02',
    description: 'Minor muscle strain in the left quadriceps.',
    treatment: 'Rest and gradual return, fully cleared.',
    history: [
      { date: 'Aug 02', change: 'Injury registered — status set to injured.' },
      { date: 'Aug 09', change: 'Marked as recovered — health status restored to active.' },
    ],
  },
  i4: {
    injuryId: 'i4',
    occurredDuring: 'match',
    date: 'Jul 28',
    description: 'Shoulder issue after a fall during a match challenge.',
    treatment: 'Physiotherapy and strength work, fully cleared.',
    history: [
      { date: 'Jul 28', change: 'Injury registered — status set to injured.' },
      { date: 'Aug 05', change: 'Marked as recovered — health status restored to active.' },
    ],
  },
};

export type ChannelPost = {
  id: string;
  author: string;
  initials: string;
  color: string;
  text: string;
  time: string;
  mine: boolean;
};

export const CHANNEL_POSTS: ChannelPost[] = [
  { id: 'cp1', author: 'Rexhep Hyseni', initials: 'RH', color: '#2fbf71', text: 'Great intensity today. Tactical review Wednesday 17:00.', time: '09:42', mine: true },
  { id: 'cp2', author: 'Ardit Llapashtica', initials: 'AL', color: '#B0E4CC', text: 'Coach, can we go through set-pieces before Ballkani?', time: '10:05', mine: false },
  { id: 'cp3', author: 'Rexhep Hyseni', initials: 'RH', color: '#2fbf71', text: 'Yes — we will add 15 min after the Wednesday review.', time: '10:11', mine: true },
  { id: 'cp4', author: 'Agon Gashi', initials: 'AG', color: '#8f86e8', text: "I'm free earlier tomorrow, happy to help set up cones.", time: '10:14', mine: false },
  { id: 'cp5', author: 'Rexhep Hyseni', initials: 'RH', color: '#2fbf71', text: "That's the spirit. See you all Wednesday.", time: '10:20', mine: true },
];

export type AppNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  source: string;
  time: string;
  read: boolean;
};

export const ALL_NOTIFICATIONS: AppNotification[] = [
  { id: 'n1', type: 'injury_registered', title: 'Erion Zeka — injury registered', body: 'Hamstring strain reported. Expected return Sep 20.', source: 'platform', time: '2h', read: false },
  { id: 'n2', type: 'match_scheduled', title: 'Match vs KF Llapi', body: 'Superliga · Home · Aug 27 at 19:00.', source: 'admin', time: '5h', read: false },
  { id: 'n3', type: 'rating_saved', title: 'Rating saved', body: 'Ardit Llapashtica was rated 8.2.', source: 'platform', time: '1d', read: true },
  { id: 'n4', type: 'message', title: 'Message from Faton Krasniqi', body: 'Please confirm the player list for September.', source: 'finance', time: '2d', read: true },
];

// ---------- Admin: users, teams, club ----------

export type AppUser = {
  id: string;
  name: string;
  initials: string;
  role: Role;
  email: string;
  club: string;
  active: boolean;
  lastLogin: string;
};

export const ALL_USERS: AppUser[] = [
  { id: 'u1', name: 'Ardian Dema', initials: 'AD', role: 'administrator', email: 'admin@fcprishtina.com', club: 'FC Prishtina', active: true, lastLogin: 'now' },
  { id: 'u2', name: 'Rexhep Hyseni', initials: 'RH', role: 'trainer', email: 'rexhep@fcprishtina.com', club: 'FC Prishtina', active: true, lastLogin: '2h' },
  { id: 'u3', name: 'Faton Krasniqi', initials: 'FK', role: 'financier', email: 'faton@fcprishtina.com', club: 'FC Prishtina', active: true, lastLogin: '5h' },
  { id: 'u4', name: 'Besnik Gashi', initials: 'BG', role: 'parent', email: 'besnik@gmail.com', club: 'FC Prishtina Academy', active: true, lastLogin: '1d' },
  { id: 'u5', name: 'Ardit Llapashtica', initials: 'AL', role: 'player', email: 'ardit@fcprishtina.com', club: 'FC Prishtina', active: true, lastLogin: '3h' },
  { id: 'u6', name: 'Mergim Berisha', initials: 'MB', role: 'player', email: 'mergim@fcprishtina.com', club: 'FC Prishtina', active: true, lastLogin: '1d' },
  { id: 'u7', name: 'Dren Hyseni', initials: 'DH', role: 'player', email: 'dren@fcprishtina.com', club: 'FC Prishtina', active: true, lastLogin: '2d' },
  { id: 'u8', name: 'Agon Gashi', initials: 'AG', role: 'player', email: 'agon@fcprishtina.com', club: 'FC Prishtina Academy', active: true, lastLogin: '3h' },
  { id: 'u9', name: 'Valon Krasniqi', initials: 'VK', role: 'parent', email: 'valon@gmail.com', club: 'FC Prishtina Academy', active: false, lastLogin: '2w' },
];

export type TeamMember = {
  name: string;
  initials: string;
  color: string;
  position: string;
  number: number;
};

export type Team = {
  id: string;
  name: string;
  category: string;
  color: string;
  trainer: string;
  season: string;
  members: TeamMember[];
};

const FIRST_TEAM: TeamMember[] = [
  { name: 'Luan Kryeziu', initials: 'LK', color: '#5aa7e6', position: 'GK', number: 1 },
  { name: 'Dren Hyseni', initials: 'DH', color: '#2fbf71', position: 'CB', number: 5 },
  { name: 'Bekim Shala', initials: 'BS', color: '#f5a623', position: 'CB', number: 3 },
  { name: 'Fatos Bytyqi', initials: 'FB', color: '#86C2A4', position: 'CM', number: 6 },
  { name: 'Mergim Berisha', initials: 'MB', color: '#408A71', position: 'ML', number: 8 },
  { name: 'Ardit Llapashtica', initials: 'AL', color: '#B0E4CC', position: 'FW', number: 9 },
  { name: 'Agon Gashi', initials: 'AG', color: '#8f86e8', position: 'ML', number: 7 },
  { name: 'Erion Zeka', initials: 'EZ', color: '#E24B4A', position: 'ML', number: 11 },
];

export const ALL_TEAMS: Team[] = [
  { id: 'tm1', name: 'First Team', category: 'Senior', color: '#1a9e5c', trainer: 'Rexhep Hyseni', season: '2026/27', members: FIRST_TEAM },
  { id: 'tm2', name: 'U21', category: 'Academy', color: '#185fa5', trainer: 'Blerim Shala', season: '2026/27', members: [
    { name: 'Granit Aliu', initials: 'GA', color: '#185fa5', position: 'CM', number: 6 },
    { name: 'Leart Mehmeti', initials: 'LM', color: '#185fa5', position: 'FW', number: 9 },
    { name: 'Dardan Morina', initials: 'DM', color: '#185fa5', position: 'CB', number: 4 },
  ] },
  { id: 'tm3', name: 'U17', category: 'Academy', color: '#ba7517', trainer: 'Blerim Shala', season: '2026/27', members: [
    { name: 'Agon Gashi', initials: 'AG', color: '#8f86e8', position: 'ML', number: 7 },
    { name: 'Rinor Hoxha', initials: 'RH', color: '#ba7517', position: 'GK', number: 1 },
  ] },
  { id: 'tm4', name: 'U15', category: 'Academy', color: '#993556', trainer: 'Luan Shala', season: '2026/27', members: [
    { name: 'Endrit Gashi', initials: 'EG', color: '#993556', position: 'FW', number: 10 },
  ] },
  { id: 'tm5', name: 'U13', category: 'Academy', color: '#534ab7', trainer: 'Luan Shala', season: '2026/27', members: [] },
];

export const CLUB_PROFILE = {
  name: 'FC Prishtina',
  founded: 1922,
  address: 'Rr. Luan Haradinaj, Prishtina, Kosovo',
  phone: '+383 38 220 200',
  email: 'info@fcprishtina.com',
  league: 'Superliga e Kosovës',
  stadium: 'Stadiumi i Prishtinës',
};

export type ClubSeason = { id: string; label: string; active: boolean };

export const CLUB_SEASONS: ClubSeason[] = [
  { id: 's1', label: '2026/27', active: true },
  { id: 's2', label: '2025/26', active: false },
  { id: 's3', label: '2024/25', active: false },
];

export type ExpenseStatus = 'paid' | 'pending' | 'reimbursed';

export type Expense = {
  id: string;
  title: string;
  category: string;
  amount: string;
  month: string;
  status: ExpenseStatus;
  color: string;
};

export const ALL_EXPENSES: Expense[] = [
  { id: 'e1', title: 'Match travel — Ballkani', category: 'travel', amount: '€420', month: 'Sep', status: 'paid', color: '#185fa5' },
  { id: 'e2', title: 'Training balls (pack of 12)', category: 'equipment', amount: '€260', month: 'Sep', status: 'paid', color: '#408A71' },
  { id: 'e3', title: 'Physio supplies', category: 'medical', amount: '€180', month: 'Sep', status: 'pending', color: '#f5a623' },
  { id: 'e4', title: 'Gym maintenance', category: 'facilities', amount: '€150', month: 'Sep', status: 'paid', color: '#534AB7' },
  { id: 'e5', title: 'Scouting & analysis', category: 'staff', amount: '€190', month: 'Sep', status: 'paid', color: '#5aa7e6' },
  { id: 'e6', title: 'Staff match-day meals', category: 'staff', amount: '€190', month: 'Aug', status: 'reimbursed', color: '#5aa7e6' },
  { id: 'e7', title: 'Pitch line marking', category: 'facilities', amount: '€120', month: 'Aug', status: 'paid', color: '#534AB7' },
];

export type CompetitionType = 'league' | 'cup' | 'friendly';

export type Competition = {
  id: string;
  name: string;
  type: CompetitionType;
  active: boolean;
};

export const ALL_COMPETITIONS: Competition[] = [
  { id: 'c1', name: 'Superliga e Kosovës', type: 'league', active: true },
  { id: 'c2', name: 'Kupa e Kosovës', type: 'cup', active: true },
  { id: 'c3', name: 'Superkupa e Kosovës', type: 'cup', active: true },
  { id: 'c4', name: 'Friendly matches', type: 'friendly', active: true },
  { id: 'c5', name: 'U19 League', type: 'league', active: false },
];

export type ClubField = { id: string; name: string; location: string; status: 'active' | 'maintenance' };

export const CLUB_FIELDS: ClubField[] = [
  { id: 'f1', name: 'Field 1', location: 'Training Centre', status: 'active' },
  { id: 'f2', name: 'Field 2', location: 'Training Centre', status: 'active' },
  { id: 'f3', name: 'Gym', location: 'Training Centre', status: 'active' },
  { id: 'f4', name: 'Pool', location: 'Recovery Suite', status: 'maintenance' },
];
