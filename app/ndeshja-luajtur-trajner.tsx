import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import { getMatch } from '@/lib/api/matches';
import type { ApiMatch } from '@/lib/api/types';
import { positionLabel } from '@/lib/player-position';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * A played match, the trainer's own view — opened from "Shiko" on the results
 * table in ndeshjet-trajner. The fixture's facts, the players' statistics and
 * the starting eleven that was called up.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',

  /* blue1 = the deeper blue of the buttons and the body; blue2 = pale card. */
  blue1: '#E3EEFB',
  blue2: '#F6FBFF',

  border: 'rgba(100,140,190,0.30)',
  rowLine: 'rgba(100,140,190,0.22)',
  headLine: 'rgba(30,40,35,0.10)',

  /* The starting-eleven cards. */
  cardGreen: 'rgba(158,253,134,0.20)',
};

const INFO_LABELS = ['Kundershtari', 'Gara', 'Data', 'Vendodhja'];

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

type ColKey = 'goals' | 'assists' | 'minutes' | 'yellow' | 'red' | 'nota';

const COLS: { key: ColKey | 'name'; label: string; width: number }[] = [
  { key: 'name', label: 'Lojtari', width: 118 },
  { key: 'goals', label: '⚽ Gola', width: 58 },
  { key: 'assists', label: '🅰️ Asiste', width: 64 },
  { key: 'minutes', label: '⏱ Minuta', width: 62 },
  { key: 'yellow', label: '🟨 Karton', width: 62 },
  { key: 'red', label: '🟥 Karton', width: 62 },
  { key: 'nota', label: '⭐ Nota', width: 58 },
];

type StatRow = {
  name: string;
  goals: string;
  assists: string;
  minutes: string;
  yellow: string;
  red: string;
  nota: string;
};

const pad2 = (n: number) => String(n).padStart(2, '0');

/** An ISO timestamp as "18 Aug 2026, 15:30"; null or unparseable renders a dash. */
function whenLabel(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const mon = MONTHS[d.getMonth()];
  const month = mon.charAt(0).toUpperCase() + mon.slice(1).toLowerCase();
  return `${pad2(d.getDate())} ${month} ${d.getFullYear()}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export default function TrainerPlayedMatchScreen() {
  const router = useRouter();
  const { token, signOut } = useSession();

  const params = useLocalSearchParams<{
    id?: string;
    home?: string;
    away?: string;
    comp?: string;
    date?: string;
    time?: string;
  }>();

  const id = params.id ? Number(params.id) : null;

  const [match, setMatch] = useState<ApiMatch | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !id) return;
    const controller = new AbortController();

    getMatch(token, id, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setMatch(res.data);
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
            : 'Nuk mund të ngarkohet ndeshja.',
        );
      });

    return () => controller.abort();
  }, [token, id, router, signOut]);

  /* The fixture's side of the table, once the match is in hand. */
  const teamName = match?.team?.name ?? '';
  const opponent = match?.opponent ?? '';
  const isHome = match?.venue === 'home';

  const home = match ? (isHome ? teamName : opponent) : params.home ?? '';
  const away = match ? (isHome ? opponent : teamName) : params.away ?? '';
  const title = away ? `${home} - ${away}` : home;
  /* The rival is known only once the match is in hand; before that the params
     cannot say which side is the club's. */
  const rival = match ? opponent : '';

  const sched = match?.scheduled_at ? new Date(match.scheduled_at) : null;
  const validSched = sched && !Number.isNaN(sched.getTime()) ? sched : null;

  const values = [
    rival || '—',
    match?.competition || params.comp || '—',
    validSched ? whenLabel(match?.scheduled_at ?? null) : params.date ?? '—',
    isHome ? 'Shtëpi' : 'Musafir',
  ];

  const statRows: StatRow[] = (match?.player_stats ?? []).map((s) => ({
    name: s.player_name ?? '—',
    goals: String(s.goals ?? 0),
    assists: String(s.assists ?? 0),
    minutes: s.minutes_played == null ? '—' : String(s.minutes_played),
    yellow: String(s.yellow_cards ?? 0),
    red: String(s.red_cards ?? 0),
    nota: s.rating == null ? '—' : Number(s.rating).toFixed(1),
  }));

  const starters = (match?.lineup ?? []).filter((l) => l.type === 'starter');

  /* The same shape of params the fixtures table hands to the other pages. */
  const fixture = {
    ...(params.id ? { id: params.id } : {}),
    home,
    away,
    day: validSched ? pad2(validSched.getDate()) : params.date?.split('/')[0] ?? '',
    mon: validSched ? MONTHS[validSched.getMonth()] : '',
    time: validSched ? `${pad2(validSched.getHours())}:${pad2(validSched.getMinutes())}` : params.time ?? '',
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
                <MaterialCommunityIcons name="chevron-left" size={I(24)} color={C.text} />
              </Pressable>
              <View style={styles.headerText}>
                <Text
                  style={styles.title}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {title || '—'}
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
            {/* One action only: the result is corrected, never deleted. */}
            <View style={styles.actions}>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/fut-rezultatin',
                    params: { ...(params.id ? { id: params.id } : {}), home, away },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel="Edito rezultatin"
                style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
              >
                <Text style={styles.actionText}>Edito rezultatin</Text>
              </Pressable>
            </View>

            {/* ── Informacioni ──────────────────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.head}>
                <Text style={styles.headTextBlack}>Informacioni</Text>
              </View>
              <View style={styles.headLine} />

              {/* Labels lead into their values; no rules between the pairs, and
                  the deeper body holds them as one block. */}
              <View style={styles.infoBody}>
                {INFO_LABELS.map((label, i) => (
                  <View key={label} style={styles.cellRow}>
                    <Text style={styles.cellLabel} numberOfLines={1}>
                      {label}
                    </Text>
                    <Text
                      style={styles.cellValue}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      {values[i]}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* ── Statistikat e lojtarëve ───────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.head}>
                <Text style={styles.headTextBlack}>Statistikat e lojtarëve</Text>
              </View>
              <View style={styles.headLine} />

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={[styles.tblInner, styles.tblFill]}
              >
                {/* One wrapper that takes the card's full width, so the header
                    rule and every row rule reach the far edge. */}
                <View style={styles.tblFill}>
                  <View style={[styles.tr, styles.thRow]}>
                    {COLS.map((c) => (
                      <Text key={c.key} style={[styles.th, { width: c.width }]} numberOfLines={1}>
                        {c.label}
                      </Text>
                    ))}
                  </View>

                  {statRows.map((row, i) => (
                    <View key={row.name} style={[styles.tr, i > 0 && styles.trBorder]}>
                      {COLS.map((c) =>
                        c.key === 'name' ? (
                          <Text
                            key={c.key}
                            style={[styles.tdName, { width: c.width }]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.8}
                          >
                            {row.name}
                          </Text>
                        ) : (
                          <Text
                            key={c.key}
                            style={[styles.td, { width: c.width }]}
                            numberOfLines={1}
                          >
                            {row[c.key]}
                          </Text>
                        ),
                      )}
                    </View>
                  ))}

                  {statRows.length === 0 ? (
                    <View style={styles.tr}>
                      <Text style={styles.empty} numberOfLines={2}>
                        {error ?? (match ? 'Nuk ka statistika.' : '…')}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </ScrollView>
            </View>

            {/* ── Edito formacionin ─────────────────────────────── */}
            <View style={styles.actions}>
              <Pressable
                onPress={() => router.push({ pathname: '/cakto-formacion', params: fixture })}
                accessibilityRole="button"
                accessibilityLabel="Edito formacionin"
                style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
              >
                <Text style={styles.actionText}>Edito formacionin</Text>
              </Pressable>
            </View>

            {/* ── Formacioni ────────────────────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.head}>
                <Text style={styles.headTextBlack}>Formacioni</Text>
              </View>
              <View style={styles.headLine} />

              <Text style={styles.sectionLabel}>{`Startuesit (${starters.length})`}</Text>

              <View style={styles.squadGrid}>
                {starters.map((s) => (
                  <View key={s.player_id} style={styles.playerCard}>
                    <Text style={styles.playerName} numberOfLines={2}>
                      {s.player_name ?? '—'}
                    </Text>
                    <Text style={styles.playerPosition}>{positionLabel(s.position)}</Text>
                  </View>
                ))}

                {starters.length === 0 ? (
                  <Text style={styles.empty} numberOfLines={2}>
                    {error ?? (match ? 'Nuk ka formacion.' : '…')}
                  </Text>
                ) : null}
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

    /* A blue wash under a black rim and label. */
    editBtn: {
      height: 30,
      paddingHorizontal: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.blue1,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
    },

    actionText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      color: '#000000',
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
      paddingHorizontal: 10,
      paddingVertical: 10,
    },

    headTextBlack: {
      fontFamily: Fonts.bodyBold,
      fontSize: 14,
      lineHeight: 18,
      color: C.text,
    },

    headLine: {
      height: 1,
      backgroundColor: C.headLine,
    },

    /* ── Informacioni rows ───────────────────────────────────── */
    /* A step deeper than the title strip above it, with no rules inside. */
    infoBody: {
      backgroundColor: C.blue1,
    },

    cellRow: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 34,
      paddingHorizontal: 10,
      gap: 6,
    },

    cellLabel: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 14,
      color: C.hint,
    },

    cellValue: {
      flex: 1,
      textAlign: 'right',
      fontFamily: Fonts.bodyBold,
      fontSize: 11,
      lineHeight: 14,
      color: C.text,
    },

    /* ── Statistikat table ───────────────────────────────────── */
    tblInner: {
      paddingHorizontal: 8,
      paddingBottom: 6,
    },

    /* Stretches the rows to the card's width, so the rules run the full width
       instead of stopping where the last column ends. */
    tblFill: {
      flexGrow: 1,
    },

    thRow: {
      paddingTop: 9,
      paddingBottom: 7,
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 2,
      minHeight: 44,
    },

    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    th: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10,
      lineHeight: 13,
      color: C.hint,
    },

    tdName: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11,
      lineHeight: 14,
      color: C.text,
    },

    td: {
      textAlign: 'center',
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 14,
      color: C.text,
    },

    /* The load error / empty-list line, spanning the table. */
    empty: {
      flex: 1,
      paddingVertical: 10,
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 15,
      color: C.hint,
    },

    /* ── Formacioni ──────────────────────────────────────────── */
    sectionLabel: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12,
      lineHeight: 16,
      color: C.text,
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
      backgroundColor: C.cardGreen,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
    },

    playerName: {
      fontFamily: Fonts.bodyBold,
      fontSize: 11.5,
      lineHeight: 14,
      color: '#000000',
    },

    playerPosition: {
      fontFamily: Fonts.body,
      fontSize: 9,
      lineHeight: 12,
      marginTop: 1,
      color: '#000000',
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
