import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * Statistikat e lojtarëve — opened from the "Statistikat" card on the players
 * page. Four orange-framed stat rectangles, the team filter, the
 * "Statistikat individuale" table and its pager.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',

  card: '#F6FBFF',
  border: 'rgba(100,140,190,0.30)',
  rowLine: 'rgba(100,140,190,0.22)',
  headLine: 'rgba(30,40,35,0.10)',

  orange: '#E4A000',
  red: '#E03131',
  green: '#159447',
  blue: '#1749B8',
  blueSoft: '#E3EEFB',
};

type StatRect = { label: string; value: string; hint: string; tone?: string };

const STATS: StatRect[] = [
  { label: 'Lojtarë gjithsej', value: '85', hint: 'me statistika' },
  { label: 'Gola total', value: '177', hint: 'sezoni aktual', tone: C.green },
  { label: 'Asiste total', value: '176', hint: 'sezoni aktual', tone: C.blue },
  { label: 'Minuta total', value: '35,049', hint: 'luajtura', tone: C.orange },
];

type Col = { key: string; label: string; width: number; color?: string; align?: 'left' | 'center' };

const COLS: Col[] = [
  { key: 'player', label: 'Lojtari', width: 56, align: 'left' },
  { key: 'team', label: 'Ekipi', width: 46 },
  { key: 'nd', label: 'ND', width: 29 },
  { key: 'min', label: 'Min', width: 37 },
  { key: 'goals', label: 'Gola', width: 42, color: C.green },
  { key: 'assists', label: 'Asiste', width: 50 },
  { key: 'kv', label: 'KV', width: 28, color: C.orange },
  { key: 'kk', label: 'KK', width: 28, color: C.red },
];

const ROWS = 10;
const PAGES = [1, 2, 3, 4];

export default function PlayerStatisticsScreen() {
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
                  Statistikat e lojtarëve
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Performanca individuale e sezonit
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
          {/* ── Stat rectangles ─────────────────────────────────── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.rectRow}
          >
            {STATS.map((s) => (
              <View key={s.label} style={styles.rect}>
                <Text style={styles.rectLabel} numberOfLines={2}>
                  {s.label}
                </Text>
                <Text
                  style={[styles.rectValue, s.tone ? { color: s.tone } : null]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.5}
                >
                  {s.value}
                </Text>
                <Text style={[styles.rectHint, s.tone ? { color: s.tone } : null]} numberOfLines={1}>
                  {s.hint}
                </Text>
              </View>
            ))}
          </ScrollView>

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

            {/* ── Statistikat individuale ───────────────────────── */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Statistikat individuale</Text>
              </View>

              <View style={styles.tblWrap}>
                <View style={styles.tr}>
                  {COLS.map((c) => (
                    <Text
                      key={c.key}
                      style={[
                        styles.th,
                        c.align ? { textAlign: c.align } : null,
                        c.color ? { color: c.color } : null,
                        { width: c.width },
                      ]}
                    >
                      {c.label}
                    </Text>
                  ))}
                </View>

                {Array.from({ length: ROWS }).map((_, i) => (
                  <View key={i} style={[styles.tr, styles.trBorder]}>
                    {COLS.map((c) => (
                      <View key={c.key} style={{ width: c.width }} />
                    ))}
                  </View>
                ))}
              </View>
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

    /* ── Stat rectangles ─────────────────────────────────────── */
    rectRow: {
      paddingLeft: 27,
      paddingRight: 27,
      paddingTop: 4,
      gap: 8,
    },

    rect: {
      width: 100,
      height: 122,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: C.orange,
      borderRadius: 8,
      padding: 11,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 5,
      elevation: 1,
    },

    /* Fixed two-line block so all four values sit on the same line. */
    rectLabel: {
      minHeight: 30,
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      lineHeight: 15,
      color: C.gray,
    },

    rectValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 26,
      lineHeight: 32,
      letterSpacing: -0.5,
      color: C.text,
      marginTop: 4,
    },

    rectHint: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.gray,
      marginTop: 4,
    },

    /* ── Team filter ─────────────────────────────────────────── */
    /* Same shape as the "Lojtari i ri" button, with a dropdown on the end. */
    teamBtn: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      height: 36,
      marginTop: 14,
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

    /* ── Statistikat individuale ─────────────────────────────── */
    card: {
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

    /* All eight columns fit — this table never scrolls sideways. */
    tblWrap: {
      paddingHorizontal: 8,
      paddingBottom: 8,
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
      fontSize: 10.5,
      lineHeight: 13,
      color: C.gray,
      textAlign: 'center',
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
      backgroundColor: '#86BCFD',
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
