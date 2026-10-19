import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { FilterSelect, type FilterOption } from '@/components/filters/filter-select';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import { listPlayers, playerStats } from '@/lib/api/players';
import { listTeams } from '@/lib/api/teams';
import type { ApiPlayer, ApiTeam, PlayerStats } from '@/lib/api/types';
import { POSITIONS, positionLabel } from '@/lib/player-position';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * Lista e lojtarëve — the trainer's squad, opened from the "Lojtarët" card on
 * the trainer dashboard.
 *
 * Four orange-framed squares, the team/position filters, the squad table and
 * the Vlerësimet card.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',

  frame: '#000000',
  headLine: 'rgba(30,40,35,0.10)',
  rowLine: 'rgba(100,140,190,0.22)',

  blueSoft: '#E3EEFB',
  orange: '#E4A000',
  green: '#159447',
  red: '#E03131',

  /* The ratings card borrows the "Ndeshjet" card's palette from the trainer
     home — cream ground, sand frame, amber button. */
  sand: '#F8EBD8',
  sandBorder: '#F0D9AE',
  sandBtn: '#D99A4A',
};

/* Same art the trainer home's "Ndeshjet" card uses, mirrored on both sides. */
const IMG = {
  ndeshjet: require('@/assets/dashboard/ndeshjet.png'),
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

type Square = { label: string; value: string };

const POSITION_OPTIONS: FilterOption[] = [
  { label: 'Të gjitha pozicionet', value: '' },
  ...POSITIONS.map((p) => ({ label: p.label, value: p.code })),
];

/* The squad on show — also the team handed to the single-player page. */
const TEAM = 'Ekipi i Parë';

/* ── Squad table ───────────────────────────────────────────────────── */

type Status = 'Aktiv' | 'I lënduar' | 'I pezulluar';

type Player = {
  id: number;
  nr: string;
  name: string;
  pos: string;
  att: string;
  rating: string;
  status: Status;
};

const STATUS_TONE: Record<Status, string> = {
  Aktiv: C.green,
  'I lënduar': C.red,
  'I pezulluar': C.orange,
};

const COLS: { key: keyof Player; label: string; width: number }[] = [
  { key: 'nr', label: 'NR', width: 38 },
  { key: 'name', label: 'Emri', width: 132 },
  { key: 'pos', label: 'Pozicioni', width: 92 },
  { key: 'att', label: 'Prania në stërvitje', width: 118 },
  { key: 'rating', label: 'Vlerësimi', width: 76 },
  { key: 'status', label: 'Statusi', width: 84 },
];

const ACTION_W = 68;

/** Backend `health_status` → the table's existing labels, reusing the same
 *  three tones. `rehabilitation` reads as a player still out injured. */
function statusOf(health: string): Status {
  if (health === 'suspended') return 'I pezulluar';
  if (health === 'injured' || health === 'rehabilitation') return 'I lënduar';
  return 'Aktiv';
}

/** A fetched squad member → the table's row shape. Attendance and rating carry
 *  no API equivalent on the squad list, so they hold the dash placeholder. */
function toRow(p: ApiPlayer): Player {
  return {
    id: p.id,
    nr: p.jersey_number != null ? String(p.jersey_number) : '—',
    name: p.name ?? '—',
    pos: positionLabel(p.position),
    att: '—',
    rating: '—',
    status: statusOf(p.health_status),
  };
}

/** A square of the summary row — frosted, then glossed. */
function SummarySquare({ square }: { square: Square }) {
  return (
    <View style={styles.sqShadow}>
      <View style={styles.sq}>
        {/* Frost the canvas grid, then lay a gloss sweep over it. */}
        <BlurView pointerEvents="none" intensity={50} tint="light" style={StyleSheet.absoluteFill} />
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
          <Text style={styles.sqLabel} numberOfLines={2}>
            {square.label}
          </Text>
          <Text
            style={styles.sqValue}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            {square.value}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function PlayerListScreen() {
  const router = useRouter();
  const { token, signOut } = useSession();
  const [rows, setRows] = useState<Player[]>([]);
  const [teams, setTeams] = useState<ApiTeam[]>([]);
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [teamFilter, setTeamFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    playerStats(token, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setStats(res);
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

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    listPlayers(
      token,
      {
        team_id: teamFilter ? Number(teamFilter) : undefined,
        position: positionFilter || undefined,
      },
      controller.signal,
    )
      .then((res) => {
        if (controller.signal.aborted) return;
        setRows(res.data.map(toRow));
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) {
          signOut();
          router.replace('/login');
        }
      });
    return () => controller.abort();
  }, [token, router, signOut, teamFilter, positionFilter]);

  /* The teams fill the first filter's options. */
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    listTeams(token, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setTeams(res.data);
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

  const teamOptions: FilterOption[] = [
    { label: 'Të gjitha ekipet', value: '' },
    ...teams.map((t) => ({ label: t.name, value: String(t.id) })),
  ];

  /* Every number here is black — no tone colour, unlike the other squares.
     Rehabilitation counts as injured, the same way the table's status does. */
  const summary: Square[] = [
    { label: 'Lojtarë gjithsej', value: stats ? String(stats.total) : '—' },
    { label: 'Lojtarë aktiv', value: stats ? String(stats.active) : '—' },
    {
      label: 'Lojtarët e lënduar',
      value: stats ? String(stats.injured + stats.rehabilitation) : '—',
    },
    { label: 'Lojtarët e pezulluar', value: stats ? String(stats.suspended) : '—' },
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
                <Text
                  style={styles.title}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  Lista e lojtarëve
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {stats ? `Ekipi i parë · ${stats.total} lojtarë` : 'Ekipi i parë'}
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
              <SummarySquare key={s.label} square={s} />
            ))}
          </ScrollView>

          <View style={styles.colPad}>
            {/* ── Filters ───────────────────────────────────────── */}
            <View style={styles.filterRow}>
              <FilterSelect
                label="Filtro sipas ekipit"
                options={teamOptions}
                value={teamFilter}
                onChange={setTeamFilter}
                boxStyle={styles.filterBox}
                textStyle={styles.filterText}
              />
              <FilterSelect
                label="Filtro sipas pozicionit"
                options={POSITION_OPTIONS}
                value={positionFilter}
                onChange={setPositionFilter}
                boxStyle={styles.filterBox}
                textStyle={styles.filterText}
              />
            </View>

            {/* ── Squad table ───────────────────────────────────── */}
            <View style={styles.card}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={styles.tblInner}
              >
                {/* One wrapper, so the header row and the rows below it stack
                    down the page instead of lining up across it. */}
                <View>
                  <View style={[styles.tr, styles.thRow]}>
                    {COLS.map((c) => (
                      <Text key={c.key} style={[styles.th, { width: c.width }]} numberOfLines={1}>
                        {c.label}
                      </Text>
                    ))}
                    {/* Keeps the header rule exactly as wide as the rows below. */}
                    <View style={{ width: ACTION_W }} />
                  </View>

                  {rows.map((p) => (
                    <View key={p.id} style={[styles.tr, styles.trBorder]}>
                      {COLS.map((c) => {
                        const isStatus = c.key === 'status';
                        return (
                          <Text
                            key={c.key}
                            style={[
                              styles.td,
                              c.key === 'name' ? styles.tdName : null,
                              isStatus ? [styles.tdStatus, { color: STATUS_TONE[p.status] }] : null,
                              { width: c.width },
                            ]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.75}
                          >
                            {p[c.key]}
                          </Text>
                        );
                      })}

                      <View style={[styles.actions, { width: ACTION_W }]}>
                        <Pressable
                          onPress={() =>
                            router.push({
                              pathname: '/lojtari',
                              params: {
                                id: String(p.id),
                                name: p.name,
                                team: TEAM,
                                nr: p.nr,
                                pos: p.pos,
                              },
                            })
                          }
                          accessibilityRole="button"
                          accessibilityLabel={`Shiko ${p.name}`}
                          style={({ pressed }) => [styles.actView, pressed && styles.pressed]}
                        >
                          <Text style={styles.actViewText}>Shiko</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* ── Vlerësimet e lojtarëve ────────────────────────── */}
            <Pressable
              onPress={() => router.push('/vleresimet-lojtareve')}
              accessibilityRole="button"
              accessibilityLabel="Vlerësimet e lojtarëve"
              style={({ pressed }) => [styles.ratings, pressed && styles.pressed]}
            >
              <Image source={IMG.ndeshjet} style={styles.rateImgLeft} resizeMode="contain" />
              <Image source={IMG.ndeshjet} style={styles.rateImgRight} resizeMode="contain" />

              <Text style={styles.rateTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                Vlerësimet e lojtarëve
              </Text>

              <View style={styles.rateBtnWrap}>
                <View style={styles.rateBtn}>
                  <Text style={styles.rateBtnText}>Vazhdo</Text>
                </View>
              </View>
            </Pressable>
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
      paddingHorizontal: 27,
      paddingTop: 8,
      gap: 8,
    },

    /* Translucent so the frosted pane inside has a backdrop to blur. */
    sqShadow: {
      width: 100,
      height: 100,
      borderRadius: 8,
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
      padding: 11,
    },

    sheen: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '14%',
    },

    sqLabel: {
      minHeight: 28,
      fontFamily: Fonts.bodyBold,
      fontSize: 12,
      lineHeight: 15,
      color: C.gray,
    },

    sqValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 25,
      lineHeight: 30,
      letterSpacing: -0.5,
      color: C.text,
      marginTop: 3,
    },

    /* ── Filters ─────────────────────────────────────────────── */
    filterRow: {
      flexDirection: 'row',
      gap: 7,
      marginTop: 14,
    },

    /* Hugs its own label rather than splitting the row evenly. */
    filterBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      height: 32,
      paddingHorizontal: 8,
      backgroundColor: C.blueSoft,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    filterText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 11,
      lineHeight: 14,
      color: C.text,
    },

    /* ── Squad table ─────────────────────────────────────────── */
    card: {
      marginTop: 14,
      backgroundColor: '#F5F5F5',
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 5,
      overflow: 'hidden',
    },

    tblInner: {
      paddingHorizontal: 10,
      paddingBottom: 10,
    },

    thRow: {
      paddingTop: 10,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 44,
    },

    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    th: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.gray,
    },

    td: {
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 14,
      color: C.text,
    },

    tdName: {
      fontFamily: Fonts.bodySemiBold,
    },

    tdStatus: {
      fontFamily: Fonts.bodySemiBold,
    },

    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    /* Transparent, outlined, and sitting on the row itself. */
    actView: {
      height: 24,
      paddingHorizontal: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    actViewText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: C.text,
    },

    /* ── Vlerësimet e lojtarëve ──────────────────────────────── */
    ratings: {
      marginTop: 16,
      height: 92,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: C.sandBorder,
      backgroundColor: C.sand,
      overflow: 'hidden',
    },

    rateTitle: {
      position: 'absolute',
      top: 8,
      left: 0,
      right: 0,
      textAlign: 'center',
      fontFamily: Fonts.bodyBold,
      fontSize: 22,
      lineHeight: 26,
      color: C.text,
      zIndex: 3,
    },

    /* Mirrored pair, both clear of the centred button. */
    rateImgLeft: {
      position: 'absolute',
      width: 104,
      height: 84,
      left: -10,
      bottom: -10,
      zIndex: 1,
    },

    rateImgRight: {
      position: 'absolute',
      width: 104,
      height: 84,
      right: -10,
      bottom: -10,
      zIndex: 1,
    },

    rateBtnWrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 9,
      alignItems: 'center',
      zIndex: 5,
    },

    rateBtn: {
      backgroundColor: C.sandBtn,
      borderRadius: 6,
      paddingHorizontal: 18,
      paddingVertical: 7,
    },

    rateBtnText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12.5,
      color: '#F5F5F5',
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
