/**
 * Team list shared by "Lista e ekipeve" and the single-team "Ekipa" page.
 */
export type Team = {
  name: string;
  season: string;
  coach: string;
  players: number;
  matches: number;
  win: number;
  draw: number;
  loss: number;
  goalsPlus: number;
  goalsMinus: number;
};

export const TEAMS: Team[] = [
  {
    name: 'Ekipi i Parë',
    season: '2025/2026',
    coach: 'Rexhep Hyseni',
    players: 25,
    matches: 9,
    win: 2,
    draw: 1,
    loss: 6,
    goalsPlus: 1,
    goalsMinus: 17,
  },
  {
    name: 'U13',
    season: '2025/2026',
    coach: 'Adnan Hoxha',
    players: 12,
    matches: 12,
    win: 5,
    draw: 3,
    loss: 4,
    goalsPlus: 14,
    goalsMinus: 11,
  },
  {
    name: 'U15',
    season: '2025/2026',
    coach: 'Genc Nimani',
    players: 14,
    matches: 12,
    win: 4,
    draw: 4,
    loss: 4,
    goalsPlus: 11,
    goalsMinus: 13,
  },
  {
    name: 'U17',
    season: '2025/2026',
    coach: 'Blerim Zeka',
    players: 16,
    matches: 10,
    win: 6,
    draw: 2,
    loss: 2,
    goalsPlus: 16,
    goalsMinus: 8,
  },
  {
    name: 'U21',
    season: '2025/2026',
    coach: 'Fatos Demaku',
    players: 18,
    matches: 13,
    win: 3,
    draw: 5,
    loss: 5,
    goalsPlus: 12,
    goalsMinus: 15,
  },
];
