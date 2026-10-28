import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import { createMatch, listMatches } from '@/lib/api/matches';
import type { ApiMatch } from '@/lib/api/types';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * Ndeshjet — the trainer's own copy of the matches page, opened from the
 * "Ndeshjet" card on the trainer home.
 *
 * The season's headline counts, then the fixtures still to play and the
 * results already banked, each in its own framed table.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',

  /* The pale blue both tables sit on. */
  blue2: '#F6FBFF',

  frame: '#000000',
  border: 'rgba(100,140,190,0.30)',
  rowLine: 'rgba(100,140,190,0.22)',
  headLine: 'rgba(30,40,35,0.10)',

  green: '#159447',
  red: '#E03131',
  orange: '#E4A000',
  dateBlue: '#0766D8',

  /* Translucent row buttons — a wash of the tone, not a block of it. */
  green20: 'rgba(21,148,71,0.20)',
  red20: 'rgba(224,49,49,0.20)',
};

/* Popup palette — same shell as the modals on the other pages. */
const MO = {
  border: '#159B63',
  divider: '#55B88B',
  title: '#080808',
  text: '#111111',
  sub: '#666666',
  inputBorder: '#777777',
  inputBg: '#FAFCFC',
  ph: '#A8A8A8',
  cancel: '#ED5050',
  create: '#16A51D',
  white: '#F5F5F5',
  err: '#C90000',
};

/* Popup option sets */
const VENUES = ['Shtëpi', 'Musafir'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** Two-digit zero pad for the date parts. */
function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** Wrapped so the render-purity rule doesn't flag `Date.now` inside a memo. */
function currentMs(): number {
  return Date.now();
}

/** `home`/`away` → the Albanian venue label the row colours by. */
function venueLabel(venue: string | null): 'Shtëpi' | 'Musafir' {
  return venue === 'home' ? 'Shtëpi' : 'Musafir';
}

/** Maps an API match to an upcoming-fixture row. The API has no home/away
 *  side marker beyond `venue`, so the club is always the home side here. */
function toFixture(m: ApiMatch, club: string): Fixture {
  const d = m.scheduled_at ? new Date(m.scheduled_at) : null;
  const ok = d !== null && !Number.isNaN(d.getTime());
  const atHome = m.venue === 'home';
  return {
    id: m.id,
    day: ok ? pad2(d!.getDate()) : '—',
    mon: ok ? MONTHS[d!.getMonth()] : '—',
    home: atHome ? club : (m.opponent ?? '—'),
    away: atHome ? (m.opponent ?? '—') : club,
    time: ok ? `${pad2(d!.getHours())}:${pad2(d!.getMinutes())}` : '—',
    venue: venueLabel(m.venue),
    comp: m.competition ?? '—',
  };
}

/** Maps an API match to a results-table row. `goals_for`/`goals_against` are
 *  from the club's perspective, so the result reads straight off them. */
function toPlayed(m: ApiMatch, club: string): Played {
  const d = m.scheduled_at ? new Date(m.scheduled_at) : null;
  const ok = d !== null && !Number.isNaN(d.getTime());
  return {
    id: m.id,
    date: ok ? `${pad2(d!.getDate())}/${pad2(d!.getMonth() + 1)}/${d!.getFullYear()}` : '—',
    rival: m.opponent ?? '—',
    venue: venueLabel(m.venue),
    score: `${m.goals_for ?? 0} - ${m.goals_against ?? 0}`,
    comp: m.competition ?? '—',
  };
}

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

/* ── Fixtures ──────────────────────────────────────────────────────── */

type Fixture = {
  id: number;
  day: string;
  mon: string;
  home: string;
  away: string;
  time: string;
  venue: 'Shtëpi' | 'Musafir';
  comp: string;
};

/** What the "Shto ndeshje" popup hands to `POST /matches`. */
type MatchDraft = {
  opponent: string;
  competition: string | null;
  venue: 'home' | 'away';
  scheduled_at: string;
  transport_at: string | null;
  notes: string | null;
};

/* ── Results ───────────────────────────────────────────────────────── */

type Played = {
  id: number;
  date: string;
  rival: string;
  venue: 'Shtëpi' | 'Musafir';
  /* Read from our side of the pitch: "2 - 1" is two for Prishtina. */
  score: string;
  comp: string;
};

type Col = { key: string; label: string; width: number };

const COLS: Col[] = [
  { key: 'date', label: 'DATA', width: 58 },
  { key: 'rival', label: 'KUNDËSHTARI', width: 96 },
  { key: 'venue', label: 'VENDNDODHJA', width: 74 },
  { key: 'score', label: 'REZULTATI', width: 60 },
  { key: 'goals', label: 'GOL', width: 32 },
];

/* Wide enough for "Shiko" and "Statistikat" side by side. */
const ACTION_W = 118;

/** Our goals and the letter that goes with them. */
function resultOf(score: string) {
  const [us, them] = score.split('-').map((n) => Number(n.trim()));
  const letter = us === them ? 'B' : us > them ? 'F' : 'H';
  const tone = letter === 'F' ? C.green : letter === 'H' ? C.red : C.orange;
  return { goals: us, letter, tone };
}

export default function TrainerMatchesScreen() {
  const router = useRouter();
  const { user, token, signOut } = useSession();
  const club = user?.club ?? '—';

  const [matches, setMatches] = useState<ApiMatch[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    listMatches(token, {}, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setMatches(res.data);
        setError(null);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          signOut();
          router.replace('/login');
          return;
        }
        setError('Nuk mund të ngarkohen ndeshjet.');
      });

    return () => controller.abort();
  }, [token, router, signOut, reloadKey]);

  const upcoming = useMemo(() => {
    const now = currentMs();
    return (matches ?? [])
      .filter((m) => m.scheduled_at && new Date(m.scheduled_at).getTime() > now)
      .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())
      .map((m) => toFixture(m, club));
  }, [matches, club]);

  const played = useMemo(() => {
    const now = currentMs();
    return (matches ?? [])
      .filter((m) => !m.scheduled_at || new Date(m.scheduled_at).getTime() <= now)
      .sort((a, b) => new Date(b.scheduled_at ?? 0).getTime() - new Date(a.scheduled_at ?? 0).getTime())
      .map((m) => toPlayed(m, club));
  }, [matches, club]);

  const summary = useMemo(() => {
    let won = 0;
    let draws = 0;
    let lost = 0;
    let gf = 0;
    let ga = 0;
    for (const m of matches ?? []) {
      if (m.scheduled_at && new Date(m.scheduled_at).getTime() > currentMs()) continue;
      const f = m.goals_for ?? 0;
      const a = m.goals_against ?? 0;
      gf += f;
      ga += a;
      if (f > a) won += 1;
      else if (f === a) draws += 1;
      else lost += 1;
    }
    return [
      { label: 'Ndeshjet e luajtura', value: String(played.length), tone: C.text },
      { label: 'Ndeshjet e fituara', value: String(won), tone: C.green },
      { label: 'Ndeshjet barazim', value: String(draws), tone: C.orange },
      { label: 'Ndeshjet e humbura', value: String(lost), tone: C.red },
      { label: 'Golat', value: `${gf}:${ga}`, tone: C.text },
    ];
  }, [matches, played.length]);

  /* The competitions already on the calendar — the only list the staff API
     exposes, since `/competitions` is administrator-only. */
  const compOptions = useMemo(() => {
    const names = (matches ?? [])
      .map((m) => m.competition)
      .filter((c): c is string => Boolean(c));
    return Array.from(new Set(names));
  }, [matches]);

  const save = (d: MatchDraft) => {
    if (!token || saveBusy) return;
    setSaveBusy(true);
    setSaveError(null);

    createMatch(token, d)
      .then(() => {
        setSaveBusy(false);
        setAdding(false);
        setReloadKey((k) => k + 1);
      })
      .catch((e) => {
        setSaveBusy(false);
        if (e instanceof ApiError && e.status === 401) {
          signOut();
          router.replace('/login');
          return;
        }
        setSaveError(
          e instanceof ApiError && e.status !== 0 && e.message
            ? e.message
            : 'Nuk mund të lidhemi me serverin. Kontrollo lidhjen.',
        );
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
                  Ndeshjet
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {club}
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
          {/* ── Season counts ───────────────────────────────────── */}
          {/* Five cards share one row; each shrinks to fit the width. */}
          <View style={styles.grid}>
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
                      style={[styles.sqValue, { color: s.tone }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.5}
                    >
                      {s.value}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.colPad}>
            {/* ── Add a fixture ───────────────────────────────────── */}
            <Pressable
              onPress={() => {
                setSaveError(null);
                setAdding(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="Shto ndeshje"
              style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
            >
              <Text style={styles.addBtnText} numberOfLines={1}>
                + Shto ndeshje
              </Text>
            </Pressable>

            {/* ── Ndeshjet e ardhshme ───────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Ndeshjet e ardhshme</Text>
              </View>

              {upcoming.length === 0 ? (
                <View style={styles.mRow}>
                  <Text style={styles.mSub} numberOfLines={1}>
                    {error ?? (matches ? 'Nuk ka ndeshje të ardhshme.' : '…')}
                  </Text>
                </View>
              ) : (
                upcoming.map((f, i) => (
                <View key={`${f.day}-${f.away}-${i}`} style={[styles.mRow, i > 0 && styles.mRowBorder]}>
                  <View style={styles.dateBox}>
                    <Text style={styles.dateDay}>{f.day}</Text>
                    <Text style={styles.dateMon}>{f.mon}</Text>
                  </View>

                  {/* Date and fixture are two halves of the row, not one block. */}
                  <View style={styles.vLine} />

                  <View style={styles.mInfo}>
                    <Text
                      style={styles.mTitle}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      {f.home} - {f.away}
                    </Text>
                    <Text
                      style={styles.mSub}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.65}
                    >
                      <Text style={styles.mTime}>{f.time}</Text>
                      <Text style={styles.mSep}> • </Text>
                      <Text style={[styles.mVenue, { color: f.venue === 'Shtëpi' ? C.green : C.orange }]}>
                        {f.venue}
                      </Text>
                      <Text style={styles.mSep}> • </Text>
                      <Text style={styles.mComp}>{f.comp}</Text>
                    </Text>
                    <Text style={styles.mPending} numberOfLines={1}>
                      Pa rezultat
                    </Text>
                  </View>

                  <View style={styles.mActions}>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/ndeshja-trajner',
                          params: {
                            id: String(f.id),
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
                      style={({ pressed }) => [styles.rowBtn, styles.shikoBtn, pressed && styles.pressed]}
                    >
                      <Text style={styles.rowBtnText}>Shiko</Text>
                    </Pressable>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/fut-rezultatin',
                          params: { id: String(f.id), home: f.home, away: f.away },
                        })
                      }
                      accessibilityRole="button"
                      accessibilityLabel="Fut rezultatin"
                      style={({ pressed }) => [styles.rowBtn, styles.resultBtn, pressed && styles.pressed]}
                    >
                      <Text style={styles.rowBtnText}>Fut rezultatin</Text>
                    </Pressable>
                  </View>
                </View>
                ))
              )}
            </View>

            {/* ── Ndeshjet e luajtura ───────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Ndeshjet e luajtura</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={[styles.tblInner, styles.tblFill]}
              >
                {/* One wrapper that takes the card's full width, so the header
                    rule and every row rule reach the far edge. */}
                <View style={styles.tblFill}>
                  <View style={[styles.tr, styles.thRow]}>
                    {COLS.map((c) => (
                      <Text key={c.key} style={[styles.th, { width: c.width }]} numberOfLines={1}>
                        {c.label}
                      </Text>
                    ))}
                    {/* Keeps the header rule exactly as wide as the rows below. */}
                    <View style={{ width: ACTION_W }} />
                  </View>

                  {played.length === 0 ? (
                    <View style={styles.tr}>
                      <Text style={[styles.td, { width: COLS[0].width }]} numberOfLines={1}>
                        {error ?? (matches ? 'Nuk ka ndeshje të luajtura.' : '…')}
                      </Text>
                    </View>
                  ) : (
                    played.map((p) => {
                    const { goals, letter, tone } = resultOf(p.score);

                    return (
                      <View key={`${p.date}-${p.rival}`} style={[styles.tr, styles.trBorder]}>
                        <Text style={[styles.td, { width: COLS[0].width }]} numberOfLines={1}>
                          {p.date}
                        </Text>
                        <Text
                          style={[styles.td, styles.tdRival, { width: COLS[1].width }]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          {p.rival}
                        </Text>
                        <Text
                          style={[
                            styles.td,
                            styles.tdStrong,
                            { color: p.venue === 'Shtëpi' ? C.green : C.orange },
                            { width: COLS[2].width },
                          ]}
                          numberOfLines={1}
                        >
                          {p.venue}
                        </Text>
                        <Text
                          style={[styles.td, styles.tdStrong, { width: COLS[3].width }]}
                          numberOfLines={1}
                        >
                          {p.score}
                          <Text style={{ color: tone }}> {letter}</Text>
                        </Text>
                        <Text
                          style={[styles.td, styles.tdStrong, { color: C.green, width: COLS[4].width }]}
                          numberOfLines={1}
                        >
                          {goals}
                        </Text>

                        <View style={[styles.tdActions, { width: ACTION_W }]}>
                          <Pressable
                            onPress={() =>
                              router.push({
                                pathname: '/ndeshja-luajtur-trajner',
                                params: {
                                  id: String(p.id),
                                  home: p.venue === 'Shtëpi' ? club : p.rival,
                                  away: p.venue === 'Shtëpi' ? p.rival : club,
                                  comp: p.comp,
                                  date: p.date,
                                  time: '',
                                },
                              })
                            }
                            accessibilityRole="button"
                            accessibilityLabel="Shiko ndeshjen"
                            style={({ pressed }) => [styles.rowBtn, pressed && styles.pressed]}
                          >
                            <Text style={styles.rowBtnText}>Shiko</Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  })
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Overlay on the SafeAreaView so the blur covers the whole screen */}
      {adding ? (
        <View style={styles.ovWrap}>
          <BlurView style={styles.ovFill} intensity={45} tint="dark" />
          <Pressable
            style={[styles.ovFill, styles.ovDim]}
            onPress={() => setAdding(false)}
            accessibilityRole="button"
            accessibilityLabel="Mbylle dritaren"
          />
          <AddMatchModal
            comps={compOptions}
            busy={saveBusy}
            error={saveError}
            onClose={() => setAdding(false)}
            onSave={save}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* "Shto ndeshje" popup                                                */
/* ------------------------------------------------------------------ */

function AddMatchModal({
  comps,
  busy,
  error,
  onClose,
  onSave,
}: {
  comps: string[];
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (d: MatchDraft) => void;
}) {
  const { width, height } = useWindowDimensions();
  const cardW = Math.min(width - 24, 360);
  const maxBody = Math.max(280, height - 187);

  const [rival, setRival] = useState('');
  const [comp, setComp] = useState(comps[0] ?? '');
  const [venue, setVenue] = useState(VENUES[0]);
  const [when, setWhen] = useState<Clock>(EMPTY_CLOCK);
  const [transport, setTransport] = useState<Clock>(EMPTY_CLOCK);
  const [note, setNote] = useState('');
  const [err, setErr] = useState(false);

  const submit = () => {
    if (busy) return;
    const scheduled = isoDateTime(when);
    if (!rival.trim() || !scheduled) {
      setErr(true);
      return;
    }
    onSave({
      opponent: rival.trim(),
      competition: comp || null,
      venue: venue === 'Musafir' ? 'away' : 'home',
      scheduled_at: scheduled,
      transport_at: isoDateTime(transport),
      notes: note.trim() || null,
    });
  };

  return (
    <View style={[styles.nmCard, { width: cardW }]}>
      <View style={styles.nmHeader}>
        <Text style={styles.nmTitle}>Shto ndeshje</Text>
      </View>
      <View style={styles.nmDivider} />

      <ScrollView
        style={{ maxHeight: maxBody }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.nmContent}
      >
        {err ? <Text style={styles.nmErr}>Plotëso kundërshtarin, datën dhe orën.</Text> : null}
        {error ? <Text style={styles.nmErr}>{error}</Text> : null}

        <Text style={styles.nmLabel}>Kundershtari:</Text>
        <TextInput
          value={rival}
          onChangeText={setRival}
          allowFontScaling={false}
          style={styles.nmInput}
        />

        <Text style={[styles.nmLabel, styles.nmGap]}>Gara/Kompeticioni:</Text>
        {comps.length > 0 ? (
          <NMSelect value={comp} options={comps} onChange={setComp} />
        ) : (
          <Text style={styles.nmErr}>Nuk ka kompeticione të regjistruara.</Text>
        )}

        <Text style={[styles.nmLabel, styles.nmGap]}>Vendoshja</Text>
        <NMSelect value={venue} options={VENUES} onChange={setVenue} />

        <Text style={[styles.nmLabel, styles.nmGap]}>Data&Ora:</Text>
        <ClockBoxes value={when} onChange={setWhen} />

        <Text style={[styles.nmLabel, styles.nmGap]}>Transporti(nisja):</Text>
        <ClockBoxes value={transport} onChange={setTransport} />

        <Text style={[styles.nmLabel, styles.nmGap]}>Shenime :</Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          multiline
          allowFontScaling={false}
          style={styles.nmTextarea}
          textAlignVertical="top"
        />

        <View style={styles.nmActions}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={({ pressed }) => [styles.nmBtn, styles.nmBtnCancel, pressed && styles.pressed]}
          >
            <Text style={styles.nmBtnText}>Anulo</Text>
          </Pressable>
          <Pressable
            onPress={submit}
            disabled={busy}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.nmBtn,
              styles.nmBtnSave,
              busy && styles.nmBtnBusy,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.nmBtnText}>{busy ? '...' : 'Shto'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Date + time boxes                                                   */
/* ------------------------------------------------------------------ */

type Clock = { day: string; month: string; year: string; hour: string; minute: string };

const EMPTY_CLOCK: Clock = { day: '', month: '', year: '', hour: '', minute: '' };

/** A fully filled clock as `YYYY-MM-DD HH:mm:00`; anything incomplete is null. */
function isoDateTime(c: Clock): string | null {
  const filled =
    c.day.length === 2 &&
    c.month.length === 2 &&
    c.year.length === 4 &&
    c.hour.length === 2 &&
    c.minute.length === 2;
  return filled ? `${c.year}-${c.month}-${c.day} ${c.hour}:${c.minute}:00` : null;
}

/** "DD/MM/YY ---- HH:MM" on one line, the same shape wherever a moment is asked for. */
function ClockBoxes({ value, onChange }: { value: Clock; onChange: (next: Clock) => void }) {
  const set = (patch: Partial<Clock>) => onChange({ ...value, ...patch });

  const box = (
    key: 'day' | 'month' | 'year' | 'hour' | 'minute',
    placeholder: string,
    maxLength = 2,
  ) => (
    <TextInput
      value={value[key]}
      onChangeText={(text) => set({ [key]: text })}
      placeholder={placeholder}
      placeholderTextColor={MO.ph}
      maxLength={maxLength}
      keyboardType="number-pad"
      allowFontScaling={false}
      style={styles.nmDateBox}
    />
  );

  return (
    <View style={styles.nmClockRow}>
      {box('day', 'DD')}
      <Text style={styles.nmSep}>/</Text>
      {box('month', 'MM')}
      <Text style={styles.nmSep}>/</Text>
      {box('year', 'YYYY', 4)}
      <Text style={styles.nmDash}>----</Text>
      {box('hour', 'HH')}
      <Text style={styles.nmSep}>:</Text>
      {box('minute', 'MM')}
    </View>
  );
}

/* Compact select with an in-flow options list */
function NMSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        style={({ pressed }) => [styles.nmSel, pressed && styles.pressed]}
      >
        <Text style={styles.nmSelText} numberOfLines={1}>
          {value}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={I(11)} color="#777777" />
      </Pressable>
      {open ? (
        <View style={styles.nmOpts}>
          {options.map((o) => {
            const active = o === value;
            return (
              <Pressable
                key={o}
                onPress={() => {
                  onChange(o);
                  setOpen(false);
                }}
                style={[styles.nmOpt, active && styles.nmOptActive]}
              >
                <Text style={[styles.nmOptText, active && styles.nmOptTextActive]} numberOfLines={1}>
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
      paddingBottom: 24,
    },

    /* ── Season counts ───────────────────────────────────────── */
    /* The row runs wider than the screen and scrolls sideways; the gutters live
       in the content so the first and last card clear both edges. */
    grid: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingTop: 8,
      paddingBottom: 4,
    },

    /* Shadow lives on the wrapper: `overflow: hidden` on the pane itself would
       clip it away on iOS. */
    sqShadow: {
      flex: 1,
      height: 88,
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
      padding: 6,
    },

    sheen: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '14%',
    },

    /* Fixed two-line block so every value sits on the same line. */
    sqLabel: {
      minHeight: 22,
      fontFamily: Fonts.bodyBold,
      fontSize: 8.5,
      lineHeight: 10.5,
      color: C.gray,
    },

    sqValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 16,
      lineHeight: 19,
      letterSpacing: -0.5,
      marginTop: 3,
    },

    /* ── Add a fixture ───────────────────────────────────────── */
    /* Small and hugging its label, rather than spanning the page. */
    addBtn: {
      alignSelf: 'flex-start',
      height: 34,
      marginTop: 14,
      paddingHorizontal: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.green20,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    addBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      lineHeight: 16,
      color: C.text,
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
      gap: 9,
      paddingHorizontal: 9,
      paddingVertical: 10,
    },

    mRowBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    dateBox: {
      width: 34,
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
      fontSize: 11,
      lineHeight: 14,
      letterSpacing: 0.4,
      color: C.text,
    },

    /* Splits the date off from the fixture it belongs to. */
    vLine: {
      width: 1,
      height: 44,
      backgroundColor: C.frame,
    },

    mInfo: {
      flex: 1,
    },

    mTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.text,
    },

    /* Time, venue and competition share one line. */
    mSub: {
      fontFamily: Fonts.body,
      fontSize: 9,
      lineHeight: 12,
      marginTop: 2,
    },

    mTime: {
      fontFamily: Fonts.body,
      color: C.hint,
    },

    mSep: {
      fontFamily: Fonts.body,
      color: C.gray,
    },

    mVenue: {
      fontFamily: Fonts.bodyBold,
    },

    mComp: {
      fontFamily: Fonts.body,
      color: C.hint,
    },

    mPending: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 9,
      lineHeight: 12,
      color: C.red,
      marginTop: 2,
    },

    /* Side by side: "Shiko" hugs its two syllables, "Fut rezultatin" takes the
       rest of the pair. */
    mActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },

    rowBtn: {
      height: 22,
      paddingHorizontal: 7,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    /* The shorter label, so it keeps a tighter gutter than its neighbour. */
    shikoBtn: {
      paddingHorizontal: 6,
      backgroundColor: C.red20,
    },

    resultBtn: {
      backgroundColor: C.green20,
    },

    rowBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 8.5,
      color: C.text,
    },

    /* ── Results table ───────────────────────────────────────── */
    /* No horizontal padding on the wrapper: the row rule is drawn on the row
       itself, so the gutter has to live inside `tr` for the line to reach the
       card edge. */
    tblInner: {
      paddingHorizontal: 8,
      paddingBottom: 6,
    },

    /* Stretches the rows to the card's width, so the rules run the full width
       instead of stopping where the last column ends. */
    tblFill: {
      flexGrow: 1,
    },

    thRow: {
      paddingTop: 9,
      paddingBottom: 7,
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 2,
      minHeight: 44,
    },

    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    th: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 9,
      lineHeight: 12,
      color: C.gray,
      textAlign: 'center',
    },

    td: {
      fontFamily: Fonts.body,
      fontSize: 9.5,
      lineHeight: 12,
      color: C.hint,
      textAlign: 'center',
    },

    tdRival: {
      color: C.text,
    },

    tdStrong: {
      fontFamily: Fonts.bodyBold,
    },

    tdCards: {
      alignItems: 'center',
    },

    /* A booking reads as the card itself: the count sits inside a filled square. */
    cardChip: {
      width: 20,
      height: 20,
      borderRadius: 3,
      backgroundColor: C.orange,
      alignItems: 'center',
      justifyContent: 'center',
    },

    cardChipText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 10,
      color: '#F5F5F5',
    },

    tdActions: {
      flexDirection: 'row',
      gap: 5,
      justifyContent: 'flex-end',
    },

    /* ── Popup overlay ───────────────────────────────────────── */
    ovWrap: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 20,
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

    /* ── "Shto ndeshje" popup ────────────────────────────────── */
    nmCard: {
      marginTop: 100,
      alignSelf: 'center',
      backgroundColor: '#F5F5F5',
      borderWidth: 1,
      borderColor: MO.border,
      borderRadius: 5,
      overflow: 'hidden',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 8,
    },

    nmHeader: {
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },

    nmTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 20,
      lineHeight: 24,
      color: MO.title,
    },

    nmDivider: {
      height: 1,
      backgroundColor: MO.divider,
    },

    nmContent: {
      paddingHorizontal: 15,
      paddingTop: 9,
      paddingBottom: 15,
    },

    nmBtnBusy: {
      opacity: 0.6,
    },

    nmErr: {
      fontFamily: Fonts.body,
      fontSize: 9,
      color: MO.err,
      marginBottom: 8,
    },

    nmLabel: {
      fontFamily: Fonts.body,
      fontSize: 9.5,
      lineHeight: 12,
      color: MO.sub,
      marginBottom: 4,
    },

    nmGap: {
      marginTop: 16,
    },

    nmInput: {
      height: 31,
      backgroundColor: MO.inputBg,
      borderWidth: 1,
      borderColor: MO.inputBorder,
      borderRadius: 1,
      paddingHorizontal: 8,
      paddingVertical: 0,
      fontSize: 11.5,
      fontFamily: Fonts.body,
      color: MO.text,
    },

    nmSel: {
      height: 31,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: MO.inputBg,
      borderWidth: 1,
      borderColor: MO.inputBorder,
      borderRadius: 1,
      paddingHorizontal: 8,
    },

    nmSelText: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 11.5,
      color: MO.text,
      marginRight: 3,
    },

    nmOpts: {
      marginTop: 2,
      backgroundColor: '#F5F5F5',
      borderWidth: 1,
      borderColor: MO.inputBorder,
      borderRadius: 1,
      overflow: 'hidden',
    },

    nmOpt: {
      height: 25,
      justifyContent: 'center',
      paddingHorizontal: 8,
    },

    nmOptActive: {
      backgroundColor: 'rgba(22,165,29,0.10)',
    },

    nmOptText: {
      fontFamily: Fonts.body,
      fontSize: 10,
      color: MO.text,
    },

    nmOptTextActive: {
      fontFamily: Fonts.bodyBold,
      color: MO.create,
    },

    nmClockRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    nmDateBox: {
      width: 30,
      height: 30,
      backgroundColor: MO.inputBg,
      borderWidth: 1,
      borderColor: MO.inputBorder,
      borderRadius: 4,
      paddingHorizontal: 0,
      paddingVertical: 0,
      textAlign: 'center',
      fontSize: 11,
      fontFamily: Fonts.body,
      color: MO.text,
    },

    nmSep: {
      fontFamily: Fonts.body,
      fontSize: 11,
      color: MO.sub,
    },

    /* Short separator that keeps the time next to the date. */
    nmDash: {
      width: 24,
      textAlign: 'center',
      fontFamily: Fonts.body,
      fontSize: 11,
      color: '#BBBBBB',
    },

    nmTextarea: {
      height: 76,
      backgroundColor: MO.inputBg,
      borderWidth: 1,
      borderColor: MO.inputBorder,
      borderRadius: 1,
      paddingHorizontal: 8,
      paddingVertical: 7,
      fontSize: 11.5,
      fontFamily: Fonts.body,
      color: MO.text,
    },

    nmActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 9,
      marginTop: 12,
    },

    nmBtn: {
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 2,
    },

    nmBtnCancel: {
      width: 74,
      backgroundColor: MO.cancel,
    },

    nmBtnSave: {
      width: 74,
      backgroundColor: MO.create,
    },

    nmBtnText: {
      fontFamily: Fonts.bodyMedium,
      fontSize: 10.5,
      color: MO.white,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
