import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';
import { TEAMS } from '@/lib/teams';

/**
 * Ekipa — opened from a team card's "Ekipa" button on "Lista e ekipeve".
 *
 * Same light #FAFBFA canvas. Two blue cards inside a thin green frame (the
 * squad summary + the season record, their black dividers level with each
 * other), then the players table, whose blank rows fill the page bottom —
 * the page itself never scrolls.
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

export default function EkipaScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);
  const params = useLocalSearchParams<{ name?: string }>();
  const team = TEAMS.find((t) => t.name === params.name) ?? TEAMS[0];

  // The rows area measures itself so the blank rows can fill it exactly.
  const [tableH, setTableH] = useState(0);
  const rowH = I(36);
  const emptyRows = Math.max(2, Math.floor(tableH / rowH) - 1);

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
                <Text style={styles.title}>{team.name}</Text>
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
                    {team.name}
                  </Text>
                  <Text style={styles.cardSub}>{team.season}</Text>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.kvRow}>
                  <Text style={styles.kvLabel}>Trajneri</Text>
                  <Text style={styles.kvValue} numberOfLines={1}>
                    {team.coach}
                  </Text>
                </View>
                <View style={styles.kvRow}>
                  <Text style={styles.kvLabel}>Lojtarët</Text>
                  <Text style={styles.kvValue}>{team.players}</Text>
                </View>
              </View>

              <View style={styles.cardHalf}>
                <View style={styles.cardHeadBlock}>
                  <View style={styles.miniRow}>
                    <View style={styles.miniCol}>
                      <Text style={[styles.miniNum, { color: C.text }]}>{team.matches}</Text>
                      <Text style={styles.miniSub}>Ndeshje</Text>
                    </View>
                    <View style={styles.miniCol}>
                      <Text style={[styles.miniNum, { color: C.green }]}>{team.win}</Text>
                      <Text style={styles.miniSub}>Fitore</Text>
                    </View>
                    <View style={styles.miniCol}>
                      <Text style={[styles.miniNum, { color: C.blue }]}>{team.goalsPlus}</Text>
                      <Text style={styles.miniSub}>Gola +</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.cardDivider} />

                <View style={styles.miniRow}>
                  <View style={styles.miniCol}>
                    <Text style={[styles.miniNum, { color: C.red }]}>{team.loss}</Text>
                    <Text style={styles.miniSub}>Humbje</Text>
                  </View>
                  <View style={styles.miniCol}>
                    <Text style={[styles.miniNum, { color: C.text }]}>{team.draw}</Text>
                    <Text style={styles.miniSub}>Barazim</Text>
                  </View>
                  <View style={styles.miniCol}>
                    <Text style={[styles.miniNum, { color: C.red }]}>{team.goalsMinus}</Text>
                    <Text style={styles.miniSub}>Gola -</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ── Lojtarët table ───────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Lojtarët ({team.players})</Text>
              </View>

              <View
                style={styles.tblWrap}
                onLayout={(e) => setTableH(e.nativeEvent.layout.height)}
              >
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

                {Array.from({ length: emptyRows }).map((_, i) => (
                  <View key={i} style={[styles.tr, styles.trBorder]} />
                ))}
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

    /* Rows area — measured so the blank rows can fill it exactly. */
    tblWrap: {
      flex: 1,
      minHeight: 0,
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

    pressed: {
      opacity: 0.5,
    },
  }),
);
