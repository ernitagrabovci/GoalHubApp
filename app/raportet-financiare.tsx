import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import { financeReports, listFees } from '@/lib/api/finance';
import type { ApiFee, FinanceReports, Paginated } from '@/lib/api/types';
import { dmy, monthLabel, payMethod, statusLabel, STATUS_TONE, usd } from '@/lib/finance';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * Kuotat e anëtarësisë — the club's collection report, opened from "Shiko të
 * gjitha" under Pagesat e fundit on the financier home.
 *
 * Four glassy squares carry the headline numbers, the year/month pair narrows
 * the list down, and the table below shows every membership fee in it.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',

  frame: '#000000',
  headLine: 'rgba(30,40,35,0.10)',
  rowLine: 'rgba(100,140,190,0.22)',

  blue1: '#E3EEFB',
  blue2: '#F6FBFF',
  blueBtn: '#86BCFD',

  /* Every square wears the same orange rim. */
  orange: '#E4A000',
  green: '#159447',
  red: '#E03131',
};

/**
 * The squares sit on a near-white page, so a white frost on its own reads as
 * nothing. Shading the pane instead — a very light grey at the top edge
 * sweeping down to white — is what gives the surface its glassy shape.
 */
const SQ_GLOSS = [
  'rgba(180,188,201,0.30)',
  'rgba(216,222,231,0.15)',
  'rgba(245,245,245,0.80)',
] as const;

/** Thin specular rim on the top edge — reads as the thickness of the pane. */
const SQ_SHEEN = ['rgba(245,245,245,0.55)', 'rgba(245,245,245,0.00)'] as const;

/* ── Headline squares ──────────────────────────────────────────────── */

type Square = { value: string; label: string; tone: string };

/* The year/month pair narrows the report down; "Të gjitha" keeps it whole. */
const MONTHS = [
  'Të gjitha',
  'Janar',
  'Shkurt',
  'Mars',
  'Prill',
  'Maj',
  'Qershor',
  'Korrik',
  'Gusht',
  'Shtator',
  'Tetor',
  'Nëntor',
  'Dhjetor',
];

/* Table columns — fixed widths so nothing gets squeezed; the frame scrolls. */
const COL_NAME = 104;
const COL_TEAM = 84;
const COL_MONTH = 88;
const COL_AMOUNT = 58;
const COL_STATUS = 66;
const COL_PAID = 76;
const COL_METHOD = 92;

/** The share of everything billed that has actually landed, as a percentage. */
function payRate(collected: number, pending: number): string {
  const total = collected + pending;
  if (total <= 0) return '—';
  return `${Math.round((collected / total) * 100)}%`;
}

export default function FinancialReportsScreen() {
  const router = useRouter();
  const { token, signOut } = useSession();

  const [reports, setReports] = useState<FinanceReports | null>(null);
  const [fees, setFees] = useState<Paginated<ApiFee> | null>(null);
  const [year, setYear] = useState('');
  const [month, setMonth] = useState(MONTHS[0]);
  /* The pair the squares currently reflect, committed by "Kërko". */
  const [applied, setApplied] = useState({ year: '', month: MONTHS[0] });
  const [open, setOpen] = useState<'year' | 'month' | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    financeReports(token, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setReports(res);
        /* Default the picker to the newest year the report carries. */
        const years = [...new Set(res.months.map((m) => String(m.year)))].sort((a, b) =>
          b.localeCompare(a),
        );
        const newest = years[0] ?? '';
        setYear((prev) => prev || newest);
        setApplied((prev) => (prev.year ? prev : { ...prev, year: newest }));
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          signOut();
          router.replace('/login');
        }
      });

    return () => controller.abort();
  }, [token, router, signOut]);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    listFees(token, { page }, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setFees(res);
        setError(null);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          signOut();
          router.replace('/login');
          return;
        }
        setError(
          err instanceof ApiError && err.status === 0
            ? 'Nuk mund të lidhemi me serverin. Kontrollo lidhjen.'
            : 'Nuk mund të ngarkohen kuotat.',
        );
      });

    return () => controller.abort();
  }, [token, page, router, signOut]);

  /* Season totals, or the picked month's slice of the report. */
  const monthIndex = MONTHS.indexOf(applied.month);
  const picked =
    monthIndex > 0
      ? (reports?.months.find(
          (m) => m.month === monthIndex && m.year === Number(applied.year),
        ) ?? null)
      : null;

  const collected = picked ? picked.collected : (reports?.season_collected ?? 0);
  const pending = picked ? picked.pending : (reports?.season_pending ?? 0);
  const overdue = picked ? picked.overdue : (reports?.season_overdue ?? 0);

  const squares: Square[] = reports
    ? [
        { value: usd(collected), label: 'të arkëtuara', tone: C.green },
        { value: usd(pending), label: 'papaguar', tone: C.orange },
        { value: String(overdue), label: 'skaduar', tone: C.red },
        { value: payRate(collected, pending), label: 'shkalla e pagesës', tone: C.text },
      ]
    : [
        { value: '—', label: 'të arkëtuara', tone: C.green },
        { value: '—', label: 'papaguar', tone: C.orange },
        { value: '—', label: 'skaduar', tone: C.red },
        { value: '—', label: 'shkalla e pagesës', tone: C.text },
      ];

  const years = reports
    ? [...new Set(reports.months.map((m) => String(m.year)))].sort((a, b) => b.localeCompare(a))
    : [];
  const yearOptions = years.length ? years : ['—'];

  const rows = (fees?.data ?? []).map((f) => ({
    id: f.id,
    name: f.player?.name ?? '—',
    team: f.team?.name ?? '—',
    month: monthLabel(f.month),
    amount: usd(Number(f.final_amount) || 0),
    status: statusLabel(f.status),
    paidOn: dmy(f.paid_at),
    method: payMethod(f.payment_method),
  }));

  const lastPage = fees?.meta.last_page ?? 0;
  const pages = Array.from({ length: lastPage }, (_, i) => i + 1);

  const runSearch = () => {
    setApplied({ year, month });
    setOpen(null);
  };

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
                <MaterialCommunityIcons name="chevron-left" size={I(24)} color={C.text} />
              </Pressable>
              <View style={styles.headerText}>
                <Text
                  style={styles.title}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  Kuotat e Anëtarësisë
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {fees ? `${fees.meta.total} rekorde` : '—'}
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
            {/* ── Headline squares ──────────────────────────────── */}
            <View style={styles.grid}>
              {squares.map((s) => (
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
                      <Text
                        style={[styles.sqValue, { color: s.tone }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.5}
                      >
                        {s.value}
                      </Text>
                      <Text style={styles.sqLabel} numberOfLines={2}>
                        {s.label}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* ── Year / month + search ─────────────────────────── */}
            {/* Lifted while a list is unrolled, so the options fall over the
                table below instead of under it. */}
            <View style={[styles.filterRow, open !== null && styles.filterRowOpen]}>
              {(
                [
                  { key: 'year', value: year, options: yearOptions },
                  { key: 'month', value: month, options: MONTHS },
                ] as const
              ).map((pick) => (
                <View key={pick.key} style={styles.pickWrap}>
                  <Pressable
                    onPress={() => setOpen(open === pick.key ? null : pick.key)}
                    accessibilityRole="button"
                    accessibilityLabel={pick.key === 'year' ? 'Viti' : 'Muaji'}
                    style={({ pressed }) => [styles.pickBox, pressed && styles.pressed]}
                  >
                    <Text style={styles.pickText} numberOfLines={1}>
                      {pick.value || '—'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={I(12)} color={C.text} />
                  </Pressable>

                  {open === pick.key ? (
                    <View style={styles.pickOpts}>
                      <ScrollView
                        nestedScrollEnabled
                        showsVerticalScrollIndicator={false}
                        style={styles.pickScroll}
                      >
                        {pick.options.map((o) => {
                          const active = o === pick.value;
                          return (
                            <Pressable
                              key={o}
                              onPress={() => {
                                if (pick.key === 'year') setYear(o);
                                else setMonth(o);
                                setOpen(null);
                              }}
                              accessibilityRole="button"
                              accessibilityLabel={o}
                              style={[styles.pickOpt, active && styles.pickOptActive]}
                            >
                              <Text
                                style={[styles.pickOptText, active && styles.pickOptTextActive]}
                                numberOfLines={1}
                              >
                                {o}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </ScrollView>
                    </View>
                  ) : null}
                </View>
              ))}

              <Pressable
                onPress={runSearch}
                accessibilityRole="button"
                accessibilityLabel="Kërko"
                style={({ pressed }) => [styles.searchBtn, pressed && styles.pressed]}
              >
                <Text style={styles.searchBtnText}>Kërko</Text>
              </Pressable>
            </View>

            {/* ── Lista ─────────────────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.head}>
                <Text
                  style={styles.headText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  Lista
                </Text>
              </View>
              <View style={styles.headLine} />

              {/* Table — scroll sideways so no column gets squeezed */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={styles.tblInner}
              >
                <View>
                  <View style={styles.tr}>
                    <Text style={[styles.th, styles.thLeft, { width: COL_NAME }]}>Emri</Text>
                    <Text style={[styles.th, { width: COL_TEAM }]}>Ekipi</Text>
                    <Text style={[styles.th, { width: COL_MONTH }]}>Muaji</Text>
                    <Text style={[styles.th, { width: COL_AMOUNT }]}>Shuma</Text>
                    <Text style={[styles.th, { width: COL_STATUS }]}>Statusi</Text>
                    <Text style={[styles.th, { width: COL_PAID }]}>Paguar më</Text>
                    <Text style={[styles.th, { width: COL_METHOD }]}>Metoda</Text>
                  </View>

                  {error ? (
                    <View style={styles.tr}>
                      <Text style={[styles.td, styles.thLeft]}>{error}</Text>
                    </View>
                  ) : fees === null ? (
                    <View style={styles.tr}>
                      <Text style={[styles.td, styles.thLeft]}>…</Text>
                    </View>
                  ) : rows.length === 0 ? (
                    <View style={styles.tr}>
                      <Text style={[styles.td, styles.thLeft]}>Nuk ka kuota.</Text>
                    </View>
                  ) : (
                    rows.map((f, i) => (
                      <View key={`${f.id}-${i}`} style={[styles.tr, styles.trBorder]}>
                        <Text
                          style={[styles.tdName, styles.thLeft, { width: COL_NAME }]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          {f.name}
                        </Text>
                        <Text style={[styles.td, { width: COL_TEAM }]} numberOfLines={1}>
                          {f.team}
                        </Text>
                        <Text style={[styles.td, { width: COL_MONTH }]} numberOfLines={1}>
                          {f.month}
                        </Text>
                        <Text style={[styles.td, { width: COL_AMOUNT }]} numberOfLines={1}>
                          {f.amount}
                        </Text>
                        <Text
                          style={[
                            styles.td,
                            styles.tdStatus,
                            { width: COL_STATUS, color: STATUS_TONE[f.status] ?? C.hint },
                          ]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          {f.status}
                        </Text>
                        <Text style={[styles.td, { width: COL_PAID }]} numberOfLines={1}>
                          {f.paidOn}
                        </Text>
                        <Text style={[styles.td, { width: COL_METHOD }]} numberOfLines={1}>
                          {f.method}
                        </Text>
                      </View>
                    ))
                  )}
                </View>
              </ScrollView>

              {/* ── Pager ─────────────────────────────────────────── */}
              {lastPage > 1 ? (
                <View style={styles.pager}>
                  <Pressable
                    onPress={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    accessibilityRole="button"
                    accessibilityLabel="Faqja e mëparshme"
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.pagerArrow,
                      page <= 1 && styles.pagerOff,
                      pressed && styles.pressed,
                    ]}
                  >
                    <MaterialCommunityIcons name="chevron-left" size={I(20)} color={C.text} />
                  </Pressable>

                  {pages.map((p) => (
                    <Pressable
                      key={p}
                      onPress={() => setPage(p)}
                      accessibilityRole="button"
                      accessibilityLabel={`Faqja ${p}`}
                      style={({ pressed }) => [
                        styles.pageSq,
                        p === page && styles.pageSqOn,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.pageSqText}>{p}</Text>
                    </Pressable>
                  ))}

                  <Pressable
                    onPress={() => setPage((p) => Math.min(lastPage, p + 1))}
                    disabled={page >= lastPage}
                    accessibilityRole="button"
                    accessibilityLabel="Faqja tjetër"
                    hitSlop={8}
                    style={({ pressed }) => [
                      styles.pagerArrow,
                      page >= lastPage && styles.pagerOff,
                      pressed && styles.pressed,
                    ]}
                  >
                    <MaterialCommunityIcons name="chevron-right" size={I(20)} color={C.text} />
                  </Pressable>
                </View>
              ) : null}
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
    /* Two by two, so each square is a wide rectangle rather than a plate. */
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginTop: 12,
      rowGap: 10,
    },

    /* Shadow lives on the wrapper: `overflow: hidden` on the pane itself would
       clip it away on iOS. */
    sqShadow: {
      width: '48.5%',
      height: 88,
      borderRadius: 8,
      /* Translucent so the frosted pane inside has a backdrop to blur. */
      backgroundColor: 'rgba(245,245,245,0.5)',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 5,
      elevation: 1,
    },

    sq: {
      flex: 1,
      borderWidth: 1,
      borderColor: C.orange,
      borderRadius: 8,
      overflow: 'hidden',
    },

    /* Content rides above the frost and gloss overlays. */
    sqBody: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 11,
    },

    sheen: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '14%',
    },

    /* The amount leads, so it takes the heavier weight and size. */
    sqValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 19,
      lineHeight: 23,
      letterSpacing: -0.4,
    },

    sqLabel: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.gray,
      marginTop: 3,
    },

    /* ── Year / month + search ───────────────────────────────── */
    filterRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 7,
      marginTop: 16,
    },

    filterRowOpen: {
      zIndex: 30,
      elevation: 30,
    },

    pickWrap: {
      width: 86,
    },

    pickBox: {
      height: 30,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 5,
      paddingHorizontal: 8,
      backgroundColor: C.blue1,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    pickText: {
      flex: 1,
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.text,
    },

    /* Floats over the table so opening it moves nothing. */
    pickOpts: {
      position: 'absolute',
      top: 33,
      left: 0,
      zIndex: 40,
      elevation: 12,
      minWidth: 96,
      backgroundColor: '#F5F5F5',
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
      overflow: 'hidden',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
    },

    /* The twelve months run past the foot of the page, so the list scrolls. */
    pickScroll: {
      maxHeight: 190,
    },

    pickOpt: {
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 10,
    },

    pickOptActive: {
      backgroundColor: C.blue1,
    },

    pickOptText: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      color: C.text,
    },

    pickOptTextActive: {
      fontFamily: Fonts.bodyBold,
      color: C.blueBtn,
    },

    /* Pushed to the far right, away from the two dropdowns. */
    searchBtn: {
      marginLeft: 'auto',
      height: 30,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.blue1,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    searchBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: C.text,
    },

    /* ── Card ────────────────────────────────────────────────── */
    card: {
      marginTop: 14,
      backgroundColor: C.blue2,
      borderWidth: 2,
      borderColor: C.rowLine,
      borderRadius: 7,
      overflow: 'hidden',
    },

    head: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 10,
      paddingVertical: 10,
    },

    headText: {
      textAlign: 'center',
      fontFamily: Fonts.bodyBold,
      fontSize: 15,
      lineHeight: 19,
      color: C.text,
    },

    headLine: {
      height: 1,
      backgroundColor: C.headLine,
    },

    /* ── Table ───────────────────────────────────────────────── */
    tblInner: {
      paddingHorizontal: 4,
      paddingTop: 6,
      paddingBottom: 4,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 2,
      minHeight: 34,
    },

    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    th: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10,
      lineHeight: 13,
      color: C.gray,
      textAlign: 'center',
    },

    thLeft: {
      textAlign: 'left',
    },

    tdName: {
      fontFamily: Fonts.body,
      fontSize: 10,
      lineHeight: 13,
      color: C.text,
    },

    td: {
      fontFamily: Fonts.body,
      fontSize: 10,
      lineHeight: 13,
      color: C.hint,
      textAlign: 'center',
    },

    tdStatus: {
      fontFamily: Fonts.bodySemiBold,
    },

    /* ── Pager ───────────────────────────────────────────────── */
    pager: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 6,
      paddingHorizontal: 10,
      paddingTop: 8,
      paddingBottom: 10,
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    pagerArrow: {
      alignItems: 'center',
      justifyContent: 'center',
    },

    pagerOff: {
      opacity: 0.3,
    },

    pageSq: {
      width: 28,
      height: 28,
      borderRadius: 5,
      backgroundColor: C.blueBtn,
      alignItems: 'center',
      justifyContent: 'center',
    },

    pageSqOn: {
      backgroundColor: '#4A90D9',
    },

    pageSqText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      color: '#F5F5F5',
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
