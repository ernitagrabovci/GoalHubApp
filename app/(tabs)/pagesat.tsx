import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { RegisterPaymentModal } from '@/components/finance/register-payment-modal';
import { Fonts } from '@/constants/theme';
import { ApiError, loadErrorMessage } from '@/lib/api/errors';
import { financeStats, listFees } from '@/lib/api/finance';
import { listTeams } from '@/lib/api/teams';
import type {
  ApiFee,
  ApiTeam,
  FinanceStats,
  Paginated,
} from '@/lib/api/types';
import { STATUS_LABEL, STATUS_TONE } from '@/lib/finance';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';
import { useAppColors, usePaletteStyles, type AppColorsOf } from '@/lib/app-theme';
import { useGlass } from '@/lib/glass';

/**
 * Kuota e anëtarësisë — the admin's "Pagesat" tab. Three headline counts, the
 * team filter / register controls, a search row and the per-player quota table.
 */

const C_LIGHT = {
  white: '#FFFFFF',
  frame: '#DCE5DF',
  glassBase: 'rgba(255,255,255,0.12)',
  glassEdge: 'rgba(255,255,255,0.95)',
  glassDivider: 'rgba(16,51,38,0.18)',
  page: '#F7F9F8',
  line: 'rgba(0,0,0,0.025)',

  text: '#17251E',
  gray: '#52645A',
  hint: '#6E6E6E',
  ghost: '#9E9E9E',
  /* Black affordances (chevrons) that invert on the dark page. */
  ink: '#000000',

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

  /* Pastel "Raporti" promo pane and its rim. */
  raportiBg: '#E8F3FF',
  raportiBorder: '#C6E0FA',
};

const IMG = {
  pagesatArt: require('@/assets/dashboard/pagesat-art.png'),
};

/**
 * The squares sit on a near-white page, so a white frost on its own reads as
 * nothing. Shading the pane instead — a very light grey at the top edge
 * sweeping down to white — is what gives the surface its glassy shape.
 */
/** 16840 → "€16,840" — grouped thousands, no cents. */
function usd(n: number) {
  return `€${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/* Table columns — fixed widths so nothing gets squeezed; the frame scrolls. */
const COL_NAME = 104;
const COL_TEAM = 62;
const COL_QUOTA = 62;
const COL_COLLECTED = 70;
const COL_PENDING = 62;
const COL_STATUS = 70;
const COL_ACTION = 58;

export default function PaymentsScreen() {
  const glass = useGlass();
  const C = useAppColors(C_LIGHT);
  const styles = usePaletteStyles(createStyles, C);
  const router = useRouter();
  const { token, signOut } = useSession();

  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [fees, setFees] = useState<Paginated<ApiFee> | null>(null);
  const [teams, setTeams] = useState<ApiTeam[]>([]);
  const [teamId, setTeamId] = useState<number | null>(null);
  const [teamOpen, setTeamOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  /** Bumped after a payment is registered, to refetch the stats and the table. */
  const [version, setVersion] = useState(0);

  // Headline totals and the team filter list are one-shots.
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    Promise.allSettled([financeStats(token, controller.signal), listTeams(token, controller.signal)])
      .then(([totals, teamList]) => {
        if (controller.signal.aborted) return;

        const failure = [totals, teamList].find((r) => r.status === 'rejected');
        if (
          failure &&
          failure.status === 'rejected' &&
          failure.reason instanceof ApiError &&
          failure.reason.status === 401
        ) {
          signOut();
          router.replace('/login');
          return;
        }

        if (totals.status === 'fulfilled') setStats(totals.value);
        if (teamList.status === 'fulfilled') setTeams(teamList.value.data);
      });

    return () => controller.abort();
  }, [token, version, router, signOut]);

  /* Refetch from the error box; the effect cannot reset state synchronously. */
  const retry = () => {
    setFees(null);
    setError(null);
    setVersion((value) => value + 1);
  };

  // The table refetches whenever the filters change.
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
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          signOut();
          router.replace('/login');
          return;
        }
        setError(loadErrorMessage(err, 'Nuk mund të ngarkohen pagesat.'));
      });

    return () => controller.abort();
  }, [token, version, page, teamId, search, router, signOut]);

  const summary = [
    {
      label: 'Kuota të mbledhura',
      value: stats ? usd(stats.collected) : '—',
      note: stats ? `${stats.paid} pagesa të kryera` : '—',
      tone: C.green,
    },
    {
      label: 'Pagesat e papaguara',
      value: stats ? String(stats.unpaid) : '—',
      note: 'Brenda afatit',
      tone: C.orange,
    },
    {
      label: 'Pagesat e skaduara',
      value: stats ? String(stats.overdue) : '—',
      note: 'Tolerancë 10 ditësh',
      tone: C.red,
    },
  ];

  const rows = (fees?.data ?? []).map((f) => {
    const amount = usd(Number(f.final_amount) || 0);
    const paid = f.status === 'paid';
    return {
      id: f.id,
      playerId: f.player?.id ?? null,
      name: f.player?.name ?? '—',
      team: f.team?.name ?? '—',
      quota: amount,
      collected: paid ? amount : usd(0),
      pending: paid ? usd(0) : amount,
      status: STATUS_LABEL[f.status] ?? f.status,
    };
  });

  const lastPage = fees?.meta.last_page ?? 0;
  const pages = Array.from({ length: lastPage }, (_, i) => i + 1);
  const selectedTeam = teams.find((t) => t.id === teamId)?.name ?? 'Të gjitha ekipet';

  const pickTeam = (id: number | null) => {
    setTeamId(id);
    setPage(1);
    setTeamOpen(false);
  };

  const runSearch = () => {
    setSearch(query);
    setPage(1);
  };

  const reload = () => setVersion((v) => v + 1);

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
                <Text style={styles.title} numberOfLines={1}>
                  Kuota e anëtarësisë
                </Text>
                <Text
                  style={styles.subtitle}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  Menaxhimi i pagesave të lojtarëve ·{' '}
                  <Text style={styles.subtitleStrong}>Toleranca: 10 ditë</Text>
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

              {summary.map((s, i) => (
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
                      {s.note}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.colPad}>
            {/* ── Raporti ───────────────────────────────────────── */}
            <Pressable
              onPress={() => router.push('/raporti-pagesave')}
              accessibilityRole="button"
              accessibilityLabel="Raporti i pagesave"
              style={({ pressed }) => [styles.raporti, pressed && styles.pressed]}
            >
              {/* Art bleeds off both edges; the right copy is mirrored. */}
              <Image source={IMG.pagesatArt} style={styles.raportiArtLeft} resizeMode="contain" />
              <Image source={IMG.pagesatArt} style={styles.raportiArtRight} resizeMode="contain" />

              <View style={styles.raportiBody}>
                <Text style={styles.raportiTitle} numberOfLines={1}>
                  Raporti
                </Text>

                <View style={styles.raportiBtn}>
                  <Text style={styles.raportiBtnText}>Vazhdo</Text>
                </View>
              </View>
            </Pressable>

            {/* ── Filter / register ─────────────────────────────── */}
            <View style={styles.actions}>
              <View>
                <Pressable
                  onPress={() => setTeamOpen((o) => !o)}
                  accessibilityRole="button"
                  accessibilityLabel="Filtro sipas ekipit"
                  style={({ pressed }) => [styles.controlBtn, pressed && styles.pressed]}
                >
                  <Text style={styles.controlText} numberOfLines={1}>
                    {selectedTeam}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={I(14)} color={C.inkText} />
                </Pressable>

                {teamOpen ? (
                  <View style={styles.teamOpts}>
                    <Pressable
                      onPress={() => pickTeam(null)}
                      accessibilityRole="button"
                      style={styles.teamOpt}
                    >
                      <Text
                        style={[styles.teamOptText, teamId === null && styles.teamOptTextOn]}
                        numberOfLines={1}
                      >
                        Të gjitha ekipet
                      </Text>
                    </Pressable>
                    {teams.map((t) => (
                      <Pressable
                        key={t.id}
                        onPress={() => pickTeam(t.id)}
                        accessibilityRole="button"
                        style={styles.teamOpt}
                      >
                        <Text
                          style={[styles.teamOptText, teamId === t.id && styles.teamOptTextOn]}
                          numberOfLines={1}
                        >
                          {t.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>

              <Pressable
                onPress={() => setRegistering(true)}
                accessibilityRole="button"
                accessibilityLabel="Regjistro pagesën"
                style={({ pressed }) => [styles.controlBtn, pressed && styles.pressed]}
              >
                <View style={styles.plusCircle}>
                  <MaterialCommunityIcons name="plus" size={I(15)} color="#FFFFFF" />
                </View>
                <Text style={styles.controlText}>Regjistro pagesën</Text>
              </Pressable>
            </View>

            {/* ── Search ────────────────────────────────────────── */}
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchBox}
                placeholder="Kërko me emër lojtarin"
                placeholderTextColor={C.ghostText}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={runSearch}
                returnKeyType="search"
                autoCorrect={false}
              />
              <Pressable
                onPress={runSearch}
                accessibilityRole="button"
                accessibilityLabel="Kërko"
                style={({ pressed }) => [styles.searchBtn, pressed && styles.pressed]}
              >
                <Text style={styles.searchBtnText}>Kërko</Text>
              </Pressable>
            </View>

            {/* ── Pagesat e lojtarëve ───────────────────────────── */}
            <View style={styles.scrollHint} accessibilityElementsHidden importantForAccessibility="no">
              <MaterialCommunityIcons name="gesture-swipe-horizontal" size={I(14)} color={C.grayText} />
              <Text style={styles.scrollHintText}>Rrëshqit anash për më shumë kolona</Text>
            </View>

            <View style={styles.card}>
              <View style={styles.head}>
                <Text style={styles.headText}>Pagesat e lojtarëve</Text>
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
                    <Text style={[styles.th, { width: COL_QUOTA }]}>Kuota</Text>
                    <Text style={[styles.th, { width: COL_COLLECTED }]}>Mbledhur</Text>
                    <Text style={[styles.th, { width: COL_PENDING }]}>Në pritje</Text>
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
                      <Text style={styles.td}>Duke ngarkuar pagesat…</Text>
                    </View>
                  ) : rows.length === 0 ? (
                    <View style={styles.tr}>
                      <Text style={[styles.td, styles.thLeft]}>Nuk ka pagesa.</Text>
                    </View>
                  ) : rows.map((p) => (
                    <View key={p.id} style={[styles.tr, styles.trBorder]}>
                      <Text
                        style={[styles.tdName, styles.thLeft, { width: COL_NAME }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                      >
                        {p.name}
                      </Text>
                      <Text
                        style={[styles.td, { width: COL_TEAM }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                      >
                        {p.team}
                      </Text>
                      <Text style={[styles.td, { width: COL_QUOTA }]} numberOfLines={1}>
                        {p.quota}
                      </Text>
                      <Text style={[styles.td, { width: COL_COLLECTED }]} numberOfLines={1}>
                        {p.collected}
                      </Text>
                      <Text style={[styles.td, { width: COL_PENDING }]} numberOfLines={1}>
                        {p.pending}
                      </Text>
                      <Text
                        style={[
                          styles.td,
                          styles.tdStatus,
                          { width: COL_STATUS, color: STATUS_TONE[p.status] ?? C.hint },
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                      >
                        {p.status}
                      </Text>
                      <View style={[styles.colAction, { width: COL_ACTION }]}>
                        <Pressable
                          onPress={() =>
                            router.push({
                              pathname: '/pagesa-lojtari',
                              params: {
                                name: p.name,
                                team: p.team,
                                playerId: p.playerId != null ? String(p.playerId) : '',
                              },
                            })
                          }
                          accessibilityRole="button"
                          accessibilityLabel={`Shiko pagesën e ${p.name}`}
                          hitSlop={{ top: 7, bottom: 7, left: 4, right: 4 }}
                          style={({ pressed }) => [styles.viewBtn, pressed && styles.pressed]}
                        >
                          <Text style={styles.viewBtnText}>Shiko</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
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
                  hitSlop={11}
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
                  hitSlop={11}
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

      {registering ? (
        <View style={styles.ovWrap}>
          <BlurView style={styles.ovFill} intensity={45} tint="dark" />
          <Pressable
            style={[styles.ovFill, styles.ovDim]}
            onPress={() => setRegistering(false)}
            accessibilityRole="button"
            accessibilityLabel="Mbylle dritaren"
          />
          <RegisterPaymentModal
            teams={teams}
            onClose={() => setRegistering(false)}
            onSaved={() => {
              setRegistering(false);
              reload();
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

    subtitleStrong: {
      fontFamily: Fonts.bodyBold,
      color: C.textText,
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

    /* ── Raporti ─────────────────────────────────────────────── */
    /* Same pastel pane as the "Statistikat" card on the players screen,
       full-width with the art bleeding off both edges. */
    raporti: {
      height: 104,
      marginTop: 16,
      position: 'relative',
      backgroundColor: C.raportiBgFill,
      borderWidth: 1,
      borderColor: C.raportiBorderBorder,
      borderRadius: 9,
      overflow: 'hidden',
    },

    raportiArtLeft: {
      position: 'absolute',
      width: 88,
      height: 125,
      left: -29,
      bottom: -15,
      zIndex: 1,
    },

    raportiArtRight: {
      position: 'absolute',
      width: 88,
      height: 125,
      right: -29,
      bottom: -15,
      zIndex: 1,
      transform: [{ scaleX: -1 }],
    },

    /* Title pinned top, button pinned bottom, both on the centre line. */
    raportiBody: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 9,
      paddingBottom: 9,
      zIndex: 3,
    },

    raportiTitle: {
      fontFamily: Fonts.bodyBlack,
      fontSize: 26,
      lineHeight: 30,
      letterSpacing: 0.5,
      color: C.textText,
    },

    raportiBtn: {
      minWidth: 76,
      height: 28,
      borderRadius: 5,
      paddingHorizontal: 12,
      backgroundColor: '#78B8F5',
      alignItems: 'center',
      justifyContent: 'center',
    },

    raportiBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11,
      lineHeight: 14,
      color: '#FFFFFF',
    },

    /* ── Filter / register ───────────────────────────────────── */
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
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
      fontSize: 13,
      color: C.textText,
    },

    /* In-flow dropdown that opens under the team-filter button. */
    teamOpts: {
      position: 'absolute',
      top: 48,
      left: 0,
      minWidth: 150,
      zIndex: 5,
      backgroundColor: C.whiteFill,
      borderWidth: 1,
      borderColor: C.frameBorder,
      borderRadius: 10,
      overflow: 'hidden',
    },

    teamOpt: {
      height: 44,
      justifyContent: 'center',
      paddingHorizontal: 12,
    },

    teamOptText: {
      fontFamily: Fonts.body,
      fontSize: 13,
      color: C.textText,
    },

    teamOptTextOn: {
      fontFamily: Fonts.bodySemiBold,
      color: C.greenText,
    },

    /* ── Search ──────────────────────────────────────────────── */
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
    },

    searchBox: {
      flex: 1,
      height: 44,
      backgroundColor: C.whiteFill,
      borderWidth: 1,
      borderColor: C.frameBorder,
      borderRadius: 10,
      paddingHorizontal: 12,
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
      backgroundColor: C.blueSoftFill,
      borderWidth: 1,
      borderColor: C.frameBorder,
      borderRadius: 10,
    },

    searchBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13,
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

    pressed: {
      opacity: 0.5,
    },

    /* ── Popup shell ─────────────────────────────────────────── */
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

  }),
);
