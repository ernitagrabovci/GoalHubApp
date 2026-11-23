import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { FilterSelect, type FilterOption } from '@/components/filters/filter-select';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import { playerStatistics } from '@/lib/api/players';
import { listTeams } from '@/lib/api/teams';
import type { ApiTeam, PlayerStatRow, PlayerStatisticsResponse } from '@/lib/api/types';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';
import { useAppColors, usePaletteStyles, type AppColorsOf } from '@/lib/app-theme';
import { useGlass } from '@/lib/glass';

/**
 * Statistikat e lojtarëve — opened from the "Statistikat" card on the players
 * page. Four orange-framed stat rectangles, the team filter, the
 * "Statistikat individuale" table and its pager.
 */

const C_LIGHT = {
  frame: '#DCE5DF',
  glassBase: 'rgba(255,255,255,0.12)',
  glassEdge: 'rgba(255,255,255,0.95)',
  glassDivider: 'rgba(16,51,38,0.18)',
  page: '#F7F9F8',
  line: 'rgba(0,0,0,0.025)',

  text: '#17251E',
  gray: '#52645A',

  card: '#F7F9F8',
  border: 'rgba(100,140,190,0.30)',
  rowLine: 'rgba(100,140,190,0.22)',
  headLine: 'rgba(30,40,35,0.10)',

  orange: '#B45309',
  red: '#B91C1C',
  green: '#2E7D5B',
  blue: '#1749B8',
  blueSoft: '#E3EEFB',
};

type StatRect = { label: string; value: string; hint: string; tone?: string };

/** Labels/hints/tones are static; only the value comes from the API totals. */
const STAT_TEMPLATES = (C: AppColorsOf<typeof C_LIGHT>): Omit<StatRect, 'value'>[] => ([
  { label: 'Lojtarë gjithsej', hint: 'me statistika' },
  { label: 'Gola total', hint: 'sezoni aktual', tone: C.green },
  { label: 'Asiste total', hint: 'sezoni aktual', tone: C.blue },
  { label: 'Minuta total', hint: 'luajtura', tone: C.orange },
]);

type Col = { key: string; label: string; width: number; color?: string; align?: 'left' | 'center' };

const COLS = (C: AppColorsOf<typeof C_LIGHT>): Col[] => ([
  { key: 'player', label: 'Lojtari', width: 56, align: 'left' },
  { key: 'team', label: 'Ekipi', width: 46 },
  { key: 'nd', label: 'ND', width: 29 },
  { key: 'min', label: 'Min', width: 37 },
  { key: 'goals', label: 'Gola', width: 42, color: C.greenText },
  { key: 'assists', label: 'Asiste', width: 50 },
  { key: 'kv', label: 'KV', width: 28, color: C.orangeText },
  { key: 'kk', label: 'KK', width: 28, color: C.redText },
]);

/** The stats endpoint returns every player at once, so the pager works on the client. */
const PAGE_SIZE = 8;

/** A short run of page numbers ending at `last`, capped for width. */
function pageWindow(current: number, last: number, span = 4): number[] {
  const start = Math.max(1, Math.min(current, last - span + 1));
  const end = Math.min(last, start + span - 1);
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);
}

/** A numeric cell, coerced from a possibly-string API value; null renders "—". */
function cell(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  return String(Number(value));
}

/** The table body's values, in the same order as `COLS`. */
function rowValues(r: PlayerStatRow): string[] {
  return [
    r.name ?? '—',
    r.team ?? '—',
    cell(r.matches),
    cell(r.minutes),
    cell(r.goals),
    cell(r.assists),
    cell(r.yellow_cards),
    cell(r.red_cards),
  ];
}

export default function PlayerStatisticsScreen() {
  const glass = useGlass();
  const C = useAppColors(C_LIGHT);
  const styles = usePaletteStyles(createStyles, C);
  const router = useRouter();
  const { token, signOut } = useSession();

  const [data, setData] = useState<PlayerStatisticsResponse | null>(null);
  const [teams, setTeams] = useState<ApiTeam[]>([]);
  const [teamFilter, setTeamFilter] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    playerStatistics(
      token,
      { team_id: teamFilter ? Number(teamFilter) : undefined },
      controller.signal,
    )
      .then((res) => {
        if (controller.signal.aborted) return;
        setData(res);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) {
          signOut();
          router.replace('/login');
        }
      });
    return () => controller.abort();
  }, [token, router, signOut, teamFilter]);

  /* The teams fill the filter's options. */
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    listTeams(token, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setTeams(res.data);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) {
          signOut();
          router.replace('/login');
        }
      });
    return () => controller.abort();
  }, [token, router, signOut]);

  const teamOptions: FilterOption[] = [
    { label: 'Të gjitha ekipet', value: '' },
    ...teams.map((t) => ({ label: t.name, value: String(t.id) })),
  ];

  const totals = data?.totals;
  const stats: StatRect[] = [
    { ...STAT_TEMPLATES(C)[0], value: totals ? String(totals.players) : '—' },
    { ...STAT_TEMPLATES(C)[1], value: totals ? String(totals.goals) : '—' },
    { ...STAT_TEMPLATES(C)[2], value: totals ? String(totals.assists) : '—' },
    {
      ...STAT_TEMPLATES(C)[3],
      value: totals ? totals.minutes.toLocaleString('en-US') : '—',
    },
  ];

  const rows = data?.data ?? [];
  const lastPage = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const current = Math.min(page, lastPage);
  const visibleRows = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

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
                <MaterialCommunityIcons name="chevron-left" size={I(24)} color={C.textText} />
              </Pressable>
              <View style={styles.headerText}>
                <Text style={styles.title} numberOfLines={1}>
                  Statistikat e lojtarëve
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Performanca individuale e sezonit
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
          {/* ── Stat rectangles ─────────────────────────────────── */}
          <View style={styles.rectRow}>
            <View style={styles.statsCard}>
              {/* One pane for the whole row: frost, base gloss, then two
                  specular sweeps so the surface reads as glass. */}
              <BlurView
                pointerEvents="none"
                intensity={55}
                tint={glass.tint}
                experimentalBlurMethod="dimezisBlurView"
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                pointerEvents="none"
                style={StyleSheet.absoluteFill}
                colors={glass.highlight}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <LinearGradient
                pointerEvents="none"
                style={styles.statsGloss}
                colors={glass.sweep}
                locations={[0, 0.38, 0.62, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              <LinearGradient
                pointerEvents="none"
                style={styles.statsGloss2}
                colors={glass.sweepSoft}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              <View pointerEvents="none" style={styles.statsSheen} />

              {stats.map((s, i) => (
                <View key={s.label} style={styles.statItem}>
                  {i > 0 ? <View pointerEvents="none" style={styles.statDivider} /> : null}
                  <Text
                    style={styles.rectLabel}
                    numberOfLines={2}
                    adjustsFontSizeToFit
                    minimumFontScale={0.65}
                  >
                    {s.label}
                  </Text>
                  <Text
                    style={[styles.rectValue, s.tone ? { color: s.tone } : null]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.5}
                  >
                    {s.value}
                  </Text>
                  <Text style={[styles.rectHint, s.tone ? { color: s.tone } : null]} numberOfLines={2}>
                    {s.hint}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.colPad}>
            {/* ── Team filter ───────────────────────────────────── */}
            <FilterSelect
              label="Filtro sipas ekipit"
              options={teamOptions}
              value={teamFilter}
              onChange={(v) => {
                setTeamFilter(v);
                setPage(1);
              }}
              boxStyle={styles.teamBtn}
              textStyle={styles.teamBtnText}
            />

            {/* ── Statistikat individuale ───────────────────────── */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Statistikat individuale</Text>
              </View>

              <View style={styles.tblWrap}>
                <View style={styles.tr}>
                  {COLS(C).map((c) => (
                    <Text
                      key={c.key}
                      style={[
                        styles.th,
                        c.align ? { textAlign: c.align } : null,
                        c.color ? { color: c.color } : null,
                        { width: c.width },
                      ]}
                    >
                      {c.label}
                    </Text>
                  ))}
                </View>

                {visibleRows.map((r) => {
                  const values = rowValues(r);
                  return (
                    <View key={r.player_id} style={[styles.tr, styles.trBorder]}>
                      {COLS(C).map((c, i) => (
                        <Text
                          key={c.key}
                          style={[
                            styles.tdCell,
                            c.align ? { textAlign: c.align } : null,
                            { width: c.width },
                          ]}
                          numberOfLines={1}
                        >
                          {values[i]}
                        </Text>
                      ))}
                    </View>
                  );
                })}
              </View>
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
                  <MaterialCommunityIcons name="chevron-left" size={I(22)} color={C.textText} />
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
                  <MaterialCommunityIcons name="chevron-right" size={I(22)} color={C.textText} />
                </Pressable>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const createStyles = (C: AppColorsOf<typeof C_LIGHT>) => StyleSheet.create(
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
      color: C.textText,
    },

    subtitle: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 16,
      color: C.grayText,
      marginTop: 1,
    },

    scroll: {
      paddingBottom: 24,
    },

    /* ── Stat rectangles ─────────────────────────────────────── */
    rectRow: {
      flexDirection: 'row',
      paddingLeft: 14,
      paddingRight: 14,
      paddingTop: 4,
    },

    /* One shared glass pane for the whole row, with an orange rim. */
    statsCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'stretch',
      height: 104,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.orangeBorder,
      backgroundColor: C.glassBaseFill,
      overflow: 'hidden',
      shadowColor: '#0B3B33',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 14,
      elevation: 5,
    },

    statsGloss: {
      position: 'absolute',
      top: -130,
      left: -150,
      right: -150,
      height: 340,
      transform: [{ rotate: '-16deg' }],
    },

    statsGloss2: {
      position: 'absolute',
      top: 57,
      left: 30,
      right: -170,
      height: 80,
      transform: [{ rotate: '-16deg' }],
    },

    statsSheen: {
      position: 'absolute',
      top: 1.5,
      left: 10,
      right: 10,
      height: 1.5,
      borderRadius: 1,
      backgroundColor: C.glassEdgeFill,
    },

    statItem: {
      flex: 1,
      minWidth: 0,
      padding: 8,
      overflow: 'hidden',
    },

    statDivider: {
      position: 'absolute',
      left: 0,
      top: 10,
      bottom: 10,
      width: StyleSheet.hairlineWidth,
      backgroundColor: C.glassDividerFill,
    },

    /* Fixed two-line block so all four values sit on the same line. */
    rectLabel: {
      minHeight: 26,
      fontFamily: Fonts.bodySemiBold,
      fontSize: 9.5,
      lineHeight: 11.5,
      color: C.grayText,
    },

    rectValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 17,
      lineHeight: 21,
      letterSpacing: -0.5,
      color: C.textText,
      marginTop: 2,
    },

    rectHint: {
      fontFamily: Fonts.body,
      fontSize: 9,
      lineHeight: 11,
      color: C.grayText,
      marginTop: 3,
    },

    /* ── Team filter ─────────────────────────────────────────── */
    /* Same shape as the "Lojtari i ri" button, with a dropdown on the end. */
    teamBtn: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      height: 36,
      marginTop: 14,
      paddingHorizontal: 12,
      backgroundColor: C.blueSoftFill,
      borderWidth: 1,
      borderColor: C.frameBorder,
      borderRadius: 4,
    },

    teamBtnText: {
      fontFamily: Fonts.body,
      fontSize: 12,
      color: C.textText,
    },

    /* ── Statistikat individuale ─────────────────────────────── */
    card: {
      marginTop: 14,
      backgroundColor: C.cardFill,
      borderWidth: 2,
      borderColor: C.borderBorder,
      borderRadius: 7,
      overflow: 'hidden',
    },

    cardHead: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor: C.headLineBorder,
    },

    cardHeadText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 16,
      lineHeight: 20,
      color: C.textText,
    },

    /* All eight columns fit — this table never scrolls sideways. */
    tblWrap: {
      paddingHorizontal: 8,
      paddingBottom: 8,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 36,
    },

    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLineBorder,
    },

    th: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.grayText,
      textAlign: 'center',
    },

    /* Body cell — same sizing as the header, normal weight and darker ink. */
    tdCell: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.textText,
      textAlign: 'center',
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
      width: 44,
      height: 44,
      borderRadius: 10,
      backgroundColor: '#86BCFD',
      alignItems: 'center',
      justifyContent: 'center',
    },

    pageSqActive: {
      width: 44,
      height: 44,
      borderRadius: 10,
      backgroundColor: '#4E90D8',
      alignItems: 'center',
      justifyContent: 'center',
    },

    pageSqText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 14,
      color: '#FFFFFF',
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
