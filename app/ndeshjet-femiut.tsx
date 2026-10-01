import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * Ndeshjet — the child's season, opened from the "Ndeshjet" card on the
 * child's page.
 *
 * Read-only for a parent: the matches already played, each with the day, the
 * ground and the result. Four columns are wider than the screen, so the table
 * scrolls sideways.
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

  green: '#159447',
  orange: '#E4A000',
};

type Match = {
  fixture: string;
  date: string;
  venue: 'Shtëpi' | 'Musafir';
  /* Read from our side of the pitch: "2 - 1" is two for us. */
  score: string;
};

const MATCHES: Match[] = [
  { fixture: 'KF Trepca - FC Prishtina', date: '18/08/2026', venue: 'Musafir', score: '2 - 1' },
  { fixture: 'FC Prishtina - FC Drita', date: '11/08/2026', venue: 'Shtëpi', score: '0 - 1' },
  { fixture: 'FC Prishtina - KF Gjilani', date: '04/08/2026', venue: 'Shtëpi', score: '1 - 1' },
  { fixture: 'KF Llapi - FC Prishtina', date: '28/07/2026', venue: 'Musafir', score: '0 - 2' },
  { fixture: 'FC Prishtina - KF Ballkani', date: '21/07/2026', venue: 'Shtëpi', score: '3 - 1' },
  { fixture: 'KF Feronikeli - FC Prishtina', date: '14/07/2026', venue: 'Musafir', score: '0 - 3' },
];

const COLS: { key: keyof Match; label: string; width: number; strong?: boolean }[] = [
  { key: 'fixture', label: 'Ndeshja', width: 150, strong: true },
  { key: 'date', label: 'Data', width: 84 },
  { key: 'venue', label: 'Vendndodhja', width: 84, strong: true },
  { key: 'score', label: 'Rezultati', width: 62, strong: true },
];

/* Home games read green, away games orange. */
const venueColor = (venue: Match['venue']) => (venue === 'Shtëpi' ? C.green : C.orange);

export default function ChildMatchesScreen() {
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
                  {`Ndeshjet e ${name}`}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Orari dhe rezultatet e sezonit
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
            {/* ── Ndeshjet e sezonit ────────────────────────────── */}
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

                  {MATCHES.map((m) => (
                    <View key={`${m.date}-${m.fixture}`} style={[styles.tr, styles.trBorder]}>
                      {COLS.map((c) => (
                        <Text
                          key={c.key}
                          style={[
                            styles.td,
                            c.strong && styles.tdStrong,
                            c.key === 'venue' && { color: venueColor(m.venue) },
                            { width: c.width },
                          ]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          {m[c.key]}
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
