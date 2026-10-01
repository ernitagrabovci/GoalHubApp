import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * Stërvitja — one session in full, opened from the "Shiko" button on a row of
 * the player's training list.
 *
 * The trainer's session page without the editing affordances: a player reads
 * the session, they don't change it. The session's facts as a two-by-two grid,
 * then the attendance card, which stays a note until the trainer settles it.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',

  frame: '#000000',
  headLine: 'rgba(30,40,35,0.10)',

  /* The table ground is the palest blue. */
  card: '#F6FBFF',
};

export default function PlayerTrainingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const params = useLocalSearchParams<{
    date?: string;
    time?: string;
    field?: string;
    type?: string;
    duration?: string;
  }>();

  /* The session's own facts come from the list row they were opened on. */
  const date = params.date ?? '18 Aug 2026';
  const time = params.time ?? '17:00';
  const field = params.field ?? 'Salla e Brendshme';
  const type = params.type ?? 'Taktike';
  const duration = params.duration ?? '90 min';

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
                <Text
                  style={styles.title}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {`Stërvitja - ${date}`}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {`${time} • ${field} • ${type}`}
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
            {/* ── Session details ──────────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  Detajet e stërvitjes
                </Text>
              </View>

              <View style={styles.tblInner}>
                <View style={[styles.tr, styles.detailRow]}>
                  <View style={styles.detailCell}>
                    <Text style={styles.detailLabel} numberOfLines={1}>
                      Lloji
                    </Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {type}
                    </Text>
                  </View>
                  <View style={styles.detailCell}>
                    <Text style={styles.detailLabel} numberOfLines={1}>
                      Data
                    </Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {`${date}, ${time}`}
                    </Text>
                  </View>
                </View>

                <View style={[styles.tr, styles.detailRow]}>
                  <View style={styles.detailCell}>
                    <Text style={styles.detailLabel} numberOfLines={1}>
                      Kohëzgjatja
                    </Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {duration}
                    </Text>
                  </View>
                  <View style={styles.detailCell}>
                    <Text style={styles.detailLabel} numberOfLines={1}>
                      Fusha
                    </Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {field}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ── Attendance ───────────────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  Prezenca ime
                </Text>
              </View>

              <View style={styles.noteBody}>
                <Text style={styles.noteText}>Pa finalizuar nga trajneri</Text>
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

    /* ── Cards ───────────────────────────────────────────────── */
    card: {
      marginTop: 14,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 5,
      overflow: 'hidden',
    },

    /* The title is ruled off from the rows below it, like the other tables. */
    cardHead: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 10,
      paddingTop: 10,
      paddingBottom: 9,
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
    },

    cardTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.text,
      textAlign: 'center',
    },

    /* ── Session details ─────────────────────────────────────── */
    tblInner: {
      paddingHorizontal: 10,
      paddingBottom: 10,
    },

    /* Two label/value cells on a row, shorter than the table's own rows. */
    detailRow: {
      gap: 10,
      paddingVertical: 5,
      minHeight: 0,
    },

    /* Label and value sit on one line, with the value held a little off the
       label so the pair reads as two columns rather than one phrase. */
    detailCell: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 12,
    },

    detailLabel: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.hint,
    },

    detailValue: {
      flexShrink: 1,
      fontFamily: Fonts.bodyBold,
      fontSize: 11.5,
      lineHeight: 16,
      color: C.text,
    },

    /* ── Attendance ──────────────────────────────────────────── */
    noteBody: {
      paddingHorizontal: 10,
      paddingVertical: 12,
    },

    noteText: {
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 15,
      color: C.hint,
      textAlign: 'center',
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 44,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
