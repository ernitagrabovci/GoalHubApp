import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { EditMatchModal } from '@/components/matches/match-modals';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import { deleteMatch, getMatch } from '@/lib/api/matches';
import { listTeams } from '@/lib/api/teams';
import type { ApiMatch, ApiTeam } from '@/lib/api/types';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * One upcoming match — opened from "Shiko" on the ndeshjet page. The fixture
 * comes in as route params so an edited match shows its new values here.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',

  /* blue1 = the deeper blue of the buttons; blue2 = the pale card blue. */
  blue1: '#E3EEFB',
  blue2: '#F6FBFF',

  border: 'rgba(100,140,190,0.30)',
  rowLine: 'rgba(100,140,190,0.22)',
  headLine: 'rgba(30,40,35,0.10)',

  dateBlue: '#0766D8',
};

const SEASON_YEAR = '2026';

const INFO_LABELS = ['Ekipi', 'Fiziku', 'Taktikat', 'Stabilitet'];

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** "AUG" → "Aug" for the readable date line. */
function monthName(mon: string): string {
  if (MONTHS.indexOf(mon.toUpperCase()) < 0) return mon;
  return mon.charAt(0).toUpperCase() + mon.slice(1).toLowerCase();
}

/** "U21 Superliga e Kosovës" belongs to U21; the senior league has no prefix. */
function teamFromComp(comp: string): string {
  const match = /^(U\d{2})\b/.exec(comp);
  return match ? match[1] : 'Ekipi i Parë';
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** `2026-08-18T16:00:00Z` → `18 Aug 2026, 16:00`. */
function matchDateLine(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${pad2(d.getDate())} ${monthName(MONTHS[d.getMonth()])} ${d.getFullYear()}, ${pad2(
    d.getHours(),
  )}:${pad2(d.getMinutes())}`;
}

export default function MatchViewScreen() {
  const router = useRouter();
  const { user, token, signOut } = useSession();

  const params = useLocalSearchParams<{
    id?: string;
    home?: string;
    away?: string;
    day?: string;
    mon?: string;
    time?: string;
    venue?: string;
    comp?: string;
  }>();

  const matchId = params.id ? Number(params.id) : null;
  const [match, setMatch] = useState<ApiMatch | null>(null);
  const [teams, setTeams] = useState<ApiTeam[]>([]);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reload, setReload] = useState(0);

  const onExpired = () => {
    signOut();
    router.replace('/login');
  };

  useEffect(() => {
    if (!token || !matchId || Number.isNaN(matchId)) return;
    const controller = new AbortController();

    getMatch(token, matchId, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setMatch(res.data);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) {
          signOut();
          router.replace('/login');
        }
      });

    return () => controller.abort();
  }, [token, matchId, router, signOut, reload]);

  /* The teams feed the edit popup's "Ekipi" picker. */
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

  const comp = match?.competition ?? params.comp ?? '';
  const home = match?.team?.name ?? params.home ?? '';
  const away = match?.opponent ?? params.away ?? '';
  const title = away ? `${home} - ${away}` : home;

  const values = [
    match?.team?.name ?? teamFromComp(comp),
    match?.venue ?? params.venue ?? '',
    comp,
    match
      ? matchDateLine(match.scheduled_at)
      : `${params.day ?? ''} ${monthName(params.mon ?? '')} ${SEASON_YEAR}, ${params.time ?? ''}`.trim(),
  ];

  /* The match's statistics and starting eleven, once it has loaded. */
  const statRows = (match?.player_stats ?? []).map((p) => ({
    name: p.player_name ?? '—',
    goals: p.goals ?? 0,
    assists: p.assists ?? 0,
  }));

  const starters = (match?.lineup ?? [])
    .filter((l) => l.type === 'starter')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((l) => ({ name: l.player_name ?? '—', position: l.position ?? '' }));

  const runDelete = () => {
    if (!token || matchId == null || deleting) return;
    setDeleting(true);
    deleteMatch(token, matchId)
      .then(() => router.back())
      .catch((e) => {
        setDeleting(false);
        if (e instanceof ApiError && e.status === 401) {
          onExpired();
          return;
        }
        const text =
          e instanceof ApiError && e.message
            ? e.message
            : 'Ndeshja nuk mund të fshihet.';
        Alert.alert('Nuk mund të fshihet', text);
      });
  };

  const confirmDelete = () => {
    if (deleting) return;
    Alert.alert('Fshi ndeshjen', 'A jeni i sigurt që dëshironi ta fshini këtë ndeshje?', [
      { text: 'Anulo', style: 'cancel' },
      { text: 'Fshi', style: 'destructive', onPress: runDelete },
    ]);
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
                  {title}
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
            {/* ── Row actions ───────────────────────────────────── */}
            <View style={styles.actions}>
              <Pressable
                onPress={() => setEditing(true)}
                disabled={!match}
                accessibilityRole="button"
                accessibilityLabel="Edito ndeshjen"
                style={({ pressed }) => [
                  styles.editBtn,
                  !match && styles.btnOff,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.actionText}>Edito</Text>
              </Pressable>
              <Pressable
                onPress={confirmDelete}
                disabled={deleting || !match}
                accessibilityRole="button"
                accessibilityLabel="Fshi ndeshjen"
                style={({ pressed }) => [
                  styles.deleteBtn,
                  (!match || deleting) && styles.btnOff,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.actionText}>Fshi</Text>
              </Pressable>
            </View>

            {/* ── Informacioni / Statistikat ────────────────────── */}
            <View style={styles.duo}>
              {/* One table, two columns: the labels lead into the bold values. */}
              <View style={[styles.card, styles.duoCard]}>
                <View style={styles.headRow}>
                  <Text style={styles.headTextBlack}>Informacioni</Text>
                  <Text style={styles.headTextBlue}>E ardhshme</Text>
                </View>
                <View style={styles.headLine} />

                {INFO_LABELS.map((label, i) => (
                  <View key={label} style={[styles.cellRow, i > 0 && styles.rowBorder]}>
                    <Text style={styles.cellLabel} numberOfLines={1}>
                      {label}
                    </Text>
                    <Text
                      style={styles.cellValue}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      {values[i]}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={[styles.card, styles.duoCard]}>
                <View style={styles.head}>
                  <Text style={styles.headTextBlack} numberOfLines={2}>
                    Statistikat e lojtarëve
                  </Text>
                </View>
                <View style={styles.headLine} />

                {statRows.length ? (
                  <View style={[styles.statList, styles.fill]}>
                    <View style={styles.statHead}>
                      <Text style={styles.statHeadText}>Lojtari</Text>
                      <Text style={styles.statHeadText}>Gola / Asiste</Text>
                    </View>
                    {statRows.map((p, i) => (
                      <View key={`${p.name}-${i}`} style={styles.statLine}>
                        <Text style={styles.statName} numberOfLines={1}>
                          {p.name}
                        </Text>
                        <Text style={styles.statVal}>{`${p.goals} / ${p.assists}`}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <View style={[styles.notePad, styles.fill]}>
                    <Text style={styles.note}>
                      Statistikat regjistrohen pas ndeshjes nga trajneri.
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* ── Formacioni ────────────────────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.head}>
                <Text style={styles.headTextBlack}>Formacioni</Text>
              </View>
              <View style={styles.headLine} />

              {starters.length ? (
                <>
                  <Text style={styles.sectionLabel}>{`Startuesit (${starters.length})`}</Text>
                  <View style={styles.squadGrid}>
                    {starters.map((s, i) => (
                      <View key={`${s.name}-${i}`} style={styles.playerCard}>
                        <Text style={styles.playerName}>{s.name}</Text>
                        <Text style={styles.playerPosition}>{s.position}</Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : (
                <View style={styles.notePad}>
                  <Text style={styles.note}>Formacioni nuk është caktuar nga trajneri.</Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
      </View>

      {editing && match ? (
        <EditMatchModal
          match={match}
          token={token ?? ''}
          teams={teams}
          clubName={user?.club ?? ''}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            setReload((n) => n + 1);
          }}
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

    scroll: {
      paddingBottom: 24,
    },

    /* ── Row actions ─────────────────────────────────────────── */
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
      marginTop: 12,
    },

    /* Black border and black label on both; only the fill tells them apart. */
    editBtn: {
      height: 30,
      paddingHorizontal: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.blue1,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
    },

    deleteBtn: {
      height: 30,
      paddingHorizontal: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(224,49,49,0.20)',
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
    },

    actionText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      color: '#000000',
    },

    /* ── Cards ───────────────────────────────────────────────── */
    card: {
      backgroundColor: C.blue2,
      borderWidth: 2,
      borderColor: C.border,
      borderRadius: 7,
      overflow: 'hidden',
    },

    cardGap: {
      marginTop: 14,
    },

    /* Two cards on top, identical in width and height. */
    duo: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 8,
      marginTop: 14,
    },

    duoCard: {
      flex: 1,
    },

    head: {
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 10,
    },

    headRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 10,
    },

    headTextBlack: {
      fontFamily: Fonts.bodyBold,
      fontSize: 14,
      lineHeight: 18,
      color: C.text,
    },

    headTextBlue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 14,
      lineHeight: 18,
      color: C.dateBlue,
    },

    headLine: {
      height: 1,
      backgroundColor: C.headLine,
    },

    /* ── Informacioni rows ───────────────────────────────────── */
    cellRow: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 34,
      paddingHorizontal: 10,
      gap: 6,
    },

    rowBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    cellLabel: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 14,
      color: C.hint,
    },

    cellValue: {
      flex: 1,
      textAlign: 'right',
      fontFamily: Fonts.bodyBold,
      fontSize: 11,
      lineHeight: 14,
      color: C.text,
    },

    /* ── Empty states ────────────────────────────────────────── */
    notePad: {
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 18,
    },

    /* The statistics card is stretched to its neighbour's height, so its body
       takes the slack instead of leaving a pale strip along the bottom. */
    fill: {
      flex: 1,
      justifyContent: 'center',
    },

    note: {
      textAlign: 'center',
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 15,
      color: C.gray,
    },

    btnOff: {
      opacity: 0.5,
    },

    /* ── Player statistics (compact) ─────────────────────────── */
    statList: {
      paddingHorizontal: 8,
      paddingBottom: 8,
    },

    statHead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
      paddingTop: 8,
      paddingBottom: 2,
    },

    statHeadText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 9,
      lineHeight: 12,
      color: C.gray,
    },

    statLine: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
      minHeight: 24,
      paddingHorizontal: 4,
    },

    statName: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.text,
    },

    statVal: {
      fontFamily: Fonts.bodyBold,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.text,
    },

    /* ── Formacioni ──────────────────────────────────────────── */
    sectionLabel: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12,
      lineHeight: 16,
      color: C.text,
      paddingHorizontal: 10,
      paddingTop: 10,
    },

    squadGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      paddingHorizontal: 10,
      paddingTop: 8,
      paddingBottom: 12,
    },

    /* No fixed height — a two-line name grows the card, a short one shrinks it. */
    playerCard: {
      width: '31%',
      minHeight: 40,
      justifyContent: 'center',
      paddingHorizontal: 7,
      paddingVertical: 7,
      backgroundColor: 'rgba(158,253,134,0.20)',
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
    },

    playerName: {
      fontFamily: Fonts.bodyBold,
      fontSize: 11.5,
      lineHeight: 14,
      color: '#000000',
    },

    playerPosition: {
      fontFamily: Fonts.body,
      fontSize: 9,
      lineHeight: 12,
      marginTop: 1,
      color: '#000000',
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
