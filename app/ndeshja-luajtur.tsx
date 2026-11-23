import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import { deleteMatch, getMatch } from '@/lib/api/matches';
import type { ApiMatch } from '@/lib/api/types';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';
import { useAppColors, usePaletteStyles, type AppColorsOf } from '@/lib/app-theme';

/**
 * A played match — opened from "Shiko" on the results table in ndeshjet. Shows
 * the same informacioni block as an upcoming match, plus the score and, since
 * the match is over, the player statistics and the starting eleven.
 */

const C_LIGHT = {
  frame: '#DCE5DF',
  page: '#F7F9F8',
  line: 'rgba(0,0,0,0.025)',

  text: '#17251E',
  gray: '#52645A',
  hint: '#6E6E6E',
  /* Black rules that invert on the dark page. */
  ink: '#000000',

  /* blue1 = the deeper blue of the buttons; blue2 = the pale card blue. */
  blue1: '#E3EEFB',
  blue2: '#F7F9F8',

  border: 'rgba(100,140,190,0.30)',
  rowLine: 'rgba(100,140,190,0.22)',
  headLine: 'rgba(30,40,35,0.10)',

  green: '#2E7D5B',
  red: '#B91C1C',
  yellow: '#FFC800',

  /* The starting-eleven cards. */
  cardGreen: 'rgba(158,253,134,0.20)',
};

const INFO_LABELS = ['Ekipi', 'Fiziku', 'Taktikat', 'Stabilitet'];

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** "18/08/2026" → "18 Aug 2026". */
function formatDate(date: string): string {
  const [day, month, year] = date.split('/');
  const mon = MONTHS[Number(month) - 1];
  if (!day || !mon || !year) return date;
  return `${day} ${mon.charAt(0).toUpperCase()}${mon.slice(1).toLowerCase()} ${year}`;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** `2026-08-18T16:00:00Z` → `18 Aug 2026, 16:00`. */
function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const mon = MONTHS[d.getMonth()];
  const name = `${mon.charAt(0)}${mon.slice(1).toLowerCase()}`;
  return `${pad2(d.getDate())} ${name} ${d.getFullYear()}, ${pad2(d.getHours())}:${pad2(
    d.getMinutes(),
  )}`;
}

/** Win/draw/loss from the club's own goals — the API reports both sides. */
function verdict(scored: number, conceded: number): 'F' | 'H' | 'B' {
  if (scored === conceded) return 'B';
  return scored > conceded ? 'F' : 'H';
}

/** Fallback verdict from a static "h - a" score, when the club is the home side. */
function staticOutcome(atHome: boolean, score: string): 'F' | 'H' | 'B' {
  const [h, a] = score.split('-').map(Number);
  if (h === a) return 'B';
  return (atHome ? h > a : a > h) ? 'F' : 'H';
}

const RESULT = (C: AppColorsOf<typeof C_LIGHT>) => ({
  F: { label: 'Fitore', color: C.greenText },
  H: { label: 'Humbje', color: C.redText },
  B: { label: 'Barazim', color: C.grayText },
});

export default function PlayedMatchScreen() {
  const C = useAppColors(C_LIGHT);
  const styles = usePaletteStyles(createStyles, C);
  const router = useRouter();
  const { token, signOut } = useSession();

  const params = useLocalSearchParams<{
    id?: string;
    home?: string;
    away?: string;
    team?: string;
    comp?: string;
    date?: string;
    time?: string;
    score?: string;
  }>();

  const matchId = params.id ? Number(params.id) : null;
  const [match, setMatch] = useState<ApiMatch | null>(null);

  useEffect(() => {
    if (!token || !matchId || Number.isNaN(matchId)) return;
    const controller = new AbortController();

    getMatch(token, matchId, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setMatch(res.data);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) {
          signOut();
          router.replace('/login');
        }
      });

    return () => controller.abort();
  }, [token, matchId, router, signOut]);

  const home = match?.team?.name ?? params.home ?? '';
  const away = match?.opponent ?? params.away ?? '';
  const title = away ? `${home} - ${away}` : home;

  const score = match
    ? `${match.goals_for ?? '—'} - ${match.goals_against ?? '—'}`
    : params.score ?? '';

  /* With live data the club is always the home side, so its own goal count decides. */
  const result = RESULT(C)[
    match?.goals_for != null && match?.goals_against != null
      ? verdict(match.goals_for, match.goals_against)
      : staticOutcome(home.includes('Prishtina'), score)
  ];

  const values = [
    match?.team?.name ?? params.team ?? '',
    match?.venue ?? (match || home.includes('Prishtina') ? 'Shtëpi' : 'Musafir'),
    match?.competition ?? params.comp ?? '',
    match
      ? formatDateTime(match.scheduled_at)
      : `${formatDate(params.date ?? '')}, ${params.time ?? ''}`,
  ];

  /* The line-up and per-player statistics come with the match; empty until load. */
  const statRows = (match?.player_stats ?? []).map((p) => ({
    name: p.player_name ?? '—',
    goals: p.goals ?? 0,
    assists: p.assists ?? 0,
    min: p.minutes_played ?? 0,
    yellow: (p.yellow_cards ?? 0) > 0,
    red: (p.red_cards ?? 0) > 0,
    nota: p.rating == null ? '—' : Number(p.rating).toFixed(1),
  }));

  const starters = (match?.lineup ?? [])
    .filter((l) => l.type === 'starter')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((l) => ({ name: l.player_name ?? '—', position: l.position ?? '' }));

  const remove = () => {
    if (!token || !matchId) return;
    Alert.alert('Fshi ndeshjen', 'A jeni të sigurt që doni ta fshini ndeshjen?', [
      { text: 'Anulo', style: 'cancel' },
      {
        text: 'Fshi',
        style: 'destructive',
        onPress: () => {
          deleteMatch(token, matchId)
            .then(() => router.back())
            .catch((e) => {
              if (e instanceof ApiError && e.status === 401) {
                signOut();
                router.replace('/login');
                return;
              }
              const first = e instanceof ApiError ? e.fieldErrors?.status?.[0] : undefined;
              Alert.alert('Gabim', first ?? 'Ndeshja nuk mund të fshihet.');
            });
        },
      },
    ]);
  };

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
                <Text
                  style={styles.title}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {title}
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
            {/* ── Row actions ───────────────────────────────────── */}
            <View style={styles.actions}>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/fut-rezultatin',
                    params: { ...(matchId ? { id: String(matchId) } : {}), home, away },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel="Edito ndeshjen"
                style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
              >
                <Text style={styles.actionText}>Edito</Text>
              </Pressable>
              <Pressable
                onPress={remove}
                accessibilityRole="button"
                accessibilityLabel="Fshi ndeshjen"
                style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressed]}
              >
                <Text style={styles.actionText}>Fshi</Text>
              </Pressable>
            </View>

            {/* ── Informacioni / E luajtur ──────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.headRow}>
                <Text style={styles.headTextBlack}>Informacioni</Text>
                <Text style={styles.headTextGreen}>E luajtur</Text>
              </View>
              <View style={styles.headLine} />

              <View style={styles.bodyRow}>
                {/* Left half — labels, the rule, then their values. */}
                <View style={styles.infoHalf}>
                  <View style={styles.labelsCol}>
                    {INFO_LABELS.map((label, i) => (
                      <View key={label} style={[styles.cell, i > 0 && styles.cellBorder]}>
                        <Text style={styles.cellLabel} numberOfLines={1}>
                          {label}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.valuesCol}>
                    {values.map((value, i) => (
                      <View key={`${value}-${i}`} style={[styles.cell, i > 0 && styles.cellBorder]}>
                        <Text
                          style={styles.cellValue}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.6}
                        >
                          {value}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.vRule} />

                {/* Right half — the score and the verdict. */}
                <View style={styles.resultCol}>
                  <Text style={styles.resultScore} numberOfLines={1}>
                    {score}
                  </Text>
                  <Text style={[styles.resultLabel, { color: result.color }]} numberOfLines={1}>
                    {result.label}
                  </Text>
                </View>
              </View>
            </View>

            {/* ── Statistikat e lojtarëve ───────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.head}>
                <Text style={styles.headTextBlack}>Statistikat e lojtarëve</Text>
              </View>
              <View style={styles.headLine} />

              <View style={styles.tblWrap}>
                <View style={styles.tr}>
                  <Text style={[styles.th, styles.colName]}>Lojtari</Text>
                  <Text style={[styles.th, styles.colStat]}>Gola</Text>
                  <Text style={[styles.th, styles.colStat]}>Asiste</Text>
                  <Text style={[styles.th, styles.colStat]}>Min</Text>
                  <View style={styles.colCard}>
                    <View style={[styles.cardSq, { backgroundColor: C.yellowFill }]} />
                  </View>
                  <View style={styles.colCard}>
                    <View style={[styles.cardSq, { backgroundColor: C.redFill }]} />
                  </View>
                  <Text style={[styles.th, styles.colNota]}>Nota</Text>
                </View>

                <View style={styles.noteRow}>
                  <Text style={styles.note}>
                    {statRows.length
                      ? 'Statistikat janë regjistruar nga trajneri.'
                      : 'Statistikat nuk janë regjistruar.'}
                  </Text>
                </View>

                {statRows.map((p, i) => (
                  <View key={`${p.name}-${i}`} style={[styles.tr, styles.trBorder]}>
                    <Text style={[styles.tdName, styles.colName]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                      {p.name}
                    </Text>
                    <Text style={[styles.td, styles.colStat]}>{p.goals}</Text>
                    <Text style={[styles.td, styles.colStat]}>{p.assists}</Text>
                    <Text style={[styles.td, styles.colStat]}>{p.min}</Text>
                    <View style={styles.colCard}>
                      {p.yellow ? <View style={[styles.cardSq, { backgroundColor: C.yellowFill }]} /> : null}
                    </View>
                    <View style={styles.colCard}>
                      {p.red ? <View style={[styles.cardSq, { backgroundColor: C.redFill }]} /> : null}
                    </View>
                    <Text style={[styles.td, styles.colNota]}>
                      {p.nota}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* ── Formacioni ────────────────────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.head}>
                <Text style={styles.headTextBlack}>Formacioni</Text>
              </View>
              <View style={styles.headLine} />

              {starters.length ? (
                <>
                  <Text style={styles.sectionLabel}>{`Startuesit (${starters.length})`}</Text>

                  <View style={styles.squadGrid}>
                    {starters.map((s, i) => (
                      <View key={`${s.name}-${i}`} style={styles.playerCard}>
                        <Text style={styles.playerName}>{s.name}</Text>
                        <Text style={styles.playerPosition}>{s.position}</Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : (
                <View style={styles.emptyPad}>
                  <Text style={styles.emptyNote}>Formacioni nuk është caktuar.</Text>
                </View>
              )}
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

    scroll: {
      paddingBottom: 24,
    },

    /* ── Row actions ─────────────────────────────────────────── */
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
      marginTop: 12,
    },

    /* Black border and black label on both; only the fill tells them apart. */
    editBtn: {
      height: 44,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.blue1Fill,
      borderWidth: 1,
      borderColor: C.frameBorder,
      borderRadius: 10,
    },

    deleteBtn: {
      height: 44,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(224,49,49,0.20)',
      borderWidth: 1,
      borderColor: C.frameBorder,
      borderRadius: 10,
    },

    actionText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13,
      lineHeight: 18,
      color: C.textText,
    },

    /* ── Cards ───────────────────────────────────────────────── */
    card: {
      backgroundColor: C.blue2Fill,
      borderWidth: 2,
      borderColor: C.borderBorder,
      borderRadius: 7,
      overflow: 'hidden',
    },

    cardGap: {
      marginTop: 14,
    },

    head: {
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 10,
    },

    headRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 10,
    },

    headTextBlack: {
      fontFamily: Fonts.bodyBold,
      fontSize: 14,
      lineHeight: 18,
      color: C.textText,
    },

    headTextGreen: {
      fontFamily: Fonts.bodyBold,
      fontSize: 14,
      lineHeight: 18,
      color: C.greenText,
    },

    headLine: {
      height: 1,
      backgroundColor: C.headLineFill,
    },

    /* ── Informacioni body ───────────────────────────────────── */
    bodyRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      paddingHorizontal: 10,
    },

    /* Labels and values share the left half; the score takes the right half. */
    infoHalf: {
      flex: 1,
      flexDirection: 'row',
    },

    /* Labels are all short, so the values get the larger share of the half. */
    labelsCol: {
      flex: 0.8,
    },

    /* Black rule dividing the sections — a margin keeps it off the letters. */
    vRule: {
      width: 1,
      marginVertical: 6,
      marginHorizontal: 8,
      backgroundColor: C.inkFill,
    },

    valuesCol: {
      flex: 1.5,
    },

    resultCol: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },

    /* Rows grow with their content instead of holding a fixed height. */
    cell: {
      minHeight: 34,
      justifyContent: 'center',
      paddingVertical: 6,
    },

    cellBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLineBorder,
    },

    cellLabel: {
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 14,
      color: C.hintText,
    },

    cellValue: {
      textAlign: 'right',
      fontFamily: Fonts.bodyBold,
      fontSize: 11,
      lineHeight: 14,
      color: C.textText,
    },

    resultScore: {
      fontFamily: Fonts.bodyBlack,
      fontSize: 34,
      lineHeight: 38,
      letterSpacing: -0.6,
      color: C.textText,
    },

    resultLabel: {
      fontFamily: Fonts.bodyBold,
      fontSize: 10.5,
      lineHeight: 14,
      marginTop: 1,
    },

    /* ── Statistikat table ───────────────────────────────────── */
    tblWrap: {
      paddingHorizontal: 8,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 30,
    },

    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLineBorder,
    },

    colName: {
      flex: 1,
    },

    colStat: {
      width: 36,
      textAlign: 'center',
    },

    colCard: {
      width: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },

    colNota: {
      width: 40,
      textAlign: 'center',
    },

    th: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 9.5,
      lineHeight: 12,
      color: C.grayText,
    },

    tdName: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.textText,
    },

    td: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.hintText,
    },

    cardSq: {
      width: 10,
      height: 10,
      borderRadius: 2,
    },

    noteRow: {
      alignItems: 'center',
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: C.rowLineBorder,
    },

    note: {
      textAlign: 'center',
      fontFamily: Fonts.body,
      fontSize: 10,
      lineHeight: 14,
      color: C.grayText,
    },

    /* ── Formacioni ──────────────────────────────────────────── */
    emptyPad: {
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 18,
    },

    emptyNote: {
      textAlign: 'center',
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 15,
      color: C.grayText,
    },

    sectionLabel: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12,
      lineHeight: 16,
      color: C.textText,
      paddingHorizontal: 10,
      paddingTop: 10,
    },

    squadGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      paddingHorizontal: 10,
      paddingTop: 8,
      paddingBottom: 12,
    },

    /* No fixed height — a two-line name grows the card, a short one shrinks it. */
    playerCard: {
      width: '31%',
      minHeight: 40,
      justifyContent: 'center',
      paddingHorizontal: 7,
      paddingVertical: 7,
      backgroundColor: C.cardGreenFill,
      borderWidth: 1,
      borderColor: C.frameBorder,
      borderRadius: 4,
    },

    playerName: {
      fontFamily: Fonts.bodyBold,
      fontSize: 11.5,
      lineHeight: 14,
      color: C.textText,
    },

    playerPosition: {
      fontFamily: Fonts.body,
      fontSize: 9,
      lineHeight: 12,
      marginTop: 1,
      color: C.textText,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
