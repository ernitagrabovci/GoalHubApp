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

/**
 * Lista e ekipeve — opened from the admin dashboard's "Ekipet → Shiko të
 * gjitha". Same light #FAFBFA canvas as the other sub-pages: four orange
 * summary squares, the "+ Ekipi i ri" control, the team cards inside a thin
 * green frame, the transfers banner, the sideways-scrolling statistics table
 * and a second green frame where each team shows its win/loss/goal figures.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',

  card: '#F6FBFF',
  border: 'rgba(100,140,190,0.30)',
  thBg: '#E7F1F8',
  rowLine: 'rgba(100,140,190,0.22)',

  green: '#159447',
  greenLine: '#7DCB9E',
  red: '#E03131',
  blue: '#1749B8',
  blueBtn: '#86BCFD',
  blueSoft: '#E3EEFB',
  orange: '#E4A000',
  amber: '#DDA15E',
  amberFill: '#F4E9DB',
};

const IMG_BALL = require('@/assets/dashboard/ndeshjet.png');

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

const STAT_COLS: Col[] = [
  { key: 'team', label: 'Ekipi', width: 92 },
  { key: 'players', label: 'Lojtarët', width: 64 },
  { key: 'nd', label: 'ND', width: 44 },
  { key: 'f', label: 'F', width: 40, color: C.green },
  { key: 'h', label: 'H', width: 40, color: C.red },
  { key: 'b', label: 'B', width: 40 },
  { key: 'gp', label: 'Gola+', width: 56 },
  { key: 'gm', label: 'Gola-', width: 56 },
  { key: 'diff', label: 'Diferenca', width: 76 },
];

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
const TEAM_COLORS = ['#159447', '#1749B8', '#E03131', '#E4A000', '#6C62D8', '#111111'];

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
                <MaterialCommunityIcons name="chevron-left" size={I(24)} color={C.text} />
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
            {summary.map((s) => (
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
              </View>
            ))}
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
                <MaterialCommunityIcons name="plus" size={I(15)} color="#F5F5F5" />
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
                  <ActivityIndicator color={C.blueBtn} />
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
                contentContainerStyle={styles.tblInner}
              >
                <View>
                  <View style={[styles.tr, styles.thRow]}>
                    {STAT_COLS.map((c) => (
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
                              key={STAT_COLS[i].key}
                              style={[
                                styles.td,
                                { width: STAT_COLS[i].width },
                                i === 0 ? styles.tdTeam : null,
                                STAT_COLS[i].color ? { color: STAT_COLS[i].color } : null,
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
          style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
        >
          <Text style={styles.editBtnText}>Edito</Text>
        </Pressable>
        <Pressable
          onPress={onOpen}
          accessibilityRole="button"
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
  return (
    <View style={[styles.teamCard, styles.recordCard]}>
      <Text style={styles.teamName} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.teamSeason}>{season}</Text>

      <View style={styles.teamDivider} />

      <View style={styles.recordRow}>
        <View style={styles.recordCol}>
          <Text style={[styles.recordNum, { color: C.green }]}>{win}</Text>
          <Text style={styles.recordLabel}>Fitore</Text>
        </View>
        <View style={styles.recordCol}>
          <Text style={[styles.recordNum, { color: C.red }]}>{loss}</Text>
          <Text style={styles.recordLabel}>Humbje</Text>
        </View>
        <View style={styles.recordCol}>
          <Text style={[styles.recordNum, { color: C.blue }]}>{goals}</Text>
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
              <ActivityIndicator color="#F5F5F5" size="small" />
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
      paddingBottom: 46,
    },

    /* ── Summary squares ─────────────────────────────────────── */
    summaryRow: {
      flexDirection: 'row',
      paddingLeft: 14,
      paddingRight: 14,
      paddingTop: 8,
      gap: 6,
    },

    /* Shadow lives on the wrapper: `overflow: hidden` on the pane itself would
       clip it away on iOS. */
    sqShadow: {
      flex: 1,
      height: 104,
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
      padding: 7,
    },

    sheen: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '14%',
    },

    /* Fixed two-line block so all the values sit on the same line. */
    sqLabel: {
      minHeight: 26,
      fontFamily: Fonts.bodyBold,
      fontSize: 9.5,
      lineHeight: 11.5,
      color: C.gray,
    },

    sqValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 17,
      lineHeight: 21,
      letterSpacing: -0.5,
      color: C.text,
      marginTop: 2,
    },

    sqHint: {
      fontFamily: Fonts.body,
      fontSize: 9,
      lineHeight: 11,
      color: C.gray,
      marginTop: 3,
    },

    /* ── + Ekipi i ri ────────────────────────────────────────── */
    newTeam: {
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

    newTeamPlus: {
      width: 25,
      height: 25,
      borderRadius: 13,
      backgroundColor: C.blueBtn,
      alignItems: 'center',
      justifyContent: 'center',
    },

    newTeamText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12.5,
      color: '#000000',
    },

    /* ── Thin green frame around the team cards ──────────────── */
    frame: {
      marginTop: 14,
      borderWidth: 1,
      borderColor: C.greenLine,
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
      color: C.gray,
      textAlign: 'center',
    },

    teamCard: {
      flex: 1,
      minHeight: 132,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: '#000000',
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
      color: C.text,
    },

    teamSeason: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.gray,
      marginTop: 1,
    },

    teamDivider: {
      width: '80%',
      height: 1,
      backgroundColor: '#000000',
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
      color: C.gray,
    },

    teamValue: {
      flexShrink: 1,
      fontFamily: Fonts.bodyBold,
      fontSize: 12.5,
      lineHeight: 15,
      color: C.text,
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
      height: 24,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.blueBtn,
      borderRadius: 3,
    },

    editBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: '#F5F5F5',
    },

    ekipaBtn: {
      height: 24,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.blueBtn,
      borderRadius: 3,
    },

    ekipaBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: C.blueBtn,
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
      color: C.gray,
      marginTop: 1,
    },

    /* ── Transferimet ────────────────────────────────────────── */
    transfer: {
      marginTop: 16,
      height: 112,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.amberFill,
      borderWidth: 1.5,
      borderColor: C.amber,
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
      color: '#000000',
    },

    transferBtn: {
      zIndex: 2,
      marginTop: 12,
      height: 32,
      paddingHorizontal: 26,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.amber,
      borderRadius: 4,
    },

    transferBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12.5,
      color: '#F5F5F5',
    },

    /* ── Statistika table ────────────────────────────────────── */
    card: {
      marginTop: 16,
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
      borderBottomColor: 'rgba(30,40,35,0.10)',
    },

    cardHeadText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 16,
      lineHeight: 20,
      color: C.text,
    },

    tblInner: {
      flexGrow: 1,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 36,
    },

    thRow: {
      backgroundColor: C.thBg,
    },

    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    th: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      lineHeight: 14,
      color: C.gray,
      textAlign: 'center',
    },

    td: {
      fontFamily: Fonts.body,
      fontSize: 11.5,
      lineHeight: 14,
      color: C.text,
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
      color: C.gray,
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
      backgroundColor: '#F5F5F5',
      borderWidth: 1,
      borderColor: C.green,
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
      color: C.text,
    },

    popDivider: {
      height: 1,
      backgroundColor: C.greenLine,
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
      color: C.gray,
      marginBottom: 5,
    },

    popInput: {
      height: 32,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
      paddingHorizontal: 9,
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 15,
      color: C.text,
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
      color: C.gray,
    },

    chip: {
      maxWidth: '100%',
      height: 28,
      paddingHorizontal: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 14,
      backgroundColor: '#F5F5F5',
    },

    chipActive: {
      backgroundColor: C.green,
      borderColor: C.green,
    },

    chipText: {
      fontFamily: Fonts.body,
      fontSize: 11.5,
      lineHeight: 14,
      color: C.text,
    },

    chipTextActive: {
      color: '#F5F5F5',
    },

    swatches: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 4,
    },

    swatchOuter: {
      width: 34,
      height: 34,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 3,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F5F5F5',
    },

    swatchSelected: {
      borderWidth: 2,
      borderColor: C.green,
    },

    swatchInner: {
      width: 24,
      height: 24,
      borderRadius: 2,
      backgroundColor: C.green,
    },

    popError: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 16,
      color: C.red,
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
      height: 32,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 4,
    },

    popCancel: {
      backgroundColor: C.red,
    },

    popCreate: {
      backgroundColor: C.green,
    },

    popDelete: {
      marginRight: 'auto',
      borderWidth: 1,
      borderColor: C.red,
    },

    popDeleteText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12.5,
      color: C.red,
    },

    btnDisabled: {
      opacity: 0.5,
    },

    popBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12.5,
      color: '#F5F5F5',
    },
  }),
);
