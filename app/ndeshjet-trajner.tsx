import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
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
import { I, scaled } from '@/lib/responsive';

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
  white: '#FFFFFF',
  err: '#C90000',
};

/* Popup option sets */
const VENUES = ['Shtëpi', 'Musafir'];
const COMPS = [
  'Superliga e Kosovës',
  'U21 Superliga e Kosovës',
  'U19 Superliga e Kosovës',
  'U17 Superliga e Kosovës',
  'U15 Superliga e Kosovës',
  'U13 Superliga e Kosovës',
  'Kupa e Kosovës',
];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/* The squad this page covers — shown as the page subtitle. */
const TEAM = 'Ekipi i Parë';
const SEASON = '2024/25';

/**
 * The squares sit on a near-white page, so a white frost on its own reads as
 * nothing. Shading the pane instead — a very light grey at the top edge
 * sweeping down to white — is what gives the surface its glassy shape.
 */
const SQ_GLOSS = [
  'rgba(180,188,201,0.30)',
  'rgba(216,222,231,0.15)',
  'rgba(255,255,255,0.80)',
] as const;

/** Thin specular rim on the top edge — reads as the thickness of the pane. */
const SQ_SHEEN = ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.00)'] as const;

/* ── Season counts ─────────────────────────────────────────────────── */

const SUMMARY = [
  { label: 'Ndeshjet e luajtura', value: '9', tone: C.text },
  { label: 'Ndeshjet e fituara', value: '2', tone: C.green },
  { label: 'Ndeshjet barazim', value: '1', tone: C.orange },
  { label: 'Ndeshjet e humbura', value: '6', tone: C.red },
  { label: 'Golat', value: '10:17', tone: C.text },
];

/* ── Fixtures ──────────────────────────────────────────────────────── */

type Fixture = {
  day: string;
  mon: string;
  home: string;
  away: string;
  time: string;
  venue: 'Shtëpi' | 'Musafir';
  comp: string;
};

const FIXTURES: Fixture[] = [
  { day: '28', mon: 'AUG', home: 'KF Trepca', away: 'FC Prishtina', time: '16:00', venue: 'Musafir', comp: 'Superliga e Kosovës' },
  { day: '31', mon: 'AUG', home: 'FC Prishtina', away: 'KF Drita', time: '18:00', venue: 'Shtëpi', comp: 'Superliga e Kosovës' },
  { day: '04', mon: 'SEP', home: 'KF Ballkani', away: 'FC Prishtina', time: '15:30', venue: 'Musafir', comp: 'Kupa e Kosovës' },
];

/* ── Results ───────────────────────────────────────────────────────── */

type Played = {
  date: string;
  rival: string;
  venue: 'Shtëpi' | 'Musafir';
  /* Read from our side of the pitch: "2 - 1" is two for Prishtina. */
  score: string;
  assists: number;
  cards: number;
  comp: string;
};

const LEAGUE = 'Superliga e Kosovës';

const PLAYED: Played[] = [
  { date: '18/08/2026', rival: 'KF Trepca', venue: 'Musafir', score: '2 - 1', assists: 2, cards: 1, comp: LEAGUE },
  { date: '11/08/2026', rival: 'FC Drita', venue: 'Shtëpi', score: '0 - 1', assists: 0, cards: 2, comp: LEAGUE },
  { date: '04/08/2026', rival: 'KF Gjilani', venue: 'Shtëpi', score: '1 - 1', assists: 1, cards: 0, comp: LEAGUE },
  { date: '28/07/2026', rival: 'KF Llapi', venue: 'Musafir', score: '0 - 2', assists: 0, cards: 1, comp: LEAGUE },
  { date: '21/07/2026', rival: 'KF Ballkani', venue: 'Shtëpi', score: '3 - 1', assists: 3, cards: 0, comp: LEAGUE },
  { date: '14/07/2026', rival: 'KF Feronikeli', venue: 'Musafir', score: '0 - 3', assists: 0, cards: 2, comp: LEAGUE },
];

type Col = { key: string; label: string; width: number };

const COLS: Col[] = [
  { key: 'date', label: 'DATA', width: 58 },
  { key: 'rival', label: 'KUNDËSHTARI', width: 96 },
  { key: 'venue', label: 'VENDNDODHJA', width: 74 },
  { key: 'score', label: 'REZULTATI', width: 60 },
  { key: 'goals', label: 'GOL', width: 32 },
  { key: 'assists', label: 'ASIST', width: 38 },
  { key: 'cards', label: 'KARTA', width: 44 },
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
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const [fixtures, setFixtures] = useState<Fixture[]>(FIXTURES);
  const [adding, setAdding] = useState(false);

  const save = (f: Fixture) => {
    setFixtures((prev) => [f, ...prev]);
    setAdding(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.canvas}>
        {/* Faint vertical canvas texture — decorative only */}
        <View pointerEvents="none" style={styles.lines}>
          {Array.from({ length: lineCount }).map((_, index) => (
            <View key={index} style={[styles.line, { left: index * 9 }]} />
          ))}
        </View>

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
                  {TEAM} • Sezoni {SEASON}
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
          {/* Five cards don't fit one row, so they slide sideways. */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={styles.grid}
          >
            {SUMMARY.map((s) => (
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
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.colPad}>
            {/* ── Add a fixture ───────────────────────────────────── */}
            <Pressable
              onPress={() => setAdding(true)}
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

              {fixtures.map((f, i) => (
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
                          params: { home: f.home, away: f.away },
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
              ))}
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

                  {PLAYED.map((p) => {
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
                        <Text
                          style={[styles.td, styles.tdStrong, { color: C.dateBlue, width: COLS[5].width }]}
                          numberOfLines={1}
                        >
                          {p.assists}
                        </Text>

                        {/* Only a booked player gets a card; a clean sheet shows nothing. */}
                        <View style={[styles.tdCards, { width: COLS[6].width }]}>
                          {p.cards > 0 ? (
                            <View style={styles.cardChip}>
                              <Text style={styles.cardChipText} numberOfLines={1}>
                                {p.cards}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        <View style={[styles.tdActions, { width: ACTION_W }]}>
                          <Pressable
                            onPress={() =>
                              router.push({
                                pathname: '/ndeshja-luajtur-trajner',
                                params: {
                                  home: p.venue === 'Shtëpi' ? 'FC Prishtina' : p.rival,
                                  away: p.venue === 'Shtëpi' ? p.rival : 'FC Prishtina',
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
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel="Statistikat"
                            style={({ pressed }) => [styles.rowBtn, pressed && styles.pressed]}
                          >
                            <Text style={styles.rowBtnText}>Statistikat</Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
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
          <AddMatchModal onClose={() => setAdding(false)} onSave={save} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* "Shto ndeshje" popup                                                */
/* ------------------------------------------------------------------ */

function AddMatchModal({ onClose, onSave }: { onClose: () => void; onSave: (f: Fixture) => void }) {
  const { width, height } = useWindowDimensions();
  const cardW = Math.min(width - 24, 360);
  const maxBody = Math.max(280, height - 187);

  const [rival, setRival] = useState('');
  const [comp, setComp] = useState(COMPS[0]);
  const [venue, setVenue] = useState(VENUES[0]);
  const [when, setWhen] = useState<Clock>(EMPTY_CLOCK);
  const [transport, setTransport] = useState<Clock>(EMPTY_CLOCK);
  const [note, setNote] = useState('');
  const [err, setErr] = useState(false);

  const submit = () => {
    const complete =
      rival.trim() && comp && venue && when.day && when.month && when.year && when.hour && when.minute;
    if (!complete) {
      setErr(true);
      return;
    }
    const atHome = venue !== 'Musafir';
    onSave({
      day: when.day,
      mon: MONTHS[Number(when.month) - 1] ?? '—',
      home: atHome ? 'FC Prishtina' : rival.trim(),
      away: atHome ? rival.trim() : 'FC Prishtina',
      time: `${when.hour}:${when.minute}`,
      venue: atHome ? 'Shtëpi' : 'Musafir',
      comp,
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
        {err ? <Text style={styles.nmErr}>Plotëso të gjitha fushat e kërkuara.</Text> : null}

        <Text style={styles.nmLabel}>Kundershtari:</Text>
        <TextInput
          value={rival}
          onChangeText={setRival}
          allowFontScaling={false}
          style={styles.nmInput}
        />

        <Text style={[styles.nmLabel, styles.nmGap]}>Gara/Kompeticioni:</Text>
        <NMSelect value={comp} options={COMPS} onChange={setComp} />

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
            accessibilityRole="button"
            style={({ pressed }) => [styles.nmBtn, styles.nmBtnSave, pressed && styles.pressed]}
          >
            <Text style={styles.nmBtnText}>Shto</Text>
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

/** "DD/MM/YY ---- HH:MM" on one line, the same shape wherever a moment is asked for. */
function ClockBoxes({ value, onChange }: { value: Clock; onChange: (next: Clock) => void }) {
  const set = (patch: Partial<Clock>) => onChange({ ...value, ...patch });

  const box = (
    key: 'day' | 'month' | 'year' | 'hour' | 'minute',
    placeholder: string,
  ) => (
    <TextInput
      value={value[key]}
      onChangeText={(text) => set({ [key]: text })}
      placeholder={placeholder}
      placeholderTextColor={MO.ph}
      maxLength={2}
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
      {box('year', 'YY')}
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
      backgroundColor: C.page,
    },

    canvas: {
      flex: 1,
      backgroundColor: C.page,
    },

    lines: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 0,
    },

    line: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 1,
      backgroundColor: C.line,
    },

    colPad: {
      alignSelf: 'center',
      width: '100%',
      paddingHorizontal: 27,
    },

    /* Pinned header */
    header: {
      backgroundColor: C.page,
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
      gap: 8,
      paddingHorizontal: 27,
      paddingTop: 8,
      paddingBottom: 4,
    },

    /* Shadow lives on the wrapper: `overflow: hidden` on the pane itself would
       clip it away on iOS. */
    sqShadow: {
      width: 104,
      height: 104,
      borderRadius: 8,
      /* Translucent so the frosted pane inside has a backdrop to blur. */
      backgroundColor: 'rgba(255,255,255,0.5)',
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
      padding: 9,
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
      minHeight: 26,
      fontFamily: Fonts.bodyBold,
      fontSize: 10,
      lineHeight: 12.5,
      color: C.gray,
    },

    sqValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 21,
      lineHeight: 26,
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
      color: '#FFFFFF',
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
      backgroundColor: '#FFFFFF',
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
      backgroundColor: '#FFFFFF',
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
