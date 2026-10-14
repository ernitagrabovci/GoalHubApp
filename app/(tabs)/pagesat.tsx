import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import { financeStats, listFees, playerUnpaidPeriods, registerPayment } from '@/lib/api/finance';
import { listPlayers } from '@/lib/api/players';
import { listTeams } from '@/lib/api/teams';
import type {
  ApiFee,
  ApiPlayer,
  ApiTeam,
  FinanceStats,
  Paginated,
  PlayerPeriods,
} from '@/lib/api/types';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * Kuota e anëtarësisë — the admin's "Pagesat" tab. Three headline counts, the
 * team filter / register controls, a search row and the per-player quota table.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',
  ghost: '#9E9E9E',

  /* blueSoft = the pale fill of the control buttons; blueBtn = the solid blue. */
  blueSoft: '#E3EEFB',
  blueBtn: '#86BCFD',
  blue2: '#F6FBFF',

  border: 'rgba(100,140,190,0.30)',
  rowLine: 'rgba(100,140,190,0.22)',
  headLine: 'rgba(30,40,35,0.10)',

  green: '#159447',
  red: '#E03131',
  orange: '#E4A000',
};

/* Green palette shared by every popup in the app. */
const MO = {
  border: '#159B63',
  divider: '#55B88B',
  title: '#080808',
  text: '#111111',
  sub: '#666666',
  inputBorder: '#777777',
  inputBg: '#FAFCFC',
  ph: '#A8A8A8',
  cancel: '#ED5050',
  create: '#16A51D',
  white: '#F5F5F5',
  err: '#C90000',
};

/* The payment methods the backend accepts (`cash`/`bank_transfer`/`card`),
   shown with the labels the design uses. */
type PayMethod = 'cash' | 'bank_transfer' | 'card';

const PAY_METHODS: { key: PayMethod; label: string }[] = [
  { key: 'cash', label: 'Kesh' },
  { key: 'bank_transfer', label: 'Transfer bankar' },
  { key: 'card', label: 'Kartë bankare' },
];

const IMG = {
  pagesatArt: require('@/assets/dashboard/pagesat-art.png'),
};

/**
 * The squares sit on a near-white page, so a white frost on its own reads as
 * nothing. Shading the pane instead — a very light grey at the top edge
 * sweeping down to white — is what gives the surface its glassy shape.
 */
const SQ_GLOSS = [
  'rgba(180,188,201,0.30)',
  'rgba(216,222,231,0.15)',
  'rgba(245,245,245,0.80)',
] as const;

/** Thin specular rim on the top edge — reads as the thickness of the pane. */
const SQ_SHEEN = ['rgba(245,245,245,0.55)', 'rgba(245,245,245,0.00)'] as const;

/** 16840 → "$16,840" — grouped thousands, no cents. */
function usd(n: number) {
  return `$${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/** The dialog's three date boxes → the `YYYY-MM-DD` the API wants, or `null`. */
function toIsoDate(day: string, month: string, year: string): string | null {
  if (!day || !month || !year) return null;
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y)) return null;
  if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > 9999) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** One colour per payment status, reused by the table. */
const STATUS_TONE: Record<string, string> = {
  Paguar: C.green,
  Papaguar: C.orange,
  Skaduar: C.red,
};

/** Backend fee status → the Albanian label the tones are keyed on. */
const STATUS_LABEL: Record<string, string> = {
  paid: 'Paguar',
  unpaid: 'Papaguar',
  overdue: 'Skaduar',
};

/* Table columns — fixed widths so nothing gets squeezed; the frame scrolls. */
const COL_NAME = 104;
const COL_TEAM = 62;
const COL_QUOTA = 62;
const COL_COLLECTED = 70;
const COL_PENDING = 62;
const COL_STATUS = 70;
const COL_ACTION = 58;

export default function PaymentsScreen() {
  const router = useRouter();
  const { token, signOut } = useSession();

  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [fees, setFees] = useState<Paginated<ApiFee> | null>(null);
  const [teams, setTeams] = useState<ApiTeam[]>([]);
  const [teamId, setTeamId] = useState<number | null>(null);
  const [teamOpen, setTeamOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  /** Bumped after a payment is registered, to refetch the stats and the table. */
  const [version, setVersion] = useState(0);

  // Headline totals and the team filter list are one-shots.
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    Promise.allSettled([financeStats(token, controller.signal), listTeams(token, controller.signal)])
      .then(([totals, teamList]) => {
        if (controller.signal.aborted) return;

        const failure = [totals, teamList].find((r) => r.status === 'rejected');
        if (
          failure &&
          failure.status === 'rejected' &&
          failure.reason instanceof ApiError &&
          failure.reason.status === 401
        ) {
          signOut();
          router.replace('/login');
          return;
        }

        if (totals.status === 'fulfilled') setStats(totals.value);
        if (teamList.status === 'fulfilled') setTeams(teamList.value.data);
      });

    return () => controller.abort();
  }, [token, version, router, signOut]);

  // The table refetches whenever the filters change.
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    listFees(
      token,
      { page, team_id: teamId ?? undefined, search: search || undefined },
      controller.signal,
    )
      .then((res) => {
        if (controller.signal.aborted) return;
        setFees(res);
        setError(null);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          signOut();
          router.replace('/login');
          return;
        }
        setError(
          err instanceof ApiError && err.status === 0
            ? 'Nuk mund të lidhemi me serverin. Kontrollo lidhjen.'
            : 'Nuk mund të ngarkohen pagesat.',
        );
      });

    return () => controller.abort();
  }, [token, version, page, teamId, search, router, signOut]);

  const summary = [
    {
      label: 'Kuota të mbledhura',
      value: stats ? usd(stats.collected) : '—',
      note: stats ? `${stats.paid} pagesa të kryera` : '—',
      tone: C.green,
    },
    {
      label: 'Pagesat e papaguara',
      value: stats ? String(stats.unpaid) : '—',
      note: 'Brenda afatit',
      tone: C.orange,
    },
    {
      label: 'Pagesat e skaduara',
      value: stats ? String(stats.overdue) : '—',
      note: 'Tolerancë 10 ditësh',
      tone: C.red,
    },
  ];

  const rows = (fees?.data ?? []).map((f) => {
    const amount = usd(Number(f.final_amount) || 0);
    const paid = f.status === 'paid';
    return {
      id: f.id,
      name: f.player?.name ?? '—',
      team: f.team?.name ?? '—',
      quota: amount,
      collected: paid ? amount : usd(0),
      pending: paid ? usd(0) : amount,
      status: STATUS_LABEL[f.status] ?? f.status,
    };
  });

  const lastPage = fees?.meta.last_page ?? 0;
  const pages = Array.from({ length: lastPage }, (_, i) => i + 1);
  const selectedTeam = teams.find((t) => t.id === teamId)?.name ?? 'Të gjitha ekipet';

  const pickTeam = (id: number | null) => {
    setTeamId(id);
    setPage(1);
    setTeamOpen(false);
  };

  const runSearch = () => {
    setSearch(query);
    setPage(1);
  };

  const reload = () => setVersion((v) => v + 1);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.canvas}>
        {/* Pinned header */}
        <View style={styles.header}>
          <View style={styles.colPad}>
            <View style={styles.headerRow}>
              <Pressable
                onPress={() => router.back()}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Kthehu prapa"
                style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons name="chevron-left" size={I(24)} color={C.text} />
              </Pressable>
              <View style={styles.headerText}>
                <Text style={styles.title} numberOfLines={1}>
                  Kuota e anëtarësisë
                </Text>
                <Text
                  style={styles.subtitle}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  Menaxhimi i pagesave të lojtarëve ·{' '}
                  <Text style={styles.subtitleStrong}>Toleranca: 10 ditë</Text>
                </Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.scroll}
        >
          {/* ── Headline counts ─────────────────────────────────── */}
          {/* Only three, so they share the row instead of scrolling. */}
          <View style={styles.summaryRow}>
            {summary.map((s) => (
              <View key={s.label} style={styles.sqShadow}>
                <View style={styles.sq}>
                  {/* Frost the canvas grid, then lay a gloss sweep over it. */}
                  <BlurView
                    pointerEvents="none"
                    intensity={50}
                    tint="light"
                    style={StyleSheet.absoluteFill}
                  />
                  <LinearGradient
                    pointerEvents="none"
                    style={StyleSheet.absoluteFill}
                    colors={SQ_GLOSS}
                    locations={[0, 0.55, 1]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <LinearGradient
                    pointerEvents="none"
                    style={styles.sheen}
                    colors={SQ_SHEEN}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                  />

                  <View style={styles.sqBody}>
                    <Text
                      style={styles.sqLabel}
                      numberOfLines={2}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {s.label}
                    </Text>
                    <Text
                      style={[styles.sqValue, { color: s.tone }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.5}
                    >
                      {s.value}
                    </Text>
                    <Text style={[styles.sqHint, { color: s.tone }]} numberOfLines={2}>
                      {s.note}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.colPad}>
            {/* ── Raporti ───────────────────────────────────────── */}
            <Pressable
              onPress={() => router.push('/raporti-pagesave')}
              accessibilityRole="button"
              accessibilityLabel="Raporti i pagesave"
              style={({ pressed }) => [styles.raporti, pressed && styles.pressed]}
            >
              {/* Art bleeds off both edges; the right copy is mirrored. */}
              <Image source={IMG.pagesatArt} style={styles.raportiArtLeft} resizeMode="contain" />
              <Image source={IMG.pagesatArt} style={styles.raportiArtRight} resizeMode="contain" />

              <View style={styles.raportiBody}>
                <Text style={styles.raportiTitle} numberOfLines={1}>
                  Raporti
                </Text>

                <View style={styles.raportiBtn}>
                  <Text style={styles.raportiBtnText}>Vazhdo</Text>
                </View>
              </View>
            </Pressable>

            {/* ── Filter / register ─────────────────────────────── */}
            <View style={styles.actions}>
              <View>
                <Pressable
                  onPress={() => setTeamOpen((o) => !o)}
                  accessibilityRole="button"
                  accessibilityLabel="Filtro sipas ekipit"
                  style={({ pressed }) => [styles.controlBtn, pressed && styles.pressed]}
                >
                  <Text style={styles.controlText} numberOfLines={1}>
                    {selectedTeam}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={I(14)} color="#000000" />
                </Pressable>

                {teamOpen ? (
                  <View style={styles.teamOpts}>
                    <Pressable
                      onPress={() => pickTeam(null)}
                      accessibilityRole="button"
                      style={styles.teamOpt}
                    >
                      <Text
                        style={[styles.teamOptText, teamId === null && styles.teamOptTextOn]}
                        numberOfLines={1}
                      >
                        Të gjitha ekipet
                      </Text>
                    </Pressable>
                    {teams.map((t) => (
                      <Pressable
                        key={t.id}
                        onPress={() => pickTeam(t.id)}
                        accessibilityRole="button"
                        style={styles.teamOpt}
                      >
                        <Text
                          style={[styles.teamOptText, teamId === t.id && styles.teamOptTextOn]}
                          numberOfLines={1}
                        >
                          {t.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>

              <Pressable
                onPress={() => setRegistering(true)}
                accessibilityRole="button"
                accessibilityLabel="Regjistro pagesën"
                style={({ pressed }) => [styles.controlBtn, pressed && styles.pressed]}
              >
                <View style={styles.plusCircle}>
                  <MaterialCommunityIcons name="plus" size={I(15)} color="#F5F5F5" />
                </View>
                <Text style={styles.controlText}>Regjistro pagesën</Text>
              </Pressable>
            </View>

            {/* ── Search ────────────────────────────────────────── */}
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchBox}
                placeholder="Kërko me emër lojtarin"
                placeholderTextColor={C.ghost}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={runSearch}
                returnKeyType="search"
                autoCorrect={false}
              />
              <Pressable
                onPress={runSearch}
                accessibilityRole="button"
                accessibilityLabel="Kërko"
                style={({ pressed }) => [styles.searchBtn, pressed && styles.pressed]}
              >
                <Text style={styles.searchBtnText}>Kërko</Text>
              </Pressable>
            </View>

            {/* ── Pagesat e lojtarëve ───────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.head}>
                <Text style={styles.headText}>Pagesat e lojtarëve</Text>
              </View>
              <View style={styles.headLine} />

              {/* Table — scroll sideways so no column gets squeezed */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={styles.tblInner}
              >
                <View>
                  <View style={styles.tr}>
                    <Text style={[styles.th, styles.thLeft, { width: COL_NAME }]}>Emri</Text>
                    <Text style={[styles.th, { width: COL_TEAM }]}>Ekipi</Text>
                    <Text style={[styles.th, { width: COL_QUOTA }]}>Kuota</Text>
                    <Text style={[styles.th, { width: COL_COLLECTED }]}>Mbledhur</Text>
                    <Text style={[styles.th, { width: COL_PENDING }]}>Në pritje</Text>
                    <Text style={[styles.th, { width: COL_STATUS }]}>Statusi</Text>
                    <View style={{ width: COL_ACTION }} />
                  </View>

                  {error ? (
                    <View style={styles.tr}>
                      <Text style={[styles.td, styles.thLeft]}>{error}</Text>
                    </View>
                  ) : fees === null ? (
                    <View style={styles.tr}>
                      <Text style={[styles.td, styles.thLeft]}>…</Text>
                    </View>
                  ) : rows.length === 0 ? (
                    <View style={styles.tr}>
                      <Text style={[styles.td, styles.thLeft]}>Nuk ka pagesa.</Text>
                    </View>
                  ) : rows.map((p) => (
                    <View key={p.id} style={[styles.tr, styles.trBorder]}>
                      <Text
                        style={[styles.tdName, styles.thLeft, { width: COL_NAME }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                      >
                        {p.name}
                      </Text>
                      <Text
                        style={[styles.td, { width: COL_TEAM }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                      >
                        {p.team}
                      </Text>
                      <Text style={[styles.td, { width: COL_QUOTA }]} numberOfLines={1}>
                        {p.quota}
                      </Text>
                      <Text style={[styles.td, { width: COL_COLLECTED }]} numberOfLines={1}>
                        {p.collected}
                      </Text>
                      <Text style={[styles.td, { width: COL_PENDING }]} numberOfLines={1}>
                        {p.pending}
                      </Text>
                      <Text
                        style={[
                          styles.td,
                          styles.tdStatus,
                          { width: COL_STATUS, color: STATUS_TONE[p.status] ?? C.hint },
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                      >
                        {p.status}
                      </Text>
                      <View style={[styles.colAction, { width: COL_ACTION }]}>
                        <Pressable
                          onPress={() =>
                            router.push({
                              pathname: '/pagesa-lojtari',
                              params: { name: p.name, team: p.team },
                            })
                          }
                          accessibilityRole="button"
                          accessibilityLabel={`Shiko pagesën e ${p.name}`}
                          style={({ pressed }) => [styles.viewBtn, pressed && styles.pressed]}
                        >
                          <Text style={styles.viewBtnText}>Shiko</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* ── Pager ─────────────────────────────────────────── */}
            {lastPage > 1 ? (
              <View style={styles.pager}>
                <Pressable
                  onPress={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  accessibilityRole="button"
                  accessibilityLabel="Faqja e mëparshme"
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.pagerArrow,
                    page <= 1 && styles.pagerOff,
                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialCommunityIcons name="chevron-left" size={I(22)} color={C.text} />
                </Pressable>

                {pages.map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => setPage(p)}
                    accessibilityRole="button"
                    accessibilityLabel={`Faqja ${p}`}
                    style={({ pressed }) => [
                      styles.pageSq,
                      p === page && styles.pageSqOn,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.pageSqText}>{p}</Text>
                  </Pressable>
                ))}

                <Pressable
                  onPress={() => setPage((p) => Math.min(lastPage, p + 1))}
                  disabled={page >= lastPage}
                  accessibilityRole="button"
                  accessibilityLabel="Faqja tjetër"
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.pagerArrow,
                    page >= lastPage && styles.pagerOff,
                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialCommunityIcons name="chevron-right" size={I(22)} color={C.text} />
                </Pressable>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>

      {registering ? (
        <View style={styles.ovWrap}>
          <BlurView style={styles.ovFill} intensity={45} tint="dark" />
          <Pressable
            style={[styles.ovFill, styles.ovDim]}
            onPress={() => setRegistering(false)}
            accessibilityRole="button"
            accessibilityLabel="Mbylle dritaren"
          />
          <RegisterPaymentModal
            teams={teams}
            onClose={() => setRegistering(false)}
            onSaved={() => {
              setRegistering(false);
              reload();
            }}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Register-payment popup                                              */
/* ------------------------------------------------------------------ */

/** In-flow dropdown: the options open directly under the field. */
function PSelect({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string | null;
  placeholder?: string;
  options: { key: string; label: string }[];
  onChange: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.key === value);

  return (
    <View>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        style={({ pressed }) => [styles.pmSel, pressed && styles.pressed]}
      >
        <Text
          style={[styles.pmSelText, !current && styles.pmSelPlaceholder]}
          numberOfLines={1}
        >
          {current?.label ?? placeholder ?? '—'}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={I(11)} color="#777777" />
      </Pressable>
      {open ? (
        <View style={styles.pmOpts}>
          {options.map((o) => {
            const active = o.key === value;
            return (
              <Pressable
                key={o.key}
                onPress={() => {
                  onChange(o.key);
                  setOpen(false);
                }}
                style={[styles.pmOpt, active && styles.pmOptActive]}
              >
                <Text
                  style={[styles.pmOptText, active && styles.pmOptTextActive]}
                  numberOfLines={1}
                >
                  {o.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

/**
 * Register-payment dialog. The team narrows the squad, the player loads their
 * unpaid (and up to 12 upcoming) periods, and `Krijo` posts the settled rows to
 * `POST /finance/payments`.
 */
function RegisterPaymentModal({
  teams,
  onClose,
  onSaved,
}: {
  teams: ApiTeam[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const { token, signOut } = useSession();
  const { width, height } = useWindowDimensions();
  const cardW = Math.min(width - 24, 360);
  const maxBody = Math.max(280, height - 187);

  const [teamId, setTeamId] = useState<number | null>(null);
  const [players, setPlayers] = useState<ApiPlayer[]>([]);
  const [playerId, setPlayerId] = useState<number | null>(null);
  const [periods, setPeriods] = useState<PlayerPeriods | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [method, setMethod] = useState<PayMethod>('cash');
  const [invoice, setInvoice] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // The squad follows the chosen team.
  useEffect(() => {
    if (!token || teamId == null) return;
    const controller = new AbortController();

    listPlayers(token, { team_id: teamId }, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setPlayers(res.data);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) {
          signOut();
          router.replace('/login');
          return;
        }
        setPlayers([]);
        setErr('Nuk mund të ngarkohen lojtarët.');
      });

    return () => controller.abort();
  }, [token, teamId, router, signOut]);

  // The player's payable periods load once a player is picked.
  useEffect(() => {
    if (!token || playerId == null) return;
    const controller = new AbortController();

    playerUnpaidPeriods(token, playerId, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setPeriods(res);
        setPicked([]);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) {
          signOut();
          router.replace('/login');
          return;
        }
        setPeriods(null);
        setErr('Nuk mund të ngarkohen kuotat e lojtarit.');
      });

    return () => controller.abort();
  }, [token, playerId, router, signOut]);

  const teamOpts = teams.map((t) => ({ key: String(t.id), label: t.name }));
  const playerOpts = players.map((p) => ({ key: String(p.id), label: p.name ?? '—' }));

  /* Each row is keyed by what it settles: an existing fee, or a new period. */
  const periodRows = periods
    ? [
        ...periods.unpaid
          .filter((p) => p.id != null)
          .map((p) => ({ key: `fee:${p.id}`, label: p.period, amount: p.final_amount })),
        ...periods.future.map((p) => ({
          key: `new:${p.period_start}|${p.period_end}`,
          label: p.period,
          amount: p.final_amount,
        })),
      ]
    : [];

  const togglePeriod = (key: string) =>
    setPicked((list) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key]));

  const submit = () => {
    if (!token) return;
    if (playerId == null) {
      setErr('Zgjedh lojtarin.');
      return;
    }
    if (picked.length === 0) {
      setErr('Zgjedh të paktën një periudhë.');
      return;
    }
    const paidAt = toIsoDate(day, month, year);
    if (!paidAt) {
      setErr('Shkruaj datën e pagesës (DD/MM/YYYY).');
      return;
    }

    const feeIds = picked
      .filter((k) => k.startsWith('fee:'))
      .map((k) => Number(k.slice(4)));
    const newPeriods = picked.filter((k) => k.startsWith('new:')).map((k) => k.slice(4));

    setSaving(true);
    setErr(null);

    registerPayment(token, {
      player_id: playerId,
      fee_ids: feeIds.length ? feeIds : undefined,
      new_periods: newPeriods.length ? newPeriods : undefined,
      paid_at: paidAt,
      payment_method: method,
      invoice_number: invoice.trim() || undefined,
    })
      .then(() => onSaved())
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) {
          signOut();
          router.replace('/login');
          return;
        }
        setSaving(false);
        if (e instanceof ApiError && e.status === 0) {
          setErr('Nuk mund të lidhemi me serverin. Kontrollo lidhjen.');
        } else if (e instanceof ApiError && e.status === 422) {
          setErr('Të dhënat nuk janë të vlefshme. Kontrollo fushat.');
        } else {
          setErr('Nuk mund të regjistrohet pagesa.');
        }
      });
  };

  return (
    <View style={[styles.pmCard, { width: cardW }]}>
      <View style={styles.pmHeader}>
        <Text style={styles.pmTitle}>Regjistro pagesën</Text>
        <Text style={styles.pmSubtitle}>
          Zgjedh lojtarin dhe shëno datën e dokumentit të pagesës
        </Text>
      </View>
      <View style={styles.pmDivider} />

      <ScrollView
        style={{ maxHeight: maxBody }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.pmContent}
      >
        {err ? <Text style={styles.pmErr}>{err}</Text> : null}

        <View style={styles.pmRow}>
          <View style={styles.pmCol}>
            <Text style={styles.pmLabel}>Ekipi:</Text>
            <PSelect
              value={teamId == null ? null : String(teamId)}
              placeholder="Zgjidh ekipin"
              options={teamOpts}
              onChange={(key) => {
                setTeamId(Number(key));
                setPlayerId(null);
                setPlayers([]);
                setPeriods(null);
                setPicked([]);
                setErr(null);
              }}
            />
          </View>
          <View style={styles.pmCol}>
            <Text style={styles.pmLabel}>Lojtari:</Text>
            <PSelect
              value={playerId == null ? null : String(playerId)}
              placeholder={teamId == null ? 'Zgjidh ekipin' : 'Zgjidh lojtarin'}
              options={playerOpts}
              onChange={(key) => {
                setPlayerId(Number(key));
                setPeriods(null);
                setPicked([]);
                setErr(null);
              }}
            />
          </View>
        </View>

        <Text style={[styles.pmLabel, styles.pmGap]}>Zgjedh periudhat:</Text>
        {playerId == null ? (
          <Text style={styles.pmHint}>Zgjidh lojtarin për të parë kuotat.</Text>
        ) : periods === null ? (
          <Text style={styles.pmHint}>…</Text>
        ) : periodRows.length === 0 ? (
          <Text style={styles.pmHint}>Nuk ka kuota për pagesë.</Text>
        ) : (
          <View style={styles.pmPeriods}>
            {periodRows.map((p) => {
              const on = picked.includes(p.key);
              return (
                <Pressable
                  key={p.key}
                  onPress={() => togglePeriod(p.key)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  style={({ pressed }) => [styles.pmPeriodRow, pressed && styles.pressed]}
                >
                  <View style={[styles.pmCheck, on && styles.pmCheckOn]} />
                  <Text style={styles.pmPeriodText} numberOfLines={1}>
                    {p.label}
                  </Text>
                  <Text style={styles.pmPeriodAmount} numberOfLines={1}>
                    {usd(p.amount)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <Text style={[styles.pmLabel, styles.pmGap]}>Data e pagesës:</Text>
        <View style={styles.pmClockRow}>
          <TextInput
            value={day}
            onChangeText={setDay}
            placeholder="DD"
            placeholderTextColor={MO.ph}
            maxLength={2}
            keyboardType="number-pad"
            allowFontScaling={false}
            style={styles.pmDateBox}
          />
          <Text style={styles.pmSep}>/</Text>
          <TextInput
            value={month}
            onChangeText={setMonth}
            placeholder="MM"
            placeholderTextColor={MO.ph}
            maxLength={2}
            keyboardType="number-pad"
            allowFontScaling={false}
            style={styles.pmDateBox}
          />
          <Text style={styles.pmSep}>/</Text>
          <TextInput
            value={year}
            onChangeText={setYear}
            placeholder="YYYY"
            placeholderTextColor={MO.ph}
            maxLength={4}
            keyboardType="number-pad"
            allowFontScaling={false}
            style={styles.pmYearBox}
          />
        </View>

        <Text style={[styles.pmLabel, styles.pmGap]}>Metodat e pagesës:</Text>
        <PSelect value={method} options={PAY_METHODS} onChange={(k) => setMethod(k as PayMethod)} />

        <Text style={[styles.pmLabel, styles.pmGap]}>Nr. Fatura:</Text>
        <TextInput
          value={invoice}
          onChangeText={setInvoice}
          allowFontScaling={false}
          style={styles.pmInput}
        />

        <Text style={[styles.pmLabel, styles.pmGap]}>Dokumenti i pagesës:</Text>

        {/* Same upload zone as the player form's photo picker. */}
        <View style={styles.pmFileZone}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ngarko dokumentin e pagesës"
            style={({ pressed }) => [styles.pmFileBtn, pressed && styles.pressed]}
          >
            <View style={styles.pmFileCircle}>
              <MaterialCommunityIcons name="cloud-upload-outline" size={I(22)} color={MO.white} />
            </View>
          </Pressable>
          <Text style={styles.pmFileHint}>Choose file</Text>
        </View>

        <View style={styles.pmActions}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={({ pressed }) => [styles.pmBtn, styles.pmBtnCancel, pressed && styles.pressed]}
          >
            <Text style={styles.pmBtnText}>Anulo</Text>
          </Pressable>
          <Pressable
            onPress={submit}
            disabled={saving}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.pmBtn,
              styles.pmBtnCreate,
              saving && styles.pmBtnOff,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.pmBtnText}>{saving ? '…' : 'Krijo'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create(
  scaled({
    safe: {
      flex: 1,
    },

    canvas: {
      flex: 1,
    },

    colPad: {
      alignSelf: 'center',
      width: '100%',
      paddingHorizontal: 27,
    },

    /* Pinned header */
    header: {
      backgroundColor: 'transparent',
      paddingTop: 2,
      paddingBottom: 12,
    },

    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    backBtn: {
      height: 34,
      justifyContent: 'center',
      marginLeft: -8,
      paddingRight: 10,
    },

    headerText: {
      flex: 1,
      justifyContent: 'center',
    },

    title: {
      fontFamily: Fonts.bodyBold,
      fontSize: 20,
      lineHeight: 24,
      letterSpacing: -0.3,
      color: C.text,
    },

    subtitle: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 16,
      color: C.gray,
      marginTop: 1,
    },

    subtitleStrong: {
      fontFamily: Fonts.bodyBold,
      color: C.text,
    },

    scroll: {
      paddingBottom: 24,
    },

    /* ── Headline counts ─────────────────────────────────────── */
    summaryRow: {
      flexDirection: 'row',
      paddingLeft: 27,
      paddingRight: 27,
      paddingTop: 8,
      gap: 8,
    },

    /* Shadow lives on the wrapper: `overflow: hidden` on the pane itself would
       clip it away on iOS. */
    sqShadow: {
      /* Three cards share the row, so each grows to a third of it. */
      flex: 1,
      height: 122,
      borderRadius: 8,
      /* Translucent so the frosted pane inside has a backdrop to blur. */
      backgroundColor: 'rgba(245,245,245,0.5)',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 5,
      elevation: 1,
    },

    sq: {
      flex: 1,
      borderWidth: 1,
      borderColor: C.orange,
      borderRadius: 8,
      overflow: 'hidden',
    },

    /* Content rides above the frost and gloss overlays. */
    sqBody: {
      flex: 1,
      padding: 11,
    },

    sheen: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '14%',
    },

    /* Fixed two-line block so all three values sit on the same line. */
    sqLabel: {
      minHeight: 30,
      fontFamily: Fonts.bodyBold,
      fontSize: 12,
      lineHeight: 15,
      color: C.gray,
    },

    sqValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 26,
      lineHeight: 32,
      letterSpacing: -0.5,
      color: C.text,
      marginTop: 4,
    },

    sqHint: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.gray,
      marginTop: 4,
    },

    /* ── Raporti ─────────────────────────────────────────────── */
    /* Same pastel pane as the "Statistikat" card on the players screen,
       full-width with the art bleeding off both edges. */
    raporti: {
      height: 104,
      marginTop: 16,
      position: 'relative',
      backgroundColor: '#E8F3FF',
      borderWidth: 1,
      borderColor: '#C6E0FA',
      borderRadius: 9,
      overflow: 'hidden',
    },

    raportiArtLeft: {
      position: 'absolute',
      width: 88,
      height: 125,
      left: -29,
      bottom: -15,
      zIndex: 1,
    },

    raportiArtRight: {
      position: 'absolute',
      width: 88,
      height: 125,
      right: -29,
      bottom: -15,
      zIndex: 1,
      transform: [{ scaleX: -1 }],
    },

    /* Title pinned top, button pinned bottom, both on the centre line. */
    raportiBody: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 9,
      paddingBottom: 9,
      zIndex: 3,
    },

    raportiTitle: {
      fontFamily: Fonts.bodyBlack,
      fontSize: 26,
      lineHeight: 30,
      letterSpacing: 0.5,
      color: C.text,
    },

    raportiBtn: {
      minWidth: 76,
      height: 28,
      borderRadius: 5,
      paddingHorizontal: 12,
      backgroundColor: '#78B8F5',
      alignItems: 'center',
      justifyContent: 'center',
    },

    raportiBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11,
      lineHeight: 14,
      color: '#F5F5F5',
    },

    /* ── Filter / register ───────────────────────────────────── */
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginTop: 16,
    },

    controlBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      height: 34,
      paddingHorizontal: 10,
      backgroundColor: C.blueSoft,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
    },

    plusCircle: {
      width: 23,
      height: 23,
      borderRadius: 12,
      backgroundColor: C.blueBtn,
      alignItems: 'center',
      justifyContent: 'center',
    },

    controlText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      color: '#000000',
    },

    /* In-flow dropdown that opens under the team-filter button. */
    teamOpts: {
      position: 'absolute',
      top: 38,
      left: 0,
      minWidth: 150,
      zIndex: 5,
      backgroundColor: '#F5F5F5',
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
      overflow: 'hidden',
    },

    teamOpt: {
      height: 30,
      justifyContent: 'center',
      paddingHorizontal: 10,
    },

    teamOptText: {
      fontFamily: Fonts.body,
      fontSize: 12,
      color: C.text,
    },

    teamOptTextOn: {
      fontFamily: Fonts.bodySemiBold,
      color: C.green,
    },

    /* ── Search ──────────────────────────────────────────────── */
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
    },

    searchBox: {
      flex: 1,
      height: 36,
      backgroundColor: '#F5F5F5',
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
      paddingHorizontal: 10,
      fontFamily: Fonts.body,
      fontSize: 12,
      color: C.text,
    },

    searchBtn: {
      height: 36,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.blueSoft,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
    },

    searchBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      color: '#000000',
    },

    /* ── Card ────────────────────────────────────────────────── */
    card: {
      marginTop: 14,
      backgroundColor: C.blue2,
      borderWidth: 2,
      borderColor: C.border,
      borderRadius: 7,
      overflow: 'hidden',
    },

    head: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 10,
      paddingVertical: 10,
    },

    headText: {
      textAlign: 'center',
      fontFamily: Fonts.bodyBold,
      fontSize: 15,
      lineHeight: 19,
      color: C.text,
    },

    headLine: {
      height: 1,
      backgroundColor: C.headLine,
    },

    /* ── Table ───────────────────────────────────────────────── */
    tblInner: {
      paddingHorizontal: 4,
      paddingTop: 6,
      paddingBottom: 4,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 34,
    },

    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    colAction: {
      alignItems: 'flex-end',
    },

    th: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.gray,
      textAlign: 'center',
    },

    thLeft: {
      textAlign: 'left',
    },

    tdName: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.text,
    },

    td: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.hint,
      textAlign: 'center',
    },

    tdStatus: {
      fontFamily: Fonts.bodySemiBold,
    },

    /* Clear fill, black rim and black label. */
    viewBtn: {
      height: 22,
      paddingHorizontal: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
    },

    viewBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10,
      color: '#000000',
    },

    /* ── Pager ───────────────────────────────────────────────── */
    pager: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 6,
      marginTop: 12,
    },

    pagerArrow: {
      alignItems: 'center',
      justifyContent: 'center',
    },

    pagerOff: {
      opacity: 0.3,
    },

    pageSq: {
      width: 34,
      height: 34,
      borderRadius: 5,
      backgroundColor: C.blueBtn,
      alignItems: 'center',
      justifyContent: 'center',
    },

    pageSqOn: {
      backgroundColor: '#4A90D9',
    },

    pageSqText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 14,
      color: '#F5F5F5',
    },

    pressed: {
      opacity: 0.5,
    },

    /* ── Popup shell ─────────────────────────────────────────── */
    ovWrap: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 20,
      alignItems: 'center',
    },

    ovFill: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },

    ovDim: {
      backgroundColor: 'rgba(0,0,0,0.42)',
    },

    /* ── Register-payment popup ──────────────────────────────── */
    pmCard: {
      marginTop: 100,
      backgroundColor: MO.white,
      borderWidth: 2,
      borderColor: MO.border,
      borderRadius: 10,
      overflow: 'hidden',
    },

    pmHeader: {
      paddingHorizontal: 15,
      paddingTop: 11,
      paddingBottom: 9,
    },

    pmTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 20,
      lineHeight: 24,
      letterSpacing: -0.3,
      color: MO.title,
    },

    pmSubtitle: {
      fontFamily: Fonts.body,
      fontSize: 10,
      lineHeight: 13,
      color: MO.sub,
      marginTop: 2,
    },

    pmDivider: {
      height: 1,
      backgroundColor: MO.divider,
    },

    pmContent: {
      paddingHorizontal: 15,
      paddingTop: 11,
      paddingBottom: 15,
    },

    pmErr: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 9,
      lineHeight: 12,
      color: MO.err,
      marginBottom: 6,
    },

    pmLabel: {
      fontFamily: Fonts.body,
      fontSize: 9.5,
      lineHeight: 12,
      color: MO.sub,
      marginBottom: 4,
    },

    pmGap: {
      marginTop: 14,
    },

    pmHint: {
      fontFamily: Fonts.body,
      fontSize: 9,
      lineHeight: 12,
      color: MO.ph,
      marginTop: 2,
    },

    pmInput: {
      height: 31,
      backgroundColor: MO.inputBg,
      borderWidth: 1,
      borderColor: MO.inputBorder,
      borderRadius: 4,
      paddingHorizontal: 8,
      fontFamily: Fonts.body,
      fontSize: 11.5,
      color: MO.text,
    },

    pmRow: {
      flexDirection: 'row',
      gap: 8,
    },

    pmCol: {
      flex: 1,
    },

    pmSel: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 31,
      gap: 4,
      paddingHorizontal: 8,
      backgroundColor: MO.inputBg,
      borderWidth: 1,
      borderColor: MO.inputBorder,
      borderRadius: 4,
    },

    pmSelText: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 11.5,
      color: MO.text,
    },

    pmSelPlaceholder: {
      color: MO.ph,
    },

    pmOpts: {
      marginTop: 3,
      backgroundColor: MO.white,
      borderWidth: 1,
      borderColor: MO.inputBorder,
      borderRadius: 4,
      overflow: 'hidden',
    },

    pmOpt: {
      height: 25,
      justifyContent: 'center',
      paddingHorizontal: 8,
    },

    pmOptActive: {
      backgroundColor: 'rgba(22,165,29,0.10)',
    },

    pmOptText: {
      fontFamily: Fonts.body,
      fontSize: 10,
      color: MO.text,
    },

    pmOptTextActive: {
      fontFamily: Fonts.bodySemiBold,
    },

    /* ── Period picker ───────────────────────────────────────── */
    pmPeriods: {
      borderWidth: 1,
      borderColor: MO.inputBorder,
      borderRadius: 4,
      overflow: 'hidden',
    },

    pmPeriodRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      height: 30,
      paddingHorizontal: 8,
    },

    /* Square checkbox: black rim at rest, green fill once picked. */
    pmCheck: {
      width: 14,
      height: 14,
      borderRadius: 3,
      borderWidth: 1.5,
      borderColor: '#000000',
      backgroundColor: 'transparent',
    },

    pmCheckOn: {
      backgroundColor: MO.create,
    },

    pmPeriodText: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 10.5,
      color: MO.text,
    },

    pmPeriodAmount: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: MO.text,
    },

    pmClockRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 8,
    },

    pmDateBox: {
      width: 30,
      height: 30,
      backgroundColor: MO.inputBg,
      borderWidth: 1,
      borderColor: MO.inputBorder,
      borderRadius: 4,
      textAlign: 'center',
      fontFamily: Fonts.body,
      fontSize: 11,
      color: MO.text,
    },

    pmYearBox: {
      width: 50,
      height: 30,
      backgroundColor: MO.inputBg,
      borderWidth: 1,
      borderColor: MO.inputBorder,
      borderRadius: 4,
      textAlign: 'center',
      fontFamily: Fonts.body,
      fontSize: 11,
      color: MO.text,
    },

    pmSep: {
      fontFamily: Fonts.body,
      fontSize: 12,
      color: MO.sub,
    },

    /* Mirrors the player form's photo zone, but hugging the left edge. */
    pmFileZone: {
      height: 118,
      alignItems: 'flex-start',
      justifyContent: 'center',
    },

    pmFileBtn: {
      alignItems: 'center',
    },

    pmFileCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: C.green,
      alignItems: 'center',
      justifyContent: 'center',
    },

    pmFileHint: {
      fontFamily: Fonts.body,
      fontSize: 12,
      color: MO.text,
      marginTop: 8,
    },

    pmActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 9,
      marginTop: 14,
    },

    pmBtn: {
      width: 74,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 4,
    },

    pmBtnCancel: {
      backgroundColor: MO.cancel,
    },

    pmBtnCreate: {
      backgroundColor: MO.create,
    },

    pmBtnOff: {
      opacity: 0.5,
    },

    pmBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: MO.white,
    },
  }),
);
