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
 * Raporti i ndeshjeve — opened from "Vazhdo" on the Raportet e ndeshjeve card
 * over on the Raportet page.
 *
 * Four headline squares, the two filters, the season's fixtures with their
 * pager, then the competition breakdown and the seasonal summary box.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',
  ghost: '#A8A8A8',

  cardBg: '#E3EEFB',
  headBg: '#F6FBFF',
  frame: '#000000',
  headLine: 'rgba(30,40,35,0.10)',
  rowLine: 'rgba(100,140,190,0.22)',

  blueSoft: '#E3EEFB',
  blueBtn: '#86BCFD',
  green: '#159447',
  orange: '#E4A000',
  red: '#E03131',

  /* Unfilled part of every progress rail. */
  track: 'rgba(0,0,0,0.10)',
};

/* ── Headline squares ──────────────────────────────────────────────── */

/** Gloss sweep laid over the frosted squares — bright corner, pale middle. */
const SQ_GLOSS = [
  'rgba(255,255,255,0.78)',
  'rgba(255,255,255,0.16)',
  'rgba(255,255,255,0.46)',
] as const;

const SUMMARY = [
  { label: 'Ndeshje gjithsej', value: '41', hint: 'të luajtura', tone: C.text },
  { label: 'Fitore gjithsej', value: '18', hint: '44%', tone: C.green },
  { label: 'Gola të shënuara', value: '83', hint: '2.0/ndeshje', tone: C.green },
  { label: 'Gola të pësuara', value: '74', hint: '1.8/ndeshje', tone: C.text },
];

/* ── Fixtures ──────────────────────────────────────────────────────── */

type Outcome = 'Fitore' | 'Barazim' | 'Humbje';

const OUTCOME_TONE: Record<Outcome, string> = {
  Fitore: C.green,
  Barazim: C.orange,
  Humbje: C.red,
};

type Match = {
  fixture: string;
  comp: string;
  rez: string;
  plus: number;
  minus: number;
  status: Outcome;
};

const MATCHES: Match[] = [
  { fixture: 'Malisheva - Ulpiana', comp: 'Superliga e Kosovës', rez: '3-1', plus: 3, minus: 1, status: 'Fitore' },
  { fixture: 'Ulpiana - Feronikeli', comp: 'Superliga e Kosovës', rez: '1-1', plus: 1, minus: 1, status: 'Barazim' },
  { fixture: 'Drita - Ulpiana', comp: 'Superliga e Kosovës', rez: '2-0', plus: 0, minus: 2, status: 'Humbje' },
  { fixture: 'Ulpiana - Prishtina', comp: 'Kupa e Kosovës', rez: '4-2', plus: 4, minus: 2, status: 'Fitore' },
  { fixture: 'Ballkani - Ulpiana', comp: 'Superliga e Kosovës', rez: '1-2', plus: 2, minus: 1, status: 'Fitore' },
  { fixture: 'Ulpiana - Gjilani', comp: 'Superliga e Kosovës', rez: '0-0', plus: 0, minus: 0, status: 'Barazim' },
  { fixture: 'Trepça - Ulpiana', comp: 'Superliga e Kosovës', rez: '3-1', plus: 1, minus: 3, status: 'Humbje' },
  { fixture: 'Ulpiana - Llapi', comp: 'Kupa e Kosovës', rez: '2-1', plus: 2, minus: 1, status: 'Fitore' },
];

/** Match / competition / score / scored / conceded / outcome. */
const COLS = [
  { key: 'match', label: 'Ndeshja', flex: 1.9 },
  { key: 'comp', label: 'Kompeticion', flex: 1.5 },
  { key: 'rez', label: 'Rez', flex: 0.8 },
  { key: 'plus', label: '+', flex: 0.5 },
  { key: 'minus', label: '-', flex: 0.5 },
  { key: 'status', label: 'Statusi', flex: 1.1 },
] as const;

const PAGES = [1, 2, 3, 4];

/* ── Results by competition ────────────────────────────────────────── */

type Comp = { name: string; played: number; win: number; draw: number; loss: number };

const COMPS: Comp[] = [
  { name: 'Superliga e Kosovës', played: 31, win: 14, draw: 4, loss: 13 },
  { name: 'Kupa e Kosovës', played: 10, win: 4, draw: 3, loss: 3 },
];

const LEGEND: { label: string; color: string }[] = [
  { label: 'Fitore', color: C.green },
  { label: 'Barazim', color: C.orange },
  { label: 'Humbje', color: C.red },
];

/* ── Seasonal summary ──────────────────────────────────────────────── */

const SEASON: { label: string; value: string; tone: string }[] = [
  { label: 'Fitore', value: '18(44%)', tone: C.green },
  { label: 'Barazim', value: '7(17%)', tone: C.orange },
  { label: 'Humbje', value: '16(39%)', tone: C.red },
];

export default function MatchReportScreen() {
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
                <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                  Raportet e ndeshjeve
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Rezultatet dhe statistikat e sezonit
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
          {/* ── Headline squares — fixed size like the team list, so the row
              runs past the right edge and scrolls ─────────────────────── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.summaryRow}
          >
            {SUMMARY.map((s) => (
              <View key={s.label} style={styles.sqShadow}>
                <View style={styles.sq}>
                  {/* Frost the canvas grid, then lay a gloss sweep over it. */}
                  <BlurView
                    pointerEvents="none"
                    intensity={22}
                    tint="light"
                    style={StyleSheet.absoluteFill}
                  />
                  <LinearGradient
                    pointerEvents="none"
                    style={StyleSheet.absoluteFill}
                    colors={SQ_GLOSS}
                    locations={[0, 0.55, 1]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />

                  <View style={styles.sqBody}>
                    <Text style={styles.sqLabel} numberOfLines={2}>
                      {s.label}
                    </Text>
                    <Text
                      style={[styles.sqValue, { color: s.tone }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.5}
                    >
                      {s.value}
                    </Text>
                    <Text style={[styles.sqHint, { color: s.tone }]} numberOfLines={2}>
                      {s.hint}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.colPad}>
            {/* ── Filters ───────────────────────────────────────── */}
            <View style={styles.filterRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Filtro: Të gjitha ekipet"
                style={({ pressed }) => [styles.filterBox, pressed && styles.pressed]}
              >
                <Text style={styles.filterText} numberOfLines={1}>
                  Të gjitha ekipet
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={I(14)} color={C.text} />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Filtro: Të gjitha rezultatet"
                style={({ pressed }) => [styles.filterBox, pressed && styles.pressed]}
              >
                <Text style={styles.filterText} numberOfLines={1}>
                  Të gjitha rezultatet
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={I(14)} color={C.text} />
              </Pressable>
            </View>

            {/* ── Fixtures ──────────────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.head}>
                <Text style={styles.headText} numberOfLines={1}>
                  Raporti i ndeshjeve
                </Text>
              </View>
              <View style={styles.headLine} />

              <View style={styles.tblInner}>
                <View style={[styles.tr, styles.thRow]}>
                  {COLS.map((c) => (
                    <Text key={c.key} style={[styles.th, { flex: c.flex }]} numberOfLines={1}>
                      {c.label}
                    </Text>
                  ))}
                </View>

                {MATCHES.map((m) => (
                  <View key={m.fixture} style={[styles.tr, styles.trBorder]}>
                    <Text
                      style={[styles.td, styles.tdMatch, { flex: 1.9 }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.75}
                    >
                      {m.fixture}
                    </Text>
                    <Text
                      style={[styles.td, { flex: 1.5 }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      {m.comp}
                    </Text>
                    <Text style={[styles.td, { flex: 0.8 }]}>{m.rez}</Text>
                    <Text style={[styles.td, styles.tdPlus, { flex: 0.5 }]}>{m.plus}</Text>
                    <Text style={[styles.td, styles.tdMinus, { flex: 0.5 }]}>{m.minus}</Text>
                    <Text
                      style={[styles.td, { flex: 1.1, color: OUTCOME_TONE[m.status] }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      {m.status}
                    </Text>
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

            {/* ── Results by competition ────────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.head}>
                <Text style={styles.headText} numberOfLines={1}>
                  Rezultatet sipas kompeticionit
                </Text>
              </View>
              <View style={styles.headLine} />

              <View style={styles.body}>
                {/* Laid out left to right, kept short of the card's full width. */}
                <View style={styles.legend}>
                  {LEGEND.map((l) => (
                    <View key={l.label} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                      <Text style={styles.legendText}>{l.label}</Text>
                    </View>
                  ))}
                </View>

                {COMPS.map((c) => (
                  <View key={c.name} style={styles.statBlock}>
                    <View style={styles.statTop}>
                      <Text style={styles.compName} numberOfLines={1}>
                        {c.name}
                      </Text>
                      <Text style={styles.compPlayed}>{c.played} ndeshje</Text>
                    </View>

                    {/* One rail, split win / draw / loss. */}
                    <View style={styles.splitBar}>
                      <View style={[styles.splitFill, { flex: c.win, backgroundColor: C.green }]} />
                      <View style={[styles.splitFill, { flex: c.draw, backgroundColor: C.orange }]} />
                      <View style={[styles.splitFill, { flex: c.loss, backgroundColor: C.red }]} />
                    </View>

                    <View style={styles.tallyRow}>
                      <Text style={[styles.tally, { color: C.green }]}>{c.win}F</Text>
                      <Text style={[styles.tally, { color: C.orange }]}>{c.draw}F</Text>
                      <Text style={[styles.tally, { color: C.red }]}>{c.loss}F</Text>
                    </View>
                  </View>
                ))}

                {/* ── Seasonal summary — framed box inside the same card ── */}
                <View style={styles.seasonBox}>
                  <Text style={styles.seasonTitle}>Përmbledhje Sezonale</Text>
                  <View style={styles.seasonLine} />

                  {SEASON.map((s) => (
                    <View key={s.label} style={styles.seasonRow}>
                      <Text style={styles.seasonLabel}>{s.label}</Text>
                      <Text style={[styles.seasonValue, { color: s.tone }]}>{s.value}</Text>
                    </View>
                  ))}
                </View>
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

    /* ── Headline squares ────────────────────────────────────── */
    summaryRow: {
      flexDirection: 'row',
      paddingLeft: 27,
      paddingRight: 27,
      paddingTop: 8,
      gap: 8,
    },

    /* Shadow lives on the wrapper: `overflow: hidden` on the pane itself would
       clip it away on iOS. */
    sqShadow: {
      width: 100,
      height: 122,
      borderRadius: 8,
      /* Translucent so the frosted pane inside has a backdrop to blur. */
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
      borderColor: '#E4A000',
      borderRadius: 8,
      overflow: 'hidden',
    },

    /* Content rides above the frost and gloss overlays. */
    sqBody: {
      flex: 1,
      padding: 11,
    },

    /* Fixed two-line block so all four values sit on the same line. */
    sqLabel: {
      minHeight: 30,
      fontFamily: Fonts.bodyBold,
      fontSize: 12,
      lineHeight: 15,
      color: C.gray,
    },

    sqValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 26,
      lineHeight: 32,
      letterSpacing: -0.5,
      marginTop: 4,
    },

    sqHint: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      marginTop: 4,
    },

    /* ── Filters ─────────────────────────────────────────────── */
    filterRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 14,
    },

    filterBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 32,
      paddingHorizontal: 9,
      backgroundColor: C.blueSoft,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    filterText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12.5,
      color: C.text,
    },

    /* ── Tables ──────────────────────────────────────────────── */
    card: {
      marginTop: 14,
      backgroundColor: C.cardBg,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 7,
      overflow: 'hidden',
    },

    cardGap: {
      marginTop: 16,
    },

    head: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 11,
      backgroundColor: C.headBg,
    },

    headText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 15,
      lineHeight: 19,
      color: C.text,
    },

    headLine: {
      height: 1,
      backgroundColor: C.headLine,
    },

    /* ── Fixtures table ──────────────────────────────────────── */
    tblInner: {
      paddingHorizontal: 10,
      paddingBottom: 10,
    },

    thRow: {
      paddingTop: 9,
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      minHeight: 34,
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

    td: {
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 14,
      color: C.text,
      textAlign: 'center',
    },

    tdMatch: {
      fontFamily: Fonts.bodySemiBold,
      textAlign: 'left',
    },

    tdPlus: {
      fontFamily: Fonts.bodyBold,
      color: C.green,
    },

    tdMinus: {
      fontFamily: Fonts.bodyBold,
      color: C.red,
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

    /* ── Competition breakdown ───────────────────────────────── */
    body: {
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 14,
      gap: 16,
    },

    legend: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },

    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    legendDot: {
      width: 9,
      height: 9,
      borderRadius: 2,
    },

    legendText: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.text,
    },

    statBlock: {
      gap: 5,
    },

    statTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },

    compName: {
      flex: 1,
      fontFamily: Fonts.bodyBold,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.text,
    },

    compPlayed: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.text,
    },

    splitBar: {
      flexDirection: 'row',
      height: 7,
      borderRadius: 4,
      overflow: 'hidden',
      backgroundColor: C.track,
    },

    splitFill: {
      height: '100%',
    },

    tallyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    tally: {
      fontFamily: Fonts.body,
      fontSize: 10,
      lineHeight: 12,
    },

    /* ── Seasonal summary ────────────────────────────────────── */
    seasonBox: {
      paddingHorizontal: 12,
      paddingTop: 11,
      paddingBottom: 13,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 7,
    },

    seasonTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 14,
      lineHeight: 18,
      color: C.text,
    },

    seasonLine: {
      height: 1,
      marginTop: 9,
      marginBottom: 4,
      backgroundColor: C.headLine,
    },

    seasonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      minHeight: 26,
    },

    seasonLabel: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 15,
      color: C.text,
    },

    seasonValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12,
      lineHeight: 15,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
