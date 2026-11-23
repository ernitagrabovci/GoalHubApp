import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { ApiError, loadErrorMessage } from '@/lib/api/errors';
import { listFees } from '@/lib/api/finance';
import type { ApiFee, Paginated } from '@/lib/api/types';
import { dmy, monthLabel, statusLabel, statusRank, STATUS_TONE, usd } from '@/lib/finance';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';
import { useAppColors, usePaletteStyles, type AppColorsOf } from '@/lib/app-theme';

/**
 * Kuotat e anëtarësisë — the whole club's membership fees, opened from
 * "Vazhdo" on the Pagesat card of the financier home.
 *
 * The financier works the list from the top down, so the rows that still owe
 * money are always lifted above the settled ones: an unpaid row offers
 * "Regjistro pagesën", a settled one only "Shiko".
 */

const C_LIGHT = {
  white: '#FFFFFF',
  page: '#F7F9F8',
  line: 'rgba(0,0,0,0.025)',

  text: '#17251E',
  gray: '#52645A',
  hint: '#6E6E6E',

  frame: '#DCE5DF',
  headLine: 'rgba(30,40,35,0.10)',
  rowLine: 'rgba(100,140,190,0.22)',

  blue1: '#E3EEFB',
  blue2: '#F7F9F8',
  blueBtn: '#86BCFD',

  green: '#2E7D5B',
  red: '#B91C1C',
  orange: '#B45309',
};

/* Table columns — fixed widths so nothing gets squeezed; the frame scrolls. */
const COL_NAME = 104;
const COL_TEAM = 88;
const COL_PERIOD = 90;
const COL_AMOUNT = 58;
const COL_DUE = 72;
const COL_STATUS = 66;
const COL_ACTION = 88;

export default function MembershipFeesScreen() {
  const C = useAppColors(C_LIGHT);
  const styles = usePaletteStyles(createStyles, C);
  const router = useRouter();
  const { token, signOut } = useSession();

  const [fees, setFees] = useState<Paginated<ApiFee> | null>(null);
  /* The teams the dropdown offers, gathered from the fees as they load. */
  const [teams, setTeams] = useState<{ id: number; name: string }[]>([]);
  const [teamId, setTeamId] = useState<number | null>(null);
  const [teamOpen, setTeamOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    listFees(
      token,
      { page, team_id: teamId ?? undefined, search: search || undefined },
      controller.signal,
    )
      .then((res) => {
        if (controller.signal.aborted) return;
        setFees(res);
        setError(null);
        // Accumulate every team seen, so the roster survives a filter change.
        setTeams((prev) => {
          const seen = new Map(prev.map((t) => [t.id, t]));
          for (const f of res.data) {
            if (f.team) seen.set(f.team.id, { id: f.team.id, name: f.team.name });
          }
          return [...seen.values()].sort((a, b) => a.name.localeCompare(b.name));
        });
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
  }, [token, page, teamId, search, router, signOut, reload]);

  /* Refetch from the error box; the effect cannot reset state synchronously. */
  const retry = () => {
    setFees(null);
    setError(null);
    setReload((value) => value + 1);
  };

  /* Unpaid first, then the overdue, then the settled — the design's order. */
  const rows = (fees?.data ?? [])
    .map((f) => ({
      id: f.id,
      playerId: f.player?.id ?? null,
      name: f.player?.name ?? '—',
      team: f.team?.name ?? '—',
      period: monthLabel(f.month),
      amount: usd(Number(f.final_amount) || 0),
      due: dmy(f.due_date),
      paid: f.status === 'paid',
      status: statusLabel(f.status),
      rank: statusRank(f.status),
    }))
    .sort((a, b) => a.rank - b.rank);

  const lastPage = fees?.meta.last_page ?? 0;
  const pages = Array.from({ length: lastPage }, (_, i) => i + 1);
  const selectedTeam = teams.find((t) => t.id === teamId)?.name ?? 'Të gjitha';

  const pickTeam = (id: number | null) => {
    setTeamId(id);
    setPage(1);
    setTeamOpen(false);
  };

  const runSearch = () => {
    setSearch(query);
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
                  Kuotat e anëtarësisë
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
            {/* ── Team dropdown ─────────────────────────────────── */}
            {/* Lifted while the list is unrolled, so the options fall over the
                table below instead of under it. */}
            <View style={[styles.pickRow, teamOpen && styles.pickRowOpen]}>
              <View style={styles.pickWrap}>
                <Pressable
                  onPress={() => setTeamOpen(!teamOpen)}
                  accessibilityRole="button"
                  accessibilityLabel="Filtro sipas ekipit"
                  style={({ pressed }) => [styles.pickBox, pressed && styles.pressed]}
                >
                  <Text style={styles.pickText} numberOfLines={1}>
                    {selectedTeam}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={I(14)} color={C.textText} />
                </Pressable>

                {teamOpen ? (
                  <View style={styles.pickOpts}>
                    <Pressable
                      onPress={() => pickTeam(null)}
                      accessibilityRole="button"
                      accessibilityLabel="Të gjitha"
                      style={[styles.pickOpt, teamId === null && styles.pickOptActive]}
                    >
                      <Text
                        style={[styles.pickOptText, teamId === null && styles.pickOptTextActive]}
                        numberOfLines={1}
                      >
                        Të gjitha
                      </Text>
                    </Pressable>
                    {teams.map((t) => {
                      const active = t.id === teamId;
                      return (
                        <Pressable
                          key={t.id}
                          onPress={() => pickTeam(t.id)}
                          accessibilityRole="button"
                          accessibilityLabel={t.name}
                          style={[styles.pickOpt, active && styles.pickOptActive]}
                        >
                          <Text
                            style={[styles.pickOptText, active && styles.pickOptTextActive]}
                            numberOfLines={1}
                          >
                            {t.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            </View>

            {/* ── Search ────────────────────────────────────────── */}
            <View style={styles.searchRow}>
              <View style={styles.searchBar}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Kërko anëtar..."
                  placeholderTextColor={C.grayText}
                  accessibilityLabel="Kërko anëtar"
                  value={query}
                  onChangeText={setQuery}
                  onSubmitEditing={runSearch}
                  returnKeyType="search"
                  autoCorrect={false}
                />
                <MaterialCommunityIcons name="magnify" size={I(17)} color={C.textText} />
              </View>

              <Pressable
                onPress={runSearch}
                accessibilityRole="button"
                accessibilityLabel="Kërko"
                style={({ pressed }) => [styles.searchBtn, pressed && styles.pressed]}
              >
                <Text style={styles.searchBtnText}>Kërko</Text>
              </Pressable>
            </View>

            {/* ── List ──────────────────────────────────────────── */}
            <View style={styles.scrollHint} accessibilityElementsHidden importantForAccessibility="no">
              <MaterialCommunityIcons name="gesture-swipe-horizontal" size={I(14)} color={C.grayText} />
              <Text style={styles.scrollHintText}>Rrëshqit anash për më shumë kolona</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.head}>
                <Text
                  style={styles.headText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  List
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
                    <Text style={[styles.th, styles.thLeft, { width: COL_NAME }]}>Emri</Text>
                    <Text style={[styles.th, { width: COL_TEAM }]}>Ekipi</Text>
                    <Text style={[styles.th, { width: COL_PERIOD }]}>Periudha</Text>
                    <Text style={[styles.th, { width: COL_AMOUNT }]}>Shuma</Text>
                    <Text style={[styles.th, { width: COL_DUE }]}>Afati</Text>
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
                  ) : rows.map((r, i) => {
                    const unpaid = !r.paid;

                    return (
                      <View key={`${r.id}-${i}`} style={[styles.tr, styles.trBorder]}>
                        <Text
                          style={[styles.tdName, styles.thLeft, { width: COL_NAME }]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          {r.name}
                        </Text>
                        <Text style={[styles.td, { width: COL_TEAM }]} numberOfLines={1}>
                          {r.team}
                        </Text>
                        <Text style={[styles.td, { width: COL_PERIOD }]} numberOfLines={1}>
                          {r.period}
                        </Text>
                        <Text style={[styles.td, { width: COL_AMOUNT }]} numberOfLines={1}>
                          {r.amount}
                        </Text>
                        <Text style={[styles.td, { width: COL_DUE }]} numberOfLines={1}>
                          {r.due}
                        </Text>
                        <Text
                          style={[
                            styles.td,
                            styles.tdStatus,
                            { width: COL_STATUS, color: STATUS_TONE[r.status] ?? C.hint },
                          ]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          {r.status}
                        </Text>

                        <View style={[styles.colAction, { width: COL_ACTION }]}>
                          {unpaid ? (
                            /* Nothing owed has been registered yet, so the row
                               carries the action that clears it. */
                            <Pressable
                              onPress={() =>
                                router.push({
                                  pathname: '/regjistro-pagesen-financierit',
                                  params: {
                                    id: String(r.id),
                                    playerId: r.playerId != null ? String(r.playerId) : '',
                                    name: r.name,
                                    team: r.team,
                                    period: r.period,
                                    amount: r.amount,
                                    due: r.due,
                                    status: r.status,
                                  },
                                })
                              }
                              accessibilityRole="button"
                              accessibilityLabel={`Regjistro pagesën e ${r.name}`}
                              hitSlop={{ top: 7, bottom: 7, left: 3, right: 3 }}
                              style={({ pressed }) => [styles.actReg, pressed && styles.pressed]}
                            >
                              <Text
                                style={styles.actRegText}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                minimumFontScale={0.8}
                              >
                                Regjistro pagesën
                              </Text>
                            </Pressable>
                          ) : (
                            <Pressable
                              onPress={() =>
                                router.push({
                                  pathname: '/detajet-pageses-financierit',
                                  params: {
                                    id: String(r.id),
                                    playerId: r.playerId != null ? String(r.playerId) : '',
                                    name: r.name,
                                    team: r.team,
                                    period: r.period,
                                    amount: r.amount,
                                    due: r.due,
                                    status: r.status,
                                  },
                                })
                              }
                              accessibilityRole="button"
                              accessibilityLabel={`Shiko ${r.name}`}
                              hitSlop={{ top: 7, bottom: 7, left: 3, right: 3 }}
                              style={({ pressed }) => [styles.actShiko, pressed && styles.pressed]}
                            >
                              <Text style={styles.actShikoText}>Shiko</Text>
                            </Pressable>
                          )}
                        </View>
                      </View>
                    );
                  })}
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

    /* ── Team dropdown ───────────────────────────────────────── */
    pickRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: 12,
    },

    pickRowOpen: {
      zIndex: 30,
      elevation: 30,
    },

    pickWrap: {
      width: 152,
    },

    pickBox: {
      height: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
      paddingHorizontal: 10,
      backgroundColor: C.blue1Fill,
      borderWidth: 1,
      borderColor: C.frameBorder,
      borderRadius: 10,
    },

    pickText: {
      flex: 1,
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.textText,
    },

    /* Floats over the table so opening it moves nothing. */
    pickOpts: {
      position: 'absolute',
      top: 47,
      left: 0,
      right: 0,
      zIndex: 40,
      elevation: 12,
      backgroundColor: C.whiteFill,
      borderWidth: 1,
      borderColor: C.frameBorder,
      borderRadius: 8,
      overflow: 'hidden',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
    },

    pickOpt: {
      minHeight: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },

    pickOptActive: {
      backgroundColor: C.blue1Fill,
    },

    pickOptText: {
      fontFamily: Fonts.body,
      fontSize: 12.5,
      color: C.textText,
    },

    pickOptTextActive: {
      fontFamily: Fonts.bodyBold,
      color: C.blueBtnText,
    },

    /* ── Search ──────────────────────────────────────────────── */
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
    },

    /* The field wears the magnifier on its right edge. */
    searchBar: {
      flex: 1,
      height: 44,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      backgroundColor: C.whiteFill,
      borderWidth: 1,
      borderColor: C.frameBorder,
      borderRadius: 10,
    },

    searchInput: {
      flex: 1,
      paddingHorizontal: 0,
      paddingVertical: 0,
      fontFamily: Fonts.body,
      fontSize: 14,
      color: C.textText,
    },

    searchBtn: {
      height: 44,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.blue1Fill,
      borderWidth: 1,
      borderColor: C.frameBorder,
      borderRadius: 10,
    },

    searchBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      color: C.textText,
    },

    /* ── Card ────────────────────────────────────────────────── */
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

    card: {
      marginTop: 14,
      backgroundColor: C.blue2Fill,
      borderWidth: 2,
      borderColor: C.rowLineBorder,
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
      minHeight: 44,
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

    /* The dropdown's fill and rim — the row's one action while the fee is
       still owed. */
    actReg: {
      height: 30,
      paddingHorizontal: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.blue1Fill,
      borderWidth: 1,
      borderColor: C.frameBorder,
      borderRadius: 6,
    },

    actRegText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 9.5,
      color: C.textText,
    },

    /* Clear fill, black rim and black label — the settled row's one action. */
    actShiko: {
      height: 30,
      paddingHorizontal: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.frameBorder,
      borderRadius: 6,
    },

    actShikoText: {
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

    pressed: {
      opacity: 0.5,
    },
  }),
);
