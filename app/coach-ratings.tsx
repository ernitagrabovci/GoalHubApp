import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

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
  name: string;
  team: string;
  nr: string;
  scores: [number, number, number, number, number];
};

/* Scores are 0–10; seven and up reads as progress, below that as a problem. */
const PLAYERS: RatedPlayer[] = [
  { name: 'Ardit Lapashtica', team: 'Ekipi i Parë', nr: '9', scores: [8.7, 8.2, 8.5, 7.9, 8.8] },
  { name: 'Narti Cerkini', team: 'Ekipi i Parë', nr: '1', scores: [7.9, 8.4, 7.2, 8.6, 8.1] },
  { name: 'Blerim Krasniqi', team: 'U21', nr: '10', scores: [8.2, 6.4, 7.8, 7.1, 8.4] },
  { name: 'Endrit Gashi', team: 'U21', nr: '7', scores: [6.9, 8.8, 7.4, 7.6, 8.2] },
  { name: 'Leart Berisha', team: 'U17', nr: '4', scores: [7.4, 7.8, 8.9, 8.3, 7.7] },
  { name: 'Riad Hoxha', team: 'U17', nr: '11', scores: [5.8, 6.2, 6.9, 5.4, 7.1] },
  { name: 'Arbnor Zeka', team: 'U15', nr: '6', scores: [7.1, 6.8, 7.9, 8.0, 7.5] },
  { name: 'Dion Nimani', team: 'U15', nr: '3', scores: [8.5, 8.1, 7.6, 8.4, 8.9] },
  { name: 'Yll Demaku', team: 'U13', nr: '8', scores: [6.4, 5.9, 6.7, 6.2, 7.3] },
  { name: 'Arion Selimi', team: 'U13', nr: '2', scores: [7.8, 7.5, 8.1, 7.9, 8.0] },
];

/** Anything below seven is flagged red, everything else green. */
const tone = (score: number) => (score >= 7 ? C.green : C.red);
const average = (scores: number[]) => scores.reduce((a, b) => a + b, 0) / scores.length;

export default function CoachRatingsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.canvas}>
        {/* Faint vertical canvas texture — decorative only */}
        <View pointerEvents="none" style={styles.lines}>
          {Array.from({ length: lineCount }).map((_, index) => (
            <View key={index} style={[styles.line, { left: index * 9 }]} />
          ))}
        </View>

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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Filtro sipas ekipit"
              style={({ pressed }) => [styles.teamBtn, pressed && styles.pressed]}
            >
              <Text style={styles.teamBtnText}>Të gjitha ekipet</Text>
              <MaterialCommunityIcons name="chevron-down" size={I(15)} color={C.text} />
            </Pressable>

            {/* ── Rating cards ──────────────────────────────────── */}
            <View style={styles.grid}>
              {PLAYERS.map((player) => {
                const overall = average(player.scores);

                return (
                  <View key={player.name} style={styles.card}>
                    <View style={styles.cardTop}>
                      <View style={styles.cardTopLeft}>
                        <Text style={styles.name} numberOfLines={1}>
                          {player.name}
                        </Text>
                        <Text style={styles.teamText} numberOfLines={1}>
                          {player.team} nr.{player.nr}
                        </Text>
                      </View>
                      <Text style={[styles.overall, { color: tone(overall) }]}>
                        {overall.toFixed(1)}
                      </Text>
                    </View>

                    <View style={styles.divider} />

                    {CATEGORIES.map((category, i) => {
                      const value = player.scores[i];

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
                                  width: `${value * 10}%`,
                                  backgroundColor: tone(value),
                                },
                              ]}
                            />
                          </View>
                          <Text style={[styles.catValue, { color: tone(value) }]}>
                            {value.toFixed(1)}
                          </Text>
                        </View>
                      );
                    })}

                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/player-profile',
                          params: { name: player.name, team: player.team, nr: player.nr },
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
      backgroundColor: C.page,
    },

    canvas: {
      flex: 1,
      backgroundColor: C.page,
    },

    lines: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 0,
    },

    line: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 1,
      backgroundColor: C.line,
    },

    colPad: {
      alignSelf: 'center',
      width: '100%',
      paddingHorizontal: 27,
    },

    /* Pinned header */
    header: {
      backgroundColor: C.page,
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
      backgroundColor: '#FFFFFF',
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
