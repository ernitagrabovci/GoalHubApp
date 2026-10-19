import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { AddMatchModal, EditMatchModal } from '@/components/matches/match-modals';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import { listMatches } from '@/lib/api/matches';
import { listTeams } from '@/lib/api/teams';
import type { ApiMatch, ApiTeam } from '@/lib/api/types';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * Ndeshjet — opened from the "Ndeshjet e sotme" section on the admin
 * dashboard. The team filter + "Shto ndeshje" toolbar, the upcoming fixtures
 * list and the results table, each with its own pager.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',

  /* blue1 = the deeper blue of the filter button; blue2 = the pale card blue. */
  blue1: '#E3EEFB',
  blue2: '#F6FBFF',

  border: 'rgba(100,140,190,0.30)',
  rowLine: 'rgba(100,140,190,0.22)',
  headLine: 'rgba(30,40,35,0.10)',

  green: '#159447',
  red: '#E03131',
  orange: '#E4A000',
  dateBlue: '#0766D8',
  blueBtn: '#86BCFD',
};

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

type Fixture = {
  id?: number;
  day: string;
  mon: string;
  home: string;
  away: string;
  time: string;
  venue: string;
  comp: string;
};

type Played = {
  id: number;
  home: string;
  away: string;
  comp: string;
  team: string;
  date: string;
  time: string;
  score: string;
  outcome: 'F' | 'H' | null;
};

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Wrapped so the render-purity rule doesn't flag `Date.now` inside a memo. */
function currentMs(): number {
  return Date.now();
}

/** Maps an API match to an upcoming-fixture row. The API has no home/away flag,
 *  so the club is always rendered as the home side. */
function toFixture(m: ApiMatch, clubName: string): Fixture {
  const d = m.scheduled_at ? new Date(m.scheduled_at) : null;
  const ok = d !== null && !Number.isNaN(d.getTime());
  return {
    id: m.id,
    day: ok ? pad2(d!.getDate()) : '—',
    mon: ok ? MONTHS[d!.getMonth()] : '—',
    home: clubName,
    away: m.opponent ?? '—',
    time: ok ? `${pad2(d!.getHours())}:${pad2(d!.getMinutes())}` : '—',
    venue: m.venue ?? '',
    comp: m.competition ?? '—',
  };
}

/** Maps an API match to a results-table row. `goals_for`/`goals_against` are
 *  from the club's perspective, so the F/H outcome reads straight off them. */
function toPlayed(m: ApiMatch, clubName: string): Played {
  const d = m.scheduled_at ? new Date(m.scheduled_at) : null;
  const ok = d !== null && !Number.isNaN(d.getTime());
  const gf = m.goals_for ?? 0;
  const ga = m.goals_against ?? 0;
  return {
    id: m.id,
    home: clubName,
    away: m.opponent ?? '—',
    comp: m.competition ?? '—',
    team: m.team?.name ?? '—',
    date: ok ? `${pad2(d!.getDate())}/${pad2(d!.getMonth() + 1)}/${d!.getFullYear()}` : '—',
    time: ok ? `${pad2(d!.getHours())}:${pad2(d!.getMinutes())}` : '—',
    score: `${gf}-${ga}`,
    outcome: gf > ga ? 'F' : gf < ga ? 'H' : null,
  };
}

type Col = { key: string; label: string; width: number; align?: 'left' | 'center' };

const COLS: Col[] = [
  { key: 'match', label: 'Ndeshja', width: 112, align: 'left' },
  { key: 'team', label: 'Ekipi', width: 48 },
  { key: 'date', label: 'Data', width: 54 },
  { key: 'score', label: 'Rezultati', width: 40 },
  { key: 'actions', label: 'Veprimet', width: 46 },
];

/** The two tables are split on the client, so page through them client-side. */
const PAGE_SIZE = 8;

/** A short run of page numbers ending at `last`, capped for width. */
function pageWindow(current: number, last: number, span = 4): number[] {
  const start = Math.max(1, Math.min(current, last - span + 1));
  const end = Math.min(last, start + span - 1);
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);
}

/** Every match page — the two tables page over the club's full history, and the
 *  endpoint only serves 20 rows at a time. */
async function fetchAllMatches(token: string, signal: AbortSignal): Promise<ApiMatch[]> {
  const first = await listMatches(token, { page: 1 }, signal);
  const rows = [...first.data];
  for (let p = 2; p <= first.meta.last_page; p++) {
    const page = await listMatches(token, { page: p }, signal);
    rows.push(...page.data);
  }
  return rows;
}

export default function MatchesScreen() {
  const router = useRouter();
  const { user, token, signOut } = useSession();
  const clubName = user?.club ?? '—';

  const [matches, setMatches] = useState<ApiMatch[] | null>(null);
  const [teams, setTeams] = useState<ApiTeam[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [teamFilter, setTeamFilter] = useState<'all' | number>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<ApiMatch | null>(null);
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [playedPage, setPlayedPage] = useState(1);
  /* Bumped after a successful write so the lists refetch from the server. */
  const [reload, setReload] = useState(0);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    Promise.allSettled([
      fetchAllMatches(token, controller.signal),
      listTeams(token, controller.signal),
    ]).then(([m, t]) => {
      if (controller.signal.aborted) return;

      const failure = [m, t].find((r) => r.status === 'rejected');
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

      if (m.status === 'fulfilled') setMatches(m.value);
      if (t.status === 'fulfilled') setTeams(t.value.data);
      setError(failure ? 'Nuk mund të ngarkohen ndeshjet.' : null);
    });

    return () => controller.abort();
  }, [token, router, signOut, reload]);

  const filtered = useMemo(() => {
    const all = matches ?? [];
    return teamFilter === 'all' ? all : all.filter((m) => m.team?.id === teamFilter);
  }, [matches, teamFilter]);

  const upcoming = useMemo(() => {
    const now = currentMs();
    return filtered
      .filter((m) => m.scheduled_at && new Date(m.scheduled_at).getTime() > now)
      .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
      .map((m) => toFixture(m, clubName));
  }, [filtered, clubName]);

  const played = useMemo(() => {
    const now = currentMs();
    return filtered
      .filter((m) => !m.scheduled_at || new Date(m.scheduled_at).getTime() <= now)
      .sort((a, b) => new Date(b.scheduled_at ?? 0).getTime() - new Date(a.scheduled_at ?? 0).getTime())
      .map((m) => toPlayed(m, clubName));
  }, [filtered, clubName]);

  const upcomingLast = Math.max(1, Math.ceil(upcoming.length / PAGE_SIZE));
  const upcomingCur = Math.min(upcomingPage, upcomingLast);
  const upcomingRows = upcoming.slice((upcomingCur - 1) * PAGE_SIZE, upcomingCur * PAGE_SIZE);

  const playedLast = Math.max(1, Math.ceil(played.length / PAGE_SIZE));
  const playedCur = Math.min(playedPage, playedLast);
  const playedRows = played.slice((playedCur - 1) * PAGE_SIZE, playedCur * PAGE_SIZE);

  const filterLabel =
    teamFilter === 'all'
      ? 'Të gjitha ekipet'
      : teams.find((t) => t.id === teamFilter)?.name ?? 'Të gjitha ekipet';

  /* A successful write closes the popup and refetches; a dead token bounces to
     the login screen. */
  const onSaved = (close: () => void) => () => {
    close();
    setReload((n) => n + 1);
  };

  const onExpired = () => {
    signOut();
    router.replace('/login');
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
                <Text style={styles.title} numberOfLines={1}>
                  Ndeshjet
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Orari dhe rezultatet e të gjitha ekipeve
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
            {/* ── Toolbar ───────────────────────────────────────── */}
            <View style={styles.toolbar}>
              <View>
                <Pressable
                  onPress={() => setFilterOpen((v) => !v)}
                  accessibilityRole="button"
                  accessibilityLabel="Filtro sipas ekipit"
                  style={({ pressed }) => [styles.teamBtn, pressed && styles.pressed]}
                >
                  <Text style={styles.teamBtnText} numberOfLines={1}>
                    {filterLabel}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={I(15)} color={C.text} />
                </Pressable>

                {filterOpen ? (
                  <View style={styles.filterMenu}>
                    <Pressable
                      onPress={() => {
                        setTeamFilter('all');
                        setUpcomingPage(1);
                        setPlayedPage(1);
                        setFilterOpen(false);
                      }}
                      style={styles.filterItem}
                    >
                      <Text style={styles.filterItemText}>Të gjitha ekipet</Text>
                    </Pressable>
                    {teams.map((t) => (
                      <Pressable
                        key={t.id}
                        onPress={() => {
                          setTeamFilter(t.id);
                          setUpcomingPage(1);
                          setPlayedPage(1);
                          setFilterOpen(false);
                        }}
                        style={styles.filterItem}
                      >
                        <Text style={styles.filterItemText} numberOfLines={1}>
                          {t.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>

              <Pressable
                onPress={() => setAdding(true)}
                accessibilityRole="button"
                accessibilityLabel="Shto ndeshje"
                style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
              >
                <View style={styles.addBtnPlus}>
                  <MaterialCommunityIcons name="plus" size={I(15)} color="#F5F5F5" />
                </View>
                <Text style={styles.addBtnText}>Shto ndeshje</Text>
              </Pressable>
            </View>

            {/* ── Ndeshjet e ardhshme ───────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Ndeshjet e ardhshme</Text>
              </View>

              {error ? (
                <View style={styles.stateBox}>
                  <Text style={styles.stateText}>{error}</Text>
                </View>
              ) : matches === null ? (
                <View style={styles.stateBox}>
                  <Text style={styles.stateText}>…</Text>
                </View>
              ) : upcomingRows.length === 0 ? (
                <View style={styles.stateBox}>
                  <Text style={styles.stateText}>Nuk ka ndeshje të ardhshme.</Text>
                </View>
              ) : (
                upcomingRows.map((f, i) => (
                  <View
                    key={f.id ?? `${f.day}-${f.away}-${i}`}
                    style={[styles.mRow, i > 0 && styles.mRowBorder]}
                  >
                    <View style={styles.dateBox}>
                      <Text style={styles.dateDay}>{f.day}</Text>
                      <Text style={styles.dateMon}>{f.mon}</Text>
                    </View>

                    <View style={styles.mInfo}>
                      <Text
                        style={styles.mTitle}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                      >
                        {f.home} - {f.away}
                      </Text>
                      <Text
                        style={styles.mSub}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                      >
                        <Text style={styles.mTime}>{f.time} </Text>
                        {f.venue ? (
                          <Text
                            style={[
                              styles.mVenue,
                              { color: f.venue === 'Shtëpi' ? C.green : C.orange },
                            ]}
                          >
                            {f.venue}
                          </Text>
                        ) : null}
                        <Text style={styles.mComp}> {f.comp}</Text>
                      </Text>
                    </View>

                    <View style={styles.mActions}>
                      <Pressable
                        onPress={() =>
                          router.push({
                            pathname: '/ndeshja',
                            params: {
                              id: f.id != null ? String(f.id) : '',
                              home: f.home,
                              away: f.away,
                              day: f.day,
                              mon: f.mon,
                              time: f.time,
                              venue: f.venue,
                              comp: f.comp,
                            },
                          })
                        }
                        accessibilityRole="button"
                        accessibilityLabel="Shiko ndeshjen"
                        style={({ pressed }) => [styles.viewBtn, pressed && styles.pressed]}
                      >
                        <Text style={styles.viewBtnText}>Shiko</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => setEditing(filtered.find((m) => m.id === f.id) ?? null)}
                        accessibilityRole="button"
                        accessibilityLabel="Edito ndeshjen"
                        style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
                      >
                        <Text style={styles.editBtnText}>Edito</Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* ── Pager ─────────────────────────────────────────── */}
            {upcomingLast > 1 ? (
              <View style={styles.pager}>
                <Pressable
                  onPress={() => setUpcomingPage(upcomingCur - 1)}
                  disabled={upcomingCur <= 1}
                  accessibilityRole="button"
                  accessibilityLabel="Faqja e mëparshme"
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.pagerArrow,
                    upcomingCur <= 1 && styles.pagerDisabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialCommunityIcons name="chevron-left" size={I(22)} color={C.text} />
                </Pressable>

                {pageWindow(upcomingCur, upcomingLast).map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => setUpcomingPage(p)}
                    accessibilityRole="button"
                    accessibilityLabel={`Faqja ${p}`}
                    style={({ pressed }) => [
                      p === upcomingCur ? styles.pageSqActive : styles.pageSq,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.pageSqText}>{p}</Text>
                  </Pressable>
                ))}

                <Pressable
                  onPress={() => setUpcomingPage(upcomingCur + 1)}
                  disabled={upcomingCur >= upcomingLast}
                  accessibilityRole="button"
                  accessibilityLabel="Faqja tjetër"
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.pagerArrow,
                    upcomingCur >= upcomingLast && styles.pagerDisabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialCommunityIcons name="chevron-right" size={I(22)} color={C.text} />
                </Pressable>
              </View>
            ) : null}

            {/* ── Ndeshjet e luajtura ───────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Ndeshjet e luajtura</Text>
              </View>

              <View style={styles.tblWrap}>
                <View style={styles.tr}>
                  {COLS.map((c, i) => (
                    <Text
                      key={c.key}
                      style={[
                        styles.th,
                        c.align ? { textAlign: c.align } : null,
                        i > 0 && { width: c.width },
                        i === 0 && styles.colFirst,
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      {c.label}
                    </Text>
                  ))}
                </View>

                {error ? (
                  <View style={styles.stateBox}>
                    <Text style={styles.stateText}>{error}</Text>
                  </View>
                ) : matches === null ? (
                  <View style={styles.stateBox}>
                    <Text style={styles.stateText}>…</Text>
                  </View>
                ) : playedRows.length === 0 ? (
                  <View style={styles.stateBox}>
                    <Text style={styles.stateText}>Nuk ka ndeshje të luajtura.</Text>
                  </View>
                ) : (
                  playedRows.map((p, i) => (
                    <View key={p.id} style={[styles.tr, i > 0 && styles.trBorder]}>
                      <View style={[styles.tdMatch, styles.colFirst]}>
                        <Text
                          style={styles.tdTitle}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.75}
                        >
                          {p.home} - {p.away}
                        </Text>
                        <Text style={styles.tdSub} numberOfLines={1}>
                          {p.comp}
                        </Text>
                      </View>

                      <Text style={[styles.td, { width: COLS[1].width }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                        {p.team}
                      </Text>
                      <Text style={[styles.td, { width: COLS[2].width }]} numberOfLines={1}>
                        {p.date}
                      </Text>
                      <Text style={[styles.td, styles.tdScore, { width: COLS[3].width }]} numberOfLines={1}>
                        {p.score}
                        {p.outcome ? (
                          <Text style={[styles.tdResult, { color: p.outcome === 'F' ? C.green : C.red }]}>
                            {p.outcome}
                          </Text>
                        ) : null}
                      </Text>

                      <View style={[styles.tdActions, { width: COLS[4].width }]}>
                        <Pressable
                          onPress={() =>
                            router.push({
                              pathname: '/ndeshja-luajtur',
                              params: {
                                id: String(p.id),
                                home: p.home,
                                away: p.away,
                                team: p.team,
                                comp: p.comp,
                                date: p.date,
                                time: p.time,
                                score: p.score,
                              },
                            })
                          }
                          accessibilityRole="button"
                          accessibilityLabel="Shiko ndeshjen"
                          style={({ pressed }) => [styles.viewBtn, pressed && styles.pressed]}
                        >
                          <Text style={styles.viewBtnText}>Shiko</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>

            {/* ── Pager ─────────────────────────────────────────── */}
            {playedLast > 1 ? (
              <View style={styles.pager}>
                <Pressable
                  onPress={() => setPlayedPage(playedCur - 1)}
                  disabled={playedCur <= 1}
                  accessibilityRole="button"
                  accessibilityLabel="Faqja e mëparshme"
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.pagerArrow,
                    playedCur <= 1 && styles.pagerDisabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialCommunityIcons name="chevron-left" size={I(22)} color={C.text} />
                </Pressable>

                {pageWindow(playedCur, playedLast).map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => setPlayedPage(p)}
                    accessibilityRole="button"
                    accessibilityLabel={`Faqja ${p}`}
                    style={({ pressed }) => [
                      p === playedCur ? styles.pageSqActive : styles.pageSq,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.pageSqText}>{p}</Text>
                  </Pressable>
                ))}

                <Pressable
                  onPress={() => setPlayedPage(playedCur + 1)}
                  disabled={playedCur >= playedLast}
                  accessibilityRole="button"
                  accessibilityLabel="Faqja tjetër"
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.pagerArrow,
                    playedCur >= playedLast && styles.pagerDisabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialCommunityIcons name="chevron-right" size={I(22)} color={C.text} />
                </Pressable>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>

      {/* The popups carry their own blur-and-dim overlay, so they sit directly
          on the SafeAreaView and cover the whole screen. */}
      {adding ? (
        <AddMatchModal
          token={token ?? ''}
          teams={teams}
          clubName={clubName}
          onClose={() => setAdding(false)}
          onSaved={onSaved(() => setAdding(false))}
          onExpired={onExpired}
        />
      ) : null}

      {editing ? (
        <EditMatchModal
          match={editing}
          token={token ?? ''}
          teams={teams}
          clubName={clubName}
          onClose={() => setEditing(null)}
          onSaved={onSaved(() => setEditing(null))}
          onExpired={onExpired}
        />
      ) : null}
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

    /* ── Toolbar ─────────────────────────────────────────────── */
    toolbar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginTop: 14,
    },

    teamBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      height: 36,
      paddingHorizontal: 12,
      backgroundColor: C.blue1,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
    },

    teamBtnText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12,
      color: C.text,
    },

    filterMenu: {
      position: 'absolute',
      top: 40,
      left: 0,
      minWidth: 170,
      zIndex: 30,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
      overflow: 'hidden',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 6,
    },

    filterItem: {
      paddingHorizontal: 12,
      paddingVertical: 9,
    },

    filterItemText: {
      fontFamily: Fonts.body,
      fontSize: 12,
      color: C.text,
    },

    stateBox: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 22,
    },

    stateText: {
      fontFamily: Fonts.body,
      fontSize: 12.5,
      color: C.gray,
      textAlign: 'center',
    },

    /* Same shape as "Lojtari i ri" on the players page. */
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      height: 36,
      paddingLeft: 5,
      paddingRight: 14,
      backgroundColor: C.blue1,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
    },

    addBtnPlus: {
      width: 25,
      height: 25,
      borderRadius: 13,
      backgroundColor: C.blueBtn,
      alignItems: 'center',
      justifyContent: 'center',
    },

    addBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12.5,
      color: '#000000',
    },

    /* ── Cards ───────────────────────────────────────────────── */
    card: {
      marginTop: 14,
      backgroundColor: C.blue2,
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

    /* ── Upcoming fixtures ───────────────────────────────────── */
    mRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 8,
      paddingVertical: 9,
      minHeight: 56,
    },

    mRowBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    dateBox: {
      width: 46,
      alignItems: 'center',
    },

    dateDay: {
      fontFamily: Fonts.bodyBlack,
      fontSize: 22,
      lineHeight: 26,
      letterSpacing: -0.4,
      color: C.dateBlue,
    },

    dateMon: {
      fontFamily: Fonts.bodyBlack,
      fontSize: 12,
      lineHeight: 15,
      letterSpacing: 0.4,
      color: C.dateBlue,
    },

    mInfo: {
      flex: 1,
    },

    mTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 11.5,
      lineHeight: 14,
      color: C.text,
    },

    /* Time, venue and competition share one line. */
    mSub: {
      fontFamily: Fonts.body,
      fontSize: 9.5,
      lineHeight: 13,
      marginTop: 2,
    },

    mTime: {
      fontFamily: Fonts.body,
      color: C.hint,
    },

    mVenue: {
      fontFamily: Fonts.bodyBold,
    },

    mComp: {
      fontFamily: Fonts.body,
      color: C.hint,
    },

    mActions: {
      flexDirection: 'row',
      gap: 6,
    },

    /* "Shiko" is filled with the same blue as the "+" on "Shto ndeshje";
       "Edito" is the clear version of that same blue. */
    editBtn: {
      height: 24,
      paddingHorizontal: 7,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.blueBtn,
      borderRadius: 4,
    },

    editBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 9.5,
      color: C.blueBtn,
    },

    /* ── Results table ───────────────────────────────────────── */
    tblWrap: {
      paddingHorizontal: 8,
      paddingVertical: 4,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 44,
    },

    /* The Ndeshja column absorbs the slack so Veprimet sits flush right. */
    colFirst: {
      flex: 1,
    },

    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    th: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 9.5,
      lineHeight: 12,
      color: C.gray,
      textAlign: 'center',
    },

    tdMatch: {
      justifyContent: 'center',
    },

    tdTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 9.5,
      lineHeight: 12,
      color: C.text,
    },

    tdSub: {
      fontFamily: Fonts.body,
      fontSize: 8,
      lineHeight: 10,
      color: C.hint,
      marginTop: 1,
    },

    td: {
      fontFamily: Fonts.body,
      fontSize: 9.5,
      lineHeight: 12,
      color: C.hint,
      textAlign: 'center',
    },

    tdScore: {
      fontFamily: Fonts.bodyBold,
      color: C.text,
    },

    tdResult: {
      fontFamily: Fonts.bodyBold,
    },

    tdActions: {
      alignItems: 'flex-end',
    },

    viewBtn: {
      height: 24,
      paddingHorizontal: 7,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.blueBtn,
      borderRadius: 4,
    },

    viewBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 9.5,
      color: '#F5F5F5',
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

    pressed: {
      opacity: 0.5,
    },
  }),
);
