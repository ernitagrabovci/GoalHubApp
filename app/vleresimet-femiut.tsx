import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * Vlerësimet — the child's ratings, opened from the "Vlerësimet" card on the
 * child's page.
 *
 * Read-only for a parent: one row per rated session, a score in each of the
 * five categories and the row's average down the end. Seven columns are wider
 * than the screen, so the table scrolls sideways.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',

  /* The card's pale blue wash and its blue rim. */
  blue2: '#F6FBFF',
  border: 'rgba(100,140,190,0.30)',
  rowLine: 'rgba(100,140,190,0.22)',
  headLine: 'rgba(30,40,35,0.10)',
};

type Scores = {
  date: string;
  taktike: number;
  fizike: number;
  teknike: number;
  vazhdimi: number;
  ekip: number;
};

const SESSIONS: Scores[] = [
  { date: '12/08/2026', taktike: 8.0, fizike: 7.5, teknike: 8.2, vazhdimi: 7.8, ekip: 8.4 },
  { date: '09/08/2026', taktike: 7.2, fizike: 6.8, teknike: 7.6, vazhdimi: 7.1, ekip: 7.9 },
  { date: '07/08/2026', taktike: 8.4, fizike: 8.1, teknike: 8.6, vazhdimi: 8.2, ekip: 8.8 },
  { date: '05/08/2026', taktike: 7.6, fizike: 7.2, teknike: 7.9, vazhdimi: 7.4, ekip: 8.0 },
  { date: '01/08/2026', taktike: 6.9, fizike: 6.4, teknike: 7.2, vazhdimi: 6.8, ekip: 7.5 },
  { date: '30/07/2026', taktike: 7.8, fizike: 7.6, teknike: 8.0, vazhdimi: 7.7, ekip: 8.2 },
];

/* The row's own average, so the last column can never drift from the scores. */
const ROWS = SESSIONS.map((s) => ({
  ...s,
  mesatare: (s.taktike + s.fizike + s.teknike + s.vazhdimi + s.ekip) / 5,
}));

type Row = (typeof ROWS)[number];

const COLS: { key: keyof Row; label: string; width: number; strong?: boolean }[] = [
  { key: 'date', label: 'Data', width: 80, strong: true },
  { key: 'taktike', label: 'Taktike', width: 58 },
  { key: 'fizike', label: 'Fizike', width: 54 },
  { key: 'teknike', label: 'Teknike', width: 58 },
  { key: 'vazhdimi', label: 'Vazhdimi', width: 68 },
  { key: 'ekip', label: 'Ekip', width: 50 },
  { key: 'mesatare', label: 'Mesatare', width: 68, strong: true },
];

/* Every score reads one decimal place, so the columns stay flush. */
const cell = (value: string | number) =>
  typeof value === 'number' ? value.toFixed(1) : value;

export default function ChildRatingsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const params = useLocalSearchParams<{ name?: string }>();
  const name = params.name ?? 'Agon Gashi';

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
                  {`Vlerësimet e ${name}`}
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
            {/* ── Vlerësimet sipas stërvitjes ───────────────────── */}
            <View style={styles.card}>
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

                  {ROWS.map((row) => (
                    <View key={row.date} style={[styles.tr, styles.trBorder]}>
                      {COLS.map((c) => (
                        <Text
                          key={c.key}
                          style={[
                            styles.td,
                            c.strong && styles.tdStrong,
                            { width: c.width },
                          ]}
                          numberOfLines={1}
                        >
                          {cell(row[c.key])}
                        </Text>
                      ))}
                    </View>
                  ))}
                </View>
              </ScrollView>
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

    scroll: {
      paddingBottom: 24,
    },

    /* ── Table ───────────────────────────────────────────────── */
    card: {
      marginTop: 14,
      backgroundColor: C.blue2,
      borderWidth: 2,
      borderColor: C.border,
      borderRadius: 7,
      overflow: 'hidden',
    },

    tblInner: {
      paddingHorizontal: 8,
      paddingBottom: 6,
    },

    /* Stretches the rows to the card's width, so the rules run the full width
       instead of stopping where the last column ends. */
    tblFill: {
      flexGrow: 1,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 2,
      minHeight: 42,
    },

    thRow: {
      paddingTop: 9,
      paddingBottom: 7,
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
    },

    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    th: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 9,
      lineHeight: 12,
      color: C.gray,
      textAlign: 'center',
    },

    td: {
      fontFamily: Fonts.body,
      fontSize: 9.5,
      lineHeight: 12,
      color: C.gray,
      textAlign: 'center',
    },

    tdStrong: {
      fontFamily: Fonts.bodyBold,
      color: C.text,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
