import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { matchesReport } from '@/lib/api/reports';
import {
  createTeam,
  deleteTeam,
  listTeams,
  teamStats,
  updateTeam,
} from '@/lib/api/teams';
import type { ApiMember, ApiTeam, MatchReportRow, TeamStats } from '@/lib/api/types';
import { listUsers } from '@/lib/api/users';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';
import { useAppColors, usePaletteStyles, type AppColorsOf } from '@/lib/app-theme';
import { useGlass } from '@/lib/glass';

/**
 * Lista e ekipeve — opened from the admin dashboard's "Ekipet → Shiko të
 * gjitha". Same light #F7F9F8 canvas as the other sub-pages: four orange
 * summary squares, the "+ Ekipi i ri" control, the team cards inside a thin
 * green frame, the transfers banner, the sideways-scrolling statistics table
 * and a second green frame where each team shows its win/loss/goal figures.
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
  /* Black rules that invert on the dark page. */
  ink: '#000000',

  card: '#F7F9F8',
  border: 'rgba(100,140,190,0.30)',
  thBg: '#E7F1F8',
  rowLine: 'rgba(100,140,190,0.22)',

  green: '#2E7D5B',
  greenLine: '#7DCB9E',
  red: '#B91C1C',
  blue: '#1749B8',
  blueBtn: '#86BCFD',
  blueSoft: '#E3EEFB',
  orange: '#B45309',
  amber: '#DDA15E',
  amberFill: '#F4E9DB',
};

const IMG_BALL = require('@/assets/dashboard/ndeshjet.png');

/**
 * The squares sit on a near-white page, so a white frost on its own reads as
 * nothing. Shading the pane instead — a very light grey at the top edge
 * sweeping down to white — is what gives the surface its glassy shape.
 */
/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

function errorText(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return 'Nuk mund të lidhemi me serverin. Kontrollo lidhjen.';
    return error.message;
  }
  return 'Diçka shkoi keq. Provo përsëri.';
}

type Col = { key: string; label: string; width: number; color?: string };

const STAT_COLS = (C: AppColorsOf<typeof C_LIGHT>): Col[] => ([
  { key: 'team', label: 'Ekipi', width: 92 },
  { key: 'players', label: 'Lojtarët', width: 64 },
  { key: 'nd', label: 'ND', width: 44 },
  { key: 'f', label: 'F', width: 40, color: C.greenText },
  { key: 'h', label: 'H', width: 40, color: C.redText },
  { key: 'b', label: 'B', width: 40 },
  { key: 'gp', label: 'Gola+', width: 56 },
  { key: 'gm', label: 'Gola-', width: 56 },
  { key: 'diff', label: 'Diferenca', width: 76 },
]);

/** A team's match record, rolled up from the club's fixture list. */
type TeamAgg = { played: number; win: number; loss: number; draw: number; gf: number; ga: number };

const EMPTY_AGG: TeamAgg = { played: 0, win: 0, loss: 0, draw: 0, gf: 0, ga: 0 };

/** Rolls the fixtures up per team; matches without a score don't count. */
function aggregate(rows: MatchReportRow[]): Map<number, TeamAgg> {
  const byTeam = new Map<number, TeamAgg>();
  for (const m of rows) {
    const id = m.team?.id;
    if (id == null || m.goals_for == null || m.goals_against == null) continue;

    const a = byTeam.get(id) ?? { ...EMPTY_AGG };
    a.played += 1;
    a.gf += m.goals_for;
    a.ga += m.goals_against;
    if (m.goals_for > m.goals_against) a.win += 1;
    else if (m.goals_for < m.goals_against) a.loss += 1;
    else a.draw += 1;
    byTeam.set(id, a);
  }
  return byTeam;
}

/** Two per row, with the odd last card keeping its half width. */
function chunkPairs<T>(items: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return rows;
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

type ModalState = { title: string; team?: ApiTeam };

/** Preset shirt colours — the backend wants a `#RRGGBB` hex. */
const TEAM_COLORS = ['#2E7D5B', '#1749B8', '#B91C1C', '#B45309', '#6C62D8', '#17251E'];

/** Active staff who can be attached to a team, all pages included. */
async function loadStaff(token: string, signal: AbortSignal): Promise<ApiMember[]> {
  const roles = ['trainer', 'assistant_trainer', 'technical_staff'];
  const out: ApiMember[] = [];

  for (const role of roles) {
    let page = 1;
    for (;;) {
      const res = await listUsers(token, { role, page, status: 'active' }, signal);
      out.push(...res.data);
      if (page >= res.meta.last_page) break;
      page += 1;
    }
  }

  return out;
}

export default function TeamsScreen() {
  const glass = useGlass();
  const C = useAppColors(C_LIGHT);
  const styles = usePaletteStyles(createStyles, C);
  const router = useRouter();
  const { user, token, signOut } = useSession();
  const [modal, setModal] = useState<ModalState | null>(null);

  const [teams, setTeams] = useState<ApiTeam[] | null>(null);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [matches, setMatches] = useState<MatchReportRow[] | null>(null);
  const [staff, setStaff] = useState<ApiMember[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // The team list, its counts and the club's fixtures are one-shots — fetched
  // together, and a failure of one leaves only that section at "—". An abort is
  // indistinguishable from a timeout (both surface as status 0), so guard on
  // our own signal rather than the error.
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    Promise.allSettled([
      listTeams(token, controller.signal),
      teamStats(token, controller.signal),
      matchesReport(token, {}, controller.signal),
      loadStaff(token, controller.signal),
    ]).then(([teamsRes, statsRes, matchesRes, staffRes]) => {
      if (controller.signal.aborted) return;

      const rejected = [teamsRes, statsRes, matchesRes].find((r) => r.status === 'rejected');
      if (
        rejected &&
        rejected.status === 'rejected' &&
        rejected.reason instanceof ApiError &&
        rejected.reason.status === 401
      ) {
        signOut();
        router.replace('/login');
        return;
      }

      if (teamsRes.status === 'fulfilled') {
        setTeams(teamsRes.value.data);
      } else {
        setTeams([]);
        setListError(errorText(teamsRes.reason));
      }

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);

      if (matchesRes.status === 'fulfilled') setMatches(matchesRes.value.matches);
      else setMatches([]);

      if (staffRes.status === 'fulfilled') setStaff(staffRes.value);
    });

    return () => controller.abort();
  }, [token, router, signOut, reloadKey]);

  const count = (value: number | undefined) => (value == null ? '—' : String(value));
  const seasonName = stats?.season ?? '—';

  // One row per team: its squad size from `GET /teams`, its record from the
  // fixture roll-up. A team with no fixtures shows a row of zeroes.
  const byTeam = aggregate(matches ?? []);
  const board = (teams ?? []).map((team) => {
    const record = byTeam.get(team.id) ?? EMPTY_AGG;
    return { team, record, diff: record.gf - record.ga };
  });

  const summary = [
    { label: 'Ekipet gjithsej', value: count(stats?.total_teams), hint: 'Kategori aktive' },
    { label: 'Lojtarët total', value: count(stats?.total_players), hint: 'Të gjitha ekipet' },
    { label: 'Nr. i trajnerëve', value: count(stats?.total_trainers), hint: 'Staf teknik' },
    { label: 'Sezoni aktual', value: seasonName, hint: 'Aktiv' },
  ];

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
                <Text style={styles.title}>Lista e ekipeve</Text>
                <Text style={styles.subtitle}>
                  {user?.club || '—'} - Sezoni {seasonName}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          {/* ── Summary squares — one row; each card shrinks to fit ─────── */}
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
                      style={styles.sqValue}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.5}
                    >
                      {s.value}
                    </Text>
                    <Text style={styles.sqHint} numberOfLines={2}>
                      {s.hint}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.colPad}>

            {/* ── Ekipi i ri ───────────────────────────────────── */}
            <Pressable
              onPress={() => setModal({ title: 'Krijo ekip' })}
              accessibilityRole="button"
              accessibilityLabel="Shto ekip të ri"
              style={({ pressed }) => [styles.newTeam, pressed && styles.pressed]}
            >
              <View style={styles.newTeamPlus}>
                <MaterialCommunityIcons name="plus" size={I(15)} color="#FFFFFF" />
              </View>
              <Text style={styles.newTeamText}>Ekipi i ri</Text>
            </Pressable>

            {/* ── Team cards ───────────────────────────────────── */}
            <View style={styles.frame}>
              {listError ? (
                <View style={styles.frameState}>
                  <Text style={styles.frameStateText}>{listError}</Text>
                </View>
              ) : teams === null ? (
                <View style={styles.frameState}>
                  <ActivityIndicator color={C.blueBtnText} />
                </View>
              ) : teams.length === 0 ? (
                <View style={styles.frameState}>
                  <Text style={styles.frameStateText}>Nuk ka ekipe.</Text>
                </View>
              ) : (
                chunkPairs(teams).map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.gridRow}>
                    {row.map((team) => (
                      <TeamCard
                        key={team.id}
                        team={team}
                        onEdit={() => setModal({ title: 'Edito ekip', team })}
                        onOpen={() => router.push(`/ekipa?id=${team.id}`)}
                      />
                    ))}
                    {row.length === 1 ? <View style={styles.gridSpacer} /> : null}
                  </View>
                ))
              )}
            </View>

            {/* ── Transferimet ─────────────────────────────────── */}
            <View style={styles.transfer}>
              <Image source={IMG_BALL} style={styles.transferImgLeft} resizeMode="contain" />
              <Image source={IMG_BALL} style={styles.transferImgRight} resizeMode="contain" />

              <Text style={styles.transferTitle}>Transferimet</Text>

              <Pressable
                onPress={() => router.push('/transferimet')}
                accessibilityRole="button"
                accessibilityLabel="Hap transferimet"
                style={({ pressed }) => [styles.transferBtn, pressed && styles.pressed]}
              >
                <Text style={styles.transferBtnText}>Vazhdo</Text>
              </Pressable>
            </View>

            {/* ── Statistika ───────────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Statistika</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.tblInner, styles.tblFill]}
              >
                <View style={styles.tblFill}>
                  <View style={[styles.tr, styles.thRow]}>
                    {STAT_COLS(C).map((c) => (
                      <Text
                        key={c.key}
                        style={[styles.th, { width: c.width }, c.color ? { color: c.color } : null]}
                      >
                        {c.label}
                      </Text>
                    ))}
                  </View>

                  {board.length === 0 ? (
                    <View style={[styles.tr, styles.trBorder]}>
                      <Text style={styles.tdEmpty}>Nuk ka të dhëna.</Text>
                    </View>
                  ) : (
                    board.map(({ team, record, diff }) => {
                      const cells = [
                        team.name,
                        team.players_count == null ? '—' : String(team.players_count),
                        String(record.played),
                        String(record.win),
                        String(record.loss),
                        String(record.draw),
                        String(record.gf),
                        String(record.ga),
                        `${diff > 0 ? '+' : ''}${diff}`,
                      ];
                      return (
                        <View key={team.id} style={[styles.tr, styles.trBorder]}>
                          {cells.map((value, i) => (
                            <Text
                              key={STAT_COLS(C)[i].key}
                              style={[
                                styles.td,
                                { width: STAT_COLS(C)[i].width },
                                i === 0 ? styles.tdTeam : null,
                                STAT_COLS(C)[i].color ? { color: STAT_COLS(C)[i].color } : null,
                              ]}
                              numberOfLines={1}
                              adjustsFontSizeToFit
                              minimumFontScale={0.7}
                            >
                              {value}
                            </Text>
                          ))}
                        </View>
                      );
                    })
                  )}
                </View>
              </ScrollView>
            </View>

            {/* ── Team records ─────────────────────────────────── */}
            <View style={[styles.frame, styles.frameGreen]}>
              {board.length === 0 ? (
                <View style={styles.frameState}>
                  <Text style={styles.frameStateText}>Nuk ka të dhëna.</Text>
                </View>
              ) : (
                chunkPairs(board).map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.gridRow}>
                    {row.map(({ team, record }) => (
                      <TeamRecordCard
                        key={team.id}
                        name={team.name}
                        season={team.season ?? '—'}
                        win={record.win}
                        loss={record.loss}
                        goals={record.gf}
                      />
                    ))}
                    {row.length === 1 ? <View style={styles.gridSpacer} /> : null}
                  </View>
                ))
              )}
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Overlay on the SafeAreaView so the blur covers the whole screen */}
      {modal ? (
        <TeamModal
          title={modal.title}
          team={modal.team}
          staff={staff}
          token={token ?? ''}
          onClose={() => setModal(null)}
          onSaved={() => setReloadKey((k) => k + 1)}
          onExpired={() => {
            setModal(null);
            signOut();
            router.replace('/login');
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

function TeamCard({
  team,
  onEdit,
  onOpen,
}: {
  team: ApiTeam;
  onEdit: () => void;
  onOpen: () => void;
}) {
  const C = useAppColors(C_LIGHT);
  const styles = usePaletteStyles(createStyles, C);
  return (
    <View style={styles.teamCard}>
      <Text style={styles.teamName} numberOfLines={1}>
        {team.name}
      </Text>
      <Text style={styles.teamSeason}>{team.season ?? '—'}</Text>

      <View style={styles.teamDivider} />

      <View style={styles.teamRow}>
        <Text style={styles.teamLabel}>Trajneri</Text>
        <Text style={styles.teamValue} numberOfLines={1}>
          {team.trainer?.name ?? '—'}
        </Text>
      </View>
      <View style={styles.teamRow}>
        <Text style={styles.teamLabel}>Lojtarët</Text>
        <Text style={styles.teamValue}>{team.players_count ?? '—'}</Text>
      </View>

      <View style={styles.teamBtns}>
        <Pressable
          onPress={onEdit}
          accessibilityRole="button"
          hitSlop={{ top: 7, bottom: 7, left: 3, right: 3 }}
          style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
        >
          <Text style={styles.editBtnText}>Edito</Text>
        </Pressable>
        <Pressable
          onPress={onOpen}
          accessibilityRole="button"
          hitSlop={{ top: 7, bottom: 7, left: 3, right: 3 }}
          style={({ pressed }) => [styles.ekipaBtn, pressed && styles.pressed]}
        >
          <Text style={styles.ekipaBtnText}>Ekipa</Text>
        </Pressable>
      </View>
    </View>
  );
}

function TeamRecordCard({
  name,
  season,
  win,
  loss,
  goals,
}: {
  name: string;
  season: string;
  win: number;
  loss: number;
  goals: number;
}) {
  const C = useAppColors(C_LIGHT);
  const styles = usePaletteStyles(createStyles, C);
  return (
    <View style={[styles.teamCard, styles.recordCard]}>
      <Text style={styles.teamName} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.teamSeason}>{season}</Text>

      <View style={styles.teamDivider} />

      <View style={styles.recordRow}>
        <View style={styles.recordCol}>
          <Text style={[styles.recordNum, { color: C.greenText }]}>{win}</Text>
          <Text style={styles.recordLabel}>Fitore</Text>
        </View>
        <View style={styles.recordCol}>
          <Text style={[styles.recordNum, { color: C.redText }]}>{loss}</Text>
          <Text style={styles.recordLabel}>Humbje</Text>
        </View>
        <View style={styles.recordCol}>
          <Text style={[styles.recordNum, { color: C.blueText }]}>{goals}</Text>
          <Text style={styles.recordLabel}>Gola</Text>
        </View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Create / edit popup                                                 */
/* ------------------------------------------------------------------ */

type StaffOption = { id: number; name: string };

/** The active staff of one role, keeping a current assignee even if not loaded. */
function optionsFor(
  staff: ApiMember[],
  role: string,
  current: StaffOption | null,
): StaffOption[] {
  const out = staff
    .filter((m) => m.role === role)
    .map((m) => ({ id: m.id, name: m.name }));

  if (current && !out.some((o) => o.id === current.id)) out.unshift(current);
  return out;
}

function TeamModal({
  title,
  team,
  staff,
  token,
  onClose,
  onSaved,
  onExpired,
}: {
  title: string;
  team?: ApiTeam;
  staff: ApiMember[];
  token: string;
  onClose: () => void;
  onSaved: () => void;
  onExpired: () => void;
}) {
  const C = useAppColors(C_LIGHT);
  const styles = usePaletteStyles(createStyles, C);
  const [name, setName] = useState(team?.name ?? '');
  const [season, setSeason] = useState(team?.season ?? '');
  const [colorHex, setColorHex] = useState(team?.color_hex ?? TEAM_COLORS[0]);
  const [trainerId, setTrainerId] = useState<number | null>(team?.trainer?.id ?? null);
  const [assistantId, setAssistantId] = useState<number | null>(
    team?.assistant_trainer?.id ?? null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trainerOptions = optionsFor(staff, 'trainer', team?.trainer ?? null);
  const assistantOptions = optionsFor(staff, 'assistant_trainer', team?.assistant_trainer ?? null);

  function fail(e: unknown) {
    if (e instanceof ApiError && e.status === 401) {
      onExpired();
      return;
    }
    setError(errorText(e));
  }

  async function remove() {
    if (!team) return;
    setBusy(true);
    setError(null);
    try {
      await deleteTeam(token, team.id);
      onSaved();
      onClose();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }

  function confirmDelete() {
    if (!team || busy) return;
    Alert.alert(
      'Fshi ekipin',
      `A jeni i sigurt që dëshironi të fshini "${team.name}"?`,
      [
        { text: 'Anulo', style: 'cancel' },
        { text: 'Fshi', style: 'destructive', onPress: remove },
      ],
    );
  }

  async function save() {
    if (busy) return;
    if (!name.trim()) {
      setError('Shkruaj emrin e ekipit.');
      return;
    }
    if (!season.trim()) {
      setError('Shkruaj sezonin.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const input = {
        name: name.trim(),
        season: season.trim(),
        color_hex: colorHex,
        trainer_id: trainerId,
        assistant_trainer_id: assistantId,
      };
      if (team) await updateTeam(token, team.id, input);
      else await createTeam(token, input);
      onSaved();
      onClose();
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  }

  const renderChips = (
    options: StaffOption[],
    selected: number | null,
    onPick: (id: number | null) => void,
  ) => (
    <View style={styles.chipsRow}>
      {options.length === 0 ? (
        <Text style={styles.chipsEmpty}>Nuk ka staf të regjistruar.</Text>
      ) : (
        options.map((o) => {
          const active = o.id === selected;
          return (
            <Pressable
              key={o.id}
              onPress={() => onPick(active ? null : o.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={o.name}
              hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
              style={({ pressed }) => [
                styles.chip,
                active && styles.chipActive,
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                {o.name}
              </Text>
            </Pressable>
          );
        })
      )}
    </View>
  );

  return (
    <View style={styles.ovWrap}>
      <BlurView style={styles.ovFill} intensity={45} tint="dark" />
      <Pressable
        style={[styles.ovFill, styles.ovDim]}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Mbylle dritaren"
      />

      <View style={styles.popCard}>
        <View style={styles.popHeader}>
          <Text style={styles.popTitle}>{title}</Text>
        </View>
        <View style={styles.popDivider} />

        <View style={styles.popBody}>
          <View style={styles.popGridRow}>
            <View style={styles.popCol}>
              <Text style={styles.popLabel}>Emri i ekipit:</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                autoCorrect={false}
                allowFontScaling={false}
                style={styles.popInput}
              />
            </View>
            <View style={styles.popCol}>
              <Text style={styles.popLabel}>Sezoni:</Text>
              <TextInput
                value={season}
                onChangeText={setSeason}
                autoCorrect={false}
                allowFontScaling={false}
                style={styles.popInput}
              />
            </View>
          </View>

          <Text style={styles.popLabel}>Trajneri kryesor:</Text>
          {renderChips(trainerOptions, trainerId, setTrainerId)}

          <Text style={styles.popLabel}>Asistenti i trajnerit:</Text>
          {renderChips(assistantOptions, assistantId, setAssistantId)}

          <Text style={styles.popLabel}>Ngjyra e ekipit:</Text>
          <View style={styles.swatches}>
            {TEAM_COLORS.map((color) => {
              const active = color === colorHex;
              return (
                <Pressable
                  key={color}
                  onPress={() => setColorHex(color)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`Ngjyra ${color}`}
                  hitSlop={2}
                  style={[styles.swatchOuter, active && styles.swatchSelected]}
                >
                  <View style={[styles.swatchInner, { backgroundColor: color }]} />
                </Pressable>
              );
            })}
          </View>

          {error ? <Text style={styles.popError}>{error}</Text> : null}
        </View>

        <View style={styles.popActions}>
          {team ? (
            <Pressable
              onPress={confirmDelete}
              disabled={busy}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.popBtn,
                styles.popDelete,
                busy && styles.btnDisabled,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.popDeleteText}>Fshi</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={({ pressed }) => [styles.popBtn, styles.popCancel, pressed && styles.pressed]}
          >
            <Text style={styles.popBtnText}>Anulo</Text>
          </Pressable>
          <Pressable
            onPress={save}
            disabled={busy}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.popBtn,
              styles.popCreate,
              busy && styles.btnDisabled,
              pressed && styles.pressed,
            ]}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.popBtnText}>{team ? 'Ruaj' : 'Krijo'}</Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
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
      paddingBottom: 46,
    },

    /* ── Summary squares ─────────────────────────────────────── */
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

    /* Fixed two-line block so all the values sit on the same line. */
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
      color: C.textText,
      marginTop: 2,
    },

    sqHint: {
      fontFamily: Fonts.body,
      fontSize: 9,
      lineHeight: 11,
      color: C.grayText,
      marginTop: 3,
    },

    /* ── + Ekipi i ri ────────────────────────────────────────── */
    newTeam: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 14,
      height: 44,
      paddingLeft: 9,
      paddingRight: 16,
      backgroundColor: C.blueSoftFill,
      borderWidth: 1,
      borderColor: C.frameBorder,
      borderRadius: 10,
    },

    newTeamPlus: {
      width: 25,
      height: 25,
      borderRadius: 13,
      backgroundColor: C.blueBtnFill,
      alignItems: 'center',
      justifyContent: 'center',
    },

    newTeamText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13,
      lineHeight: 18,
      color: C.textText,
    },

    /* ── Thin green frame around the team cards ──────────────── */
    frame: {
      marginTop: 14,
      borderWidth: 1,
      borderColor: C.greenLineBorder,
      borderRadius: 8,
      padding: 8,
      gap: 8,
    },

    frameGreen: {
      marginTop: 16,
    },

    gridRow: {
      flexDirection: 'row',
      gap: 8,
    },

    gridSpacer: {
      flex: 1,
    },

    /* Loading / empty / error placeholder inside the team-card frame. */
    frameState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 24,
    },

    frameStateText: {
      fontFamily: Fonts.body,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.grayText,
      textAlign: 'center',
    },

    teamCard: {
      flex: 1,
      minHeight: 132,
      backgroundColor: C.cardFill,
      borderWidth: 1,
      borderColor: C.frameBorder,
      borderRadius: 6,
      paddingHorizontal: 10,
      paddingTop: 8,
      paddingBottom: 8,
    },

    teamName: {
      fontFamily: Fonts.bodyBold,
      fontSize: 15,
      lineHeight: 18,
      letterSpacing: -0.3,
      color: C.textText,
    },

    teamSeason: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.grayText,
      marginTop: 1,
    },

    teamDivider: {
      width: '80%',
      height: 1,
      backgroundColor: C.inkFill,
      marginTop: 6,
      marginBottom: 6,
    },

    teamRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
      marginBottom: 3,
    },

    teamLabel: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.grayText,
    },

    teamValue: {
      flexShrink: 1,
      fontFamily: Fonts.bodyBold,
      fontSize: 12.5,
      lineHeight: 15,
      color: C.textText,
      textAlign: 'right',
    },

    teamBtns: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 6,
      marginTop: 'auto',
      paddingTop: 8,
    },

    editBtn: {
      height: 30,
      paddingHorizontal: 11,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.blueBtnFill,
      borderRadius: 6,
    },

    editBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      lineHeight: 15,
      color: '#FFFFFF',
    },

    ekipaBtn: {
      height: 30,
      paddingHorizontal: 11,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.blueBtnBorder,
      borderRadius: 6,
    },

    ekipaBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.blueBtnText,
    },

    /* ── Win / loss / goals rows ─────────────────────────────── */
    recordCard: {
      minHeight: 104,
    },

    recordRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 4,
    },

    recordCol: {
      alignItems: 'center',
      flex: 1,
    },

    recordNum: {
      fontFamily: Fonts.bodyBold,
      fontSize: 16,
      lineHeight: 19,
    },

    recordLabel: {
      fontFamily: Fonts.body,
      fontSize: 10,
      lineHeight: 13,
      color: C.grayText,
      marginTop: 1,
    },

    /* ── Transferimet ────────────────────────────────────────── */
    transfer: {
      marginTop: 16,
      height: 112,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.amberFillFill,
      borderWidth: 1.5,
      borderColor: C.amberBorder,
      borderRadius: 7,
      overflow: 'hidden',
    },

    transferImgLeft: {
      position: 'absolute',
      left: -18,
      bottom: -42,
      width: 96,
      height: 96,
      zIndex: 0,
    },

    transferImgRight: {
      position: 'absolute',
      right: -18,
      bottom: -42,
      width: 96,
      height: 96,
      zIndex: 0,
      transform: [{ scaleX: -1 }],
    },

    transferTitle: {
      zIndex: 2,
      fontFamily: Fonts.bodyBold,
      fontSize: 20,
      lineHeight: 24,
      letterSpacing: -0.4,
      color: C.textText,
    },

    transferBtn: {
      zIndex: 2,
      marginTop: 12,
      height: 44,
      paddingHorizontal: 26,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.amberFill,
      borderRadius: 10,
    },

    transferBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13,
      lineHeight: 18,
      color: '#FFFFFF',
    },

    /* ── Statistika table ────────────────────────────────────── */
    card: {
      marginTop: 16,
      backgroundColor: C.cardFill,
      borderWidth: 2,
      borderColor: C.borderBorder,
      borderRadius: 7,
      overflow: 'hidden',
    },

    cardHead: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(30,40,35,0.10)',
    },

    cardHeadText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 16,
      lineHeight: 20,
      color: C.textText,
    },

    tblInner: {
      flexGrow: 1,
    },

    /* Stretches the rows to the card's width, so the rules run the full width
       instead of stopping where the last column ends. */
    tblFill: {
      flexGrow: 1,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 36,
    },

    thRow: {
      backgroundColor: C.thBgFill,
    },

    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLineBorder,
    },

    th: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      lineHeight: 14,
      color: C.grayText,
      textAlign: 'center',
    },

    td: {
      fontFamily: Fonts.body,
      fontSize: 11.5,
      lineHeight: 14,
      color: C.textText,
      textAlign: 'center',
      paddingHorizontal: 2,
    },

    tdTeam: {
      fontFamily: Fonts.bodySemiBold,
      textAlign: 'left',
    },

    tdEmpty: {
      flex: 1,
      paddingHorizontal: 12,
      fontFamily: Fonts.body,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.grayText,
    },

    pressed: {
      opacity: 0.5,
    },

    /* ── Create / edit popup ─────────────────────────────────── */
    ovWrap: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 20,
      alignItems: 'center',
      justifyContent: 'center',
      /* Centering happens above this padding, so the popup sits a
         little above the vertical middle. */
      paddingBottom: 150,
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

    popCard: {
      width: '86%',
      maxWidth: 340,
      backgroundColor: C.whiteFill,
      borderWidth: 1,
      borderColor: C.greenBorder,
      borderRadius: 6,
      overflow: 'hidden',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 8,
    },

    popHeader: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
    },

    popTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 17,
      lineHeight: 21,
      color: C.textText,
    },

    popDivider: {
      height: 1,
      backgroundColor: C.greenLineFill,
    },

    popBody: {
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 4,
    },

    popGridRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 10,
    },

    popCol: {
      flex: 1,
    },

    popLabel: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 15,
      color: C.grayText,
      marginBottom: 5,
    },

    popInput: {
      height: 44,
      borderWidth: 1,
      borderColor: C.frameBorder,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 0,
      fontFamily: Fonts.body,
      fontSize: 14,
      lineHeight: 18,
      color: C.textText,
    },

    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 10,
    },

    chipsEmpty: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 15,
      color: C.grayText,
    },

    chip: {
      maxWidth: '100%',
      height: 36,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.frameBorder,
      borderRadius: 18,
      backgroundColor: C.whiteFill,
    },

    chipActive: {
      backgroundColor: C.greenFill,
      borderColor: C.greenBorder,
    },

    chipText: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 16,
      color: C.textText,
    },

    chipTextActive: {
      color: '#FFFFFF',
    },

    swatches: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 4,
    },

    swatchOuter: {
      width: 40,
      height: 40,
      borderWidth: 1,
      borderColor: C.frameBorder,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.whiteFill,
    },

    swatchSelected: {
      borderWidth: 2,
      borderColor: C.greenBorder,
    },

    swatchInner: {
      width: 28,
      height: 28,
      borderRadius: 4,
      backgroundColor: C.greenFill,
    },

    popError: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 16,
      color: C.redText,
      marginTop: 4,
    },

    popActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
      padding: 14,
      paddingTop: 12,
    },

    popBtn: {
      height: 44,
      paddingHorizontal: 18,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
    },

    popCancel: {
      backgroundColor: C.redFill,
    },

    popCreate: {
      backgroundColor: C.greenFill,
    },

    popDelete: {
      marginRight: 'auto',
      borderWidth: 1,
      borderColor: C.redBorder,
    },

    popDeleteText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12.5,
      color: C.redText,
    },

    btnDisabled: {
      opacity: 0.5,
    },

    popBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13,
      lineHeight: 18,
      color: '#FFFFFF',
    },
  }),
);
