import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import { getTeam } from '@/lib/api/teams';
import type { ApiTeamDetail } from '@/lib/api/types';
import { statusLabel } from '@/lib/player-status';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * Ekipa — opened from a team card's "Ekipa" button on "Lista e ekipeve",
 * carrying the team id in the URL.
 *
 * Same light #FAFBFA canvas. Two blue cards inside a thin green frame (the
 * squad summary + the season record, their black dividers level with each
 * other), then the Lojtarët table, whose rows scroll when the squad is longer
 * than the space below the cards.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',

  card: '#F6FBFF',
  border: 'rgba(100,140,190,0.30)',
  thBg: '#E7F1F8',
  rowLine: 'rgba(100,140,190,0.22)',
  headLine: 'rgba(30,40,35,0.10)',

  green: '#159447',
  greenLine: '#7DCB9E',
  red: '#E03131',
  blue: '#1749B8',
};

type Col = { key: string; label: string; width: number };

const COLS: Col[] = [
  { key: 'name', label: 'Emri', width: 106 },
  { key: 'nr', label: 'Nr.', width: 42 },
  { key: 'pos', label: 'Pozicioni', width: 94 },
  { key: 'status', label: 'Statusi', width: 84 },
];

function errorText(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return 'Nuk mund të lidhemi me serverin. Kontrollo lidhjen.';
    return error.message;
  }
  return 'Diçka shkoi keq. Provo përsëri.';
}

export default function EkipaScreen() {
  const router = useRouter();
  const { token, signOut } = useSession();
  const params = useLocalSearchParams<{ id?: string }>();
  const teamId = params.id ? Number(params.id) : NaN;

  const [team, setTeam] = useState<ApiTeamDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  // An abort is indistinguishable from a timeout (both surface as status 0),
  // so guard on our own signal rather than the error.
  useEffect(() => {
    if (!token || !Number.isFinite(teamId)) return;
    const controller = new AbortController();

    getTeam(token, teamId, controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) setTeam(res.data);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          signOut();
          router.replace('/login');
          return;
        }
        setError(errorText(err));
      });

    return () => controller.abort();
  }, [token, teamId, router, signOut]);

  const loadError = error ?? (Number.isFinite(teamId) ? null : 'Ekipi nuk u gjet.');
  const rosterCount = team ? String(team.players.length) : '—';
  const record = team?.season_record;

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
                <Text style={styles.title}>{team?.name ?? '—'}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={[styles.colPad, styles.bodyCol]}>
            {/* ── Squad card + season record ───────────────────── */}
            <View style={styles.frame}>
              <View style={styles.cardHalf}>
                <View style={styles.cardHeadBlock}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {team?.name ?? '—'}
                  </Text>
                  <Text style={styles.cardSub}>{team?.season ?? '—'}</Text>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.kvRow}>
                  <Text style={styles.kvLabel}>Trajneri</Text>
                  <Text style={styles.kvValue} numberOfLines={1}>
                    {team?.trainer?.name ?? '—'}
                  </Text>
                </View>
                <View style={styles.kvRow}>
                  <Text style={styles.kvLabel}>Lojtarët</Text>
                  <Text style={styles.kvValue}>{rosterCount}</Text>
                </View>
              </View>

              <View style={styles.cardHalf}>
                <View style={styles.cardHeadBlock}>
                  <View style={styles.miniRow}>
                    <View style={styles.miniCol}>
                      <Text style={[styles.miniNum, { color: C.text }]}>
                        {record ? String(record.played) : '—'}
                      </Text>
                      <Text style={styles.miniSub}>Ndeshje</Text>
                    </View>
                    <View style={styles.miniCol}>
                      <Text style={[styles.miniNum, { color: C.green }]}>
                        {record ? String(record.wins) : '—'}
                      </Text>
                      <Text style={styles.miniSub}>Fitore</Text>
                    </View>
                    <View style={styles.miniCol}>
                      <Text style={[styles.miniNum, { color: C.blue }]}>
                        {record ? String(record.goals_for) : '—'}
                      </Text>
                      <Text style={styles.miniSub}>Gola +</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.miniRow}>
                  <View style={styles.miniCol}>
                    <Text style={[styles.miniNum, { color: C.red }]}>
                      {record ? String(record.losses) : '—'}
                    </Text>
                    <Text style={styles.miniSub}>Humbje</Text>
                  </View>
                  <View style={styles.miniCol}>
                    <Text style={[styles.miniNum, { color: C.text }]}>
                      {record ? String(record.draws) : '—'}
                    </Text>
                    <Text style={styles.miniSub}>Barazim</Text>
                  </View>
                  <View style={styles.miniCol}>
                    <Text style={[styles.miniNum, { color: C.red }]}>
                      {record ? String(record.goals_against) : '—'}
                    </Text>
                    <Text style={styles.miniSub}>Gola -</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ── Lojtarët table ───────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Lojtarët ({rosterCount})</Text>
              </View>

              <View style={styles.tblWrap}>
                <View style={styles.tr}>
                  {COLS.map((c, i) => (
                    <Text
                      key={c.key}
                      style={[
                        styles.th,
                        i === 0 && styles.thFirst,
                        i === COLS.length - 1 && styles.thLast,
                        { width: c.width },
                      ]}
                    >
                      {c.label}
                    </Text>
                  ))}
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.rowsContent}
                >
                  {loadError ? (
                    <View style={styles.stateRow}>
                      <Text style={styles.stateText}>{loadError}</Text>
                    </View>
                  ) : team === null ? (
                    <View style={styles.stateRow}>
                      <ActivityIndicator color={C.blue} />
                    </View>
                  ) : team.players.length === 0 ? (
                    <View style={styles.stateRow}>
                      <Text style={styles.stateText}>Nuk ka lojtarë.</Text>
                    </View>
                  ) : (
                    team.players.map((p) => (
                      <View key={p.id} style={[styles.tr, styles.trBorder]}>
                        <Text
                          style={[styles.td, styles.thFirst, { width: COLS[0].width }]}
                          numberOfLines={1}
                        >
                          {p.name ?? '—'}
                        </Text>
                        <Text style={[styles.td, { width: COLS[1].width }]}>
                          {p.jersey_number != null ? String(p.jersey_number) : '—'}
                        </Text>
                        <Text
                          style={[styles.td, { width: COLS[2].width }]}
                          numberOfLines={1}
                        >
                          {p.position ?? '—'}
                        </Text>
                        <Text
                          style={[styles.td, styles.thLast, { width: COLS[3].width }]}
                          numberOfLines={1}
                        >
                          {statusLabel(p.health_status)}
                        </Text>
                      </View>
                    ))
                  )}
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
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

    /* Page body — fills the screen, so the page never scrolls vertically. */
    body: {
      flex: 1,
      minHeight: 0,
    },

    bodyCol: {
      flex: 1,
      minHeight: 0,
    },

    /* ── Thin green frame around the two blue cards ──────────── */
    frame: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
      borderWidth: 1,
      borderColor: C.greenLine,
      borderRadius: 8,
      padding: 8,
    },

    cardHalf: {
      flex: 1,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingTop: 8,
      paddingBottom: 8,
    },

    /* Fixed height so both cards' black dividers stay level. */
    cardHeadBlock: {
      minHeight: 38,
    },

    cardTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 15,
      lineHeight: 18,
      letterSpacing: -0.3,
      color: C.text,
    },

    cardSub: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.gray,
      marginTop: 1,
    },

    /* Full card width — both cards are equal width, so the two dividers
       line up with each other. */
    cardDivider: {
      width: '100%',
      height: 1,
      backgroundColor: '#000000',
      marginTop: 6,
      marginBottom: 6,
    },

    kvRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
      marginBottom: 3,
    },

    kvLabel: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.gray,
    },

    kvValue: {
      flexShrink: 1,
      fontFamily: Fonts.bodyBold,
      fontSize: 12.5,
      lineHeight: 15,
      color: C.text,
      textAlign: 'right',
    },

    /* ── Mini stat columns ───────────────────────────────────── */
    miniRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
    },

    miniCol: {
      flex: 1,
      alignItems: 'center',
    },

    miniNum: {
      fontFamily: Fonts.bodyBold,
      fontSize: 15,
      lineHeight: 18,
    },

    miniSub: {
      fontFamily: Fonts.body,
      fontSize: 9.5,
      lineHeight: 12,
      color: C.gray,
      marginTop: 1,
    },

    /* ── Lojtarët table ──────────────────────────────────────── */
    card: {
      flex: 1,
      minHeight: 0,
      marginTop: 14,
      backgroundColor: C.card,
      borderWidth: 2,
      borderColor: C.border,
      borderRadius: 7,
      overflow: 'hidden',
    },

    cardHead: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
    },

    cardHeadText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 16,
      lineHeight: 20,
      color: C.text,
    },

    /* Rows area — the scroll view fills it, so a long squad scrolls. */
    tblWrap: {
      flex: 1,
      minHeight: 0,
    },

    rowsContent: {
      flexGrow: 1,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 36,
    },

    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    th: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      lineHeight: 14,
      color: C.gray,
      textAlign: 'center',
    },

    td: {
      fontFamily: Fonts.body,
      fontSize: 11.5,
      lineHeight: 14,
      color: C.text,
      textAlign: 'center',
    },

    /* "Emri" sits at the start of the row, a little off the table's edge. */
    thFirst: {
      paddingLeft: 12,
      textAlign: 'left',
    },

    /* "Statusi" is pushed to the far right of the row. */
    thLast: {
      paddingRight: 12,
      textAlign: 'right',
    },

    /* Loading / empty / error placeholder inside the rows area. */
    stateRow: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 24,
    },

    stateText: {
      fontFamily: Fonts.body,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.gray,
      textAlign: 'center',
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
