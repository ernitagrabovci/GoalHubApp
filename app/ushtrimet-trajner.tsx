import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * Ushtrime — opened from "Ushtrime" on the trainer's Akademia page. The
 * drills, two to a row: each card reads top to bottom — title, what it is,
 * how long and what it works on, how many reps and when it was added — then
 * the two ways into it.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',

  frame: '#000000',
  headLine: 'rgba(30,40,35,0.10)',

  /* The title strip sits pale; the body below it takes the deeper wash. */
  blue1: '#E3EEFB',
  blue2: '#F6FBFF',
  blue: '#2F80ED',

  green20: 'rgba(21,148,71,0.20)',
  red: '#E03131',
};

type Drill = {
  id: string;
  title: string;
  summary: string;
  minutes: string;
  focus: string;
  reps: string;
  date: string;
};

const DRILLS: Drill[] = [
  {
    id: 'rondo',
    title: 'Rondo 5v2',
    summary: 'Ushtrim stërvitore për ekip',
    minutes: '15 min',
    focus: 'Pasim',
    reps: 'x4',
    date: '12 Aug 2026',
  },
  {
    id: 'presing',
    title: 'Presing 4-3',
    summary: 'Ushtrim stërvitore për ekip',
    minutes: '20 min',
    focus: 'Pasim',
    reps: 'x6',
    date: '10 Aug 2026',
  },
  {
    id: 'driblim',
    title: 'Driblim 1v1',
    summary: 'Ushtrim stërvitore për ekip',
    minutes: '12 min',
    focus: 'Driblim',
    reps: 'x5',
    date: '08 Aug 2026',
  },
  {
    id: 'gjuajtje',
    title: 'Gjuajtje në portë',
    summary: 'Ushtrim stërvitore për ekip',
    minutes: '18 min',
    focus: 'Gjuajtje',
    reps: 'x3',
    date: '05 Aug 2026',
  },
  {
    id: 'koordinim',
    title: 'Koordinim me shkallë',
    summary: 'Ushtrim stërvitore për ekip',
    minutes: '10 min',
    focus: 'Koordinim',
    reps: 'x4',
    date: '02 Aug 2026',
  },
  {
    id: 'ndertim',
    title: 'Ndërtim 4v4',
    summary: 'Ushtrim stërvitore për ekip',
    minutes: '22 min',
    focus: 'Ndërtim',
    reps: 'x2',
    date: '28 Kor 2026',
  },
];

export default function TrainerDrillsScreen() {
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
                  Ushtrime
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Krijo dhe menaxho ushtrime stërvitore
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
            {/* ── Stërvitje e re ─────────────────────────────────── */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Stërvitje e re"
              style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
            >
              <Text style={styles.addText} numberOfLines={1}>
                + Stërvitje e re
              </Text>
            </Pressable>

            {/* ── Ushtrimet ─────────────────────────────────────── */}
            <View style={styles.grid}>
              {DRILLS.map((d) => (
                <View key={d.id} style={styles.card}>
                  <View style={styles.cardHead}>
                    <Text
                      style={styles.cardTitle}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      {d.title}
                    </Text>
                  </View>
                  <View style={styles.headLine} />

                  <View style={styles.cardBody}>
                    <Text style={styles.summary} numberOfLines={1}>
                      {d.summary}
                    </Text>

                    {/* Left of every pair reads black; the right reads quiet. */}
                    <View style={styles.metaRow}>
                      <View style={styles.metaLeft}>
                        <MaterialCommunityIcons
                          name="clock-outline"
                          size={I(12)}
                          color={C.text}
                        />
                        <Text style={styles.metaLeftText} numberOfLines={1}>
                          {d.minutes}
                        </Text>
                      </View>
                      <Text style={styles.metaRight} numberOfLines={1}>
                        {d.focus}
                      </Text>
                    </View>

                    <View style={[styles.metaRow, styles.metaRowGap]}>
                      <View style={styles.metaLeft}>
                        <MaterialCommunityIcons name="reload" size={I(12)} color={C.text} />
                        <Text style={styles.metaLeftText} numberOfLines={1}>
                          {d.reps}
                        </Text>
                      </View>
                      <Text style={styles.metaRight} numberOfLines={1}>
                        {d.date}
                      </Text>
                    </View>

                    {/* Both buttons ride the card's right edge. */}
                    <View style={styles.actions}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Hap ${d.title}`}
                        style={({ pressed }) => [styles.actHap, pressed && styles.pressed]}
                      >
                        <Text style={styles.actHapText}>Hap</Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Fshi ${d.title}`}
                        style={({ pressed }) => [styles.actDel, pressed && styles.pressed]}
                      >
                        <Text style={styles.actDelText}>Fshi</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
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

    /* ── Stërvitje e re ──────────────────────────────────────── */
    /* Hugs its own label, pinned to the left rather than spanning the page. */
    addBtn: {
      alignSelf: 'flex-start',
      minHeight: 34,
      marginTop: 12,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      backgroundColor: C.green20,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    addText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12,
      color: C.text,
    },

    /* ── Ushtrimet grid ──────────────────────────────────────── */
    /* Two to a row, wrapping as deep as the list runs. */
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 14,
      columnGap: 10,
      rowGap: 10,
    },

    /* Hairline black frame; the head's wash runs into the body's. */
    card: {
      width: '48%',
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 7,
      overflow: 'hidden',
    },

    cardHead: {
      paddingHorizontal: 10,
      paddingTop: 9,
      paddingBottom: 8,
      backgroundColor: C.blue2,
    },

    cardTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 13,
      lineHeight: 17,
      color: C.text,
    },

    headLine: {
      height: 1,
      backgroundColor: C.headLine,
    },

    cardBody: {
      paddingHorizontal: 10,
      paddingTop: 8,
      paddingBottom: 9,
      backgroundColor: C.blue1,
    },

    summary: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 14,
      color: C.text,
    },

    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
    },

    metaRowGap: {
      marginTop: 5,
    },

    metaLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    metaLeftText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.text,
    },

    metaRight: {
      flexShrink: 1,
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.hint,
    },

    /* Both buttons ride the card's right edge, clear of the meta above. */
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 6,
      marginTop: 8,
    },

    actHap: {
      height: 24,
      paddingHorizontal: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.blue,
      borderRadius: 4,
    },

    actHapText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: C.blue,
    },

    actDel: {
      height: 24,
      paddingHorizontal: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.red,
      borderRadius: 4,
    },

    actDelText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: C.red,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
