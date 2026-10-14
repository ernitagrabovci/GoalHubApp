import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import { listInjuries } from '@/lib/api/injuries';
import { playerStats } from '@/lib/api/players';
import { listTeams } from '@/lib/api/teams';
import type { ApiInjury, ApiTeam, Paginated, PlayerStats } from '@/lib/api/types';
import { injuryStatusLabel, occurredLabel } from '@/lib/injury-status';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * Kartela mjekësore — opened from the medical card on the admin dashboard.
 * Three headline counts, the players currently carrying a problem, and the
 * injury log.
 *
 * Counts come from `GET /players/stats`; the log from the paginated
 * `GET /injuries` (whose `team_id`/`status` filters back the two filter
 * buttons). The "players with a problem" table is the unfiltered set minus
 * the recovered ones, so it doesn't move when the log is filtered.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',

  /* blue1 = the deeper blue of the filter buttons; blue2 = the pale card blue. */
  blue1: '#E3EEFB',
  blue2: '#F6FBFF',

  border: 'rgba(100,140,190,0.30)',
  rowLine: 'rgba(100,140,190,0.22)',
  headLine: 'rgba(30,40,35,0.10)',

  green: '#159447',
  red: '#E03131',
  orange: '#E4A000',
};

type FilterKey = 'team' | 'status';

const STATUS_OPTIONS = [
  { value: 'injured', label: 'I lënduar' },
  { value: 'rehabilitation', label: 'Në rehabilitim' },
  { value: 'recovered', label: 'I shëruar' },
];

/** Width of the trailing "Shiko" column in the injury log. */
const INJ_ACTION_W = 58;

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

/** One colour per medical status, reused by both tables. */
const STATUS_TONE: Record<string, string> = {
  'I lënduar': C.red,
  'Në rehabilitim': C.orange,
  Aktiv: C.green,
  'I shëruar': C.green,
};

/** ISO `YYYY-MM-DD` → `dd/MM/yyyy`; absent/unparseable → a dash. */
function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

/** The statuses a player can be carrying: everything but a closed-out injury. */
function isOpenProblem(injury: ApiInjury): boolean {
  return injury.status !== 'recovered';
}

/** Keeps each player's most recent open injury, assuming the list is newest-first. */
function latestPerPlayer(list: ApiInjury[]): ApiInjury[] {
  const seen = new Set<number>();
  const out: ApiInjury[] = [];
  for (const injury of list) {
    const id = injury.player?.id;
    if (id != null) {
      if (seen.has(id)) continue;
      seen.add(id);
    }
    out.push(injury);
  }
  return out;
}

export default function MedicalCardScreen() {
  const router = useRouter();
  const { token, signOut } = useSession();

  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [teams, setTeams] = useState<ApiTeam[]>([]);
  const [problems, setProblems] = useState<ApiInjury[]>([]);
  const [injuries, setInjuries] = useState<ApiInjury[]>([]);
  const [meta, setMeta] = useState<Paginated<ApiInjury>['meta'] | null>(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<{ team: 'all' | number; status: string }>({
    team: 'all',
    status: 'all',
  });
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filterKey = `${filters.team}|${filters.status}`;

  // Headline counts + the team filter's options — a one-shot.
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    Promise.allSettled([playerStats(token, controller.signal), listTeams(token, controller.signal)]).then(
      ([statsRes, teamsRes]) => {
        if (controller.signal.aborted) return;
        if (statsRes.status === 'fulfilled') setStats(statsRes.value);
        if (teamsRes.status === 'fulfilled') setTeams(teamsRes.value.data);
      },
    );
    return () => controller.abort();
  }, [token]);

  // The "players with a problem" table — unfiltered, so it holds still while
  // the log below is filtered.
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    listInjuries(token, { page: 1 }, controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) setProblems(res.data);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          signOut();
          router.replace('/login');
        }
      });
    return () => controller.abort();
  }, [token, signOut, router]);

  // The log — filtered and paged.
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    listInjuries(
      token,
      {
        page,
        team_id: filters.team === 'all' ? undefined : filters.team,
        status: filters.status === 'all' ? undefined : filters.status,
      },
      controller.signal,
    )
      .then((res) => {
        if (controller.signal.aborted) return;
        setInjuries(res.data);
        setMeta(res.meta);
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
            : 'Nuk mund të ngarkohen lëndimet.',
        );
      });
    return () => controller.abort();
  }, [token, page, filterKey, filters.team, filters.status, signOut, router]);

  const summary = [
    {
      label: 'Lojtarë aktiv',
      value: stats ? String(stats.active) : '—',
      note: 'Gati për lojë',
      tone: C.green,
    },
    {
      label: 'Lojtarë të lënduar',
      value: stats ? String(stats.injured) : '—',
      note: 'Pa lojë',
      tone: C.red,
    },
    {
      label: 'Lojtarë në rehabilitim',
      value: stats ? String(stats.rehabilitation) : '—',
      note: 'Kthim në pagese',
      tone: C.orange,
    },
  ];

  const problemRows = latestPerPlayer(problems.filter(isOpenProblem));

  const applyFilter = (key: FilterKey, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
    setOpenFilter(null);
  };

  const filterLabel = (key: FilterKey): string => {
    if (key === 'team') {
      return filters.team === 'all'
        ? 'Të gjitha ekipet'
        : teams.find((t) => t.id === filters.team)?.name ?? 'Të gjitha ekipet';
    }
    return filters.status === 'all'
      ? 'Të gjitha statuset'
      : STATUS_OPTIONS.find((o) => o.value === filters.status)?.label ?? 'Të gjitha statuset';
  };

  const filterItems = (key: FilterKey): { value: string | number; label: string }[] => {
    if (key === 'team') {
      return [
        { value: 'all', label: 'Të gjitha ekipet' },
        ...teams.map((t) => ({ value: t.id, label: t.name })),
      ];
    }
    return [{ value: 'all', label: 'Të gjitha statuset' }, ...STATUS_OPTIONS];
  };

  const selectedFilterValue = (key: FilterKey): string | number =>
    key === 'team' ? filters.team : filters.status;

  const current = meta?.current_page ?? 1;
  const lastPage = meta?.last_page ?? 1;

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
                  Kartela mjeksore
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Statusi shëndetësor i lojtarëve
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
                    <Text style={[styles.sqValue, { color: s.tone }]}>{s.value}</Text>
                    <Text style={[styles.sqHint, { color: s.tone }]} numberOfLines={2}>
                      {s.note}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.colPad}>
            {/* ── Lojtarë me probleme mjeksore ──────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.head}>
                <Text style={styles.headText}>Lojtarë me probleme mjeksore</Text>
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
                    <Text style={[styles.th, styles.thLeft, { width: 110 }]}>Emri</Text>
                    <Text style={[styles.th, { width: 58 }]}>Ekipi</Text>
                    <Text style={[styles.th, { width: 80 }]}>Statusi</Text>
                    <Text style={[styles.th, { width: 102 }]}>Lëndimi i fundit</Text>
                    <Text style={[styles.th, { width: 92 }]}>Kthimi i pritshëm</Text>
                  </View>

                  {problemRows.map((p) => {
                    const status = injuryStatusLabel(p.status);
                    return (
                      <View key={p.id} style={[styles.tr, styles.trBorder]}>
                        <Text
                          style={[styles.tdName, styles.thLeft, { width: 110 }]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          {p.player?.name ?? '—'}
                        </Text>
                        <Text style={[styles.td, { width: 58 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                          {p.team?.name ?? '—'}
                        </Text>
                        <Text
                          style={[styles.td, styles.tdStatus, { width: 80, color: STATUS_TONE[status] ?? C.hint }]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          {status}
                        </Text>
                        <Text style={[styles.td, { width: 102 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                          {p.injury_type}
                        </Text>
                        <Text style={[styles.td, { width: 92 }]} numberOfLines={1}>
                          {formatDate(p.expected_return)}
                        </Text>
                      </View>
                    );
                  })}

                  {problemRows.length === 0 ? (
                    <View style={styles.stateRow}>
                      <Text style={styles.stateText}>Asnjë lojtar me problem mjeksor.</Text>
                    </View>
                  ) : null}
                </View>
              </ScrollView>
            </View>

            {/* ── Lëndimet ──────────────────────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.head}>
                <Text style={styles.headText}>Lëndimet</Text>
              </View>
              <View style={styles.headLine} />

              <View style={styles.filters}>
                {(['team', 'status'] as FilterKey[]).map((key) => (
                  <Pressable
                    key={key}
                    onPress={() => setOpenFilter((cur) => (cur === key ? null : key))}
                    accessibilityRole="button"
                    accessibilityLabel={`Filtro sipas ${key === 'team' ? 'ekipit' : 'statusit'}`}
                    style={({ pressed }) => [
                      styles.filterBtn,
                      openFilter === key && styles.filterBtnOpen,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.filterText} numberOfLines={1}>
                      {filterLabel(key)}
                    </Text>
                    <MaterialCommunityIcons
                      name={openFilter === key ? 'chevron-up' : 'chevron-down'}
                      size={I(13)}
                      color={C.text}
                    />
                  </Pressable>
                ))}
              </View>

              {/* The open filter's options — an inline strip so nothing clips
                  and every option stays tappable on Android. */}
              {openFilter ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  bounces={false}
                  contentContainerStyle={styles.filterOptsRow}
                >
                  {filterItems(openFilter).map((item) => {
                    const active = item.value === selectedFilterValue(openFilter);
                    return (
                      <Pressable
                        key={String(item.value)}
                        onPress={() => applyFilter(openFilter, item.value)}
                        accessibilityRole="button"
                        accessibilityLabel={item.label}
                        style={({ pressed }) => [
                          styles.filterChip,
                          active && styles.filterChipActive,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text
                          style={[styles.filterChipText, active && styles.filterChipTextActive]}
                          numberOfLines={1}
                        >
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : null}

              {/* Table — scroll sideways so no column gets squeezed */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={styles.tblInner}
              >
                <View>
                  <View style={styles.tr}>
                    <Text style={[styles.th, styles.thLeft, { width: 96 }]}>Lojtari</Text>
                    <Text style={[styles.th, { width: 54 }]}>Ekipi</Text>
                    <Text style={[styles.th, { width: 68 }]}>Lloji</Text>
                    <Text style={[styles.th, { width: 78 }]}>Ndodhi gjatë</Text>
                    <Text style={[styles.th, { width: 64 }]}>Data</Text>
                    <Text style={[styles.th, { width: 70 }]}>Statusi</Text>
                    <Text style={[styles.th, { width: 60 }]}>Kthimi</Text>
                    <View style={{ width: INJ_ACTION_W }} />
                  </View>

                  {injuries.map((inj) => {
                    const name = inj.player?.name ?? '—';
                    const team = inj.team?.name ?? '—';
                    const status = injuryStatusLabel(inj.status);
                    const during = occurredLabel(inj.occurred_during);
                    const date = formatDate(inj.injury_date);
                    const returnDate = formatDate(inj.expected_return);
                    return (
                      <View key={inj.id} style={[styles.tr, styles.trBorder]}>
                        <Text
                          style={[styles.tdName, styles.thLeft, { width: 96 }]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          {name}
                        </Text>
                        <Text style={[styles.td, { width: 54 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                          {team}
                        </Text>
                        <Text style={[styles.td, { width: 68 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                          {inj.injury_type}
                        </Text>
                        <Text style={[styles.td, { width: 78 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                          {during}
                        </Text>
                        <Text style={[styles.td, { width: 64 }]} numberOfLines={1}>
                          {date}
                        </Text>
                        <Text
                          style={[styles.td, styles.tdStatus, { width: 70, color: STATUS_TONE[status] ?? C.hint }]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          {status}
                        </Text>
                        <Text style={[styles.td, { width: 60 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                          {returnDate}
                        </Text>
                        <View style={[styles.colAction, { width: INJ_ACTION_W }]}>
                          <Pressable
                            onPress={() =>
                              router.push({
                                pathname: '/detajet-lendimit',
                                params: {
                                  name,
                                  team,
                                  type: inj.injury_type,
                                  during,
                                  status,
                                  date,
                                  returnDate,
                                  serviceDate: formatDate(inj.created_at),
                                  desc: inj.description ?? '',
                                  treatment: inj.treatment ?? '',
                                },
                              })
                            }
                            accessibilityRole="button"
                            accessibilityLabel={`Shiko lëndimin e ${name}`}
                            style={({ pressed }) => [styles.viewBtn, pressed && styles.pressed]}
                          >
                            <Text style={styles.viewBtnText}>Shiko</Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Loading / empty / error — kept inside the card so the table
                  frame stays put. */}
              {error ? (
                <View style={styles.stateRow}>
                  <Text style={styles.stateText}>{error}</Text>
                </View>
              ) : injuries.length === 0 ? (
                <View style={styles.stateRow}>
                  <Text style={styles.stateText}>Asnjë lëndim nuk u gjet.</Text>
                </View>
              ) : lastPage > 1 ? (
                <View style={styles.pager}>
                  <Pressable
                    onPress={() => setPage(current - 1)}
                    disabled={current <= 1}
                    accessibilityRole="button"
                    accessibilityLabel="Faqja e mëparshme"
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.pagerArrow,
                      current <= 1 && styles.pagerDisabled,
                      pressed && styles.pressed,
                    ]}
                  >
                    <MaterialCommunityIcons name="chevron-left" size={I(20)} color={C.text} />
                  </Pressable>
                  <Text style={styles.pagerText}>
                    {current} / {lastPage}
                  </Text>
                  <Pressable
                    onPress={() => setPage(current + 1)}
                    disabled={current >= lastPage}
                    accessibilityRole="button"
                    accessibilityLabel="Faqja tjetër"
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.pagerArrow,
                      current >= lastPage && styles.pagerDisabled,
                      pressed && styles.pressed,
                    ]}
                  >
                    <MaterialCommunityIcons name="chevron-right" size={I(20)} color={C.text} />
                  </Pressable>
                </View>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
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

    scroll: {
      paddingBottom: 24,
    },

    /* ── Headline counts ─────────────────────────────────────── */
    summaryRow: {
      flexDirection: 'row',
      paddingLeft: 27,
      paddingRight: 27,
      paddingTop: 4,
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

    /* ── Cards ───────────────────────────────────────────────── */
    card: {
      backgroundColor: C.blue2,
      borderWidth: 2,
      borderColor: C.border,
      borderRadius: 7,
      overflow: 'hidden',
    },

    cardGap: {
      marginTop: 14,
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

    /* ── Filter row ──────────────────────────────────────────── */
    filters: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 4,
      paddingTop: 10,
    },

    filterBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      height: 32,
      paddingHorizontal: 10,
      backgroundColor: C.blue1,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
    },

    filterBtnOpen: {
      borderColor: C.orange,
    },

    filterText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11,
      color: C.text,
    },

    /* ── Filter options (inline strip under an open filter) ──── */
    filterOptsRow: {
      paddingHorizontal: 4,
      paddingTop: 8,
      gap: 6,
    },

    filterChip: {
      height: 28,
      justifyContent: 'center',
      paddingHorizontal: 11,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.15)',
      backgroundColor: '#FFFFFF',
    },

    filterChipActive: {
      backgroundColor: C.blue1,
      borderColor: C.blue1,
      borderWidth: 1,
    },

    filterChipText: {
      fontFamily: Fonts.body,
      fontSize: 11.5,
      color: C.hint,
    },

    filterChipTextActive: {
      fontFamily: Fonts.bodySemiBold,
      color: C.text,
    },

    /* ── Loading / empty / error ─────────────────────────────── */
    stateRow: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 16,
    },

    stateText: {
      fontFamily: Fonts.body,
      fontSize: 12,
      color: C.hint,
      textAlign: 'center',
    },

    /* ── Pager ───────────────────────────────────────────────── */
    pager: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
      paddingVertical: 10,
    },

    pagerArrow: {
      alignItems: 'center',
      justifyContent: 'center',
    },

    pagerDisabled: {
      opacity: 0.3,
    },

    pagerText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      color: C.text,
    },

    /* ── Tables ──────────────────────────────────────────────── */
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

    pressed: {
      opacity: 0.5,
    },
  }),
);
