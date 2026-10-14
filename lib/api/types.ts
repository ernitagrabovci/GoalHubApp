/** Roles as they come from the backend — a superset of the app's `Role`. */
export type ApiRole =
  | 'administrator'
  | 'trainer'
  | 'assistant_trainer'
  | 'technical_staff'
  | 'player'
  | 'parent'
  | 'financier';

export type ApiUser = {
  id: number;
  name: string;
  email: string;
  role: ApiRole;
  avatar: string | null;
};

export type ApiClub = {
  id: number;
  name: string;
  subscription_status: string | null;
  subscription_plan?: string | null;
};

/** 422 responses carry `{ field: [message, ...] }`. */
export type FieldErrors = Record<string, string[]>;

export type LoginResponse = {
  token: string;
  user: ApiUser;
  club: ApiClub | null;
};

export type MeResponse = {
  user: ApiUser;
  club: ApiClub | null;
};

export type ProfileResponse = {
  message: string;
  user: ApiUser & { language?: string | null };
};

export type MessageResponse = {
  message: string;
};

/** A team as embedded on a player record. */
export type ApiTeamRef = {
  id: number;
  name: string;
  color_hex: string | null;
};

/** Squad member as returned by `GET /players`. */
export type ApiPlayer = {
  id: number;
  name: string | null;
  email: string | null;
  avatar: string | null;
  is_active: boolean;
  jersey_number: number | string | null;
  position: string | null;
  team: ApiTeamRef | null;
  health_status: 'active' | 'injured' | 'rehabilitation' | 'suspended' | string;
  date_of_birth: string | null;
  age: number | null;
  contract_start: string | null;
  contract_end: string | null;
};

/** Laravel's paginated resource collection envelope. */
export type Paginated<T> = {
  data: T[];
  links: { first: string | null; last: string | null; prev: string | null; next: string | null };
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    path: string;
  };
};

/** Squad counts by `health_status`, from `GET /players/stats`. */
export type PlayerStats = {
  total: number;
  active: number;
  injured: number;
  rehabilitation: number;
  suspended: number;
};

export type ApiSeason = {
  name: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
};

/** Club aggregate stats, from `GET /dashboard/stats` (administrator only). */
export type DashboardStats = {
  club: {
    id: number;
    name: string;
    subscription_status: string | null;
    subscription_plan: string | null;
    on_trial: boolean;
  };
  season: ApiSeason | null;
  stats: {
    players: number;
    teams: number;
    trainings: number;
    unpaid_fees: number;
    critical_fees: number;
    delayed_fees: number;
    injured: number;
    users: number;
    pending_users: number;
    total_paid: number;
    monthly_income: number;
  };
};

/** A team as returned by `GET /teams` and `GET /teams/{team}`. */
export type ApiTeam = {
  id: number;
  name: string;
  color_hex: string | null;
  season: string | null;
  trainer: { id: number; name: string; avatar: string | null } | null;
  assistant_trainer: { id: number; name: string; avatar: string | null } | null;
  players_count?: number;
  created_at: string | null;
};

/** A team plus its squad, from `GET /teams/{team}`. */
export type ApiTeamDetail = ApiTeam & { players: ApiPlayer[] };

/** Team totals, from `GET /teams/stats`. */
export type TeamStats = {
  total_teams: number;
  total_players: number;
  total_trainers: number;
  season: string | null;
};

/** A match, from `GET /matches` (paginated) and `GET /matches/{match}`. */
export type ApiMatch = {
  id: number;
  opponent: string | null;
  competition: string | null;
  venue: string | null;
  scheduled_at: string | null;
  transport_at: string | null;
  goals_for: number | null;
  goals_against: number | null;
  status: string | null;
  notes: string | null;
  team: ApiTeamRef | null;
};

/** An injury record, from `GET /injuries` (paginated) and `GET /injuries/{injury}`. */
export type ApiInjury = {
  id: number;
  injury_type: string;
  /** `training`, `match` or `other`. */
  occurred_during: string | null;
  injury_date: string | null;
  expected_return: string | null;
  recovered_at: string | null;
  /** `injured`, `rehabilitation` or `recovered`. */
  status: string;
  description: string | null;
  treatment: string | null;
  medical_notes: string | null;
  notify_admin: boolean;
  player: { id: number; name: string | null } | null;
  team: { id: number; name: string } | null;
  created_at: string | null;
};

/** One player's line in `GET /reports/players`. */
export type PlayerReportRow = {
  id: number;
  name: string | null;
  position: string | null;
  team: { id: number; name: string } | null;
  matches: number;
  goals: number;
  assists: number;
  minutes: number;
  yellow_cards: number;
  red_cards: number;
  attendance_pct: number;
  latest_rating: number | null;
};

export type TeamAttendance = { name: string; present: number; absent: number };

/** `GET /reports/players` — the individual table plus per-team attendance. */
export type PlayersReport = {
  players: PlayerReportRow[];
  attendance_by_team: TeamAttendance[];
};

export type MatchReportRow = {
  id: number;
  opponent: string | null;
  competition: string | null;
  scheduled_at: string | null;
  goals_for: number | null;
  goals_against: number | null;
  team: { id: number; name: string } | null;
};

/** `GET /reports/matches`. */
export type MatchesReport = {
  matches: MatchReportRow[];
  stats: { total: number; wins: number; draws: number; losses: number; gf: number; ga: number };
  by_competition: { competition: string | null; wins: number; draws: number; losses: number }[];
};

/** `GET /reports/finance`. */
export type FinanceReport = {
  stats: { paid: number; delayed: number; unpaid: number; rate: number };
  trend: { label: string; income: number; count: number }[];
  fees_by_team: { team_name: string; total: number; paid: number }[];
};

/** `GET /reports/activity`. */
export type ActivityReport = {
  stats: { today: number; week: number; inactive: number; total: number };
  recent_logins: { id: number; name: string; role: string; last_login_at: string | null }[];
  by_role: Record<string, number>;
};

/** The club's full profile, from `GET /club` and `PATCH /club`. */
export type ApiClubProfile = {
  id: number;
  name: string;
  abbreviation: string | null;
  logo: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  founded_year: number | null;
  federation: string | null;
  category: string | null;
  license_number: string | null;
  color_primary: string | null;
  color_secondary: string | null;
  color_accent: string | null;
  facebook: string | null;
  instagram: string | null;
  youtube: string | null;
  twitter: string | null;
  description: string | null;
  fee_grace_days: number | null;
  fee_due_day: number | null;
  subscription: {
    status: string | null;
    plan: string | null;
    on_trial: boolean;
    active: boolean;
    ends_at: string | null;
  };
};
