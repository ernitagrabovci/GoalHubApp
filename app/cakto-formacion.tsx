import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import { getMatch, saveMatchLineup, type LineupEntry } from '@/lib/api/matches';
import { listPlayers } from '@/lib/api/players';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * Cakto formacion — opened from the button of the same name on the trainer's
 * upcoming-match page. The trainer calls each player up as Startues, Rezervë or
 * Jashtë, and can correct their position, then publishes the call-up.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',

  /* Both cards and every control are rimmed in a thin black line. */
  frame: '#000000',
  headLine: 'rgba(30,40,35,0.10)',
  rowLine: 'rgba(100,140,190,0.22)',

  blue1: '#E3EEFB',
  blue2: '#F6FBFF',

  green: '#159447',
  red: '#E03131',
  orange: '#E4A000',
  blue: '#0766D8',

  green10: 'rgba(21,148,71,0.10)',
  green20: 'rgba(21,148,71,0.20)',
};

/* A player's position, each in its own colour under their name. */
const POS_TONE: Record<string, string> = {
  Portier: C.blue,
  Mbrojtës: C.green,
  Mesfushor: C.orange,
  Sulmues: C.red,
};

const POSITIONS = ['Portier', 'Mbrojtës', 'Mesfushor', 'Sulmues'];

/* The API stores a position code (`config/positions.php`); the picker shows the
   four broad Albanian labels, so each code folds into one of them. */
const CODE_TO_POS: Record<string, string> = {
  PO: 'Portier',
  BDJ: 'Mbrojtës',
  QBM: 'Mbrojtës',
  BSI: 'Mbrojtës',
  MMB: 'Mesfushor',
  MQ: 'Mesfushor',
  MO: 'Mesfushor',
  KDJ: 'Sulmues',
  KSI: 'Sulmues',
  SU: 'Sulmues',
  SS: 'Sulmues',
};

/* The label the picker shows → the code the lineup endpoint stores. */
const POS_TO_CODE: Record<string, string> = {
  Portier: 'PO',
  Mbrojtës: 'QBM',
  Mesfushor: 'MQ',
  Sulmues: 'SU',
};

/** A position code (or an already-labelled value) → a picker label. */
function posLabel(code: string | null): string {
  if (!code) return 'Mesfushor';
  if (POSITIONS.includes(code)) return code;
  return CODE_TO_POS[code] ?? 'Mesfushor';
}

const ROLES = ['Jashtë', 'Startues', 'Rezervë'];

const STARTER_CAP = 11;

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const SEASON_YEAR = '2026';

type SquadMember = { nr: string; name: string; pos: string };

/* A squad row the screen renders, plus the backend player id when it has one. */
type Player = { key: string; id: number | null; nr: string; name: string; pos: string };

const SQUAD: SquadMember[] = [
  { nr: '1', name: 'Luan Kryeziu', pos: 'Portier' },
  { nr: '2', name: 'Bekim Rexhepi', pos: 'Portier' },
  { nr: '3', name: 'Ilir Bytyqi', pos: 'Portier' },
  { nr: '4', name: 'Driton Demiri', pos: 'Portier' },
  { nr: '5', name: 'Dren Hyseni', pos: 'Mbrojtës' },
  { nr: '6', name: 'Bekim Shala', pos: 'Mbrojtës' },
  { nr: '7', name: 'Dardan Krasniqi', pos: 'Mbrojtës' },
  { nr: '8', name: 'Fisnik Berisha', pos: 'Mbrojtës' },
  { nr: '9', name: 'Jetmir Zeka', pos: 'Mbrojtës' },
  { nr: '10', name: 'Riad Hoxha', pos: 'Mbrojtës' },
  { nr: '11', name: 'Endrit Gashi', pos: 'Mbrojtës' },
  { nr: '12', name: 'Fatos Bytyqi', pos: 'Mesfushor' },
  { nr: '13', name: 'Endrit Hoxha', pos: 'Mesfushor' },
  { nr: '14', name: 'Genc Morina', pos: 'Mesfushor' },
  { nr: '15', name: 'Kujtim Gashi', pos: 'Mesfushor' },
  { nr: '16', name: 'Leart Berisha', pos: 'Mesfushor' },
  { nr: '17', name: 'Mergim Berisha', pos: 'Mesfushor' },
  { nr: '18', name: 'Blerim Krasniqi', pos: 'Mesfushor' },
  { nr: '19', name: 'Ardit Llapashtica', pos: 'Sulmues' },
  { nr: '20', name: 'Hamdi Shala', pos: 'Sulmues' },
  { nr: '21', name: 'Arbnor Zeka', pos: 'Sulmues' },
  { nr: '22', name: 'Dion Nimani', pos: 'Sulmues' },
  { nr: '23', name: 'Yll Demaku', pos: 'Sulmues' },
  { nr: '24', name: 'Narti Cerkini', pos: 'Sulmues' },
  { nr: '25', name: 'Erion Zeka', pos: 'Sulmues' },
];

/* The id-less fallback squad, shown until a real team loads. */
const STATIC_SQUAD: Player[] = SQUAD.map((p) => ({
  key: p.nr,
  id: null,
  nr: p.nr,
  name: p.name,
  pos: p.pos,
}));

const INSTRUCTIONS = [
  'Zgjedh Startues për 11 lojtarët kryesorë',
  'Zgjedh Rezervë për lojtarët e bankës',
  'Zgjedh Jashtë për lojtar të pa thirrur',
  'Kliko Publiko për t’i njoftuar lojtarët',
];

const CLOSED = 'Jashtë';

/** "AUG" → "Aug" for the readable date line. */
function monthName(mon: string): string {
  if (MONTHS.indexOf(mon.toUpperCase()) < 0) return mon;
  return mon.charAt(0).toUpperCase() + mon.slice(1).toLowerCase();
}

export default function SetFormationScreen() {
  const router = useRouter();
  const { token, signOut } = useSession();

  const params = useLocalSearchParams<{
    id?: string;
    matchId?: string;
    home?: string;
    away?: string;
    day?: string;
    mon?: string;
    time?: string;
  }>();

  const matchId = params.id ? Number(params.id) : params.matchId ? Number(params.matchId) : null;
  const hasId = matchId !== null && !Number.isNaN(matchId);

  const home = params.home ?? '';
  const away = params.away ?? '';
  /* The side we are not: the fixture is always listed with Prishtina in it. */
  const rival = home.includes('Prishtina') ? away : home;

  const day = `${params.day ?? ''} ${monthName(params.mon ?? '')} ${SEASON_YEAR}`.trim();
  const time = params.time ?? '';

  const [squad, setSquad] = useState<Player[]>(STATIC_SQUAD);
  /* Every player starts outside the squad; the trainer calls them up. */
  const [roles, setRoles] = useState<Record<string, string>>(() =>
    Object.fromEntries(STATIC_SQUAD.map((p) => [p.key, CLOSED])),
  );
  const [positions, setPositions] = useState<Record<string, string>>(() =>
    Object.fromEntries(STATIC_SQUAD.map((p) => [p.key, p.pos])),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /* Only one dropdown is ever unrolled, and it floats over the rows below. */
  const [openKey, setOpenKey] = useState<string | null>(null);

  /* Load the match, then the squad of the team it belongs to, seeding each
     player's call-up and position from any lineup already saved. */
  useEffect(() => {
    if (!token || !hasId) return;
    const controller = new AbortController();

    (async () => {
      try {
        const matchRes = await getMatch(token, matchId as number, controller.signal);
        if (controller.signal.aborted) return;

        const teamId = matchRes.data.team?.id ?? null;
        const existing = matchRes.data.lineup ?? [];
        const playersRes = await listPlayers(
          token,
          teamId ? { team_id: teamId } : {},
          controller.signal,
        );
        if (controller.signal.aborted) return;

        const byId = new Map(existing.map((l) => [l.player_id, l]));
        const apiSquad: Player[] = playersRes.data.map((p) => ({
          key: String(p.id),
          id: p.id,
          nr: p.jersey_number != null ? String(p.jersey_number) : '',
          name: p.name ?? '—',
          pos: posLabel(byId.get(p.id)?.position ?? p.position),
        }));

        setSquad(apiSquad);
        setRoles(
          Object.fromEntries(
            apiSquad.map((p) => {
              const type = byId.get(p.id as number)?.type;
              const role =
                type === 'starter' ? 'Startues' : type === 'substitute' ? 'Rezervë' : CLOSED;
              return [p.key, role];
            }),
          ),
        );
        setPositions(Object.fromEntries(apiSquad.map((p) => [p.key, p.pos])));
        setError(null);
      } catch (err) {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          signOut();
          router.replace('/login');
          return;
        }
        setError('Nuk mund të ngarkohet formacioni.');
      }
    })();

    return () => controller.abort();
  }, [token, matchId, hasId, router, signOut]);

  const roster = squad.map((p) => ({
    ...p,
    pos: positions[p.key] ?? p.pos,
    role: roles[p.key] ?? CLOSED,
  }));

  const starters = roster.filter((p) => p.role === 'Startues').length;
  const reserves = roster.filter((p) => p.role === 'Rezervë').length;

  const summary = [
    { label: 'Startuesit', value: `${starters}/${STARTER_CAP}` },
    { label: 'Rezervat', value: `${reserves}` },
    { label: 'Jashtë', value: `${roster.length - starters - reserves}` },
  ];

  const publish = () => {
    if (saving) return;
    /* No match id: nothing to publish to, close as before. */
    if (!hasId || !token) {
      router.back();
      return;
    }
    if (starters > STARTER_CAP) {
      setError('Maksimumi 11 startues.');
      return;
    }

    const lineup: Record<number, LineupEntry> = {};
    for (const p of squad) {
      if (p.id == null) continue;
      const role = roles[p.key] ?? CLOSED;
      const type: LineupEntry['type'] =
        role === 'Startues' ? 'starter' : role === 'Rezervë' ? 'substitute' : 'out';
      const label = positions[p.key] ?? p.pos;
      lineup[p.id] = {
        type,
        position: type === 'out' ? null : (POS_TO_CODE[label] ?? label),
      };
    }

    setSaving(true);
    setError(null);

    saveMatchLineup(token, matchId as number, lineup)
      .then(() => router.back())
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          signOut();
          router.replace('/login');
          return;
        }
        setSaving(false);
        if (err instanceof ApiError && err.status === 0) {
          setError('Nuk mund të lidhemi me serverin. Kontrollo lidhjen.');
        } else if (err instanceof ApiError && err.status === 422) {
          setError('Të dhënat nuk janë të vlefshme.');
        } else {
          setError('Nuk mund të ruhet formacioni.');
        }
      });
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
                  {rival ? `Formacioni - vs ${rival}` : 'Formacioni'}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {[day, time].filter(Boolean).join(', ')}
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
            {/* ── Përmbledhje / Udhëzimi ────────────────────────── */}
            <View style={styles.duo}>
              {/* The narrow one: the counts, then the publish button. */}
              <View style={[styles.card, styles.duoSmall]}>
                <View style={styles.head}>
                  <Text style={styles.headTextBlack} numberOfLines={1}>
                    Përmbledhje
                  </Text>
                </View>
                <View style={styles.headLine} />

                <View style={styles.sumBody}>
                  {summary.map((s) => (
                    <View key={s.label} style={styles.sumRow}>
                      <Text style={styles.sumLabel} numberOfLines={1}>
                        {s.label}
                      </Text>
                      <Text style={styles.sumValue} numberOfLines={1}>
                        {s.value}
                      </Text>
                    </View>
                  ))}

                  <Pressable
                    onPress={publish}
                    disabled={saving}
                    accessibilityRole="button"
                    accessibilityLabel="Publiko formacionin"
                    style={({ pressed }) => [
                      styles.publishBtn,
                      saving && styles.publishBtnOff,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.publishText} numberOfLines={1}>
                      Publiko formacionin
                    </Text>
                  </Pressable>

                  {error ? (
                    <Text style={styles.errorText} numberOfLines={3}>
                      {error}
                    </Text>
                  ) : null}
                </View>
              </View>

              {/* The wide one: how the three call-ups work. */}
              <View style={[styles.card, styles.duoWide]}>
                <View style={styles.head}>
                  <Text style={styles.headTextBlack} numberOfLines={1}>
                    Udhëzimi
                  </Text>
                </View>
                <View style={styles.headLine} />

                <View style={styles.guideBody}>
                  {INSTRUCTIONS.map((line) => (
                    <Text key={line} style={styles.guideText}>
                      {line}
                    </Text>
                  ))}
                </View>
              </View>
            </View>

            {/* ── Lojtarët e ekipit ─────────────────────────────── */}
            <View style={[styles.card, styles.cardGap, styles.rosterCard]}>
              <View style={styles.head}>
                <Text style={styles.headTextBlack} numberOfLines={1}>
                  Lojtarët e ekipit
                </Text>
              </View>
              <View style={styles.headLine} />

              <View style={styles.rosterBody}>
                {roster.map((p, i) => {
                  const roleKey = `${p.key}:role`;
                  const posKey = `${p.key}:pos`;
                  return (
                    <View
                      key={p.key}
                      style={[
                        styles.tr,
                        i > 0 && styles.trBorder,
                        (openKey === roleKey || openKey === posKey) && styles.trOpen,
                      ]}
                    >
                      <View style={styles.who}>
                        <Text
                          style={styles.pName}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.8}
                        >
                          {p.name}
                        </Text>
                        <Text
                          style={[styles.pPos, { color: POS_TONE[p.pos] ?? C.hint }]}
                          numberOfLines={1}
                        >
                          {p.pos}
                        </Text>
                      </View>

                      <View style={styles.picks}>
                        <Pick
                          value={p.role}
                          options={ROLES}
                          width={78}
                          open={openKey === roleKey}
                          setOpen={(v) => setOpenKey(v ? roleKey : null)}
                          isOff={(option) =>
                            option === 'Startues' &&
                            starters >= STARTER_CAP &&
                            p.role !== 'Startues'
                          }
                          onChange={(v) => setRoles((prev) => ({ ...prev, [p.key]: v }))}
                        />
                        <Pick
                          value={p.pos}
                          options={POSITIONS}
                          width={90}
                          open={openKey === posKey}
                          setOpen={(v) => setOpenKey(v ? posKey : null)}
                          onChange={(v) => setPositions((prev) => ({ ...prev, [p.key]: v }))}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Dropdown                                                            */
/* ------------------------------------------------------------------ */

function Pick({
  value,
  options,
  width,
  open,
  setOpen,
  isOff,
  onChange,
}: {
  value: string;
  options: string[];
  width: number;
  open: boolean;
  setOpen: (open: boolean) => void;
  isOff?: (option: string) => boolean;
  onChange: (v: string) => void;
}) {
  return (
    <View style={{ width }}>
      <Pressable
        onPress={() => setOpen(!open)}
        accessibilityRole="button"
        accessibilityLabel={`Zgjedh: ${value}`}
        style={({ pressed }) => [styles.sel, pressed && styles.pressed]}
      >
        <Text style={styles.selText} numberOfLines={1}>
          {value}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={I(12)} color={C.text} />
      </Pressable>

      {open ? (
        <View style={styles.selOpts}>
          {options.map((o) => {
            const off = isOff?.(o) ?? false;
            const active = o === value;
            return (
              <Pressable
                key={o}
                disabled={off}
                onPress={() => {
                  onChange(o);
                  setOpen(false);
                }}
                accessibilityRole="button"
                accessibilityLabel={o}
                style={[styles.selOpt, active && styles.selOptActive, off && styles.selOptOff]}
              >
                <Text
                  style={[styles.selOptText, active && styles.selOptTextActive]}
                  numberOfLines={1}
                >
                  {o}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
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
      /* Room for the last row's dropdown, which hangs past the card. */
      paddingBottom: 110,
    },

    /* ── Cards ───────────────────────────────────────────────── */
    card: {
      backgroundColor: C.blue2,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 5,
      overflow: 'hidden',
    },

    cardGap: {
      marginTop: 14,
    },

    head: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
      paddingVertical: 9,
    },

    headTextBlack: {
      textAlign: 'center',
      fontFamily: Fonts.bodyBold,
      fontSize: 13,
      lineHeight: 17,
      color: C.text,
    },

    headLine: {
      height: 1,
      backgroundColor: C.headLine,
    },

    /* ── Përmbledhje / Udhëzimi ───────────────────────────────── */
    duo: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 8,
      marginTop: 14,
    },

    /* The square-ish one on the left, the wide one on the right. */
    duoSmall: {
      flex: 0.85,
    },

    duoWide: {
      flex: 1.3,
    },

    sumBody: {
      flex: 1,
      justifyContent: 'space-between',
      backgroundColor: C.blue1,
      paddingHorizontal: 8,
      paddingTop: 2,
      paddingBottom: 8,
    },

    sumRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 4,
      height: 28,
    },

    sumLabel: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      color: C.hint,
    },

    sumValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 11,
      color: C.text,
    },

    publishBtn: {
      minHeight: 28,
      marginTop: 8,
      paddingHorizontal: 6,
      paddingVertical: 4,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.green20,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    publishText: {
      textAlign: 'center',
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10,
      lineHeight: 13,
      color: C.text,
    },

    publishBtnOff: {
      opacity: 0.5,
    },

    errorText: {
      marginTop: 8,
      textAlign: 'center',
      fontFamily: Fonts.body,
      fontSize: 9.5,
      lineHeight: 13,
      color: C.red,
    },

    guideBody: {
      flex: 1,
      backgroundColor: C.blue1,
      paddingHorizontal: 9,
      paddingTop: 8,
      paddingBottom: 10,
      gap: 8,
    },

    guideText: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 14,
      color: C.hint,
    },

    /* ── Lojtarët e ekipit ───────────────────────────────────── */
    /* No overflow clipping on this one: an unrolled dropdown hangs past the
       card's bottom edge, and would be cut off at the last rows. */
    rosterCard: {
      overflow: 'visible',
    },

    rosterBody: {
      backgroundColor: C.blue1,
      borderBottomLeftRadius: 4,
      borderBottomRightRadius: 4,
    },

    /* The name block stays at the top when a dropdown below it opens. */
    tr: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      minHeight: 58,
      paddingHorizontal: 9,
      paddingVertical: 12,
    },

    /* Every row but the first is ruled off from the one above it. */
    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    /* Lifts the whole row so its unrolled dropdown floats over the next ones. */
    trOpen: {
      zIndex: 30,
      elevation: 30,
    },

    who: {
      flex: 1,
      justifyContent: 'center',
      minHeight: 24,
    },

    pName: {
      fontFamily: Fonts.bodyBold,
      fontSize: 11.5,
      lineHeight: 14,
      color: C.text,
    },

    pPos: {
      marginTop: 1,
      fontFamily: Fonts.body,
      fontSize: 9.5,
      lineHeight: 12,
    },

    picks: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 6,
    },

    /* ── Dropdown ────────────────────────────────────────────── */
    sel: {
      height: 26,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 6,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 3,
    },

    selText: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 9.5,
      color: C.text,
      marginRight: 2,
    },

    /* Floats over the rows below so opening it never pushes them down. */
    selOpts: {
      position: 'absolute',
      top: 28,
      left: 0,
      right: 0,
      zIndex: 40,
      elevation: 12,
      backgroundColor: '#F5F5F5',
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 3,
      overflow: 'hidden',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
    },

    selOpt: {
      height: 26,
      justifyContent: 'center',
      paddingHorizontal: 6,
    },

    selOptActive: {
      backgroundColor: C.green10,
    },

    /* Startues, once the eleven are already named. */
    selOptOff: {
      opacity: 0.35,
    },

    selOptText: {
      fontFamily: Fonts.body,
      fontSize: 9.5,
      color: C.text,
    },

    selOptTextActive: {
      fontFamily: Fonts.bodyBold,
      color: C.green,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
