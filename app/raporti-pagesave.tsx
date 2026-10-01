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
 * Raporti i pagesave — opened from "Vazhdo" on the Raportet e pagesave card
 * over on the Raportet page.
 *
 * Four headline squares, the twelve-month collection chart with its pager,
 * the membership-fee breakdown and the per-team split.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',

  cardBg: '#E3EEFB',
  headBg: '#F6FBFF',
  frame: '#000000',
  headLine: 'rgba(30,40,35,0.10)',
  rowLine: 'rgba(100,140,190,0.22)',

  blueBtn: '#86BCFD',
  green: '#159447',
  orange: '#E4A000',
  red: '#E03131',

  /* Unfilled part of every progress rail. */
  track: 'rgba(0,0,0,0.10)',
};

/** 1170 → "$1,170" — grouped thousands, no cents. */
function usd(n: number) {
  return `$${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/** 16840 → "$16,840.00" — the long form the breakdown rows use. */
function usdFull(n: number) {
  return `${usd(n)}.00`;
}

/* ── Headline squares ──────────────────────────────────────────────── */

/**
 * The squares sit on a near-white page, so a white frost on its own reads as
 * nothing. Shading the pane instead — a very light grey at the top edge
 * sweeping down to white — is what gives the surface its glassy shape.
 */
const SQ_GLOSS = [
  'rgba(180,188,201,0.30)',
  'rgba(216,222,231,0.15)',
  'rgba(255,255,255,0.80)',
] as const;

/** Thin specular rim on the top edge — reads as the thickness of the pane. */
const SQ_SHEEN = ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.00)'] as const;

const SUMMARY = [
  { label: 'Kuota të mbledhura', value: '$16,840', hint: 'të paguara', tone: C.green },
  { label: 'Kuota të vonuara', value: '$16,800', hint: 'me vonesë', tone: C.red },
  { label: 'Kuota të papaguara', value: '$230', hint: 'borxh aktiv', tone: C.orange },
  { label: 'Norma e mbledhjes', value: '40%', hint: 'kuota të paguara', tone: C.green },
];

/* ── Monthly collection grid ───────────────────────────────────────── */

type Month = { month: string; collected: number; payments: number };

/** Ten months, oldest first, charted above and listed below. */
const MONTHS: Month[] = [
  { month: 'Oct 2025', collected: 1170, payments: 38 },
  { month: 'Nov 2025', collected: 1190, payments: 41 },
  { month: 'Dec 2025', collected: 1180, payments: 36 },
  { month: 'Jan 2026', collected: 1240, payments: 42 },
  { month: 'Feb 2026', collected: 1320, payments: 45 },
  { month: 'Mar 2026', collected: 1390, payments: 44 },
  { month: 'Apr 2026', collected: 1430, payments: 47 },
  { month: 'May 2026', collected: 1510, payments: 49 },
  { month: 'Jun 2026', collected: 1360, payments: 43 },
  { month: 'Jul 2026', collected: 1480, payments: 46 },
];

const COLLECTED_MIN = Math.min(...MONTHS.map((m) => m.collected));
const COLLECTED_MAX = Math.max(...MONTHS.map((m) => m.collected));

const TICK_MIN = 40;
const TICK_SPAN = 36;

/** Tick length tracks the month's take, so the bars read longest-to-shortest. */
function tickHeight(collected: number) {
  const ratio = (collected - COLLECTED_MIN) / (COLLECTED_MAX - COLLECTED_MIN);
  return TICK_MIN + ratio * TICK_SPAN;
}

const PAGES = [1, 2, 3, 4];

/* ── Membership-fee breakdown ──────────────────────────────────────── */

const STATUS: { label: string; amount: number; pct: number; tone: string }[] = [
  { label: 'Të paguara', amount: 16840, pct: 50, tone: C.green },
  { label: 'Me vonesë', amount: 16800, pct: 50, tone: C.red },
  { label: 'Të papaguara', amount: 230, pct: 1, tone: C.orange },
];

/* ── Per-team split ───────────────────────────────────────────────── */

const TEAMS: { name: string; pct: number; amount: number }[] = [
  { name: 'Ekipi i Parë', pct: 40, amount: 4840 },
  { name: 'U21', pct: 46, amount: 4160 },
  { name: 'U17', pct: 52, amount: 3280 },
  { name: 'U15', pct: 38, amount: 2890 },
  { name: 'U13', pct: 31, amount: 1670 },
];

export default function PaymentReportScreen() {
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
                  Raporti i pagesave
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Gjendja e kuotave të anëtarësisë
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
                    intensity={50}
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
                  <LinearGradient
                    pointerEvents="none"
                    style={styles.sheen}
                    colors={SQ_SHEEN}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
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
            {/* ── Collection chart ──────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.head}>
                <Text style={styles.headText} numberOfLines={1}>
                  Kuotat e mbledhura — 12 muajt e fundit
                </Text>
              </View>
              <View style={styles.headLine} />

              {/* Ten ticks hung from one top edge, each labelled on its side. */}
              <View style={styles.chart}>
                {MONTHS.map((m) => (
                  <View key={m.month} style={styles.chartCol}>
                    {/* Fixed-height slot: the ticks differ, the labels don't. */}
                    <View style={styles.tickArea}>
                      <View style={[styles.tick, { height: tickHeight(m.collected) }]} />
                    </View>
                    <View style={styles.tickLabelBox}>
                      <Text style={styles.tickLabel} numberOfLines={1}>
                        {m.month}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.chartDivider} />

              {/* The same ten months, spelled out. */}
              <View style={styles.tblInner}>
                <View style={[styles.tr, styles.thRow]}>
                  <Text style={[styles.th, styles.thLeft, { flex: 1.2 }]} numberOfLines={1}>
                    Muaji
                  </Text>
                  <Text style={[styles.th, { flex: 1.5 }]} numberOfLines={1}>
                    Kuota të mbledhura
                  </Text>
                  <Text style={[styles.th, { flex: 1.4 }]} numberOfLines={1}>
                    Numri i pagesave
                  </Text>
                </View>

                {MONTHS.map((m) => (
                  <View key={m.month} style={[styles.tr, styles.trBorder]}>
                    <Text
                      style={[styles.td, styles.tdMonth, { flex: 1.2 }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      {m.month}
                    </Text>
                    <Text
                      style={[styles.td, styles.tdCollected, { flex: 1.5 }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      {usd(m.collected)}
                    </Text>
                    <Text style={[styles.td, { flex: 1.4 }]}>{m.payments}</Text>
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

            {/* ── Membership-fee breakdown ──────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.head}>
                <Text style={styles.headText} numberOfLines={1}>
                  Gjendja e kuotave
                </Text>
              </View>
              <View style={styles.headLine} />

              <View style={styles.body}>
                {STATUS.map((s) => (
                  <View key={s.label} style={styles.statBlock}>
                    <View style={styles.statTop}>
                      <Text style={styles.statName} numberOfLines={1}>
                        {s.label}
                      </Text>
                      <Text style={[styles.statValue, { color: s.tone }]} numberOfLines={1}>
                        {usdFull(s.amount)} ({s.pct}%)
                      </Text>
                    </View>

                    <View style={styles.rail}>
                      <View
                        style={[styles.railFill, { width: `${s.pct}%`, backgroundColor: s.tone }]}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* ── Per-team split ────────────────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={[styles.head, styles.headSplit]}>
                <Text style={styles.headTextLeft} numberOfLines={1}>
                  Prezenca në stërvitje
                </Text>
                <Text style={styles.headAside} numberOfLines={1}>
                  sipas ekipit
                </Text>
              </View>
              <View style={styles.headLine} />

              <View style={styles.body}>
                {TEAMS.map((t) => (
                  <View key={t.name} style={styles.statBlock}>
                    <View style={styles.statTop}>
                      <Text style={styles.statName} numberOfLines={1}>
                        {t.name}
                      </Text>
                      <Text style={styles.statValue}>
                        {t.pct}% · {usd(t.amount)}
                      </Text>
                    </View>

                    {/* One rail, split paid / unpaid. */}
                    <View style={styles.splitBar}>
                      <View style={[styles.splitFill, { flex: t.pct, backgroundColor: C.green }]} />
                      <View
                        style={[styles.splitFill, { flex: 100 - t.pct, backgroundColor: C.red }]}
                      />
                    </View>
                  </View>
                ))}
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

    sheen: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '14%',
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

    /* ── Cards ───────────────────────────────────────────────── */
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

    /* The per-team card carries a title and an aside, so it spans the width. */
    headSplit: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },

    headText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 15,
      lineHeight: 19,
      color: C.text,
    },

    headTextLeft: {
      flex: 1,
      fontFamily: Fonts.bodyBold,
      fontSize: 15,
      lineHeight: 19,
      color: C.text,
    },

    headAside: {
      fontFamily: Fonts.body,
      fontSize: 11.5,
      lineHeight: 14,
      color: C.gray,
    },

    headLine: {
      height: 1,
      backgroundColor: C.headLine,
    },

    /* ── Collection chart ────────────────────────────────────── */
    chart: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: 12,
      paddingTop: 18,
      paddingBottom: 14,
      gap: 4,
    },

    chartCol: {
      flex: 1,
      alignItems: 'center',
    },

    /* Sized to the longest tick and bottom-anchored: every bar stands on the
       label row, however short it is, so each one meets its own month. */
    tickArea: {
      width: '100%',
      height: TICK_MIN + TICK_SPAN,
      alignItems: 'center',
      justifyContent: 'flex-end',
    },

    /* Chunky bars, all hanging from the same top, length set per month. */
    tick: {
      width: 3,
      borderRadius: 2,
      backgroundColor: C.green,
    },

    /* Rotating a label leaves its box behind, so the box is sized to the
       label's own length and the text is turned inside it. */
    tickLabelBox: {
      width: '100%',
      height: 58,
      justifyContent: 'center',
      alignItems: 'center',
    },

    tickLabel: {
      width: 58,
      textAlign: 'center',
      transform: [{ rotate: '-90deg' }],
      fontFamily: Fonts.body,
      fontSize: 9,
      lineHeight: 12,
      color: '#4A4A4A',
    },

    /* Splits the chart off from the month-by-month table below it. */
    chartDivider: {
      height: 1,
      backgroundColor: C.headLine,
    },

    /* ── Month table ─────────────────────────────────────────── */
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

    thLeft: {
      textAlign: 'left',
    },

    td: {
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 14,
      color: C.text,
      textAlign: 'center',
    },

    tdMonth: {
      fontFamily: Fonts.bodySemiBold,
      textAlign: 'left',
    },

    tdCollected: {
      fontFamily: Fonts.bodyBold,
      color: C.green,
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

    /* ── Stat blocks ─────────────────────────────────────────── */
    body: {
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 14,
      gap: 16,
    },

    statBlock: {
      gap: 6,
    },

    statTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },

    statName: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.text,
    },

    statValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.text,
    },

    rail: {
      height: 7,
      borderRadius: 4,
      overflow: 'hidden',
      backgroundColor: C.track,
    },

    railFill: {
      height: '100%',
      borderRadius: 4,
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

    pressed: {
      opacity: 0.5,
    },
  }),
);
