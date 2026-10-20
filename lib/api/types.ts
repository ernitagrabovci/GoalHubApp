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

/** A successful login / challenge completion — the app's stored session. */
export type SessionResponse = {
  token: string;
  user: ApiUser;
  club: ApiClub | null;
};

/** A correct password on a 2FA account — no token until the code is checked. */
export type TwoFactorChallengeResponse = {
  two_factor_required: true;
  challenge_token: string;
  /** Seconds until the challenge token expires. */
  expires_in: number;
};

/** `/auth/login` answers with either a session or a 2FA challenge. */
export type LoginResponse = SessionResponse | TwoFactorChallengeResponse;

export type MeResponse = {
  user: ApiUser;
  club: ApiClub | null;
};

/** `GET /auth/two-factor/status`. */
export type TwoFactorStatus = {
  enabled: boolean;
  confirmed_at: string | null;
  recovery_codes_remaining: number;
};

/** `POST /auth/two-factor/setup` — shown once for manual entry. */
export type TwoFactorSetupResponse = {
  secret: string;
  otpauth_url: string;
};

/** `POST /auth/two-factor/confirm` — the recovery codes are shown only once. */
export type TwoFactorConfirmResponse = {
  enabled: boolean;
  recovery_codes: string[];
  message: string;
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
  nationality: string | null;
  contract_start: string | null;
  contract_end: string | null;
  ffk_license: string | null;
  contract_type: string | null;
  /** Server may serialise DECIMAL columns as strings. */
  monthly_amount: number | string | null;
  payment_deadline_days: number | null;
  billing_cycle: string | null;
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

/** This month's session count and attendance rate, from `GET /trainings/stats`. */
export type TrainingStats = {
  /** `YYYY-MM`. */
  month: string;
  sessions: number;
  /** Percentage of present vs. marked rows; null when nothing is marked. */
  attendance_rate: number | null;
};

export type ApiSeason = {
  id?: number;
  name: string;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  /** Free-form competition names stored on the season (JSON column). */
  competitions?: string[] | null;
};

/** The fixed week keys stored in a training field's availability. */
export type FieldDay =
  | 'e_hene'
  | 'e_marte'
  | 'e_merkure'
  | 'e_enjte'
  | 'e_premte'
  | 'e_shtune'
  | 'e_diele';

export type ApiFieldAvailabilitySlot = {
  open: boolean;
  /** `HH:MM`. */
  from: string;
  to: string;
};

/** The whole week, as stored and returned by the club fields endpoints. */
export type ApiFieldAvailability = Record<FieldDay, ApiFieldAvailabilitySlot>;

/** A training field, from `GET /club/fields`. */
export type ApiTrainingField = {
  id: number;
  name: string;
  type: string | null;
  status: string | null;
  address: string | null;
  capacity: number | null;
  dimensions: string | null;
  has_lighting: boolean;
  locker_rooms: number;
  availability: ApiFieldAvailability | null;
  notes: string | null;
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

/** One player's call-up, present only on `GET /matches/{match}`. */
export type ApiMatchLineupEntry = {
  player_id: number;
  player_name: string | null;
  /** `starter`, `substitute` or `out`. */
  type: string;
  position: string | null;
  order: number | null;
};

/** One player's line in the final result, on `GET /matches/{match}`. */
export type ApiMatchPlayerStat = {
  player_id: number;
  player_name: string | null;
  goals: number | null;
  assists: number | null;
  minutes_played: number | null;
  yellow_cards: number | null;
  red_cards: number | null;
  rating: number | null;
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
  /** Present only on the show endpoint (`whenLoaded`). */
  lineup?: ApiMatchLineupEntry[];
  /** Present only on the show endpoint (`whenLoaded`). */
  player_stats?: ApiMatchPlayerStat[];
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

/** One attendance line, present only on `GET /trainings/{training}`. */
export type ApiTrainingAttendance = {
  player_id: number;
  player_name: string | null;
  /** `present`, `absent` or `unconfirmed`. */
  status: string;
  reason: string | null;
  confirmed_at: string | null;
};

/** A training session, from `GET /trainings` (paginated) and `GET /trainings/{training}`. */
export type ApiTraining = {
  id: number;
  /** `regular`, `tactical`, `physical` or `recovery`. */
  type: string | null;
  field: string | null;
  scheduled_at: string | null;
  duration_minutes: number | null;
  notes: string | null;
  attendance_finalized: boolean;
  team?: { id: number; name: string } | null;
  trainer?: { id: number; name: string } | null;
  /** Counts, present on the index; absent on the show endpoint. */
  attendances_count?: number;
  present_count?: number;
  reported_absences_count?: number;
  /** Only present on the show endpoint. */
  attendances?: ApiTrainingAttendance[];
  /** The caller's own status — only present on the player's own list. */
  my_attendance?: string | null;
};

/** A coaching-library item, from `GET /library` (paginated). */
export type ApiTrainingMaterial = {
  id: number;
  title: string;
  /** `beginner`, `intermediate` or `advanced`. */
  level: string | null;
  category: string | null;
  description: string | null;
  file_path: string | null;
  /** `mp4`, `gif`, `pdf` or null. */
  file_type: string | null;
  is_shared: boolean;
  /** The team the material is shared with, or null when it isn't shared. */
  shared_team_id: number | null;
  trainer: { id: number; name: string } | null;
  created_at: string | null;
};

/** `GET /library` — the paginated shelf plus the distinct categories. */
export type TrainingLibraryResponse = Paginated<ApiTrainingMaterial> & { categories: string[] };

/** The writable fields of a library item — `POST`/`PATCH /library`. */
export type LibraryInput = {
  title: string;
  /** `beginner`, `intermediate` or `advanced`. */
  level: string;
  category?: string | null;
  description?: string | null;
  /** When set, the material is shared with that team and its players notified. */
  shared_team_id?: number | null;
};

/** The writable fields of a training session — `POST`/`PATCH /trainings`. */
export type TrainingInput = {
  /** `tactical`, `physical`, `recovery` or `regular`. */
  type: string;
  field?: string | null;
  training_field_id?: number | null;
  /** Required on create; omitted (frozen) when updating a finalized session. */
  scheduled_at?: string | null;
  duration_minutes: number;
  notes?: string | null;
};

/** The writable fields of a season — `POST /club/seasons`. */
export type SeasonInput = {
  name: string;
  start_date: string;
  end_date: string;
  competitions?: string[] | null;
};

/** A tactical drill, from `GET /drills` (paginated) and `GET /drills/{drill}`. */
export type ApiDrill = {
  id: number;
  title: string;
  description: string | null;
  category: string | null;
  duration_minutes: number | null;
  repetitions: number | null;
  thumbnail: string | null;
  is_shared: boolean;
  /** The board schema — present only on the detail endpoint. */
  data?: string | null;
  created_at: string | null;
};

/** The writable fields of a drill — `POST`/`PATCH /drills`. */
export type DrillInput = {
  title: string;
  description?: string | null;
  category?: string | null;
  duration_minutes?: number | null;
  repetitions?: number | null;
  data?: string | null;
  thumbnail?: string | null;
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
    starts_at: string | null;
    ends_at: string | null;
    /** The display price for the plan; null for unknown or missing plans. */
    price: { amount: number; currency: string; interval: string } | null;
  };
};

/** Club-wide membership-fee totals, from `GET /finance/stats`. */
export type FinanceStats = {
  paid: number;
  unpaid: number;
  overdue: number;
  collected: number;
  pending: number;
};

/** One membership-fee row, from `GET /finance/fees` (paginated). */
export type ApiFee = {
  id: number;
  month: string | null;
  period_end: string | null;
  amount: number;
  discount: number;
  final_amount: number;
  due_date: string | null;
  paid_at: string | null;
  /** `paid`, `unpaid` or `overdue`. */
  status: string;
  payment_method: string | null;
  invoice_number: string | null;
  player: { id: number; name: string | null } | null;
  team: { id: number; name: string } | null;
};

/** One month of the collection report, from `GET /finance/reports`. */
export type FinanceReportMonth = {
  label: string;
  month: number;
  year: number;
  collected: number;
  pending: number;
  overdue: number;
};

/** The club's collection report totals, from `GET /finance/reports`. */
export type FinanceReports = {
  months: FinanceReportMonth[];
  season_collected: number;
  season_pending: number;
  season_overdue: number;
};

/** A system notification, from `GET /notifications` (paginated). */export type ApiNotification = {
  id: number;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  /** Who it came from — `admin`, `trainer` or `platform`. */
  source: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string | null;
};

/** Unread counters, from `GET /badges`. */
export type ApiBadges = {
  notifications: number;
  messages: number;
  direct: number;
  groups: number;
  channel: number;
};

/** One row of `GET /conversations` — an existing DM partner or group. */
export type ApiConversation = {
  type: 'dm' | 'group';
  /** The partner's user id for a DM, the group id for a group. */
  id: number;
  name: string;
  role_label: string;
  role_color: string;
  /** Two letters, or the 👥 glyph on a group. */
  initials: string;
  badge: string | null;
  last_message: string;
  last_mine: boolean;
  last_read: boolean;
  /** `09:42` when today, otherwise `17/09`. */
  last_time: string;
  unread_count: number;
  url: string;
  members_label: string | null;
};

/** Someone the requester is allowed to message (the composer's roster). */
export type ApiContact = {
  id: number;
  name: string;
  role_label: string;
  role_color: string;
  initials: string;
  url: string;
};

/** One emoji tally on a message. */
export type ApiMessageReaction = {
  reaction: string;
  count: number;
  mine: boolean;
};

/** One message, as a chat bubble renders it. */
export type ApiMessage = {
  id: number;
  body: string;
  mine: boolean;
  time: string;
  /** `null` on a message you received. */
  read: boolean | null;
  sender: string | null;
  edited: boolean;
  deleted: boolean;
  reactions: ApiMessageReaction[];
};

/** `GET /conversations` — the list plus who you can start talking to. */
export type ConversationsResponse = {
  conversations: ApiConversation[];
  contacts: ApiContact[];
  total_unread: number;
};

/** `GET /conversations/{user}` — one direct thread. */
export type ThreadResponse = {
  contact: { id: number; name: string };
  messages: ApiMessage[];
  read_ids: number[];
  updates: ApiMessage[];
};

/** `GET /groups/{group}` — one group thread. */
export type GroupThreadResponse = {
  group: { id: number; name: string; members: string[] };
  messages: ApiMessage[];
  updates: ApiMessage[];
};

/** `POST /groups` — the new group's opening envelope. */
export type CreateGroupResponse = GroupThreadResponse & { message: string };

/** One personal access token, from `GET /security/sessions`. */
export type ApiSecuritySession = {
  id: number;
  name: string;
  created_at: string | null;
  last_used_at: string | null;
  expires_at: string | null;
  current: boolean;
};

/** `GET /security/sessions` — current request metadata plus the caller's tokens. */
export type SecuritySessionsResponse = {
  last_login_at: string | null;
  current: {
    /** Null when the caller authenticated without a personal access token. */
    id: number | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string | null;
    last_used_at: string | null;
  };
  sessions: ApiSecuritySession[];
};

/** One payable period, from `GET /finance/players/{player}/unpaid`. */
export type UnpaidPeriod = {
  /** `null` on a future period that has no fee row yet. */
  id: number | null;
  period: string;
  final_amount: number;
  due_date: string | null;
  status: string;
  is_new: boolean;
  period_start?: string;
  period_end?: string;
};

/** A player's outstanding and upcoming periods. */
export type PlayerPeriods = {
  player: { id: number; name: string | null };
  unpaid: UnpaidPeriod[];
  future: UnpaidPeriod[];
};

/** `GET /players/{player}/attendance` — finalized-training totals. */
export type ApiAttendance = {
  total: number;
  present: number;
  absent: number;
  unconfirmed: number;
  /** Whole percent. */
  rate: number;
};

/** `GET /players/{player}/finance` and `GET /my/finance`. */
export type ApiFinanceSummary = {
  paid: number;
  unpaid: number;
  delayed: number;
  critical: number;
  overdue: number;
  total_paid: number;
  total_outstanding: number;
};

/** `GET /my/statistics` — the signed-in player's lifetime match totals. */
export type ApiPlayerStatistics = {
  statistics: {
    matches: number;
    minutes: number;
    goals: number;
    assists: number;
    yellow_cards: number;
    red_cards: number;
    /** `null` until at least one match has been rated. */
    rating: number | null;
  };
};

/** One row of `GET /players/statistics` — season totals per player. */
export type PlayerStatRow = {
  player_id: number;
  name: string | null;
  team_id: number | null;
  team: string | null;
  jersey_number: number | string | null;
  position: string | null;
  matches: number | string;
  minutes: number | string;
  goals: number | string;
  assists: number | string;
  yellow_cards: number | string;
  red_cards: number | string;
  rating: number | string | null;
};

/** `GET /players/statistics` — the rows plus club-wide totals. */
export type PlayerStatisticsResponse = {
  data: PlayerStatRow[];
  totals: { players: number; goals: number; assists: number; minutes: number };
};

/** One row of `GET /ratings` — a player's averaged coach ratings. */
export type PlayerRatingRow = {
  player_id: number;
  name: string | null;
  team_id: number | null;
  team: string | null;
  jersey_number: number | string | null;
  position: string | null;
  technique: number | string | null;
  physical: number | string | null;
  tactics: number | string | null;
  consistency: number | string | null;
  teamwork: number | string | null;
  average: number | string | null;
  ratings_count: number | string;
  last_rated_at: string | null;
};

/** A competition, from `GET /competitions`. */
export type ApiCompetition = {
  id: number;
  name: string;
  type: 'league' | 'cup' | 'friendly' | string;
  is_active: boolean;
  created_at: string | null;
};

/** A playing position option, from `GET /positions`. */
export type ApiPosition = {
  id: number;
  code: string;
  name: string;
  color: string | null;
};

/** Envelope for a single-resource mutation — `{ data, message }`. */
export type MutationResponse<T> = { data: T; message: string };

/* ─────────────────────────────  Parent / children  ───────────────────────────── */

/** One coach rating, from the child's ratings list and the dashboard `last_rating`. */
export type ApiChildRating = {
  id: number;
  technique: number | string | null;
  physical: number | string | null;
  tactics: number | string | null;
  consistency: number | string | null;
  teamwork: number | string | null;
  /** A stored-as generated column; `7.40` on MySQL, an int under SQLite. */
  average: number | string | null;
  comment: string | null;
  rated_at: string | null;
  /** `training`, `match` or `general`. */
  context_type: string | null;
  context_id: number | null;
  /** Only present on the ratings list (`whenLoaded`). */
  trainer?: { id: number; name: string } | null;
  created_at: string | null;
};

/** The soonest upcoming session for a child's team, on the dashboard row. */
export type ApiChildNextTraining = {
  id: number;
  type: string | null;
  field: string | null;
  scheduled_at: string | null;
  trainer: { id: number; name: string } | null;
};

/** One row of the parent dashboard, from `GET /my/children`. */
export type ApiChild = {
  id: number;
  name: string | null;
  jersey_number: number | string | null;
  position: string | null;
  team: ApiTeamRef | null;
  /** `active`, `injured`, `rehabilitation` or `suspended`. */
  health_status: string;
  /** Attendance rate as a whole percent. */
  attendance_rate: number;
  open_fees_count: number;
  overdue_fees_count: number;
  active_injuries_count: number;
  last_rating: ApiChildRating | null;
  next_training: ApiChildNextTraining | null;
};

/** `GET /my/children` — the children plus the family totals. */
export type ChildrenResponse = {
  data: ApiChild[];
  totals: { children: number; open_fees: number; overdue_fees: number; active_injuries: number };
};

/** The `summary` block on `GET /my/children/{id}`. */
export type ApiChildSummary = {
  attendance: { total: number; present: number; absent: number; rate: number };
  match_stats: {
    matches: number;
    goals: number;
    assists: number;
    minutes: number;
    yellow_cards: number;
    red_cards: number;
  };
  last_rating: ApiChildRating | null;
  fees: { paid: number; unpaid: number; overdue: number; total_paid: number };
  active_injuries: number;
};

/** `GET /my/children/{id}` — the child's player record plus the summary block. */
export type ChildResponse = { data: ApiPlayer; summary: ApiChildSummary };

/** One attendance line, from `GET /my/children/{id}/attendance`. */
export type ApiChildAttendance = {
  id: number;
  training_id: number;
  /** `present`, `absent` or `unconfirmed`. */
  status: string;
  reason: string | null;
  confirmed_at: string | null;
  created_at: string | null;
  training: {
    id: number;
    type: string | null;
    field: string | null;
    scheduled_at: string | null;
    trainer: { id: number; name: string } | null;
  } | null;
};

/** A club member, from `GET /users`. */
export type ApiMember = {
  id: number;
  name: string;
  email: string | null;
  avatar: string | null;
  role: string;
  role_label: string | null;
  is_active: boolean;
  team: { id: number; name: string } | null;
  jersey_number: number | string | null;
  position: string | null;
  last_login_at: string | null;
  created_at: string | null;
};

/* ───────────────────────  Notification preferences  ─────────────────────── */

/**
 * The signed-in user's platform-notification switches, from
 * `GET /notifications/preferences`. Keys mirror the server's allowed set.
 */
export type ApiNotificationPreferences = {
  injury_registered: boolean;
  fee_overdue: boolean;
  fee_critical: boolean;
  attendance_confirm: boolean;
  new_message: boolean;
  match_upcoming: boolean;
};

/** Both preference endpoints answer with the full, merged switch set. */
export type NotificationPreferencesResponse = {
  preferences: ApiNotificationPreferences;
};
