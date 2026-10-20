import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { HealthStatusModal } from '@/components/players/health-status-modal';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import {
  getPlayer,
  listPlayers,
  playerAttendance,
  playerStatistics,
} from '@/lib/api/players';
import { listRatings } from '@/lib/api/ratings';
import type {
  ApiAttendance,
  ApiPlayer,
  PlayerRatingRow,
  PlayerStatRow,
} from '@/lib/api/types';
import { positionLabel } from '@/lib/player-position';
import { statusLabel } from '@/lib/player-status';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * The trainer's single player page — opened from the "Shiko" button on a row
 * of the squad list.
 *
 * A copy of the administrator's `player-profile` screen with two differences:
 * the club side rides above the name in the header, and the second card shows
 * the latest ratings as a bare label/value list over a filled rail instead of
 * the financial summary. Keep the two files in step when either side changes.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',
  hintSoft: '#E2E2E2',

  /* blue1 = the deeper blue of the dropdown button; blue2 = the pale blue of
     the cards/tables. Card heads sit on blue2, card bodies on blue1. */
  blue1: '#E3EEFB',
  blue2: '#F6FBFF',

  border: '#000000',
  rowLine: '#000000',
  headLine: '#000000',

  green: '#159447',
  greenSoft: '#DDF6E7',
  redDark: '#9E1B1B',
  red: '#E03131',
  redSoft: '#ED5050',
  orange: '#E4A000',
  blue: '#1749B8',
};

const IMG = {
  star: require('@/assets/dashboard/star.png'),
};

const MONTHS = [
  'janar',
  'shkurt',
  'mars',
  'prill',
  'maj',
  'qershor',
  'korrik',
  'gusht',
  'shtator',
  'tetor',
  'nëntor',
  'dhjetor',
];

/** `2026-08-25` → `25 gusht 2026`; empty/unparseable dates render as a dash. */
function formatContract(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** `health_status` → the existing pill tones; anything unknown stays green. */
const STATUS_TONE: Record<string, string> = {
  active: C.green,
  injured: C.red,
  rehabilitation: C.orange,
  suspended: C.redDark,
};

export default function PlayerProfileScreen() {
  const router = useRouter();
  const { token, signOut } = useSession();

  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    team?: string;
    nr?: string;
    pos?: string;
  }>();

  const playerId = params.id ? Number(params.id) : null;
  const [player, setPlayer] = useState<ApiPlayer | null>(null);
  const [seasonStats, setSeasonStats] = useState<PlayerStatRow | null>(null);
  const [coachRatings, setCoachRatings] = useState<PlayerRatingRow | null>(null);
  const [attendance, setAttendance] = useState<ApiAttendance | null>(null);

  /* The squad behind the header selector — picking one reloads the page. */
  const [roster, setRoster] = useState<ApiPlayer[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [healthOpen, setHealthOpen] = useState(false);

  useEffect(() => {
    if (!token || !playerId || Number.isNaN(playerId)) return;
    const controller = new AbortController();

    getPlayer(token, playerId, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setPlayer(res.data);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) {
          signOut();
          router.replace('/login');
        }
      });

    return () => controller.abort();
  }, [token, playerId, router, signOut]);

  /* Season totals and coach ratings for this player. */
  useEffect(() => {
    if (!token || !playerId) return;
    const controller = new AbortController();

    playerStatistics(token, {}, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setSeasonStats(res.data.find((r) => r.player_id === playerId) ?? null);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) {
          signOut();
          router.replace('/login');
        }
      });

    listRatings(token, {}, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setCoachRatings(res.data.find((r) => r.player_id === playerId) ?? null);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) {
          signOut();
          router.replace('/login');
        }
      });

    playerAttendance(token, playerId, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setAttendance(res);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) {
          signOut();
          router.replace('/login');
        }
      });

    return () => controller.abort();
  }, [token, playerId, router, signOut]);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    listPlayers(token, {}, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setRoster(res.data);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) {
          signOut();
          router.replace('/login');
        }
      });

    return () => controller.abort();
  }, [token, router, signOut]);

  const pickPlayer = (p: ApiPlayer) => {
    setPickerOpen(false);
    router.setParams({
      id: String(p.id),
      name: p.name ?? '',
      team: p.team?.name ?? '',
      nr: p.jersey_number != null ? String(p.jersey_number) : '',
    });
  };

  const name = player?.name ?? params.name ?? 'Narti Cerkini';
  const team = player?.team?.name ?? params.team ?? '—';
  const nr =
    player?.jersey_number != null ? String(player.jersey_number) : params.nr ?? '1';
  const pos = player?.position ? positionLabel(player.position) : params.pos ?? 'Portier';

  const num = (v: number | string | null | undefined) => (v == null ? '—' : String(v));
  const score = (v: number | string | null | undefined) => {
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? n : 0;
  };

  const stats = [
    { label: 'Ndeshjet', value: num(seasonStats?.matches), tone: C.text },
    { label: 'Golat', value: num(seasonStats?.goals), tone: C.green },
    { label: 'Asiste', value: num(seasonStats?.assists), tone: C.blue },
  ];

  const stats2 = [
    { label: 'K.verdha', value: num(seasonStats?.yellow_cards), tone: C.orange },
    { label: 'K.kuq', value: num(seasonStats?.red_cards), tone: C.red },
    { label: 'Minuta', value: num(seasonStats?.minutes), tone: C.text },
  ];

  const attendanceRows = [
    { label: 'prezent', value: num(attendance?.present), dot: C.green },
    { label: 'mungesë', value: num(attendance?.absent), dot: C.red },
    { label: 'pa status', value: num(attendance?.unconfirmed), dot: C.hintSoft },
  ];

  /* Averaged coach ratings, out of 10 — the rail fills to one tenth of it. */
  const ratings = [
    { label: 'Teknika', value: score(coachRatings?.technique) },
    { label: 'Fiziku', value: score(coachRatings?.physical) },
    { label: 'Taktika', value: score(coachRatings?.tactics) },
    { label: 'Qëndrueshmëria', value: score(coachRatings?.consistency) },
    { label: 'Puna ekipore', value: score(coachRatings?.teamwork) },
  ];

  const details = [
    { label: 'Mosha', value: player?.age != null ? `${player.age} vjeç` : '—' },
    { label: 'Kombësia', value: player?.nationality ?? '—' },
    { label: 'Email', value: player?.email ?? '—' },
    { label: 'Licensa FFK', value: player?.ffk_license ?? '—' },
    { label: 'Kontrata nga', value: player ? formatContract(player.contract_start) : '—' },
    { label: 'Kontrata deri', value: player ? formatContract(player.contract_end) : '—' },
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
                <Text style={styles.headerTeam} numberOfLines={1}>
                  {team}
                </Text>
                <Text style={styles.title} numberOfLines={1}>
                  {name}
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
            {/* ── Player selector ───────────────────────────────── */}
            <View style={styles.pickerWrap}>
              <Pressable
                onPress={() => setPickerOpen((v) => !v)}
                accessibilityRole="button"
                accessibilityLabel="Zgjidh lojtarin"
                style={({ pressed }) => [styles.playerBtn, pressed && styles.pressed]}
              >
                <Text style={styles.playerBtnText} numberOfLines={1}>
                  {name}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={I(15)} color="#000000" />
              </Pressable>

              {pickerOpen ? (
                <ScrollView
                  style={styles.playerMenu}
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                >
                  {roster.length === 0 ? (
                    <Text style={styles.playerMenuEmpty}>Nuk ka lojtarë.</Text>
                  ) : (
                    roster.map((p) => (
                      <Pressable
                        key={p.id}
                        onPress={() => pickPlayer(p)}
                        accessibilityRole="button"
                        accessibilityLabel={p.name ?? 'Lojtari'}
                        style={({ pressed }) => [
                          styles.playerMenuItem,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.playerMenuItemText} numberOfLines={1}>
                          {p.name ?? '—'}
                        </Text>
                      </Pressable>
                    ))
                  )}
                </ScrollView>
              ) : null}
            </View>

            {/* ── Identity + latest ratings ─────────────────────── */}
            <View style={styles.duo}>
              {/* Identity card */}
              <View style={[styles.duoCard, styles.card]}>
                <View style={styles.identityTop}>
                  <View style={styles.profileBox}>
                    {player?.avatar ? (
                      <Image
                        source={{ uri: player.avatar }}
                        style={styles.profileImg}
                        resizeMode="cover"
                      />
                    ) : (
                      <MaterialCommunityIcons name="account" size={I(34)} color="#000000" />
                    )}
                  </View>
                  <View style={styles.identityText}>
                    <Text style={styles.playerName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                      {name}
                    </Text>
                    <Text style={styles.playerSub} numberOfLines={1}>
                      Nr.{nr} {pos}
                    </Text>
                    <Text style={styles.playerTeam} numberOfLines={1}>
                      {team}
                    </Text>
                    <Pressable
                      onPress={() => player && setHealthOpen(true)}
                      disabled={!player}
                      accessibilityRole="button"
                      accessibilityLabel="Ndrysho statusin shëndetësor"
                      style={({ pressed }) => [
                        styles.activePill,
                        {
                          backgroundColor: player
                            ? STATUS_TONE[player.health_status] ?? C.green
                            : C.green,
                        },
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.activePillText}>
                        {player ? statusLabel(player.health_status) : 'Aktiv'}
                      </Text>
                      {player ? (
                        <MaterialCommunityIcons
                          name="chevron-down"
                          size={I(10)}
                          color="#F5F5F5"
                        />
                      ) : null}
                    </Pressable>
                  </View>
                </View>

                <View style={styles.blackRule} />

                <View style={styles.body}>
                  <View style={styles.statRow}>
                    {stats.map((s) => (
                      <View key={s.label} style={styles.statCol}>
                        <Text style={[styles.statValue, { color: s.tone }]}>{s.value}</Text>
                        <Text style={styles.statLabel} numberOfLines={1}>
                          {s.label}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View style={[styles.statRow, styles.statRowLast]}>
                    {stats2.map((s) => (
                      <View key={s.label} style={styles.statCol}>
                        <Text style={[styles.statValue, { color: s.tone }]}>{s.value}</Text>
                        <Text style={styles.statLabel} numberOfLines={1}>
                          {s.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              {/* Latest ratings — a bare label/value list, no boxes, each row
                  sitting on a rail that fills to a tenth of the score. */}
              <View style={[styles.duoCard, styles.card]}>
                <View style={styles.rateTop}>
                  <Text style={styles.rateTitle} numberOfLines={1}>
                    Vlerësimet e fundit
                  </Text>
                  <Text style={styles.rateAvg}>5.0</Text>
                </View>
                <View style={styles.thinRule} />

                <View style={styles.body}>
                  {ratings.map((r) => (
                    <View key={r.label} style={styles.rateRow}>
                      <View style={styles.rateLine}>
                        <Text style={styles.rateLabel} numberOfLines={1}>
                          {r.label}
                        </Text>
                        <Text style={styles.rateValue}>{r.value.toFixed(1)}</Text>
                      </View>
                      <View style={styles.rail}>
                        <View style={[styles.railFill, { width: `${r.value * 10}%` }]} />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* ── Vlerësimet e fundit ───────────────────────────── */}
            <View style={[styles.wideCard, styles.card]}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Vlerësimet e fundit</Text>
              </View>
              <View style={[styles.bodyFlat, styles.empty]}>
                <View style={styles.starWrap}>
                  {/* Same artwork scaled up and tinted black, sitting behind the
                      star — gives a uniform outline that keeps the sharp tips. */}
                  <Image source={IMG.star} style={styles.starOutline} tintColor="#000000" />
                  <Image source={IMG.star} style={styles.starImg} resizeMode="contain" />
                </View>
                <Text style={styles.emptyText}>Nuk ka vlerësime akoma.</Text>
              </View>
            </View>

            {/* ── Prezenca + details ────────────────────────────── */}
            <View style={styles.duo}>
              {/* Attendance card */}
              <View style={[styles.duoCard, styles.card]}>
                <View style={styles.prezencaTop}>
                  <Text style={styles.cardTitle}>Prezenca</Text>
                  <Text style={styles.prezencaPct}>
                    {attendance ? `${attendance.rate}%` : '—'}
                  </Text>
                </View>
                <View style={styles.grayRule} />

                <View style={styles.body}>
                  {attendanceRows.map((a) => (
                    <View key={a.label} style={styles.attRow}>
                      <View style={styles.attLeft}>
                        <View style={[styles.dot, { backgroundColor: a.dot }]} />
                        <Text style={styles.attLabel} numberOfLines={1}>
                          {a.label}
                        </Text>
                      </View>
                      <Text style={styles.attValue}>{a.value}</Text>
                    </View>
                  ))}

                  <View style={styles.totalRow}>
                    <Text style={styles.totalRowLabel}>total stërvitje</Text>
                    <Text style={styles.totalRowValue}>{num(attendance?.total)}</Text>
                  </View>
                </View>
              </View>

              {/* Personal details card */}
              <View style={[styles.duoCard, styles.card]}>
                {details.map((d, i) => (
                  <View
                    key={d.label}
                    style={[styles.detRow, i < details.length - 1 && styles.detRowLine]}
                  >
                    <Text style={styles.detLabel} numberOfLines={1}>
                      {d.label}
                    </Text>
                    <Text style={styles.detValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                      {d.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* ── Historiku i lëndimeve ─────────────────────────── */}
            <View style={[styles.wideCard, styles.card]}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Historiku i lëndimeve</Text>
              </View>

              <View style={[styles.bodyFlat, styles.injuryRow]}>
                <View style={styles.injuryText}>
                  <Text style={styles.injuryName} numberOfLines={1}>
                    Gripi
                  </Text>
                  <Text style={styles.injurySub} numberOfLines={2}>
                    Lënduar: 27 Aug 2026 - Kthimi i pritshëm: 01 Sep 2026
                  </Text>
                </View>
                <View style={styles.healedPill}>
                  <Text style={styles.healedPillText}>i shëruar</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>

      {playerId != null && !Number.isNaN(playerId) ? (
        <HealthStatusModal
          visible={healthOpen}
          token={token}
          playerId={playerId}
          current={player?.health_status ?? 'active'}
          onClose={() => setHealthOpen(false)}
          onUpdated={(updated) => setPlayer(updated)}
          onUnauthorized={() => {
            signOut();
            router.replace('/login');
          }}
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

    /* The player's club side, riding above the name in the pinned header. */
    headerTeam: {
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 14,
      color: C.gray,
      marginBottom: 1,
    },

    title: {
      fontFamily: Fonts.bodyBold,
      fontSize: 20,
      lineHeight: 24,
      letterSpacing: -0.3,
      color: C.text,
    },

    scroll: {
      paddingBottom: 24,
    },

    /* ── Player selector ─────────────────────────────────────── */
    playerBtn: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      height: 36,
      paddingHorizontal: 12,
      backgroundColor: C.blue2,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
      marginTop: 4,
    },

    playerBtnText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12,
      color: '#000000',
    },

    /* Menu opens directly under the button, capped so a long squad scrolls. */
    pickerWrap: {
      zIndex: 5,
    },

    playerMenu: {
      maxHeight: 220,
      marginTop: 3,
      backgroundColor: C.blue2,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 4,
    },

    playerMenuItem: {
      minHeight: 34,
      justifyContent: 'center',
      paddingHorizontal: 12,
      borderBottomWidth: 1,
      borderBottomColor: C.line,
    },

    playerMenuItemText: {
      fontFamily: Fonts.body,
      fontSize: 12,
      color: C.text,
    },

    playerMenuEmpty: {
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontFamily: Fonts.body,
      fontSize: 12,
      color: C.hint,
    },

    /* ── Parallel card rows ──────────────────────────────────── */
    duo: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 8,
      marginTop: 12,
    },

    /* Shared shell for the column cards and the full-width ones. */
    card: {
      backgroundColor: C.blue2,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 7,
      overflow: 'hidden',
    },

    /* Card body: pulled out to the card's edges so blue1 reads as a filled
       lower half rather than an inset panel. flexGrow lets it take up the
       slack when the parallel card in the row is taller, so blue1 always
       reaches the bottom edge. */
    body: {
      flex: 1,
      marginHorizontal: -10,
      marginBottom: -10,
      paddingHorizontal: 10,
      paddingTop: 8,
      paddingBottom: 8,
      backgroundColor: C.blue1,
    },

    /* Same, for the full-width cards that have no inner padding. */
    bodyFlat: {
      backgroundColor: C.blue1,
    },

    duoCard: {
      flex: 1,
      paddingHorizontal: 10,
      paddingTop: 10,
      paddingBottom: 10,
    },

    wideCard: {
      marginTop: 12,
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
      fontSize: 15,
      lineHeight: 19,
      color: C.text,
    },

    cardTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.text,
    },

    /* The rules close the blue2 head and run edge to edge so each card reads
       as one long line splitting head from body; the body's paddingTop
       supplies the space underneath. */
    thinRule: {
      height: 1,
      marginHorizontal: -10,
      backgroundColor: C.text,
      marginTop: 6,
    },

    blackRule: {
      height: 1,
      marginHorizontal: -10,
      backgroundColor: C.text,
      marginTop: 8,
    },

    grayRule: {
      height: 1,
      marginHorizontal: -10,
      backgroundColor: C.hintSoft,
      marginTop: 6,
    },

    /* ── Identity card ───────────────────────────────────────── */
    identityTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    profileBox: {
      width: 64,
      height: 64,
      borderRadius: 8,
      backgroundColor: '#F5F5F5',
      borderWidth: 1,
      borderColor: '#000000',
      alignItems: 'center',
      justifyContent: 'center',
    },

    /* Fills the avatar box when the player record carries a photo. */
    profileImg: {
      width: 62,
      height: 62,
      borderRadius: 7,
    },

    identityText: {
      flex: 1,
    },

    playerName: {
      fontFamily: Fonts.bodyBold,
      fontSize: 13,
      lineHeight: 16,
      color: C.text,
    },

    playerSub: {
      fontFamily: Fonts.body,
      fontSize: 10,
      lineHeight: 13,
      color: C.hint,
      marginTop: 1,
    },

    playerTeam: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.hint,
      marginTop: 5,
    },

    activePill: {
      alignSelf: 'flex-start',
      marginTop: 4,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingHorizontal: 9,
      paddingVertical: 2,
      borderRadius: 999,
      backgroundColor: C.green,
    },

    activePillText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 9.5,
      lineHeight: 12,
      color: '#F5F5F5',
    },

    statRow: {
      flexDirection: 'row',
      marginBottom: 6,
    },

    statRowLast: {
      marginBottom: 0,
    },

    statCol: {
      flex: 1,
      alignItems: 'center',
    },

    statValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 15,
      lineHeight: 19,
    },

    statLabel: {
      fontFamily: Fonts.body,
      fontSize: 9,
      lineHeight: 12,
      color: C.hint,
      marginTop: 1,
    },

    /* ── Latest ratings ──────────────────────────────────────── */
    rateTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
    },

    /* Shrinks rather than pushing the score off the card's edge. */
    rateTitle: {
      flexShrink: 1,
      fontFamily: Fonts.bodyBold,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.text,
    },

    rateAvg: {
      fontFamily: Fonts.bodyBold,
      fontSize: 13,
      color: C.green,
    },

    rateRow: {
      marginBottom: 8,
    },

    rateLine: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
    },

    rateLabel: {
      flexShrink: 1,
      fontFamily: Fonts.body,
      fontSize: 10.5,
      color: C.hint,
    },

    rateValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 10.5,
      color: C.text,
    },

    rail: {
      height: 4,
      marginTop: 4,
      borderRadius: 2,
      backgroundColor: C.hintSoft,
      overflow: 'hidden',
    },

    railFill: {
      height: '100%',
      borderRadius: 2,
      backgroundColor: C.green,
    },

    /* ── Empty state ─────────────────────────────────────────── */
    empty: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 22,
    },

    starWrap: {
      width: 64,
      height: 64,
      alignItems: 'center',
      justifyContent: 'center',
    },

    starOutline: {
      position: 'absolute',
      width: 64,
      height: 64,
    },

    starImg: {
      width: 58,
      height: 58,
    },

    emptyText: {
      marginTop: 10,
      fontFamily: Fonts.body,
      fontSize: 12,
      color: C.hint,
    },

    /* ── Prezenca ────────────────────────────────────────────── */
    prezencaTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    prezencaPct: {
      fontFamily: Fonts.bodyBold,
      fontSize: 13,
      color: C.red,
    },

    attRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 5,
    },

    attLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
    },

    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },

    attLabel: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      color: C.hint,
    },

    attValue: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: C.text,
    },

    totalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 40,
      marginTop: 12,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
      backgroundColor: C.blue2,
    },

    totalRowLabel: {
      fontFamily: Fonts.body,
      fontSize: 9.5,
      color: C.hint,
    },

    totalRowValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 11.5,
      color: C.text,
    },

    /* ── Details ─────────────────────────────────────────────── */
    detRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
      gap: 6,
    },

    detRowLine: {
      borderBottomWidth: 1,
      borderBottomColor: C.rowLine,
    },

    detLabel: {
      fontFamily: Fonts.body,
      fontSize: 10,
      color: C.hint,
    },

    detValue: {
      flexShrink: 1,
      textAlign: 'right',
      fontFamily: Fonts.bodyBold,
      fontSize: 10,
      color: C.text,
    },

    /* ── Injury history ──────────────────────────────────────── */
    injuryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },

    injuryText: {
      flex: 1,
    },

    injuryName: {
      fontFamily: Fonts.bodyBold,
      fontSize: 13,
      lineHeight: 16,
      color: C.text,
    },

    injurySub: {
      fontFamily: Fonts.body,
      fontSize: 10,
      lineHeight: 13,
      color: C.hint,
      marginTop: 2,
    },

    healedPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: C.green,
    },

    healedPillText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10,
      lineHeight: 13,
      color: '#F5F5F5',
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
