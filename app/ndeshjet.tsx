import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
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

/* Popup palette — same shell as the modals on the other admin pages. */
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
const TEAMS = ['Ekipi i Parë', 'U21', 'U19', 'U17', 'U15', 'U13'];
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
const STATUS = ['E ardhshme', 'E luajtur', 'Anuluar'];
const SEASON_YEAR = '2026';

/** "U21 Superliga e Kosovës" belongs to U21; the senior league has no prefix. */
function teamFromComp(comp: string): string {
  const match = /^(U\d{2})\b/.exec(comp);
  return match ? match[1] : TEAMS[0];
}

/** The fixture's date and kick-off on one line: "18/08/2026 16:00". */
function dateTimeOf(f: Fixture): string {
  const month = MONTHS.indexOf(f.mon.toUpperCase()) + 1;
  const mm = month > 0 ? String(month).padStart(2, '0') : '';
  return `${f.day}/${mm}/${SEASON_YEAR} ${f.time}`;
}

/** Reads "18/08/2026 16:00" back into the fixture's date parts. */
function parseDateTime(value: string, src: Fixture) {
  const [date, time] = value.trim().split(/\s+/);
  const [day, mm] = (date ?? '').split('/');
  const mon = MONTHS[Number(mm) - 1];
  if (!day || !mon || !time) {
    return { day: src.day, mon: src.mon, time: src.time };
  }
  return { day, mon, time };
}

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
  { day: '18', mon: 'AUG', home: 'FC Prishtina', away: 'KF Trepca', time: '16:00', venue: 'Shtëpi', comp: 'U21 Superliga e Kosovës' },
  { day: '21', mon: 'AUG', home: 'KF Ballkani', away: 'FC Prishtina', time: '14:30', venue: 'Musafir', comp: 'U21 Superliga e Kosovës' },
  { day: '24', mon: 'AUG', home: 'FC Prishtina', away: 'KF Gjilani', time: '17:00', venue: 'Shtëpi', comp: 'U21 Superliga e Kosovës' },
  { day: '27', mon: 'AUG', home: 'KF Llapi', away: 'FC Prishtina', time: '13:00', venue: 'Musafir', comp: 'U19 Superliga e Kosovës' },
  { day: '30', mon: 'AUG', home: 'FC Prishtina', away: 'KF Feronikeli', time: '18:00', venue: 'Shtëpi', comp: 'U19 Superliga e Kosovës' },
  { day: '02', mon: 'SEP', home: 'KF Dukagjini', away: 'FC Prishtina', time: '16:00', venue: 'Musafir', comp: 'U17 Superliga e Kosovës' },
  { day: '05', mon: 'SEP', home: 'FC Prishtina', away: 'FC Malisheva', time: '15:30', venue: 'Shtëpi', comp: 'U15 Superliga e Kosovës' },
  { day: '09', mon: 'SEP', home: 'KF Ulpiana', away: 'FC Prishtina', time: '17:00', venue: 'Musafir', comp: 'U13 Superliga e Kosovës' },
];

type Played = {
  home: string;
  away: string;
  comp: string;
  team: string;
  date: string;
  time: string;
  score: string;
};

const PLAYED: Played[] = [
  { home: 'FC Prishtina', away: 'FC Drita', comp: 'Superliga e Kosovës', team: 'Ekipi i parë', date: '18/08/2026', time: '16:00', score: '2-1' },
  { home: 'KF Ballkani', away: 'FC Prishtina', comp: 'Superliga e Kosovës', team: 'Ekipi i parë', date: '11/08/2026', time: '14:30', score: '1-3' },
  { home: 'FC Prishtina', away: 'KF Gjilani', comp: 'Superliga e Kosovës', team: 'Ekipi i parë', date: '04/08/2026', time: '17:00', score: '0-2' },
  { home: 'KF Llapi', away: 'FC Prishtina', comp: 'U21 Superliga', team: 'U21', date: '28/07/2026', time: '13:00', score: '2-2' },
  { home: 'FC Prishtina', away: 'KF Trepca', comp: 'U21 Superliga', team: 'U21', date: '21/07/2026', time: '18:00', score: '3-1' },
  { home: 'KF Feronikeli', away: 'FC Prishtina', comp: 'U19 Superliga', team: 'U19', date: '14/07/2026', time: '16:00', score: '1-2' },
  { home: 'FC Prishtina', away: 'KF Dukagjini', comp: 'U17 Superliga', team: 'U17', date: '07/07/2026', time: '15:30', score: '4-0' },
];

type Col = { key: string; label: string; width: number; align?: 'left' | 'center' };

const COLS: Col[] = [
  { key: 'match', label: 'Ndeshja', width: 112, align: 'left' },
  { key: 'team', label: 'Ekipi', width: 48 },
  { key: 'date', label: 'Data', width: 54 },
  { key: 'score', label: 'Rezultati', width: 40 },
  { key: 'actions', label: 'Veprimet', width: 46 },
];

const PAGES = [1, 2, 3, 4];

/** F for a Prishtina win, H for a loss; a draw shows nothing. */
function outcome(home: string, away: string, score: string): 'F' | 'H' | null {
  const [h, a] = score.split('-').map(Number);
  if (h === a) return null;
  const atHome = home.includes('Prishtina');
  return (atHome ? h > a : a > h) ? 'F' : 'H';
}

export default function MatchesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const [fixtures, setFixtures] = useState<Fixture[]>(FIXTURES);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Fixture | null>(null);

  const save = (f: Fixture) => {
    setFixtures((prev) => [f, ...prev]);
    setAdding(false);
  };

  const saveEdit = (src: Fixture, next: Fixture) => {
    setFixtures((prev) => prev.map((f) => (f === src ? next : f)));
    setEditing(null);
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
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Filtro sipas ekipit"
                style={({ pressed }) => [styles.teamBtn, pressed && styles.pressed]}
              >
                <Text style={styles.teamBtnText}>Të gjitha ekipet</Text>
                <MaterialCommunityIcons name="chevron-down" size={I(15)} color={C.text} />
              </Pressable>

              <Pressable
                onPress={() => setAdding(true)}
                accessibilityRole="button"
                accessibilityLabel="Shto ndeshje"
                style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
              >
                <View style={styles.addBtnPlus}>
                  <MaterialCommunityIcons name="plus" size={I(15)} color="#FFFFFF" />
                </View>
                <Text style={styles.addBtnText}>Shto ndeshje</Text>
              </Pressable>
            </View>

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
                      <Text style={[styles.mVenue, { color: f.venue === 'Shtëpi' ? C.green : C.orange }]}>
                        {f.venue}
                      </Text>
                      <Text style={styles.mComp}> {f.comp}</Text>
                    </Text>
                  </View>

                  <View style={styles.mActions}>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/ndeshja',
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
                      style={({ pressed }) => [styles.viewBtn, pressed && styles.pressed]}
                    >
                      <Text style={styles.viewBtnText}>Shiko</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => setEditing(f)}
                      accessibilityRole="button"
                      accessibilityLabel="Edito ndeshjen"
                      style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
                    >
                      <Text style={styles.editBtnText}>Edito</Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>

            {/* ── Pager ─────────────────────────────────────────── */}
            <View style={styles.pager}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Faqja e mëparshme"
                hitSlop={8}
                style={({ pressed }) => [styles.pagerArrow, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons name="chevron-left" size={I(22)} color={C.text} />
              </Pressable>

              {PAGES.map((p) => (
                <Pressable
                  key={p}
                  accessibilityRole="button"
                  accessibilityLabel={`Faqja ${p}`}
                  style={({ pressed }) => [styles.pageSq, pressed && styles.pressed]}
                >
                  <Text style={styles.pageSqText}>{p}</Text>
                </Pressable>
              ))}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Faqja tjetër"
                hitSlop={8}
                style={({ pressed }) => [styles.pagerArrow, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons name="chevron-right" size={I(22)} color={C.text} />
              </Pressable>
            </View>

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

                {PLAYED.map((p, i) => {
                  const result = outcome(p.home, p.away, p.score);

                  return (
                    <View key={`${p.date}-${p.away}`} style={[styles.tr, i > 0 && styles.trBorder]}>
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
                        {result ? (
                          <Text style={[styles.tdResult, { color: result === 'F' ? C.green : C.red }]}>
                            {result}
                          </Text>
                        ) : null}
                      </Text>

                      <View style={[styles.tdActions, { width: COLS[4].width }]}>
                        <Pressable
                          onPress={() =>
                            router.push({
                              pathname: '/ndeshja-luajtur',
                              params: {
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
                  );
                })}
              </View>
            </View>

            {/* ── Pager ─────────────────────────────────────────── */}
            <View style={styles.pager}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Faqja e mëparshme"
                hitSlop={8}
                style={({ pressed }) => [styles.pagerArrow, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons name="chevron-left" size={I(22)} color={C.text} />
              </Pressable>

              {PAGES.map((p) => (
                <Pressable
                  key={p}
                  accessibilityRole="button"
                  accessibilityLabel={`Faqja ${p}`}
                  style={({ pressed }) => [styles.pageSq, pressed && styles.pressed]}
                >
                  <Text style={styles.pageSqText}>{p}</Text>
                </Pressable>
              ))}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Faqja tjetër"
                hitSlop={8}
                style={({ pressed }) => [styles.pagerArrow, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons name="chevron-right" size={I(22)} color={C.text} />
              </Pressable>
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

      {editing ? (
        <View style={styles.ovWrap}>
          <BlurView style={styles.ovFill} intensity={45} tint="dark" />
          <Pressable
            style={[styles.ovFill, styles.ovDim]}
            onPress={() => setEditing(null)}
            accessibilityRole="button"
            accessibilityLabel="Mbylle dritaren"
          />
          <EditMatchModal
            fixture={editing}
            onClose={() => setEditing(null)}
            onSave={(next) => saveEdit(editing, next)}
          />
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

  const [team, setTeam] = useState(TEAMS[0]);
  const [venue, setVenue] = useState(VENUES[0]);
  const [rival, setRival] = useState('');
  const [comp, setComp] = useState(COMPS[0]);
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState(false);

  const submit = () => {
    const complete =
      team && venue && rival.trim() && comp && day && month && year && hour && minute;
    if (!complete) {
      setErr(true);
      return;
    }
    const atHome = venue !== 'Musafir';
    onSave({
      day,
      mon: MONTHS[Number(month) - 1] ?? '—',
      home: atHome ? 'FC Prishtina' : rival.trim(),
      away: atHome ? rival.trim() : 'FC Prishtina',
      time: `${hour}:${minute}`,
      venue: atHome ? 'Shtëpi' : 'Musafir',
      comp,
    });
  };

  const fixtureName = venue === 'Musafir' ? `${rival.trim()} - FC Prishtina` : `FC Prishtina - ${rival.trim()}`;

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

        <Text style={styles.nmLabel}>Ekipi:</Text>
        <NMSelect value={team} options={TEAMS} onChange={setTeam} />

        <View style={styles.nmRow}>
          <View style={styles.nmCol}>
            <Text style={styles.nmLabel}>Vendosja</Text>
            <NMSelect value={venue} options={VENUES} onChange={setVenue} />
          </View>
          <View style={styles.nmCol}>
            <Text style={styles.nmLabel}>Kundershtari</Text>
            <TextInput
              value={rival}
              onChangeText={setRival}
              allowFontScaling={false}
              style={styles.nmInput}
            />
          </View>
        </View>

        <View style={styles.nmPreview}>
          <Text style={styles.nmPreviewText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {fixtureName}
          </Text>
        </View>

        <Text style={[styles.nmLabel, styles.nmGap]}>Gara/Kompeticion</Text>
        <NMSelect value={comp} options={COMPS} onChange={setComp} />

        <Text style={[styles.nmLabel, styles.nmGap]}>Data & Ora:</Text>
        <View style={styles.nmClockRow}>
          <TextInput
            value={day}
            onChangeText={setDay}
            placeholder="DD"
            placeholderTextColor={MO.ph}
            maxLength={2}
            keyboardType="number-pad"
            allowFontScaling={false}
            style={styles.nmDateBox}
          />
          <Text style={styles.nmSep}>/</Text>
          <TextInput
            value={month}
            onChangeText={setMonth}
            placeholder="MM"
            placeholderTextColor={MO.ph}
            maxLength={2}
            keyboardType="number-pad"
            allowFontScaling={false}
            style={styles.nmDateBox}
          />
          <Text style={styles.nmSep}>/</Text>
          <TextInput
            value={year}
            onChangeText={setYear}
            placeholder="YYYY"
            placeholderTextColor={MO.ph}
            maxLength={4}
            keyboardType="number-pad"
            allowFontScaling={false}
            style={styles.nmYearBox}
          />
          <Text style={styles.nmDash}>----</Text>
          <TextInput
            value={hour}
            onChangeText={setHour}
            placeholder="HH"
            placeholderTextColor={MO.ph}
            maxLength={2}
            keyboardType="number-pad"
            allowFontScaling={false}
            style={styles.nmTimeBox}
          />
          <Text style={styles.nmSep}>:</Text>
          <TextInput
            value={minute}
            onChangeText={setMinute}
            placeholder="MM"
            placeholderTextColor={MO.ph}
            maxLength={2}
            keyboardType="number-pad"
            allowFontScaling={false}
            style={styles.nmTimeBox}
          />
        </View>

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
            <Text style={styles.nmBtnText}>Ruaj</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* "Edito ndeshje" popup                                               */
/* ------------------------------------------------------------------ */

function EditMatchModal({
  fixture,
  onClose,
  onSave,
}: {
  fixture: Fixture;
  onClose: () => void;
  onSave: (f: Fixture) => void;
}) {
  const { width, height } = useWindowDimensions();
  const cardW = Math.min(width - 24, 360);
  const maxBody = Math.max(280, height - 187);

  const atHome = fixture.home.includes('Prishtina');
  const dateTime = dateTimeOf(fixture);

  /* Every field opens filled with the fixture's current values. */
  const [team, setTeam] = useState(() => teamFromComp(fixture.comp));
  const [venue, setVenue] = useState(VENUES[atHome ? 0 : 1]);
  const [rival, setRival] = useState(atHome ? fixture.away : fixture.home);
  const [comp, setComp] = useState(fixture.comp);
  const [when, setWhen] = useState(dateTime);
  const [transport, setTransport] = useState(dateTime);
  const [status, setStatus] = useState(STATUS[0]);
  const [note, setNote] = useState('');
  const [err, setErr] = useState(false);

  const submit = () => {
    if (!team || !venue || !rival.trim() || !comp) {
      setErr(true);
      return;
    }
    const home = venue !== 'Musafir';
    onSave({
      ...parseDateTime(when, fixture),
      home: home ? 'FC Prishtina' : rival.trim(),
      away: home ? rival.trim() : 'FC Prishtina',
      venue: home ? 'Shtëpi' : 'Musafir',
      comp,
    });
  };

  const fixtureName =
    venue === 'Musafir' ? `${rival.trim()} - FC Prishtina` : `FC Prishtina - ${rival.trim()}`;

  return (
    <View style={[styles.nmCard, { width: cardW }]}>
      <View style={styles.nmHeader}>
        <Text style={styles.nmTitle}>Edito ndeshje</Text>
      </View>
      <View style={styles.nmDivider} />

      <ScrollView
        style={{ maxHeight: maxBody }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.nmContent}
      >
        {err ? <Text style={styles.nmErr}>Plotëso të gjitha fushat e kërkuara.</Text> : null}

        <Text style={styles.nmLabel}>Ekipi:</Text>
        <NMSelect value={team} options={TEAMS} onChange={setTeam} />

        <View style={styles.nmRow}>
          <View style={styles.nmCol}>
            <Text style={styles.nmLabel}>Vendosja</Text>
            <NMSelect value={venue} options={VENUES} onChange={setVenue} />
          </View>
          <View style={styles.nmCol}>
            <Text style={styles.nmLabel}>Kundershtari</Text>
            <TextInput
              value={rival}
              onChangeText={setRival}
              allowFontScaling={false}
              style={styles.nmInput}
            />
          </View>
        </View>

        <View style={styles.nmPreview}>
          <Text style={styles.nmPreviewText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {fixtureName}
          </Text>
        </View>

        <Text style={[styles.nmLabel, styles.nmGap]}>Gara/Kompeticion:</Text>
        <NMSelect value={comp} options={COMPS} onChange={setComp} />

        <View style={styles.nmRow}>
          <View style={styles.nmCol}>
            <Text style={styles.nmLabel}>Data & Ora:</Text>
            <TextInput
              value={when}
              onChangeText={setWhen}
              allowFontScaling={false}
              style={styles.nmInput}
            />
          </View>
          <View style={styles.nmCol}>
            <Text style={styles.nmLabel}>Transporti (nisja)</Text>
            <TextInput
              value={transport}
              onChangeText={setTransport}
              allowFontScaling={false}
              style={[styles.nmInput, styles.nmHintInput]}
            />
          </View>
        </View>

        <Text style={[styles.nmLabel, styles.nmGap]}>Statusi:</Text>
        <NMSelect value={status} options={STATUS} onChange={setStatus} />

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
            <Text style={styles.nmBtnText}>Ruaj</Text>
          </Pressable>
        </View>
      </ScrollView>
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
      color: '#FFFFFF',
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

    pageSq: {
      width: 34,
      height: 34,
      borderRadius: 5,
      backgroundColor: C.blueBtn,
      alignItems: 'center',
      justifyContent: 'center',
    },

    pageSqText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 14,
      color: '#FFFFFF',
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

    /* The transport field opens on the kick-off values, greyed as a suggestion. */
    nmHintInput: {
      color: C.hint,
    },

    nmRow: {
      marginTop: 15,
      flexDirection: 'row',
      gap: 8,
    },

    nmCol: {
      flex: 1,
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

    /* Live preview of the fixture name. */
    nmPreview: {
      marginTop: 15,
      height: 34,
      justifyContent: 'center',
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 3,
      backgroundColor: 'rgba(26,157,0,0.2)',
    },

    nmPreviewText: {
      textAlign: 'center',
      fontFamily: Fonts.bodyBold,
      fontSize: 12,
      color: '#000000',
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

    nmYearBox: {
      width: 50,
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

    nmTimeBox: {
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
