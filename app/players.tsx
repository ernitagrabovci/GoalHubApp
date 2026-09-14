import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * Lojtarët — opened from the "Lojtarët" card on the admin dashboard.
 *
 * Four orange-outlined summary squares, the "Lojtari i ri" action, the
 * "Të gjithë lojtarët" table (filters + 10 rows, both scrollable sideways)
 * with its pager, then the Statistikat / Vlerësimet cards.
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

  blueBtn: '#86BCFD',
  blueSoft: '#E3EEFB',

  ghost: '#9E9E9E',
  ghostLine: '#D6D6D6',
};

const IMG = {
  trajnimet: require('@/assets/dashboard/trajnimet.png'),
  ndeshjet: require('@/assets/dashboard/ndeshjet.png'),
};

type SummarySquare = {
  label: string;
  value: string;
  hint: string;
  tone?: string;
};

const SUMMARY: SummarySquare[] = [
  { label: 'Lojtarë gjithsej', value: '85', hint: 'kategori aktive' },
  { label: 'Lojtarët aktiv', value: '77', hint: 'gati për lojë' },
  { label: 'Lojtarët e lënduar', value: '4', hint: '+ në rehab', tone: C.red },
  { label: 'Lojtarët e pezulluar', value: '4', hint: 'nga loja', tone: C.orange },
];

const FILTERS = ['Të gjitha ekipet', 'Të gjitha pozicionet', 'Të gjitha statuset', 'Të gjitha llogaritë'];

type Col = { key: string; label: string; width: number; align?: 'left' | 'center' | 'right' };

const COLS: Col[] = [
  { key: 'nr', label: 'Nr.', width: 34 },
  { key: 'name', label: 'Emri', width: 110, align: 'left' },
  { key: 'pos', label: 'Pozicioni', width: 82 },
  { key: 'team', label: 'Ekipi', width: 78 },
  { key: 'status', label: 'Statusi', width: 74 },
  { key: 'contract', label: 'Kontr. skadon', width: 92 },
];

const ACTIONS_W = 96;
const ROWS = 10;
const PAGES = [1, 2, 3, 4];

export default function PlayersScreen() {
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
                <Text style={styles.title}>Lojtarët</Text>
                <Text style={styles.subtitle}>85 lojtarë gjithsej</Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.scroll}
        >
          {/* ── Summary squares ─────────────────────────────────── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.summaryRow}
          >
            {SUMMARY.map((s) => (
              <View key={s.label} style={styles.sq}>
                <Text style={styles.sqLabel} numberOfLines={2}>
                  {s.label}
                </Text>
                <Text style={[styles.sqValue, s.tone ? { color: s.tone } : null]}>{s.value}</Text>
                <Text style={[styles.sqHint, s.tone ? { color: s.tone } : null]} numberOfLines={1}>
                  {s.hint}
                </Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.colPad}>
            {/* ── Lojtari i ri ──────────────────────────────────── */}
            <Pressable
              onPress={() => router.push('/register-player')}
              accessibilityRole="button"
              accessibilityLabel="Shto lojtar të ri"
              style={({ pressed }) => [styles.newPlayer, pressed && styles.pressed]}
            >
              <View style={styles.newPlayerPlus}>
                <MaterialCommunityIcons name="plus" size={I(15)} color="#FFFFFF" />
              </View>
              <Text style={styles.newPlayerText}>Lojtari i ri</Text>
            </Pressable>

            {/* ── Të gjithë lojtarët ────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Të gjithë lojtarët</Text>
              </View>

              {/* Filters — scroll sideways to reach the later ones */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={styles.filterRow}
              >
                <TextInput
                  style={styles.searchBox}
                  placeholder="Shkruaj emrin"
                  placeholderTextColor={C.ghost}
                />
                {FILTERS.map((f) => (
                  <Pressable
                    key={f}
                    accessibilityRole="button"
                    accessibilityLabel={`Filtro: ${f}`}
                    style={({ pressed }) => [styles.filterBox, pressed && styles.pressed]}
                  >
                    <Text style={styles.filterText}>{f}</Text>
                    <MaterialCommunityIcons name="chevron-down" size={I(14)} color={C.gray} />
                  </Pressable>
                ))}
              </ScrollView>

              {/* Table — scroll sideways to reach the row actions */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={styles.tblInner}
              >
                <View>
                  <View style={[styles.tr, styles.thRow]}>
                    {COLS.map((c) => (
                      <Text
                        key={c.key}
                        style={[styles.th, c.align ? { textAlign: c.align } : null, { width: c.width }]}
                      >
                        {c.label}
                      </Text>
                    ))}
                    <View style={{ width: ACTIONS_W }} />
                  </View>

                  {Array.from({ length: ROWS }).map((_, i) => (
                    <View key={i} style={[styles.tr, styles.trBorder]}>
                      {COLS.map((c) => (
                        <View key={c.key} style={{ width: c.width }} />
                      ))}
                      <View style={[styles.rowActions, { width: ACTIONS_W }]}>
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Shto"
                          style={({ pressed }) => [styles.rowBtn, pressed && styles.pressed]}
                        >
                          <Text style={styles.rowBtnText}>Shto</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => router.push('/edit-player')}
                          accessibilityRole="button"
                          accessibilityLabel="Edito"
                          style={({ pressed }) => [styles.rowBtn, pressed && styles.pressed]}
                        >
                          <Text style={styles.rowBtnText}>Edito</Text>
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

            {/* ── Statistikat / Vlerësimet ──────────────────────── */}
            <View style={styles.twoCol}>
              <Pressable
                onPress={() => router.push('/player-statistics')}
                accessibilityRole="button"
                accessibilityLabel="Statistikat"
                style={({ pressed }) => [styles.promo, styles.promoStats, pressed && styles.pressed]}
              >
                <Text style={styles.promoTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                  Statistikat
                </Text>
                <Image source={IMG.trajnimet} style={styles.promoImgStats} resizeMode="contain" />
                <View style={[styles.promoBtn, { backgroundColor: '#78B8F5' }]}>
                  <Text style={styles.promoBtnText}>Vazhdo</Text>
                </View>
              </Pressable>

              <Pressable
                onPress={() => router.push('/coach-ratings')}
                accessibilityRole="button"
                accessibilityLabel="Vlerësimet"
                style={({ pressed }) => [styles.promo, styles.promoRatings, pressed && styles.pressed]}
              >
                <Text style={styles.promoTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
                  Vlerësimet
                </Text>
                <Image source={IMG.ndeshjet} style={styles.promoImgRatings} resizeMode="contain" />
                <View style={[styles.promoBtn, { backgroundColor: '#D99A4A' }]}>
                  <Text style={styles.promoBtnText}>Vazhdo</Text>
                </View>
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

    /* ── Summary squares ─────────────────────────────────────── */
    summaryRow: {
      paddingLeft: 27,
      paddingRight: 27,
      paddingTop: 4,
      gap: 8,
    },

    sq: {
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
    sqLabel: {
      minHeight: 30,
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      lineHeight: 15,
      color: C.gray,
    },

    sqValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 26,
      lineHeight: 32,
      letterSpacing: -0.5,
      color: C.text,
      marginTop: 4,
    },

    sqHint: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.gray,
      marginTop: 4,
    },

    /* ── Lojtari i ri ────────────────────────────────────────── */
    newPlayer: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 14,
      height: 36,
      paddingLeft: 5,
      paddingRight: 14,
      backgroundColor: C.blueSoft,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
    },

    newPlayerPlus: {
      width: 25,
      height: 25,
      borderRadius: 13,
      backgroundColor: C.blueBtn,
      alignItems: 'center',
      justifyContent: 'center',
    },

    newPlayerText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12.5,
      color: '#000000',
    },

    /* ── Të gjithë lojtarët card ─────────────────────────────── */
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

    /* ── Filters ─────────────────────────────────────────────── */
    filterRow: {
      paddingHorizontal: 8,
      paddingTop: 10,
      paddingBottom: 10,
      gap: 6,
    },

    searchBox: {
      width: 128,
      height: 32,
      borderWidth: 1,
      borderColor: C.ghostLine,
      borderRadius: 4,
      paddingHorizontal: 9,
      fontFamily: Fonts.body,
      fontSize: 12,
      color: C.text,
    },

    filterBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 32,
      paddingHorizontal: 9,
      borderWidth: 1,
      borderColor: C.ghostLine,
      borderRadius: 4,
    },

    filterText: {
      fontFamily: Fonts.body,
      fontSize: 12,
      color: C.gray,
    },

    /* ── Table ───────────────────────────────────────────────── */
    tblInner: {
      paddingHorizontal: 8,
      paddingBottom: 8,
    },

    thRow: {
      borderTopWidth: 1,
      borderTopColor: C.headLine,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 36,
    },

    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    th: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13,
      lineHeight: 16,
      color: C.gray,
      textAlign: 'center',
    },

    rowActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 6,
    },

    rowBtn: {
      height: 24,
      paddingHorizontal: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.ghostLine,
      borderRadius: 4,
    },

    rowBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: C.ghost,
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
      backgroundColor: C.blueBtn,
      alignItems: 'center',
      justifyContent: 'center',
    },

    pageSqText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 14,
      color: '#FFFFFF',
    },

    /* ── Statistikat / Vlerësimet ────────────────────────────── */
    twoCol: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 16,
    },

    promo: {
      width: '48%',
      height: 100,
      position: 'relative',
      borderRadius: 9,
      borderWidth: 1,
      overflow: 'hidden',
    },

    promoStats: {
      backgroundColor: '#E8F3FF',
      borderColor: '#C6E0FA',
    },

    promoRatings: {
      backgroundColor: '#F8EBD8',
      borderColor: '#F0D9AE',
    },

    promoTitle: {
      position: 'absolute',
      top: 16,
      left: 10,
      right: 10,
      fontFamily: Fonts.bodyBlack,
      fontSize: 22,
      lineHeight: 22,
      letterSpacing: 0.5,
      color: C.text,
      zIndex: 3,
    },

    promoImgStats: {
      position: 'absolute',
      width: 120,
      height: 120,
      left: -55,
      bottom: -5,
      zIndex: 1,
    },

    promoImgRatings: {
      position: 'absolute',
      width: 100,
      height: 100,
      left: -35,
      bottom: -45,
      zIndex: 1,
    },

    promoBtn: {
      position: 'absolute',
      right: 8,
      bottom: 7,
      minWidth: 66,
      height: 28,
      borderRadius: 5,
      paddingHorizontal: 9,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 5,
    },

    promoBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11,
      lineHeight: 14,
      color: '#FFFFFF',
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
