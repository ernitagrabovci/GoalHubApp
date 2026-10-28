import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import { matchesReport } from '@/lib/api/reports';
import { listTeams } from '@/lib/api/teams';
import type { ApiTeam, MatchesReport } from '@/lib/api/types';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * Raporti i ndeshjeve — opened from "Vazhdo" on the Raportet e ndeshjeve card
 * over on the Raportet page.
 *
 * Four headline squares, the two filters, the season's fixtures with their
 * pager, then the competition breakdown and the seasonal summary box.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',
  ghost: '#A8A8A8',

  cardBg: '#E3EEFB',
  headBg: '#F6FBFF',
  frame: '#000000',
  headLine: 'rgba(30,40,35,0.10)',
  rowLine: 'rgba(100,140,190,0.22)',

  blueSoft: '#E3EEFB',
  blueBtn: '#86BCFD',
  green: '#159447',
  orange: '#E4A000',
  red: '#E03131',

  /* Unfilled part of every progress rail. */
  track: 'rgba(0,0,0,0.10)',
};

/* ── Headline squares ──────────────────────────────────────────────── */

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

/* ── Fixtures ──────────────────────────────────────────────────────── */

type Outcome = 'Fitore' | 'Barazim' | 'Humbje';

const OUTCOME_TONE: Record<Outcome, string> = {
  Fitore: C.green,
  Barazim: C.orange,
  Humbje: C.red,
};

/** Goals are from the club's perspective, so the outcome reads straight off them. */
function outcomeOf(gf: number, ga: number): Outcome {
  if (gf > ga) return 'Fitore';
  if (gf < ga) return 'Humbje';
  return 'Barazim';
}

/** Match / competition / score / scored / conceded / outcome. */
const COLS = [
  { key: 'match', label: 'Ndeshja', flex: 1.9 },
  { key: 'comp', label: 'Kompeticion', flex: 1.5 },
  { key: 'rez', label: 'Rez', flex: 0.8 },
  { key: 'plus', label: '+', flex: 0.5 },
  { key: 'minus', label: '-', flex: 0.5 },
  { key: 'status', label: 'Statusi', flex: 1.1 },
] as const;

/** The report returns every match at once, so the pager works on the client. */
const PAGE_SIZE = 8;

const LEGEND: { label: string; color: string }[] = [
  { label: 'Fitore', color: C.green },
  { label: 'Barazim', color: C.orange },
  { label: 'Humbje', color: C.red },
];

type FilterKey = 'team' | 'result';

const RESULT_OPTIONS = [
  { value: 'win', label: 'Fitore' },
  { value: 'draw', label: 'Barazim' },
  { value: 'loss', label: 'Humbje' },
];

/** A short run of page numbers ending at `last`, capped for width. */
function pageWindow(current: number, last: number, span = 4): number[] {
  const start = Math.max(1, Math.min(current, last - span + 1));
  const end = Math.min(last, start + span - 1);
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);
}

export default function MatchReportScreen() {
  const router = useRouter();
  const { token, signOut } = useSession();

  const [report, setReport] = useState<MatchesReport | null>(null);
  const [teams, setTeams] = useState<ApiTeam[]>([]);
  const [filters, setFilters] = useState<{ team: 'all' | number; result: string }>({
    team: 'all',
    result: 'all',
  });
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const filterKey = `${filters.team}|${filters.result}`;

  // The team filter's options — a one-shot, independent of the report.
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    listTeams(token, controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) setTeams(res.data);
      })
      .catch(() => {
        // Leave the filter at "Të gjitha ekipet".
      });
    return () => controller.abort();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    matchesReport(
      token,
      {
        team_id: filters.team === 'all' ? undefined : filters.team,
        result:
          filters.result === 'all' ? undefined : (filters.result as 'win' | 'draw' | 'loss'),
      },
      controller.signal,
    )
      .then((res) => {
        if (controller.signal.aborted) return;
        setReport(res);
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
            : 'Nuk mund të ngarkohet raporti.',
        );
      });
    return () => controller.abort();
  }, [token, filterKey, filters.team, filters.result, signOut, router]);

  const stats = report?.stats;
  const total = stats?.total ?? 0;
  const summary = [
    { label: 'Ndeshje gjithsej', value: stats ? String(stats.total) : '—', hint: 'të luajtura', tone: C.text },
    {
      label: 'Fitore gjithsej',
      value: stats ? String(stats.wins) : '—',
      hint: total > 0 ? `${Math.round((stats!.wins / total) * 100)}%` : '0%',
      tone: C.green,
    },
    {
      label: 'Gola të shënuara',
      value: stats ? String(stats.gf) : '—',
      hint: total > 0 ? `${(stats!.gf / total).toFixed(1)}/ndeshje` : '0.0/ndeshje',
      tone: C.green,
    },
    {
      label: 'Gola të pësuara',
      value: stats ? String(stats.ga) : '—',
      hint: total > 0 ? `${(stats!.ga / total).toFixed(1)}/ndeshje` : '0.0/ndeshje',
      tone: C.text,
    },
  ];

  const matches = (report?.matches ?? []).map((m) => {
    const gf = m.goals_for ?? 0;
    const ga = m.goals_against ?? 0;
    return {
      id: m.id,
      fixture: `${m.opponent ?? '—'} - ${m.team?.name ?? '—'}`,
      comp: m.competition ?? '—',
      rez: `${gf}-${ga}`,
      plus: gf,
      minus: ga,
      status: outcomeOf(gf, ga),
    };
  });
  const lastPage = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const current = Math.min(page, lastPage);
  const visibleMatches = matches.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const comps = (report?.by_competition ?? []).map((c) => ({
    name: c.competition ?? '—',
    played: c.wins + c.draws + c.losses,
    win: Number(c.wins),
    draw: Number(c.draws),
    loss: Number(c.losses),
  }));

  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
  const season = stats
    ? [
        { label: 'Fitore', value: `${stats.wins}(${pct(stats.wins)}%)`, tone: C.green },
        { label: 'Barazim', value: `${stats.draws}(${pct(stats.draws)}%)`, tone: C.orange },
        { label: 'Humbje', value: `${stats.losses}(${pct(stats.losses)}%)`, tone: C.red },
      ]
    : [
        { label: 'Fitore', value: '—', tone: C.green },
        { label: 'Barazim', value: '—', tone: C.orange },
        { label: 'Humbje', value: '—', tone: C.red },
      ];

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
    return filters.result === 'all'
      ? 'Të gjitha rezultatet'
      : RESULT_OPTIONS.find((o) => o.value === filters.result)?.label ?? 'Të gjitha rezultatet';
  };

  const filterItems = (key: FilterKey): { value: string | number; label: string }[] => {
    if (key === 'team') {
      return [
        { value: 'all', label: 'Të gjitha ekipet' },
        ...teams.map((t) => ({ value: t.id, label: t.name })),
      ];
    }
    return [{ value: 'all', label: 'Të gjitha rezultatet' }, ...RESULT_OPTIONS];
  };

  const selectedFilterValue = (key: FilterKey): string | number =>
    key === 'team' ? filters.team : filters.result;

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
                <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                  Raportet e ndeshjeve
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Rezultatet dhe statistikat e sezonit
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
          {/* ── Headline squares — one row; each card shrinks to fit ──── */}
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
                      minimumFontScale={0.65}
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
                      {s.hint}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.colPad}>
            {/* ── Filters ───────────────────────────────────────── */}
            <View style={styles.filterRow}>
              {(['team', 'result'] as FilterKey[]).map((key) => (
                <Pressable
                  key={key}
                  onPress={() => setOpenFilter((cur) => (cur === key ? null : key))}
                  accessibilityRole="button"
                  accessibilityLabel={`Filtro: ${filterLabel(key)}`}
                  style={({ pressed }) => [
                    styles.filterBox,
                    openFilter === key && styles.filterBoxOpen,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.filterText} numberOfLines={1}>
                    {filterLabel(key)}
                  </Text>
                  <MaterialCommunityIcons
                    name={openFilter === key ? 'chevron-up' : 'chevron-down'}
                    size={I(14)}
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

            {/* ── Fixtures ──────────────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.head}>
                <Text style={styles.headText} numberOfLines={1}>
                  Raporti i ndeshjeve
                </Text>
              </View>
              <View style={styles.headLine} />

              <View style={styles.tblInner}>
                <View style={[styles.tr, styles.thRow]}>
                  {COLS.map((c) => (
                    <Text key={c.key} style={[styles.th, { flex: c.flex }]} numberOfLines={1}>
                      {c.label}
                    </Text>
                  ))}
                </View>

                {visibleMatches.map((m) => (
                  <View key={m.id} style={[styles.tr, styles.trBorder]}>
                    <Text
                      style={[styles.td, styles.tdMatch, { flex: 1.9 }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.75}
                    >
                      {m.fixture}
                    </Text>
                    <Text
                      style={[styles.td, { flex: 1.5 }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      {m.comp}
                    </Text>
                    <Text style={[styles.td, { flex: 0.8 }]}>{m.rez}</Text>
                    <Text style={[styles.td, styles.tdPlus, { flex: 0.5 }]}>{m.plus}</Text>
                    <Text style={[styles.td, styles.tdMinus, { flex: 0.5 }]}>{m.minus}</Text>
                    <Text
                      style={[styles.td, { flex: 1.1, color: OUTCOME_TONE[m.status] }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      {m.status}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Loading / empty / error — kept inside the card so the table
                  frame stays put. */}
              {error ? (
                <View style={styles.stateRow}>
                  <Text style={styles.stateText}>{error}</Text>
                </View>
              ) : report === null ? (
                <View style={styles.stateRow}>
                  <ActivityIndicator color={C.blueBtn} />
                </View>
              ) : matches.length === 0 ? (
                <View style={styles.stateRow}>
                  <Text style={styles.stateText}>Asnjë ndeshje nuk u gjet.</Text>
                </View>
              ) : null}
            </View>

            {/* ── Pager ─────────────────────────────────────────── */}
            {lastPage > 1 ? (
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
                  <MaterialCommunityIcons name="chevron-left" size={I(22)} color={C.text} />
                </Pressable>

                {pageWindow(current, lastPage).map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => setPage(p)}
                    accessibilityRole="button"
                    accessibilityLabel={`Faqja ${p}`}
                    style={({ pressed }) => [
                      p === current ? styles.pageSqActive : styles.pageSq,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.pageSqText}>{p}</Text>
                  </Pressable>
                ))}

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
                  <MaterialCommunityIcons name="chevron-right" size={I(22)} color={C.text} />
                </Pressable>
              </View>
            ) : null}

            {/* ── Results by competition ────────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.head}>
                <Text style={styles.headText} numberOfLines={1}>
                  Rezultatet sipas kompeticionit
                </Text>
              </View>
              <View style={styles.headLine} />

              <View style={styles.body}>
                {/* Laid out left to right, kept short of the card's full width. */}
                <View style={styles.legend}>
                  {LEGEND.map((l) => (
                    <View key={l.label} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                      <Text style={styles.legendText}>{l.label}</Text>
                    </View>
                  ))}
                </View>

                {comps.length === 0 ? (
                  <Text style={styles.stateText}>Nuk ka të dhëna kompeticionesh.</Text>
                ) : (
                  comps.map((c) => (
                    <View key={c.name} style={styles.statBlock}>
                      <View style={styles.statTop}>
                        <Text style={styles.compName} numberOfLines={1}>
                          {c.name}
                        </Text>
                        <Text style={styles.compPlayed}>{c.played} ndeshje</Text>
                      </View>

                      {/* One rail, split win / draw / loss. */}
                      <View style={styles.splitBar}>
                        <View
                          style={[styles.splitFill, { flex: Math.max(c.win, 0.001), backgroundColor: C.green }]}
                        />
                        <View
                          style={[styles.splitFill, { flex: Math.max(c.draw, 0.001), backgroundColor: C.orange }]}
                        />
                        <View
                          style={[styles.splitFill, { flex: Math.max(c.loss, 0.001), backgroundColor: C.red }]}
                        />
                      </View>

                      <View style={styles.tallyRow}>
                        <Text style={[styles.tally, { color: C.green }]}>{c.win}F</Text>
                        <Text style={[styles.tally, { color: C.orange }]}>{c.draw}F</Text>
                        <Text style={[styles.tally, { color: C.red }]}>{c.loss}F</Text>
                      </View>
                    </View>
                  ))
                )}

                {/* ── Seasonal summary — framed box inside the same card ── */}
                <View style={styles.seasonBox}>
                  <Text style={styles.seasonTitle}>Përmbledhje Sezonale</Text>
                  <View style={styles.seasonLine} />

                  {season.map((s) => (
                    <View key={s.label} style={styles.seasonRow}>
                      <Text style={styles.seasonLabel}>{s.label}</Text>
                      <Text style={[styles.seasonValue, { color: s.tone }]}>{s.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
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

    /* ── Headline squares ────────────────────────────────────── */
    summaryRow: {
      flexDirection: 'row',
      paddingLeft: 14,
      paddingRight: 14,
      paddingTop: 8,
      gap: 6,
    },

    /* Shadow lives on the wrapper: `overflow: hidden` on the pane itself would
       clip it away on iOS. */
    sqShadow: {
      flex: 1,
      height: 104,
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
      borderColor: '#E4A000',
      borderRadius: 8,
      overflow: 'hidden',
    },

    /* Content rides above the frost and gloss overlays. */
    sqBody: {
      flex: 1,
      padding: 7,
    },

    sheen: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '14%',
    },

    /* Fixed two-line block so all four values sit on the same line. */
    sqLabel: {
      minHeight: 26,
      fontFamily: Fonts.bodyBold,
      fontSize: 9.5,
      lineHeight: 11.5,
      color: C.gray,
    },

    sqValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 17,
      lineHeight: 21,
      letterSpacing: -0.5,
      marginTop: 2,
    },

    sqHint: {
      fontFamily: Fonts.body,
      fontSize: 9,
      lineHeight: 11,
      marginTop: 3,
    },

    /* ── Filters ─────────────────────────────────────────────── */
    filterRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 14,
    },

    filterBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 32,
      paddingHorizontal: 9,
      backgroundColor: C.blueSoft,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    filterText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12.5,
      color: C.text,
    },

    filterBoxOpen: {
      borderColor: C.orange,
    },

    /* ── Filter options (inline strip under an open filter) ──── */
    filterOptsRow: {
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
      backgroundColor: C.blueSoft,
      borderColor: C.frame,
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
      paddingVertical: 18,
    },

    stateText: {
      fontFamily: Fonts.body,
      fontSize: 12.5,
      color: C.hint,
      textAlign: 'center',
    },

    /* ── Tables ──────────────────────────────────────────────── */
    card: {
      marginTop: 14,
      backgroundColor: C.cardBg,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 7,
      overflow: 'hidden',
    },

    cardGap: {
      marginTop: 16,
    },

    head: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 11,
      backgroundColor: C.headBg,
    },

    headText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 15,
      lineHeight: 19,
      color: C.text,
    },

    headLine: {
      height: 1,
      backgroundColor: C.headLine,
    },

    /* ── Fixtures table ──────────────────────────────────────── */
    tblInner: {
      paddingHorizontal: 10,
      paddingBottom: 10,
    },

    thRow: {
      paddingTop: 9,
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      minHeight: 34,
    },

    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    th: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.gray,
      textAlign: 'center',
    },

    td: {
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 14,
      color: C.text,
      textAlign: 'center',
    },

    tdMatch: {
      fontFamily: Fonts.bodySemiBold,
      textAlign: 'left',
    },

    tdPlus: {
      fontFamily: Fonts.bodyBold,
      color: C.green,
    },

    tdMinus: {
      fontFamily: Fonts.bodyBold,
      color: C.red,
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

    pagerDisabled: {
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

    pageSqActive: {
      width: 34,
      height: 34,
      borderRadius: 5,
      backgroundColor: '#4E90D8',
      alignItems: 'center',
      justifyContent: 'center',
    },

    pageSqText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 14,
      color: '#F5F5F5',
    },

    /* ── Competition breakdown ───────────────────────────────── */
    body: {
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 14,
      gap: 16,
    },

    legend: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },

    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    legendDot: {
      width: 9,
      height: 9,
      borderRadius: 2,
    },

    legendText: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.text,
    },

    statBlock: {
      gap: 5,
    },

    statTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },

    compName: {
      flex: 1,
      fontFamily: Fonts.bodyBold,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.text,
    },

    compPlayed: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.text,
    },

    splitBar: {
      flexDirection: 'row',
      height: 7,
      borderRadius: 4,
      overflow: 'hidden',
      backgroundColor: C.track,
    },

    splitFill: {
      height: '100%',
    },

    tallyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    tally: {
      fontFamily: Fonts.body,
      fontSize: 10,
      lineHeight: 12,
    },

    /* ── Seasonal summary ────────────────────────────────────── */
    seasonBox: {
      paddingHorizontal: 12,
      paddingTop: 11,
      paddingBottom: 13,
      backgroundColor: '#F5F5F5',
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 7,
    },

    seasonTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 14,
      lineHeight: 18,
      color: C.text,
    },

    seasonLine: {
      height: 1,
      marginTop: 9,
      marginBottom: 4,
      backgroundColor: C.headLine,
    },

    seasonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      minHeight: 26,
    },

    seasonLabel: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 15,
      color: C.text,
    },

    seasonValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12,
      lineHeight: 15,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
