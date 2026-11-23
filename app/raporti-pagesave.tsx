import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { ApiError, loadErrorMessage } from '@/lib/api/errors';
import { financeReport } from '@/lib/api/reports';
import type { FinanceReport } from '@/lib/api/types';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';
import { useAppColors, usePaletteStyles, type AppColorsOf } from '@/lib/app-theme';
import { useGlass } from '@/lib/glass';

/**
 * Raporti i pagesave — opened from "Vazhdo" on the Raportet e pagesave card
 * over on the Raportet page.
 *
 * Four headline squares, the twelve-month collection chart with its pager,
 * the membership-fee breakdown and the per-team split.
 */

const C_LIGHT = {
  glassBase: 'rgba(255,255,255,0.12)',
  glassEdge: 'rgba(255,255,255,0.95)',
  glassDivider: 'rgba(16,51,38,0.18)',
  page: '#F7F9F8',
  line: 'rgba(0,0,0,0.025)',

  text: '#17251E',
  gray: '#52645A',
  hint: '#6E6E6E',

  cardBg: '#E3EEFB',
  headBg: '#F7F9F8',
  frame: '#DCE5DF',
  headLine: 'rgba(30,40,35,0.10)',
  rowLine: 'rgba(100,140,190,0.22)',

  blueBtn: '#86BCFD',
  green: '#2E7D5B',
  orange: '#B45309',
  red: '#B91C1C',

  /* Unfilled part of every progress rail. */
  track: 'rgba(0,0,0,0.10)',

  /* Rotated axis labels under the revenue chart. */
  tickLabel: '#4A4A4A',
};

/** 1170 → "€1,170" — grouped thousands, no cents. */
function usd(n: number) {
  return `€${n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/** 16840 → "€16,840.00" — the long form the breakdown rows use. */
function usdFull(n: number) {
  return `${usd(n)}.00`;
}

/* ── Headline squares ──────────────────────────────────────────────── */

/**
 * The squares sit on a near-white page, so a white frost on its own reads as
 * nothing. Shading the pane instead — a very light grey at the top edge
 * sweeping down to white — is what gives the surface its glassy shape.
 */
/** The chart's tick geometry — the tallest bar fills the slot. */
const TICK_MIN = 40;
const TICK_SPAN = 36;

/** Tick length tracks the month's take, so the bars read longest-to-shortest. */
function tickHeight(collected: number, min: number, max: number) {
  if (max <= min) return TICK_MIN + TICK_SPAN / 2;
  const ratio = (collected - min) / (max - min);
  return TICK_MIN + ratio * TICK_SPAN;
}

/** Percent of a total, rounded; zero total reads as zero. */
function share(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

export default function PaymentReportScreen() {
  const glass = useGlass();
  const C = useAppColors(C_LIGHT);
  const styles = usePaletteStyles(createStyles, C);
  const router = useRouter();
  const { token, signOut } = useSession();

  const [report, setReport] = useState<FinanceReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    financeReport(token, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setReport(res);
        setError(null);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          signOut();
          router.replace('/login');
          return;
        }
        setError(loadErrorMessage(err, 'Nuk mund të ngarkohet raporti. Kontrollo lidhjen.'));
      });
    return () => controller.abort();
  }, [token, signOut, router, reload]);

  /* Refetch from the error box; the effect cannot reset state synchronously. */
  const retry = () => {
    setReport(null);
    setError(null);
    setReload((value) => value + 1);
  };

  const stats = report?.stats;
  const summary = [
    {
      label: 'Kuota të mbledhura',
      value: stats ? usd(Math.round(stats.paid)) : '—',
      hint: 'të paguara',
      tone: C.green,
    },
    {
      label: 'Kuota të vonuara',
      value: stats ? usd(Math.round(stats.delayed)) : '—',
      hint: 'me vonesë',
      tone: C.red,
    },
    {
      label: 'Kuota të papaguara',
      value: stats ? usd(Math.round(stats.unpaid)) : '—',
      hint: 'borxh aktiv',
      tone: C.orange,
    },
    {
      label: 'Norma e mbledhjes',
      value: stats ? `${stats.rate}%` : '—',
      hint: 'kuota të paguara',
      tone: C.green,
    },
  ];

  const months = (report?.trend ?? []).map((m) => ({
    month: m.label,
    collected: Math.round(m.income),
    payments: m.count,
  }));
  const collectedMin = months.length ? Math.min(...months.map((m) => m.collected)) : 0;
  const collectedMax = months.length ? Math.max(...months.map((m) => m.collected)) : 0;

  const feeTotal = stats ? stats.paid + stats.delayed + stats.unpaid : 0;
  const status = [
    { label: 'Të paguara', amount: stats?.paid ?? 0, pct: share(stats?.paid ?? 0, feeTotal), tone: C.green },
    { label: 'Me vonesë', amount: stats?.delayed ?? 0, pct: share(stats?.delayed ?? 0, feeTotal), tone: C.red },
    { label: 'Të papaguara', amount: stats?.unpaid ?? 0, pct: share(stats?.unpaid ?? 0, feeTotal), tone: C.orange },
  ];

  const teams = (report?.fees_by_team ?? []).map((t) => ({
    name: t.team_name,
    pct: share(t.paid, t.total),
    amount: Math.round(t.paid),
  }));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.canvas}>
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
                <MaterialCommunityIcons name="chevron-left" size={I(24)} color={C.textText} />
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
          {/* ── Headline squares — one row; each card shrinks to fit ──── */}
          <View style={styles.summaryRow}>
            <View style={styles.statsCard}>
              {/* One pane for the whole row: frost, base gloss, then two
                  specular sweeps so the surface reads as glass. */}
              <BlurView
                pointerEvents="none"
                intensity={55}
                tint={glass.tint}
                experimentalBlurMethod="dimezisBlurView"
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                pointerEvents="none"
                style={StyleSheet.absoluteFill}
                colors={glass.gloss}
                locations={[0, 0.55, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <LinearGradient
                pointerEvents="none"
                style={styles.statsGloss}
                colors={glass.sweep}
                locations={[0, 0.38, 0.62, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              <LinearGradient
                pointerEvents="none"
                style={styles.statsGloss2}
                colors={glass.sweepSoft}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              <View pointerEvents="none" style={styles.statsSheen} />

              {summary.map((s, i) => (
                <View key={s.label} style={styles.statItem}>
                  {i > 0 ? <View pointerEvents="none" style={styles.statDivider} /> : null}
                  <View style={styles.sqBody}>
                    <Text
                      style={styles.sqLabel}
                      numberOfLines={2}
                      adjustsFontSizeToFit
                      minimumFontScale={0.65}
                    >
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
              ))}
            </View>
          </View>

          <View style={styles.colPad}>
            {/* ── Collection chart ──────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.head}>
                <Text style={styles.headText} numberOfLines={1}>
                  Kuotat e mbledhura — 12 muajt e fundit
                </Text>
              </View>
              <View style={styles.headLine} />

              {/* Twelve ticks hung from one top edge, each labelled on its side. */}
              <View style={styles.chart}>
                {months.map((m) => (
                  <View key={m.month} style={styles.chartCol}>
                    {/* Fixed-height slot: the ticks differ, the labels don't. */}
                    <View style={styles.tickArea}>
                      <View
                        style={[
                          styles.tick,
                          { height: tickHeight(m.collected, collectedMin, collectedMax) },
                        ]}
                      />
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

                {months.map((m) => (
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

                {error ? (
                  <View style={styles.stateRow}>
                    <Text style={styles.stateText}>{error}</Text>
                    <Pressable
                      onPress={retry}
                      accessibilityRole="button"
                      accessibilityLabel="Provo përsëri"
                      style={({ pressed }) => [styles.stateRetry, pressed && styles.pressed]}
                    >
                      <Text style={styles.stateRetryText}>Provo përsëri</Text>
                    </Pressable>
                  </View>
                ) : report === null ? (
                  <View style={styles.stateRow}>
                    <ActivityIndicator color={C.blueBtnText} />
                    <Text style={styles.stateText}>Duke përgatitur raportin…</Text>
                  </View>
                ) : null}
              </View>
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
                {status.map((s) => (
                  <View key={s.label} style={styles.statBlock}>
                    <View style={styles.statTop}>
                      <Text style={styles.statName} numberOfLines={1}>
                        {s.label}
                      </Text>
                      <Text style={[styles.statValue, { color: s.tone }]} numberOfLines={1}>
                        {usdFull(Math.round(s.amount))} ({s.pct}%)
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
                  Pagesat sipas ekipit
                </Text>
                <Text style={styles.headAside} numberOfLines={1}>
                  të paguara / gjithsej
                </Text>
              </View>
              <View style={styles.headLine} />

              <View style={styles.body}>
                {teams.length === 0 ? (
                  <Text style={styles.stateText}>Nuk ka të dhëna pagesash.</Text>
                ) : (
                  teams.map((t) => (
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
                        <View
                          style={[styles.splitFill, { flex: Math.max(t.pct, 0.001), backgroundColor: C.greenFill }]}
                        />
                        <View
                          style={[
                            styles.splitFill,
                            { flex: Math.max(100 - t.pct, 0.001), backgroundColor: C.redFill },
                          ]}
                        />
                      </View>
                    </View>
                  ))
                )}
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

const createStyles = (C: AppColorsOf<typeof C_LIGHT>) => StyleSheet.create(
  scaled({
    safe: {
      flex: 1,
    },

    canvas: {
      flex: 1,
    },

    colPad: {
      alignSelf: 'center',
      width: '100%',
      paddingHorizontal: 27,
    },

    /* Pinned header */
    header: {
      backgroundColor: 'transparent',
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
      color: C.textText,
    },

    subtitle: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 16,
      color: C.grayText,
      marginTop: 1,
    },

    scroll: {
      paddingBottom: 24,
    },

    /* ── Headline squares ────────────────────────────────────── */
    summaryRow: {
      flexDirection: 'row',
      paddingLeft: 14,
      paddingRight: 14,
      paddingTop: 8,
    },

    /* One shared glass pane for the whole row, with an orange rim. */
    statsCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'stretch',
      height: 104,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: '#B45309',
      backgroundColor: C.glassBaseFill,
      overflow: 'hidden',
      shadowColor: '#0B3B33',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18,
      shadowRadius: 14,
      elevation: 5,
    },

    statsGloss: {
      position: 'absolute',
      top: -130,
      left: -150,
      right: -150,
      height: 340,
      transform: [{ rotate: '-16deg' }],
    },

    statsGloss2: {
      position: 'absolute',
      top: 57,
      left: 30,
      right: -170,
      height: 80,
      transform: [{ rotate: '-16deg' }],
    },

    statsSheen: {
      position: 'absolute',
      top: 1.5,
      left: 10,
      right: 10,
      height: 1.5,
      borderRadius: 1,
      backgroundColor: C.glassEdgeFill,
    },

    statItem: {
      flex: 1,
      minWidth: 0,
      overflow: 'hidden',
    },

    statDivider: {
      position: 'absolute',
      left: 0,
      top: 10,
      bottom: 10,
      width: StyleSheet.hairlineWidth,
      backgroundColor: C.glassDividerFill,
    },

    /* Content rides above the frost and gloss overlays. */
    sqBody: {
      flex: 1,
      padding: 7,
    },

    /* Fixed two-line block so all four values sit on the same line. */
    sqLabel: {
      minHeight: 26,
      fontFamily: Fonts.bodyBold,
      fontSize: 9.5,
      lineHeight: 11.5,
      color: C.grayText,
    },

    sqValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 17,
      lineHeight: 21,
      letterSpacing: -0.5,
      marginTop: 2,
    },

    sqHint: {
      fontFamily: Fonts.body,
      fontSize: 9,
      lineHeight: 11,
      marginTop: 3,
    },

    /* ── Cards ───────────────────────────────────────────────── */
    card: {
      marginTop: 14,
      backgroundColor: C.cardBgFill,
      borderWidth: 1,
      borderColor: C.frameBorder,
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
      backgroundColor: C.headBgFill,
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
      color: C.textText,
    },

    headTextLeft: {
      flex: 1,
      fontFamily: Fonts.bodyBold,
      fontSize: 15,
      lineHeight: 19,
      color: C.textText,
    },

    headAside: {
      fontFamily: Fonts.body,
      fontSize: 11.5,
      lineHeight: 14,
      color: C.grayText,
    },

    headLine: {
      height: 1,
      backgroundColor: C.headLineFill,
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
      backgroundColor: C.greenFill,
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
      color: C.tickLabelText,
    },

    /* Splits the chart off from the month-by-month table below it. */
    chartDivider: {
      height: 1,
      backgroundColor: C.headLineFill,
    },

    /* ── Month table ─────────────────────────────────────────── */
    tblInner: {
      paddingHorizontal: 10,
    },

    thRow: {
      paddingTop: 9,
      borderBottomWidth: 1,
      borderBottomColor: C.headLineBorder,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      minHeight: 34,
    },

    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLineBorder,
    },

    th: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.grayText,
      textAlign: 'center',
    },

    thLeft: {
      textAlign: 'left',
    },

    td: {
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 14,
      color: C.textText,
      textAlign: 'center',
    },

    tdMonth: {
      fontFamily: Fonts.bodySemiBold,
      textAlign: 'left',
    },

    tdCollected: {
      fontFamily: Fonts.bodyBold,
      color: C.greenText,
    },

    /* ── Loading / empty / error ─────────────────────────────── */
    stateRow: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      minHeight: 96,
      paddingHorizontal: 12,
      paddingVertical: 18,
    },

    stateText: {
      fontFamily: Fonts.body,
      fontSize: 12.5,
      lineHeight: 18,
      color: C.hintText,
      textAlign: 'center',
    },

    stateRetry: {
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: 18,
      borderWidth: 1,
      borderColor: C.blueBtnBorder,
      borderRadius: 10,
    },

    stateRetryText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13,
      color: C.blueBtnText,
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
      backgroundColor: C.blueBtnFill,
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
      color: C.textText,
    },

    statValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.textText,
    },

    rail: {
      height: 7,
      borderRadius: 4,
      overflow: 'hidden',
      backgroundColor: C.trackFill,
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
      backgroundColor: C.trackFill,
    },

    splitFill: {
      height: '100%',
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
