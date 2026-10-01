import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * Ndeshjet — the player's view of the season's matches, opened from the
 * "Ndeshjet" card on the player home.
 *
 * Read-only, so it is just the results: the season's played matches in one
 * table, each with a button through to the match itself.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',

  frame: '#000000',
  border: 'rgba(100,140,190,0.30)',
  rowLine: 'rgba(100,140,190,0.22)',
  headLine: 'rgba(30,40,35,0.10)',

  /* The pale blue the table sits on. */
  blue2: '#F6FBFF',

  green: '#159447',
  orange: '#E4A000',

  /* The row button and the pager's squares share this one blue. */
  blue: '#86BCFD',
};

const COMP = 'Superliga e Kosovës';

type Played = {
  date: string;
  /* The fixture, home side first. */
  fixture: string;
  time: string;
  venue: 'Shtëpi' | 'Musafir';
  /* Read from our side of the pitch: "2 - 1" is two for us. */
  score: string;
  comp: string;
};

const PLAYED: Played[] = [
  { date: '18/08/2026', fixture: 'KF Trepca - FC Prishtina', time: '16:00', venue: 'Musafir', score: '2 - 1', comp: COMP },
  { date: '11/08/2026', fixture: 'FC Prishtina - FC Drita', time: '18:00', venue: 'Shtëpi', score: '0 - 1', comp: COMP },
  { date: '04/08/2026', fixture: 'FC Prishtina - KF Gjilani', time: '15:30', venue: 'Shtëpi', score: '1 - 1', comp: COMP },
  { date: '28/07/2026', fixture: 'KF Llapi - FC Prishtina', time: '17:00', venue: 'Musafir', score: '0 - 2', comp: COMP },
  { date: '21/07/2026', fixture: 'FC Prishtina - KF Ballkani', time: '19:00', venue: 'Shtëpi', score: '3 - 1', comp: COMP },
  { date: '14/07/2026', fixture: 'KF Feronikeli - FC Prishtina', time: '17:00', venue: 'Musafir', score: '0 - 3', comp: COMP },
];

const COLS: { key: keyof Played; label: string; width: number }[] = [
  { key: 'fixture', label: 'Ndeshja', width: 150 },
  { key: 'date', label: 'Data', width: 84 },
  { key: 'venue', label: 'Vendndodhja', width: 84 },
  { key: 'score', label: 'Rezultati', width: 62 },
];

/* Just wide enough for the row's one button. */
const ACTION_W = 56;

const PAGES = ['1', '2', '3', '4'];

export default function PlayerMatchesScreen() {
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
                <Text
                  style={styles.title}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  Ndeshjet e ekipit
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
            {/* ── Ndeshjet e luajtura ───────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText} numberOfLines={1}>
                  Ndeshjet e luajtura
                </Text>
              </View>

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
                    {/* Keeps the header rule exactly as wide as the rows below. */}
                    <View style={{ width: ACTION_W }} />
                  </View>

                  {PLAYED.map((p) => (
                    <View key={`${p.date}-${p.fixture}`} style={[styles.tr, styles.trBorder]}>
                      <Text
                        style={[styles.td, styles.tdFixture, { width: COLS[0].width }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                      >
                        {p.fixture}
                      </Text>
                      <Text style={[styles.td, { width: COLS[1].width }]} numberOfLines={1}>
                        {p.date}
                      </Text>
                      <Text
                        style={[
                          styles.td,
                          styles.tdStrong,
                          { color: p.venue === 'Shtëpi' ? C.green : C.orange },
                          { width: COLS[2].width },
                        ]}
                        numberOfLines={1}
                      >
                        {p.venue}
                      </Text>
                      <Text
                        style={[styles.td, styles.tdStrong, { width: COLS[3].width }]}
                        numberOfLines={1}
                      >
                        {p.score}
                      </Text>

                      <View style={[styles.actions, { width: ACTION_W }]}>
                        <Pressable
                          onPress={() => {
                            const [home, away] = p.fixture.split(' - ');
                            router.push({
                              pathname: '/ndeshja-luajtur-lojtarit',
                              params: {
                                home,
                                away,
                                venue: p.venue,
                                comp: p.comp,
                                date: p.date,
                                time: p.time,
                                score: p.score,
                              },
                            });
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Shiko ndeshjen e ${p.date}`}
                          style={({ pressed }) => [styles.actShiko, pressed && styles.pressed]}
                        >
                          <Text style={styles.actShikoText}>Shiko</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* ── Pager ─────────────────────────────────────────── */}
            <View style={styles.pager}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Faqja e mëparshme"
                hitSlop={8}
                style={({ pressed }) => [styles.pagerArrow, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons name="chevron-left" size={I(22)} color={C.text} />
              </Pressable>

              {PAGES.map((p) => (
                <Pressable
                  key={p}
                  accessibilityRole="button"
                  accessibilityLabel={`Faqja ${p}`}
                  style={({ pressed }) => [styles.pageSq, pressed && styles.pressed]}
                >
                  <Text style={styles.pageSqText}>{p}</Text>
                </Pressable>
              ))}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Faqja tjetër"
                hitSlop={8}
                style={({ pressed }) => [styles.pagerArrow, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons name="chevron-right" size={I(22)} color={C.text} />
              </Pressable>
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

    /* ── Ndeshjet e luajtura ─────────────────────────────────── */
    card: {
      marginTop: 14,
      backgroundColor: C.blue2,
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

    tdFixture: {
      fontFamily: Fonts.bodySemiBold,
      color: C.text,
    },

    tdStrong: {
      fontFamily: Fonts.bodyBold,
    },

    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },

    /* Filled blue, white letters — the row's one action. */
    actShiko: {
      height: 24,
      paddingHorizontal: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.blue,
      borderRadius: 4,
    },

    actShikoText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: '#FFFFFF',
    },

    /* ── Pager ───────────────────────────────────────────────── */
    pager: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 6,
      marginTop: 12,
    },

    pagerArrow: {
      alignItems: 'center',
      justifyContent: 'center',
    },

    pageSq: {
      width: 34,
      height: 34,
      borderRadius: 5,
      backgroundColor: C.blue,
      alignItems: 'center',
      justifyContent: 'center',
    },

    pageSqText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 14,
      color: '#FFFFFF',
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
