import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { RegisterPaymentModal } from '@/components/finance/register-payment-modal';
import { Fonts } from '@/constants/theme';
import { ApiError, loadErrorMessage } from '@/lib/api/errors';
import { listFees } from '@/lib/api/finance';
import type { ApiFee, Paginated } from '@/lib/api/types';
import { dmy, monthLabel, statusLabel, STATUS_TONE, usd } from '@/lib/finance';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';
import { useAppColors, usePaletteStyles, type AppColorsOf } from '@/lib/app-theme';
import { useGlass } from '@/lib/glass';

/**
 * One player's membership quota — opened from "Shiko" on the Pagesat table.
 * The row comes in as route params, so the page always mirrors the entry it
 * was opened from.
 */

const C_LIGHT = {
  frame: '#DCE5DF',
  glassBase: 'rgba(255,255,255,0.12)',
  glassEdge: 'rgba(255,255,255,0.95)',
  glassDivider: 'rgba(16,51,38,0.18)',
  page: '#F7F9F8',
  line: 'rgba(0,0,0,0.025)',

  text: '#17251E',
  gray: '#52645A',
  hint: '#6E6E6E',

  /* blueSoft = the pale fill of the control buttons; blueBtn = the solid blue. */
  blueSoft: '#E3EEFB',
  blueBtn: '#86BCFD',
  blue2: '#F7F9F8',

  border: 'rgba(100,140,190,0.30)',
  rowLine: 'rgba(100,140,190,0.22)',
  headLine: 'rgba(30,40,35,0.10)',

  green: '#2E7D5B',
  red: '#B91C1C',
  orange: '#B45309',
};

/**
 * The squares sit on a near-white page, so a white frost on its own reads as
 * nothing. Shading the pane instead — a very light grey at the top edge
 * sweeping down to white — is what gives the surface its glassy shape.
 */
type FeeStatus = 'paid' | 'unpaid' | 'overdue';

/* The top filter narrows the table server-side; the first keeps it whole. */
const FILTERS: { label: string; status?: FeeStatus }[] = [
  { label: 'Të gjitha ekipet' },
  { label: 'Paguar', status: 'paid' },
  { label: 'Pa paguar', status: 'unpaid' },
  { label: 'Skaduar', status: 'overdue' },
];

/* Table columns — fixed widths so nothing gets squeezed; the frame scrolls. */
const COL_PERIOD = 96;
const COL_AMOUNT = 62;
const COL_DUE = 76;
const COL_PAID = 62;
const COL_STATUS = 66;
const COL_ACTION = 62;

export default function PlayerQuotaScreen() {
  const glass = useGlass();
  const C = useAppColors(C_LIGHT);
  const styles = usePaletteStyles(createStyles, C);
  const router = useRouter();
  const { token, signOut } = useSession();

  const params = useLocalSearchParams<{ name?: string; team?: string; playerId?: string }>();
  const name = params.name ?? '—';
  const team = params.team ?? '—';
  const playerId = params.playerId ? Number(params.playerId) : null;
  const canRegister = playerId != null && !Number.isNaN(playerId);

  /* Unfiltered first page drives the headline squares; the table pages itself. */
  const [summary, setSummary] = useState<ApiFee[] | null>(null);
  const [fees, setFees] = useState<Paginated<ApiFee> | null>(null);
  const [filter, setFilter] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  /** Bumped after a payment is registered, to refetch the summary and the table. */
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!token || !playerId || Number.isNaN(playerId)) return;
    const controller = new AbortController();

    listFees(token, { player_id: playerId }, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setSummary(res.data);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          signOut();
          router.replace('/login');
        }
      });

    return () => controller.abort();
  }, [token, playerId, version, router, signOut]);

  useEffect(() => {
    if (!token || !playerId || Number.isNaN(playerId)) return;
    const controller = new AbortController();

    listFees(token, { player_id: playerId, status: FILTERS[filter].status, page }, controller.signal)
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
        setError(loadErrorMessage(err, 'Nuk mund të ngarkohen kuotat.'));
      });

    return () => controller.abort();
  }, [token, playerId, filter, page, version, router, signOut]);

  /* Refetch from the error box; the effect cannot reset state synchronously. */
  const retry = () => {
    setFees(null);
    setError(null);
    setVersion((value) => value + 1);
  };

  const picked = (status: FeeStatus) => (summary ?? []).filter((f) => f.status === status);
  const total = (rows: ApiFee[]) =>
    rows.reduce((sum, f) => sum + (Number(f.final_amount) || 0), 0);

  const SUMMARY = summary
    ? [
        {
          label: 'Kuota të paguara',
          value: `${picked('paid').length} kuota`,
          hint: `${usd(total(picked('paid')))} gjithsej`,
          tone: C.green,
        },
        {
          label: 'Pagesat e papaguara',
          value: String(picked('unpaid').length),
          hint: `${usd(total(picked('unpaid')))} në pritje`,
          tone: C.orange,
        },
        {
          label: 'Pagesat e skaduara',
          value: String(picked('overdue').length),
          hint: 'Tolerancë 10 ditore',
          tone: C.red,
        },
      ]
    : [
        { label: 'Kuota të paguara', value: '—', hint: '—', tone: C.green },
        { label: 'Pagesat e papaguara', value: '—', hint: '—', tone: C.orange },
        { label: 'Pagesat e skaduara', value: '—', hint: '—', tone: C.red },
      ];

  const rows = (fees?.data ?? []).map((f) => {
    const amount = usd(Number(f.final_amount) || 0);
    const paid = f.status === 'paid';
    return {
      id: f.id,
      period: monthLabel(f.month),
      amount,
      due: dmy(f.due_date),
      paid: paid ? amount : usd(0),
      status: statusLabel(f.status),
    };
  });

  const lastPage = fees?.meta.last_page ?? 0;
  const pages = Array.from({ length: lastPage }, (_, i) => i + 1);

  const pickFilter = (i: number) => {
    setFilter(i);
    setPage(1);
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
                <MaterialCommunityIcons name="chevron-left" size={I(24)} color={C.textText} />
              </Pressable>
              <View style={styles.headerText}>
                <Text
                  style={styles.title}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {name}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {team}
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
          {/* ── Headline counts ─────────────────────────────────── */}
          {/* Only three, so they share the row instead of scrolling. */}
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

              {SUMMARY.map((s, i) => (
                <View key={s.label} style={styles.statItem}>
                  {i > 0 ? <View pointerEvents="none" style={styles.statDivider} /> : null}
                  <View style={styles.sqBody}>
                    <Text
                      style={styles.sqLabel}
                      numberOfLines={2}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
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
            {/* ── Register ──────────────────────────────────────── */}
            <View style={styles.actions}>
              <Pressable
                onPress={() => setRegistering(true)}
                disabled={!canRegister}
                accessibilityRole="button"
                accessibilityLabel="Regjistro pagesën"
                style={({ pressed }) => [
                  styles.controlBtn,
                  !canRegister && styles.controlBtnOff,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.plusCircle}>
                  <MaterialCommunityIcons name="plus" size={I(15)} color="#FFFFFF" />
                </View>
                <Text style={styles.controlText}>Regjistro pagesën</Text>
              </Pressable>
            </View>

            {/* ── Status filters ────────────────────────────────── */}
            <View style={styles.filters}>
              {FILTERS.map((f, i) => (
                <Pressable
                  key={f.label}
                  onPress={() => pickFilter(i)}
                  accessibilityRole="button"
                  accessibilityLabel={f.label}
                  hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
                  style={({ pressed }) => [
                    styles.filterBtn,
                    i === filter && styles.filterBtnOn,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text
                    style={styles.filterText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* ── Kuota e lojtarit ──────────────────────────────── */}
            <View style={styles.scrollHint} accessibilityElementsHidden importantForAccessibility="no">
              <MaterialCommunityIcons name="gesture-swipe-horizontal" size={I(14)} color={C.grayText} />
              <Text style={styles.scrollHintText}>Rrëshqit anash për më shumë kolona</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.head}>
                <Text style={styles.headText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                  Kuota e {name}
                </Text>
              </View>
              <View style={styles.headLine} />

              {/* Table — scroll sideways so no column gets squeezed */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={[styles.tblInner, styles.tblFill]}
              >
                <View style={styles.tblFill}>
                  <View style={styles.tr}>
                    <Text style={[styles.th, styles.thLeft, { width: COL_PERIOD }]}>Periudha</Text>
                    <Text style={[styles.th, { width: COL_AMOUNT }]}>Shuma</Text>
                    <Text style={[styles.th, { width: COL_DUE }]}>Afati</Text>
                    <Text style={[styles.th, { width: COL_PAID }]}>U pagua</Text>
                    <Text style={[styles.th, { width: COL_STATUS }]}>Statusi</Text>
                    <View style={{ width: COL_ACTION }} />
                  </View>

                  {error ? (
                    <View style={[styles.tr, styles.stateTr]}>
                      <Text style={styles.td}>{error}</Text>
                      <Pressable
                        onPress={retry}
                        accessibilityRole="button"
                        accessibilityLabel="Provo përsëri"
                        style={({ pressed }) => [styles.stateRetry, pressed && styles.pressed]}
                      >
                        <Text style={styles.stateRetryText}>Provo përsëri</Text>
                      </Pressable>
                    </View>
                  ) : fees === null ? (
                    <View style={[styles.tr, styles.stateTr]}>
                      <ActivityIndicator color={C.greenText} />
                      <Text style={styles.td}>Duke ngarkuar kuotat…</Text>
                    </View>
                  ) : rows.length === 0 ? (
                    <View style={styles.tr}>
                      <Text style={[styles.td, styles.thLeft]}>Nuk ka kuota.</Text>
                    </View>
                  ) : (
                    rows.map((q, i) => (
                      <View key={`${q.id}-${i}`} style={[styles.tr, styles.trBorder]}>
                        <Text
                          style={[styles.tdName, styles.thLeft, { width: COL_PERIOD }]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          {q.period}
                        </Text>
                        <Text style={[styles.td, { width: COL_AMOUNT }]} numberOfLines={1}>
                          {q.amount}
                        </Text>
                        <Text style={[styles.td, { width: COL_DUE }]} numberOfLines={1}>
                          {q.due}
                        </Text>
                        <Text style={[styles.td, { width: COL_PAID }]} numberOfLines={1}>
                          {q.paid}
                        </Text>
                        <Text
                          style={[
                            styles.td,
                            styles.tdStatus,
                            { width: COL_STATUS, color: STATUS_TONE[q.status] ?? C.hint },
                          ]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          {q.status}
                        </Text>
                        <View style={[styles.colAction, { width: COL_ACTION }]}>
                          <Pressable
                            onPress={() =>
                              router.push({
                                pathname: '/detajet-pageses',
                                params: {
                                  id: String(q.id),
                                  playerId: playerId != null ? String(playerId) : '',
                                  name,
                                  team,
                                },
                              })
                            }
                            accessibilityRole="button"
                            accessibilityLabel={`Detajet e ${q.period}`}
                            hitSlop={{ top: 7, bottom: 7, left: 4, right: 4 }}
                            style={({ pressed }) => [styles.viewBtn, pressed && styles.pressed]}
                          >
                            <Text style={styles.viewBtnText}>Detajet</Text>
                          </Pressable>
                        </View>
                      </View>
                    ))
                  )}
                </View>
              </ScrollView>
            </View>

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
                  <MaterialCommunityIcons name="chevron-left" size={I(22)} color={C.textText} />
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
                  <MaterialCommunityIcons name="chevron-right" size={I(22)} color={C.textText} />
                </Pressable>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>

      {registering && canRegister ? (
        <View style={styles.ovWrap}>
          <BlurView style={styles.ovFill} intensity={45} tint="dark" />
          <Pressable
            style={[styles.ovFill, styles.ovDim]}
            onPress={() => setRegistering(false)}
            accessibilityRole="button"
            accessibilityLabel="Mbylle dritaren"
          />
          <RegisterPaymentModal
            fixedPlayer={{ id: playerId, label: name }}
            onClose={() => setRegistering(false)}
            onSaved={() => {
              setRegistering(false);
              setVersion((v) => v + 1);
            }}
          />
        </View>
      ) : null}
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

    /* ── Headline counts ─────────────────────────────────────── */
    summaryRow: {
      flexDirection: 'row',
      paddingLeft: 27,
      paddingRight: 27,
      paddingTop: 8,
    },

    /* One shared glass pane for the whole row, with an orange rim. */
    statsCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'stretch',
      height: 122,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: C.orangeBorder,
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
      top: 67,
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
      padding: 11,
    },

    /* Fixed two-line block so all three values sit on the same line. */
    sqLabel: {
      minHeight: 30,
      fontFamily: Fonts.bodyBold,
      fontSize: 12,
      lineHeight: 15,
      color: C.grayText,
    },

    sqValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 26,
      lineHeight: 32,
      letterSpacing: -0.5,
      color: C.textText,
      marginTop: 4,
    },

    sqHint: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.grayText,
      marginTop: 4,
    },

    /* ── Register ────────────────────────────────────────────── */
    /* Sits on the left: the row exists only so the button has gutters. */
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 16,
    },

    controlBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      height: 44,
      paddingHorizontal: 12,
      backgroundColor: C.blueSoftFill,
      borderWidth: 1,
      borderColor: C.frameBorder,
      borderRadius: 10,
    },

    plusCircle: {
      width: 23,
      height: 23,
      borderRadius: 12,
      backgroundColor: C.blueBtnFill,
      alignItems: 'center',
      justifyContent: 'center',
    },

    controlText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      color: C.textText,
    },

    /* ── Status filters ──────────────────────────────────────── */
    filters: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 12,
    },

    filterBtn: {
      height: 36,
      paddingHorizontal: 12,
      backgroundColor: C.blueSoftFill,
      borderWidth: 1,
      borderColor: C.frameBorder,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },

    /* The one chip currently narrowing the table floods the solid blue. */
    filterBtnOn: {
      backgroundColor: C.blueBtnFill,
    },

    filterText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      lineHeight: 16,
      color: C.textText,
    },

    scrollHint: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 12,
    },

    scrollHintText: {
      fontFamily: Fonts.body,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.grayText,
    },

    /* ── Card ────────────────────────────────────────────────── */
    card: {
      marginTop: 14,
      backgroundColor: C.blue2Fill,
      borderWidth: 2,
      borderColor: C.borderBorder,
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
      color: C.textText,
    },

    headLine: {
      height: 1,
      backgroundColor: C.headLineFill,
    },

    /* ── Table ───────────────────────────────────────────────── */
    tblInner: {
      paddingHorizontal: 4,
      paddingTop: 6,
    },

    /* Stretches the rows to the card's width, so the rules run the full width
       instead of stopping where the last column ends. */
    tblFill: {
      flexGrow: 1,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 34,
    },

    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLineBorder,
    },

    colAction: {
      alignItems: 'flex-end',
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

    tdName: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.textText,
    },

    stateTr: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
      minHeight: 96,
      paddingHorizontal: 16,
      paddingVertical: 18,
    },

    stateRetry: {
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: 18,
      borderWidth: 1,
      borderColor: C.greenBorder,
      borderRadius: 10,
    },

    stateRetryText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13,
      color: C.greenText,
    },

    td: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.hintText,
      textAlign: 'center',
    },

    tdStatus: {
      fontFamily: Fonts.bodySemiBold,
    },

    /* Clear fill, black rim and black label. */
    viewBtn: {
      height: 30,
      paddingHorizontal: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.frameBorder,
      borderRadius: 6,
    },

    viewBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.textText,
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

    pagerOff: {
      opacity: 0.3,
    },

    pageSq: {
      width: 44,
      height: 44,
      borderRadius: 10,
      backgroundColor: C.blueBtnFill,
      alignItems: 'center',
      justifyContent: 'center',
    },

    pageSqOn: {
      backgroundColor: '#4A90D9',
    },

    pageSqText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 14,
      color: '#FFFFFF',
    },

    controlBtnOff: {
      opacity: 0.5,
    },

    /* Overlay for the register-payment dialog. */
    ovWrap: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 20,
      alignItems: 'center',
    },

    ovFill: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },

    ovDim: {
      backgroundColor: 'rgba(0,0,0,0.42)',
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
