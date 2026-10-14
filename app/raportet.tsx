import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import { playersReport } from '@/lib/api/reports';
import { listTeams } from '@/lib/api/teams';
import type { ApiTeam, PlayerReportRow, PlayersReport } from '@/lib/api/types';
import { POSITIONS, positionLabel } from '@/lib/player-position';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * Raportet — opened from the "Shiko të gjithë" footer of the Raportet card
 * on the admin dashboard.
 *
 * Two promo cards, the player filter row, the wide individual table with its
 * pager, then the attendance and goals-by-position breakdowns.
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
  blue: '#2F80ED',
  green: '#159447',
  orange: '#E4A000',
  red: '#E03131',

  /* Unfilled part of every progress rail. */
  track: 'rgba(0,0,0,0.10)',
};

const IMG = {
  ndeshjet: require('@/assets/dashboard/ndeshjet.png'),
  pagesat: require('@/assets/dashboard/pagesat-art.png'),
};

/* ── Individual report table ───────────────────────────────────────── */

type ColKey =
  | 'name'
  | 'team'
  | 'pos'
  | 'nd'
  | 'gola'
  | 'asiste'
  | 'min'
  | 'kv'
  | 'kk'
  | 'prani'
  | 'vler';

type Col = { key: ColKey; label: string; width: number };

const COLS: Col[] = [
  { key: 'name', label: 'Lojtari', width: 104 },
  { key: 'team', label: 'Ekipi', width: 60 },
  { key: 'pos', label: 'Poz', width: 40 },
  { key: 'nd', label: 'Nd', width: 34 },
  { key: 'gola', label: 'Gola', width: 44 },
  { key: 'asiste', label: 'Asiste', width: 48 },
  { key: 'min', label: 'Min', width: 44 },
  { key: 'kv', label: 'KV', width: 34 },
  { key: 'kk', label: 'KK', width: 34 },
  { key: 'prani', label: 'Prani', width: 64 },
  { key: 'vler', label: 'Vlerësimi', width: 68 },
];

/** The three columns that carry a tone; everything else stays plain. */
const TD_TONE: Partial<Record<ColKey, string>> = {
  gola: C.green,
  kv: C.orange,
  kk: C.red,
};

type Row = {
  name: string;
  team: string;
  pos: string;
  nd: number;
  gola: number;
  asiste: number;
  min: number;
  kv: number;
  kk: number;
  prani: number;
  vler: string;
};

/** The report returns every player at once, so the pager works on the client. */
const PAGE_SIZE = 8;

/** Roll each position code up into one of the four goal groups. */
const POSITION_GROUP: Record<string, string> = {
  PO: 'Portier',
  BDJ: 'Mbrojtës',
  QBM: 'Mbrojtës',
  BSI: 'Mbrojtës',
  MMB: 'Mesfushorë',
  MQ: 'Mesfushorë',
  MO: 'Mesfushorë',
  KDJ: 'Mesfushorë',
  KSI: 'Mesfushorë',
  SU: 'Sulmues',
  SS: 'Sulmues',
};

/** Fixed order and colour for the goal bars, so the card is stable at zero. */
const GOAL_GROUPS = [
  { pos: 'Sulmues', color: C.orange },
  { pos: 'Mesfushorë', color: C.blue },
  { pos: 'Mbrojtës', color: C.green },
  { pos: 'Portier', color: C.track },
];

type FilterKey = 'team' | 'position';

/** A player's report line, flattened for the wide table. */
function toRow(p: PlayerReportRow): Row {
  return {
    name: p.name ?? '—',
    team: p.team?.name ?? '—',
    pos: p.position ?? '—',
    nd: p.matches,
    gola: p.goals,
    asiste: p.assists,
    min: p.minutes,
    kv: p.yellow_cards,
    kk: p.red_cards,
    prani: p.attendance_pct,
    vler: p.latest_rating != null ? Number(p.latest_rating).toFixed(1) : '—',
  };
}

/** A short run of page numbers ending at `last`, capped for width. */
function pageWindow(current: number, last: number, span = 4): number[] {
  const start = Math.max(1, Math.min(current, last - span + 1));
  const end = Math.min(last, start + span - 1);
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);
}

/* ------------------------------------------------------------------ */

/** A hint rail with its filled share laid over it. */
function MiniBar({ pct, color, width }: { pct: number; color: string; width: number }) {
  return (
    <View style={[styles.bar, { width }]}>
      <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

export default function ReportsScreen() {
  const router = useRouter();
  const { token, signOut } = useSession();

  const [report, setReport] = useState<PlayersReport | null>(null);
  const [teams, setTeams] = useState<ApiTeam[]>([]);
  const [filters, setFilters] = useState<{ team: 'all' | number; position: string }>({
    team: 'all',
    position: 'all',
  });
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const filterKey = `${filters.team}|${filters.position}`;

  // The team filter's options — a one-shot, independent of the report.
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    listTeams(token, controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) setTeams(res.data);
      })
      .catch(() => {
        // Leave the filter at "Të gjitha ekipet"; the report carries its own
        // error state.
      });
    return () => controller.abort();
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    playersReport(
      token,
      {
        team_id: filters.team === 'all' ? undefined : filters.team,
        position: filters.position === 'all' ? undefined : filters.position,
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
            : 'Nuk mund të ngarkohen raportet.',
        );
      });
    return () => controller.abort();
  }, [token, filterKey, filters.team, filters.position, signOut, router]);

  const rows = (report?.players ?? []).map(toRow);
  const lastPage = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, lastPage);
  const visibleRows = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const attendance = (report?.attendance_by_team ?? []).map((t) => {
    const total = t.present + t.absent;
    return {
      team: t.name,
      pct: total > 0 ? Math.round((t.present / total) * 100) : 0,
      present: t.present,
      absent: t.absent,
    };
  });

  const goalTotals: Record<string, number> = {};
  for (const p of report?.players ?? []) {
    const group = POSITION_GROUP[p.position ?? ''] ?? 'Mesfushorë';
    goalTotals[group] = (goalTotals[group] ?? 0) + p.goals;
  }
  const goals = GOAL_GROUPS.map((g) => ({ ...g, total: goalTotals[g.pos] ?? 0 }));
  const goalsMax = Math.max(1, ...goals.map((g) => g.total));

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
    return filters.position === 'all' ? 'Të gjitha pozicionet' : positionLabel(filters.position);
  };

  const filterItems = (key: FilterKey): { value: string | number; label: string }[] => {
    if (key === 'team') {
      return [
        { value: 'all', label: 'Të gjitha ekipet' },
        ...teams.map((t) => ({ value: t.id, label: t.name })),
      ];
    }
    return [
      { value: 'all', label: 'Të gjitha pozicionet' },
      ...POSITIONS.map((p) => ({ value: p.code, label: p.label })),
    ];
  };

  const selectedFilterValue = (key: FilterKey): string | number =>
    key === 'team' ? filters.team : filters.position;

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
                  Raportet e lojtarëve
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Statistikat individuale dhe prezenca
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
          <View style={styles.colPad}>
            {/* ── Promo cards ───────────────────────────────────── */}
            <View style={styles.twoCol}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Raportet e ndeshjeve"
                onPress={() => router.push('/raporti-ndeshjeve')}
                style={({ pressed }) => [styles.promo, styles.promoMatches, pressed && styles.pressed]}
              >
                <Text style={styles.promoTitle} numberOfLines={2}>
                  Raportet e ndeshjeve
                </Text>
                <Image source={IMG.ndeshjet} style={styles.promoImgMatches} resizeMode="contain" />
                <View style={[styles.promoBtn, { backgroundColor: C.red }]}>
                  <Text style={styles.promoBtnText}>Vazhdo</Text>
                </View>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Raportet e pagesave"
                onPress={() => router.push('/raporti-pagesave')}
                style={({ pressed }) => [styles.promo, styles.promoPayments, pressed && styles.pressed]}
              >
                <Text style={styles.promoTitle} numberOfLines={2}>
                  Raportet e pagesave
                </Text>
                <Image source={IMG.pagesat} style={styles.promoImgPayments} resizeMode="contain" />
                <View style={[styles.promoBtn, { backgroundColor: C.orange }]}>
                  <Text style={styles.promoBtnText}>Vazhdo</Text>
                </View>
              </Pressable>
            </View>

            {/* ── Filters ───────────────────────────────────────── */}
            <View style={styles.filterRow}>
              {(['team', 'position'] as FilterKey[]).map((key) => (
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

            {/* ── Individual player report ──────────────────────── */}
            <View style={styles.card}>
              <View style={styles.head}>
                <Text style={styles.headText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                  Raporti individual i lojtarëve
                </Text>
              </View>
              <View style={styles.headLine} />

              {/* Eleven columns, so the table runs off the card sideways. */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={styles.tblInner}
              >
                <View>
                  <View style={[styles.tr, styles.thRow]}>
                    {COLS.map((c) => (
                      <Text
                        key={c.key}
                        style={[styles.th, { width: c.width }, TD_TONE[c.key] ? { color: TD_TONE[c.key] } : null]}
                        numberOfLines={1}
                      >
                        {c.label}
                      </Text>
                    ))}
                  </View>

                  {visibleRows.map((r) => (
                    <View key={r.name} style={[styles.tr, styles.trBorder]}>
                      {COLS.map((c) => {
                        if (c.key === 'name') {
                          return (
                            <Text
                              key={c.key}
                              style={[styles.td, styles.tdName, { width: c.width }]}
                              numberOfLines={1}
                            >
                              {r.name}
                            </Text>
                          );
                        }
                        if (c.key === 'prani') {
                          return (
                            <View key={c.key} style={[styles.tdBar, { width: c.width }]}>
                              <MiniBar pct={r.prani} color={C.green} width={46} />
                              <Text style={styles.barLabel}>{r.prani}%</Text>
                            </View>
                          );
                        }
                        const tone = TD_TONE[c.key];
                        return (
                          <Text
                            key={c.key}
                            style={[styles.td, { width: c.width }, tone ? { color: tone } : null]}
                            numberOfLines={1}
                          >
                            {r[c.key]}
                          </Text>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </ScrollView>

              {/* Loading / empty / error — kept inside the card so the table
                  frame stays put. */}
              {error ? (
                <View style={styles.stateRow}>
                  <Text style={styles.stateText}>{error}</Text>
                </View>
              ) : report === null ? (
                <View style={styles.stateRow}>
                  <ActivityIndicator color={C.blue} />
                </View>
              ) : rows.length === 0 ? (
                <View style={styles.stateRow}>
                  <Text style={styles.stateText}>Asnjë lojtar nuk u gjet.</Text>
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

            {/* ── Attendance ────────────────────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.headRow}>
                <Text style={styles.headText} numberOfLines={1}>
                  Prezenca në stërvitje
                </Text>
                <Text style={styles.headHint}>sipas ekipit</Text>
              </View>
              <View style={styles.headLine} />

              <View style={styles.body}>
                {attendance.length === 0 ? (
                  <Text style={styles.stateText}>Nuk ka të dhëna prezence.</Text>
                ) : (
                  attendance.map((a) => (
                    <View key={a.team} style={styles.statBlock}>
                      <View style={styles.statTop}>
                        <Text style={styles.statLabel} numberOfLines={1}>
                          {a.team}
                        </Text>
                        <Text style={styles.statValue}>{a.pct}%</Text>
                      </View>

                      {/* One rail, split present / absent. */}
                      <View style={styles.splitBar}>
                        <View
                          style={[
                            styles.splitFill,
                            { flex: Math.max(a.present, 0.001), backgroundColor: C.green },
                          ]}
                        />
                        <View
                          style={[
                            styles.splitFill,
                            { flex: Math.max(a.absent, 0.001), backgroundColor: C.red },
                          ]}
                        />
                      </View>

                      <View style={styles.statFoot}>
                        <Text style={[styles.footText, { color: C.green }]}>{a.present} prezent</Text>
                        <Text style={[styles.footText, { color: C.red }]}>{a.absent} mungesë</Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>

            {/* ── Goals by position ─────────────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.headRow}>
                <Text style={styles.headText} numberOfLines={1}>
                  Golat sipas pozicionit
                </Text>
                <Text style={styles.headHint}>sipas ekipit</Text>
              </View>
              <View style={styles.headLine} />

              <View style={styles.body}>
                {goals.map((g) => (
                  <View key={g.pos} style={styles.statBlock}>
                    <View style={styles.statTop}>
                      <Text style={styles.statLabel} numberOfLines={1}>
                        {g.pos}
                      </Text>
                      <Text style={styles.statValue}>{g.total}</Text>
                    </View>

                    <View style={styles.goalBar}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${(g.total / goalsMax) * 100}%`,
                            backgroundColor: g.color,
                          },
                        ]}
                      />
                    </View>
                  </View>
                ))}
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

    /* ── Promo cards ─────────────────────────────────────────── */
    twoCol: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },

    promo: {
      width: '48%',
      height: 106,
      position: 'relative',
      borderRadius: 9,
      borderWidth: 1,
      overflow: 'hidden',
    },

    promoMatches: {
      backgroundColor: '#FDEBEB',
      borderColor: '#F2C2C2',
    },

    promoPayments: {
      backgroundColor: '#FBF0DC',
      borderColor: '#EFD6A6',
    },

    promoTitle: {
      position: 'absolute',
      top: 8,
      left: 2,
      right: 5,
      textAlign: 'center',
      fontFamily: Fonts.bodyBold,
      fontSize: 22,
      lineHeight: 22,
      color: C.text,
      zIndex: 3,
    },

    promoImgMatches: {
      position: 'absolute',
      width: 104,
      height: 104,
      left: -30,
      bottom: -48,
      zIndex: 1,
    },

    promoImgPayments: {
      position: 'absolute',
      width: 100,
      height: 120,
      left: -40,
      bottom: -44,
      zIndex: 1,
    },

    promoBtn: {
      position: 'absolute',
      right: 8,
      bottom: 8,
      minWidth: 64,
      height: 27,
      borderRadius: 5,
      paddingHorizontal: 9,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 5,
    },

    promoBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11,
      lineHeight: 14,
      color: '#F5F5F5',
    },

    /* ── Filters ─────────────────────────────────────────────── */
    filterRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 14,
    },

    /* Sized to its own label rather than splitting the row in half. */
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

    headRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
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

    headHint: {
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 14,
      color: C.gray,
    },

    headLine: {
      height: 1,
      backgroundColor: C.headLine,
    },

    /* ── Individual report table ─────────────────────────────── */
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
      gap: 6,
      minHeight: 40,
    },

    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    th: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      lineHeight: 15,
      color: C.gray,
      textAlign: 'center',
    },

    td: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 15,
      color: C.text,
      textAlign: 'center',
    },

    tdName: {
      fontFamily: Fonts.bodySemiBold,
      textAlign: 'left',
    },

    tdBar: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },

    bar: {
      height: 5,
      borderRadius: 3,
      backgroundColor: C.track,
      overflow: 'hidden',
    },

    barFill: {
      height: '100%',
      borderRadius: 3,
    },

    barLabel: {
      fontFamily: Fonts.body,
      fontSize: 10,
      lineHeight: 12,
      color: C.gray,
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
      backgroundColor: '#86BCFD',
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

    /* ── Statistic breakdowns ────────────────────────────────── */
    body: {
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 14,
      gap: 16,
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

    statLabel: {
      flex: 1,
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.text,
    },

    statValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 13,
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

    statFoot: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },

    footText: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
    },

    goalBar: {
      height: 7,
      borderRadius: 4,
      backgroundColor: C.track,
      overflow: 'hidden',
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
