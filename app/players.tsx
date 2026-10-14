import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
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
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import { listPlayers, playerStats } from '@/lib/api/players';
import { listTeams } from '@/lib/api/teams';
import type { ApiPlayer, ApiTeam, Paginated, PlayerStats } from '@/lib/api/types';
import { POSITIONS, positionLabel } from '@/lib/player-position';
import { statusLabel } from '@/lib/player-status';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * Lojtarët — opened from the "Lojtarët" card on the admin dashboard.
 *
 * Four orange-outlined summary squares, the "Lojtari i ri" action, the
 * "Të gjithë lojtarët" table (filters + rows, both scrollable sideways)
 * with its pager, then the Statistikat / Vlerësimet cards.
 *
 * The squares come from `GET /players/stats`; the table from the paginated
 * `GET /players`, whose `team_id` / `position` / `health_status` /
 * `account_status` filters back the four filter boxes.
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

/** ISO date → `dd/MM/yyyy`; a missing/unparseable date renders as a dash. */
function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getFullYear()}`;
}

/** A short run of page numbers centred on `current`. */
function pageWindow(current: number, last: number, span = 5): number[] {
  if (last <= span) return Array.from({ length: last }, (_, i) => i + 1);
  let start = Math.max(1, current - Math.floor(span / 2));
  const end = Math.min(last, start + span - 1);
  start = Math.max(1, end - span + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function errorText(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return 'Nuk mund të lidhemi me serverin. Kontrollo lidhjen.';
    return error.message;
  }
  return 'Diçka shkoi keq. Provo përsëri.';
}

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

type FilterKey = 'team' | 'position' | 'status' | 'account';

type FilterState = {
  team: 'all' | number;
  position: string;
  status: string;
  account: string;
};

const STATUS_OPTIONS = [
  { value: 'active', label: 'Aktiv' },
  { value: 'injured', label: 'I lënduar' },
  { value: 'rehabilitation', label: 'Rehab' },
  { value: 'suspended', label: 'I pezulluar' },
];

/** The backend lists active accounts unless asked for inactive ones. */
const ACCOUNT_OPTIONS = [
  { value: 'active', label: 'Aktiv' },
  { value: 'inactive', label: 'Joaktiv' },
];

const FILTER_KEYS: { key: FilterKey; fallback: string }[] = [
  { key: 'team', fallback: 'Të gjitha ekipet' },
  { key: 'position', fallback: 'Të gjitha pozicionet' },
  { key: 'status', fallback: 'Të gjitha statuset' },
  { key: 'account', fallback: 'Llogaria' },
];

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

export default function PlayersScreen() {
  const router = useRouter();
  const { token, signOut } = useSession();

  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [players, setPlayers] = useState<ApiPlayer[]>([]);
  const [meta, setMeta] = useState<Paginated<ApiPlayer>['meta'] | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput, 300);
  const [filters, setFilters] = useState<FilterState>({
    team: 'all',
    position: 'all',
    status: 'all',
    account: 'active',
  });
  const [openFilter, setOpenFilter] = useState<FilterKey | null>(null);
  const [teams, setTeams] = useState<ApiTeam[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [resultKey, setResultKey] = useState<string | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(null);

  const filterKey = `${filters.team}|${filters.position}|${filters.status}|${filters.account}`;

  // Loading and error are *derived* from which request the current rows settled
  // for, so the fetch effect never calls setState synchronously (which would
  // trigger cascading renders). `players` is only replaced on success, so the
  // prior rows stay put while a page/search refetch is in flight.
  const requestKey = `${page}|${search}|${filterKey}|${reloadKey}`;
  const listError = error?.key === requestKey ? error.message : null;
  const listLoading = token != null && resultKey !== requestKey && listError === null;

  // Summary counts + the team filter's options — a one-shot, independent of the
  // table's paging/search.
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    Promise.allSettled([playerStats(token, controller.signal), listTeams(token, controller.signal)]).then(
      ([statsRes, teamsRes]) => {
        if (controller.signal.aborted) return;
        if (statsRes.status === 'fulfilled') setStats(statsRes.value);
        if (teamsRes.status === 'fulfilled') setTeams(teamsRes.value.data);
        // On failure the squares stay at "—" and the team filter keeps its
        // "Të gjitha ekipet" default; the table carries its own error state.
      },
    );
    return () => controller.abort();
  }, [token, reloadKey]);

  // The table. An abort is indistinguishable from a timeout (both surface as
  // status 0), so we guard on our own signal rather than the error type.
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    listPlayers(
      token,
      {
        page,
        search,
        team_id: filters.team === 'all' ? undefined : filters.team,
        position: filters.position === 'all' ? undefined : filters.position,
        health_status: filters.status === 'all' ? undefined : filters.status,
        account_status: filters.account,
      },
      controller.signal,
    )
      .then((res) => {
        if (controller.signal.aborted) return;
        setPlayers(res.data);
        setMeta(res.meta);
        setResultKey(requestKey);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          signOut();
          router.replace('/login');
          return;
        }
        setError({ key: requestKey, message: errorText(err) });
      });

    return () => controller.abort();
  }, [token, page, search, filters, requestKey, signOut, router]);

  const applyFilter = (key: FilterKey, value: string | number) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
    setOpenFilter(null);
  };

  const filterLabel = (key: FilterKey, fallback: string): string => {
    if (key === 'team') {
      return filters.team === 'all'
        ? fallback
        : teams.find((t) => t.id === filters.team)?.name ?? fallback;
    }
    if (key === 'position') {
      return filters.position === 'all' ? fallback : positionLabel(filters.position);
    }
    if (key === 'status') {
      return STATUS_OPTIONS.find((o) => o.value === filters.status)?.label ?? fallback;
    }
    return ACCOUNT_OPTIONS.find((o) => o.value === filters.account)?.label ?? fallback;
  };

  const filterItems = (key: FilterKey): { value: string | number; label: string }[] => {
    if (key === 'team') {
      return [
        { value: 'all', label: 'Të gjitha ekipet' },
        ...teams.map((t) => ({ value: t.id, label: t.name })),
      ];
    }
    if (key === 'position') {
      return [
        { value: 'all', label: 'Të gjitha pozicionet' },
        ...POSITIONS.map((p) => ({ value: p.code, label: p.label })),
      ];
    }
    return key === 'status' ? STATUS_OPTIONS : ACCOUNT_OPTIONS;
  };

  const selectedFilterValue = (key: FilterKey): string | number => {
    if (key === 'team') return filters.team;
    if (key === 'position') return filters.position;
    if (key === 'status') return filters.status;
    return filters.account;
  };

  const summary: SummarySquare[] = [
    { label: 'Lojtarë gjithsej', value: stats ? String(stats.total) : '—', hint: 'kategori aktive' },
    { label: 'Lojtarët aktiv', value: stats ? String(stats.active) : '—', hint: 'gati për lojë' },
    {
      label: 'Lojtarët e lënduar',
      value: stats ? String(stats.injured) : '—',
      hint: stats ? `+${stats.rehabilitation} në rehab` : 'në rehab',
      tone: C.red,
    },
    {
      label: 'Lojtarët e pezulluar',
      value: stats ? String(stats.suspended) : '—',
      hint: 'nga loja',
      tone: C.orange,
    },
  ];

  const current = meta?.current_page ?? 1;
  const lastPage = meta?.last_page ?? 1;
  const pages = pageWindow(current, lastPage);

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
                <Text style={styles.title}>Lojtarët</Text>
                <Text style={styles.subtitle}>
                  {stats ? `${stats.total} lojtarë gjithsej` : '—'}
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
          {/* ── Summary squares ─────────────────────────────────── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.summaryRow}
          >
            {summary.map((s) => (
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
                <MaterialCommunityIcons name="plus" size={I(15)} color="#F5F5F5" />
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
                  value={searchInput}
                  onChangeText={(text) => {
                    setSearchInput(text);
                    setPage(1);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {FILTER_KEYS.map(({ key, fallback }) => (
                  <Pressable
                    key={key}
                    onPress={() => setOpenFilter((cur) => (cur === key ? null : key))}
                    accessibilityRole="button"
                    accessibilityLabel={`Filtro: ${filterLabel(key, fallback)}`}
                    style={({ pressed }) => [
                      styles.filterBox,
                      openFilter === key && styles.filterBoxOpen,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.filterText} numberOfLines={1}>
                      {filterLabel(key, fallback)}
                    </Text>
                    <MaterialCommunityIcons
                      name={openFilter === key ? 'chevron-up' : 'chevron-down'}
                      size={I(14)}
                      color={C.gray}
                    />
                  </Pressable>
                ))}
              </ScrollView>

              {/* The open filter's options — an inline strip so nothing clips
                  and every option stays tappable on Android. */}
              {openFilter ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  bounces={false}
                  contentContainerStyle={styles.filterOptsRow}
                >
                  {filterItems(openFilter).map((item) => {
                    const active = item.value === selectedFilterValue(openFilter);
                    return (
                      <Pressable
                        key={String(item.value)}
                        onPress={() => applyFilter(openFilter, item.value)}
                        accessibilityRole="button"
                        accessibilityLabel={item.label}
                        style={({ pressed }) => [
                          styles.filterChip,
                          active && styles.filterChipActive,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text
                          style={[styles.filterChipText, active && styles.filterChipTextActive]}
                          numberOfLines={1}
                        >
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : null}

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

                  {players.map((p) => {
                    const team = p.team?.name ?? '—';
                    const nr = p.jersey_number != null ? String(p.jersey_number) : '—';
                    return (
                      <View key={p.id} style={[styles.tr, styles.trBorder]}>
                        <Text style={[styles.td, { width: COLS[0].width }]}>{nr}</Text>
                        <Text
                          style={[styles.td, { width: COLS[1].width, textAlign: 'left' }]}
                          numberOfLines={1}
                        >
                          {p.name ?? '—'}
                        </Text>
                        <Text
                          style={[styles.td, { width: COLS[2].width }]}
                          numberOfLines={1}
                        >
                          {positionLabel(p.position)}
                        </Text>
                        <Text
                          style={[styles.td, { width: COLS[3].width }]}
                          numberOfLines={1}
                        >
                          {team}
                        </Text>
                        <Text
                          style={[styles.td, { width: COLS[4].width }]}
                          numberOfLines={1}
                        >
                          {statusLabel(p.health_status)}
                        </Text>
                        <Text style={[styles.td, { width: COLS[5].width }]}>
                          {formatDate(p.contract_end)}
                        </Text>
                        <View style={[styles.rowActions, { width: ACTIONS_W }]}>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Shto"
                            style={({ pressed }) => [styles.rowBtn, pressed && styles.pressed]}
                          >
                            <Text style={styles.rowBtnText}>Shto</Text>
                          </Pressable>
                          <Pressable
                            onPress={() =>
                              router.push({
                                pathname: '/edit-player',
                                params: { name: p.name ?? '', team, nr },
                              })
                            }
                            accessibilityRole="button"
                            accessibilityLabel="Edito"
                            style={({ pressed }) => [styles.rowBtn, pressed && styles.pressed]}
                          >
                            <Text style={styles.rowBtnText}>Edito</Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>

              {/* Loading / empty / error — kept inside the card so the table
                  frame stays put while a refetch is in flight. */}
              {listError ? (
                <View style={styles.stateRow}>
                  <Text style={styles.stateText}>{listError}</Text>
                  <Pressable
                    onPress={() => setReloadKey((k) => k + 1)}
                    accessibilityRole="button"
                    accessibilityLabel="Provo përsëri"
                    style={({ pressed }) => [styles.retryBtn, pressed && styles.pressed]}
                  >
                    <Text style={styles.retryText}>Provo përsëri</Text>
                  </Pressable>
                </View>
              ) : listLoading && players.length === 0 ? (
                <View style={styles.stateRow}>
                  <ActivityIndicator color={C.blueBtn} />
                </View>
              ) : players.length === 0 ? (
                <View style={styles.stateRow}>
                  <Text style={styles.stateText}>Asnjë lojtar nuk u gjet.</Text>
                </View>
              ) : null}
            </View>

            {/* ── Pager ─────────────────────────────────────────── */}
            {lastPage > 1 ? (
              <View style={styles.pager}>
                <Pressable
                  onPress={() => setPage(current - 1)}
                  disabled={current <= 1}
                  accessibilityRole="button"
                  accessibilityLabel="Faqja e mëparshme"
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.pagerArrow,
                    current <= 1 && styles.pagerDisabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialCommunityIcons name="chevron-left" size={I(22)} color={C.text} />
                </Pressable>

                {pages.map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => setPage(p)}
                    accessibilityRole="button"
                    accessibilityLabel={`Faqja ${p}`}
                    style={({ pressed }) => [
                      p === current ? styles.pageSqActive : styles.pageSq,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.pageSqText}>{p}</Text>
                  </Pressable>
                ))}

                <Pressable
                  onPress={() => setPage(current + 1)}
                  disabled={current >= lastPage}
                  accessibilityRole="button"
                  accessibilityLabel="Faqja tjetër"
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.pagerArrow,
                    current >= lastPage && styles.pagerDisabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialCommunityIcons name="chevron-right" size={I(22)} color={C.text} />
                </Pressable>
              </View>
            ) : null}

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
      backgroundColor: '#F5F5F5',
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

    filterBoxOpen: {
      borderColor: C.orange,
    },

    /* ── Filter options (inline strip under an open filter) ───── */
    filterOptsRow: {
      paddingHorizontal: 8,
      paddingBottom: 10,
      gap: 6,
    },

    filterChip: {
      height: 28,
      justifyContent: 'center',
      paddingHorizontal: 11,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: C.ghostLine,
      backgroundColor: '#FFFFFF',
    },

    filterChipActive: {
      backgroundColor: C.blueBtn,
      borderColor: C.blueBtn,
    },

    filterChipText: {
      fontFamily: Fonts.body,
      fontSize: 11.5,
      color: C.gray,
    },

    filterChipTextActive: {
      fontFamily: Fonts.bodySemiBold,
      color: '#FFFFFF',
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

    td: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 16,
      color: C.text,
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

    /* ── Loading / empty / error ─────────────────────────────── */
    stateRow: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 18,
    },

    stateText: {
      fontFamily: Fonts.body,
      fontSize: 12.5,
      color: C.gray,
      textAlign: 'center',
    },

    retryBtn: {
      height: 30,
      paddingHorizontal: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.ghostLine,
      borderRadius: 4,
    },

    retryText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      color: C.text,
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

    pagerDisabled: {
      opacity: 0.3,
    },

    pageSq: {
      width: 34,
      height: 34,
      borderRadius: 5,
      backgroundColor: C.blueBtn,
      alignItems: 'center',
      justifyContent: 'center',
    },

    pageSqActive: {
      width: 34,
      height: 34,
      borderRadius: 5,
      backgroundColor: '#4E90D8',
      alignItems: 'center',
      justifyContent: 'center',
    },

    pageSqText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 14,
      color: '#F5F5F5',
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
      color: '#F5F5F5',
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
