import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { FilterSelect, type FilterOption } from '@/components/filters/filter-select';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import { listRatings } from '@/lib/api/ratings';
import { listTeams } from '@/lib/api/teams';
import type { ApiTeam, PlayerRatingRow } from '@/lib/api/types';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * Vlerësimi i trajnerit — opened from the "Vlerësimet" card on the players
 * page. One card per player, two per row: name and overall score up top, the
 * five category bars, then the verdict.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',
  hintSoft: '#E2E2E2',

  card: '#F6FBFF',
  border: 'rgba(100,140,190,0.30)',

  blueSoft: '#E3EEFB',

  green: '#159447',
  red: '#E03131',
};

const CATEGORIES = ['Teknika', 'Fiziku', 'Taktikat', 'Stabiliteti', 'Punë ekipore'];

type RatedPlayer = {
  id: number;
  name: string;
  team: string;
  nr: string;
  /* The card's overall score and the five category scores (0–10), from the API. */
  overall: number | null;
  scores: (number | null)[];
};

/** Coerces a possibly-string API number; null/empty stays null. */
const num = (value: number | string | null): number | null =>
  value === null || value === '' ? null : Number(value);

/** One `GET /ratings` row, laid onto the card's shape. */
const toRatedPlayer = (row: PlayerRatingRow): RatedPlayer => ({
  id: row.player_id,
  name: row.name ?? '—',
  team: row.team ?? '—',
  nr: row.jersey_number != null ? String(row.jersey_number) : '—',
  overall: num(row.average),
  scores: [
    num(row.technique),
    num(row.physical),
    num(row.tactics),
    num(row.consistency),
    num(row.teamwork),
  ],
});

/** Anything below seven is flagged red, everything else green. */
const tone = (score: number) => (score >= 7 ? C.green : C.red);

export default function CoachRatingsScreen() {
  const router = useRouter();
  const { token, signOut } = useSession();
  const [rows, setRows] = useState<PlayerRatingRow[]>([]);
  const [teams, setTeams] = useState<ApiTeam[]>([]);
  const [teamFilter, setTeamFilter] = useState('');

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    listRatings(
      token,
      { team_id: teamFilter ? Number(teamFilter) : undefined },
      controller.signal,
    )
      .then((res) => {
        if (controller.signal.aborted) return;
        setRows(res.data);
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
                  Vlerësimi i trajnerit
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Performanca individuale sipas kategorive
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
            {/* ── Team filter ───────────────────────────────────── */}
            <FilterSelect
              label="Filtro sipas ekipit"
              options={teamOptions}
              value={teamFilter}
              onChange={setTeamFilter}
              boxStyle={styles.teamBtn}
              textStyle={styles.teamBtnText}
            />

            {/* ── Rating cards ──────────────────────────────────── */}
            <View style={styles.grid}>
              {rows.map((row) => {
                const player = toRatedPlayer(row);
                const overall = player.overall ?? 0;
                const overallTone = player.overall != null ? tone(player.overall) : C.hint;

                return (
                  <View key={player.id} style={styles.card}>
                    <View style={styles.cardTop}>
                      <View style={styles.cardTopLeft}>
                        <Text style={styles.name} numberOfLines={1}>
                          {player.name}
                        </Text>
                        <Text style={styles.teamText} numberOfLines={1}>
                          {player.team} nr.{player.nr}
                        </Text>
                      </View>
                      <Text style={[styles.overall, { color: overallTone }]}>
                        {player.overall != null ? player.overall.toFixed(1) : '—'}
                      </Text>
                    </View>

                    <View style={styles.divider} />

                    {CATEGORIES.map((category, i) => {
                      const value = player.scores[i];
                      const valueTone = value != null ? tone(value) : C.hint;

                      return (
                        <View key={category} style={styles.catRow}>
                          <Text style={styles.catLabel} numberOfLines={1}>
                            {category}
                          </Text>
                          <View style={styles.barTrack}>
                            <View
                              style={[
                                styles.barFill,
                                {
                                  width: `${(value ?? 0) * 10}%`,
                                  backgroundColor: valueTone,
                                },
                              ]}
                            />
                          </View>
                          <Text style={[styles.catValue, { color: valueTone }]}>
                            {value != null ? value.toFixed(1) : '—'}
                          </Text>
                        </View>
                      );
                    })}

                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/player-profile',
                          params: {
                            id: String(player.id),
                            name: player.name,
                            team: player.team,
                            nr: player.nr,
                          },
                        })
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`Hap profilin e ${player.name}`}
                      style={({ pressed }) => [styles.verdict, pressed && styles.pressed]}
                    >
                      <Text style={styles.verdictText}>
                        {overall >= 7 ? 'Progres i mirë!' : 'Progres i keq'}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
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

    /* ── Team filter ─────────────────────────────────────────── */
    teamBtn: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      height: 36,
      paddingHorizontal: 12,
      backgroundColor: C.blueSoft,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
    },

    teamBtnText: {
      fontFamily: Fonts.body,
      fontSize: 12,
      color: C.text,
    },

    /* ── Rating cards ────────────────────────────────────────── */
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 14,
    },

    card: {
      width: '48%',
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 7,
      paddingHorizontal: 10,
      paddingTop: 9,
      paddingBottom: 10,
    },

    cardTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
    },

    cardTopLeft: {
      flex: 1,
    },

    name: {
      fontFamily: Fonts.bodyBold,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.text,
    },

    teamText: {
      fontFamily: Fonts.body,
      fontSize: 9.5,
      lineHeight: 13,
      color: C.hint,
      marginTop: 1,
    },

    overall: {
      fontFamily: Fonts.bodyBold,
      fontSize: 19,
      lineHeight: 23,
      letterSpacing: -0.4,
    },

    /* Pulled out to the card's edges so it reads as one long black rule. */
    divider: {
      height: 1,
      marginHorizontal: -10,
      backgroundColor: '#000000',
      marginTop: 7,
      marginBottom: 7,
    },

    /* ── Category bars ───────────────────────────────────────── */
    catRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 5,
    },

    catLabel: {
      width: 56,
      fontFamily: Fonts.body,
      fontSize: 9.5,
      lineHeight: 13,
      color: C.hint,
    },

    barTrack: {
      flex: 1,
      height: 4,
      borderRadius: 2,
      backgroundColor: C.hintSoft,
      overflow: 'hidden',
    },

    barFill: {
      height: 4,
      borderRadius: 2,
    },

    catValue: {
      width: 24,
      textAlign: 'right',
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10,
      lineHeight: 13,
    },

    /* ── Verdict ─────────────────────────────────────────────── */
    verdict: {
      height: 26,
      marginTop: 6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F5F5F5',
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
    },

    verdictText: {
      fontFamily: Fonts.body,
      fontSize: 10,
      color: C.hint,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
