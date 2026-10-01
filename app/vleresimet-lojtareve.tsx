import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * Vlerësimet e lojtarëve — the trainer's ratings screen, opened from the
 * "Vlerësimet e lojtarëve" card on the squad list.
 *
 * A copy of the administrator's `coach-ratings` screen: the three team totals
 * sit above the cards, and each card ends in a "Vlerëso" action instead of the
 * verdict line. Keep the two files in step when either side changes.
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
  orange: '#E4A000',

  green: '#159447',
  red: '#E03131',
};

/**
 * The squares sit on a near-white page, so a white frost on its own reads as
 * nothing. Shading the pane instead — a very light grey at the top edge
 * sweeping down to white — is what gives the surface its glassy shape.
 */
const SQ_GLASS = [
  'rgba(180,188,201,0.30)',
  'rgba(216,222,231,0.15)',
  'rgba(255,255,255,0.80)',
] as const;

/** Thin specular rim on the top edge — reads as the thickness of the pane. */
const SQ_SHEEN = ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.00)'] as const;

/* ── Team totals ───────────────────────────────────────────────────── */

type Square = { label: string; value: string; tone: string };

const SUMMARY: Square[] = [
  { label: 'Mesatarja e ekipit', value: '7.4', tone: C.green },
  { label: 'Të vlerësuar', value: '24', tone: C.text },
  { label: 'Pa vlerësim', value: '1', tone: C.text },
];

/** A square of the summary row — frosted, then glossed. */
function SummarySquare({ square }: { square: Square }) {
  return (
    <View style={styles.sqShadow}>
      <View style={styles.sq}>
        {/* Frost the canvas grid, then lay the grey shading and a top sheen
            over it — the three together read as a pane of glass. */}
        <BlurView pointerEvents="none" intensity={50} tint="light" style={StyleSheet.absoluteFill} />
        <LinearGradient
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          colors={SQ_GLASS}
          locations={[0, 0.5, 1]}
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
          <Text style={styles.sqLabel} numberOfLines={2}>
            {square.label}
          </Text>
          <Text
            style={[styles.sqValue, { color: square.tone }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            {square.value}
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ── Rating cards ──────────────────────────────────────────────────── */

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

export default function PlayerRatingsScreen() {
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
                  Vlerësimet e lojtarëve
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Ekipi i parë · 25 lojtarë
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
            {/* ── Team totals ───────────────────────────────────── */}
            <View style={styles.summaryRow}>
              {SUMMARY.map((s) => (
                <SummarySquare key={s.label} square={s} />
              ))}
            </View>

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

                    {/* The bars are the only part on the deeper blue. */}
                    <View style={styles.cardBody}>
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
                    </View>

                    {/* The administrator's page closes each card with a verdict
                        line; the trainer grades the player instead. */}
                    <View style={styles.footRow}>
                      <Text style={styles.footText} numberOfLines={1}>
                        E përditsuar
                      </Text>
                      <Pressable
                        onPress={() =>
                          router.push({ pathname: '/vlereso-lojtarin', params: { name: player.name } })
                        }
                        accessibilityRole="button"
                        accessibilityLabel={`Vlerëso ${player.name}`}
                        style={({ pressed }) => [styles.rateBtn, pressed && styles.pressed]}
                      >
                        <Text style={styles.rateBtnText}>Vlerëso</Text>
                      </Pressable>
                    </View>
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

    /* ── Team totals ─────────────────────────────────────────── */
    /* Three squares spread across the full width rather than a fixed-width
       strip that would need scrolling. */
    summaryRow: {
      flexDirection: 'row',
      paddingTop: 8,
      gap: 8,
    },

    /* Translucent so the frosted pane inside has a backdrop to blur. */
    sqShadow: {
      flex: 1,
      height: 100,
      borderRadius: 8,
      backgroundColor: 'rgba(255,255,255,0.5)',
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

    sqLabel: {
      minHeight: 30,
      fontFamily: Fonts.bodyBold,
      fontSize: 12,
      lineHeight: 15,
      color: C.gray,
    },

    sqValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 25,
      lineHeight: 30,
      letterSpacing: -0.5,
      marginTop: 3,
    },

    /* ── Rating cards ────────────────────────────────────────── */
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12,
    },

    /* Pale shell — the head and the grade row sit on it, and the bars band is
       painted over the middle. Padding lives on the three bands so each can
       carry its own ground. */
    card: {
      width: '48%',
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 7,
      overflow: 'hidden',
    },

    cardTop: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
      paddingHorizontal: 10,
      paddingTop: 9,
      paddingBottom: 9,
    },

    /* On the seam, so the black rule is the head's bottom edge. */
    divider: {
      height: 1,
      backgroundColor: '#000000',
    },

    cardBody: {
      backgroundColor: C.blueSoft,
      paddingHorizontal: 10,
      paddingTop: 9,
      paddingBottom: 4,
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

    /* ── Grade action ────────────────────────────────────────── */
    /* Continues the body's blue to the card's bottom edge; the button is the
       one pale element sitting on it. */
    footRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      paddingHorizontal: 10,
      paddingTop: 8,
      paddingBottom: 10,
      backgroundColor: C.blueSoft,
    },

    footText: {
      flexShrink: 1,
      fontFamily: Fonts.body,
      fontSize: 10,
      lineHeight: 13,
      color: C.hint,
    },

    rateBtn: {
      height: 26,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
    },

    rateBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: C.text,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
