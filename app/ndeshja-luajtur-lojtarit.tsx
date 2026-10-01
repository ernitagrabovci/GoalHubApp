import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * A played match — opened from "Shiko" on the results table of the player's
 * matches page.
 *
 * Read-only, so the admin's page without the edit and delete actions: the
 * match's own information, then the player's own line, the squad's statistics
 * and the starting eleven.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',

  /* blue2 = the pale card blue; blue1 = the deeper wash of a card's body. */
  blue1: '#E3EEFB',
  blue2: '#F6FBFF',

  border: 'rgba(100,140,190,0.30)',
  rowLine: 'rgba(100,140,190,0.22)',
  headLine: 'rgba(30,40,35,0.10)',

  green: '#159447',
  red: '#E03131',
  yellow: '#FFC800',

  /* The starting-eleven cards. */
  cardGreen: 'rgba(158,253,134,0.20)',
};

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/* ── The player's own line ─────────────────────────────────────────── */

const MY_STATS = { minutes: '---', goals: '0', assists: '0', yellow: '0', red: '0' };

/* ── Squad statistics ──────────────────────────────────────────────── */

type StatRow = {
  name: string;
  goals: number;
  assists: number;
  min: number;
  yellow: boolean;
  red: boolean;
};

const STATS: StatRow[] = [
  { name: 'Driton Demiri', goals: 0, assists: 0, min: 90, yellow: false, red: false },
  { name: 'Enver Mustafa', goals: 0, assists: 1, min: 90, yellow: true, red: false },
  { name: 'Ardit Lapashtica', goals: 1, assists: 0, min: 90, yellow: false, red: false },
  { name: 'Narti Cerkini', goals: 0, assists: 0, min: 90, yellow: false, red: false },
  { name: 'Blerim Krasniqi', goals: 0, assists: 2, min: 78, yellow: false, red: false },
  { name: 'Endrit Gashi', goals: 0, assists: 0, min: 90, yellow: true, red: false },
  { name: 'Leart Berisha', goals: 1, assists: 0, min: 90, yellow: false, red: false },
  { name: 'Riad Hoxha', goals: 0, assists: 1, min: 64, yellow: false, red: false },
  { name: 'Arbnor Zeka', goals: 0, assists: 0, min: 90, yellow: false, red: true },
  { name: 'Dion Nimani', goals: 0, assists: 0, min: 26, yellow: false, red: false },
];

type Starter = { name: string; position: string };

const STARTERS: Starter[] = [
  { name: 'Driton Demiri', position: 'Portjer' },
  { name: 'Enver Mustafa', position: 'Mbrojtës' },
  { name: 'Ardit Lapashtica', position: 'Mbrojtës' },
  { name: 'Narti Cerkini', position: 'Mbrojtës' },
  { name: 'Blerim Krasniqi', position: 'Mbrojtës' },
  { name: 'Endrit Gashi', position: 'Mesfushor' },
  { name: 'Leart Berisha', position: 'Mesfushor' },
  { name: 'Riad Hoxha', position: 'Mesfushor' },
  { name: 'Arbnor Zeka', position: 'Sulmues' },
  { name: 'Dion Nimani', position: 'Sulmues' },
  { name: 'Yll Demaku', position: 'Sulmues' },
];

/** "18/08/2026" → "18 Aug 2026". */
function formatDate(date: string): string {
  const [day, month, year] = date.split('/');
  const mon = MONTHS[Number(month) - 1];
  if (!day || !mon || !year) return date;
  return `${day} ${mon.charAt(0).toUpperCase()}${mon.slice(1).toLowerCase()} ${year}`;
}

/** A win is Prishtina scoring more than the opponent. */
function outcome(home: string, score: string): 'F' | 'H' | 'B' {
  const [h, a] = score.split('-').map(Number);
  if (h === a) return 'B';
  const atHome = home.includes('Prishtina');
  return (atHome ? h > a : a > h) ? 'F' : 'H';
}

const RESULT = {
  F: { label: 'Fitore', color: C.green },
  H: { label: 'Humbje', color: C.red },
  B: { label: 'Barazim', color: C.gray },
};

/* One cell of the "Statistikat e mia" strip: the label, the figure it belongs
   to, then — where the cell calls for it — the short black rule closing it. */
function MyStat({
  label,
  value,
  rule = true,
}: {
  label: string;
  value: string;
  rule?: boolean;
}) {
  return (
    <View style={styles.statCell}>
      <Text
        style={styles.statLabel}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
      >
        {label}
      </Text>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      {rule ? <View style={styles.statRule} /> : null}
    </View>
  );
}

export default function PlayerPlayedMatchScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const params = useLocalSearchParams<{
    home?: string;
    away?: string;
    venue?: string;
    comp?: string;
    date?: string;
    time?: string;
    score?: string;
  }>();

  const home = params.home ?? '';
  const away = params.away ?? '';
  const score = params.score ?? '';

  /* The fixture is named from our side, so the page is titled for the rival. */
  const rival = home.includes('Prishtina') ? away : home;
  const result = RESULT[outcome(home, score)];

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
                  {`vs ${rival}`}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {`${formatDate(params.date ?? '')}, ${params.time ?? ''}`}
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
            {/* ── Informacioni / E luajtur ──────────────────────── */}
            <View style={[styles.card, styles.cardFramed]}>
              <View style={styles.headRow}>
                <Text style={styles.headTextBlack}>Informacioni</Text>
                <Text style={styles.headTextGreen}>E luajtur</Text>
              </View>
              <View style={styles.headLine} />

              <View style={[styles.bodyRow, styles.body]}>
                {/* Where it was played over what it counted for, split by a
                    black rule — both on the left half of the table. */}
                <View style={styles.infoCol}>
                  <View style={styles.infoCell}>
                    <Text style={styles.cellLabel} numberOfLines={1}>
                      Vendodhja
                    </Text>
                    <Text style={styles.cellValue} numberOfLines={1}>
                      {params.venue ?? ''}
                    </Text>
                  </View>

                  <View style={styles.hRule} />

                  <View style={styles.infoCell}>
                    <Text style={styles.cellLabel} numberOfLines={1}>
                      Kompeticioni
                    </Text>
                    <Text
                      style={styles.cellValue}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.65}
                    >
                      {params.comp ?? ''}
                    </Text>
                  </View>
                </View>

                <View style={styles.vRule} />

                {/* The score and the verdict. */}
                <View style={styles.resultCol}>
                  <Text style={styles.resultScore} numberOfLines={1}>
                    {score}
                  </Text>
                  <Text style={[styles.resultLabel, { color: result.color }]} numberOfLines={1}>
                    {result.label}
                  </Text>
                </View>
              </View>
            </View>

            {/* ── Statistikat e mia ─────────────────────────────── */}
            <View style={[styles.card, styles.cardGap, styles.cardFramed]}>
              <View style={styles.headLeft}>
                <Text style={styles.headTextBlack}>Statistikat e mia</Text>
              </View>
              <View style={styles.headLine} />

              <View style={styles.body}>
                <View style={styles.statRow}>
                  <MyStat label="Minuta të luajtura" value={MY_STATS.minutes} />
                  <MyStat label="Gola" value={MY_STATS.goals} />
                  <MyStat label="Asiste" value={MY_STATS.assists} />
                </View>

                {/* Only the top row carries the rules, so the two cards below
                    sit plain. */}
                <View style={styles.statRow}>
                  <MyStat label="Kartona të verdhë" value={MY_STATS.yellow} rule={false} />
                  <MyStat label="Kartona të kuq" value={MY_STATS.red} rule={false} />
                  {/* Keeps the second row on the same columns as the first. */}
                  <View style={styles.statCell} />
                </View>
              </View>
            </View>

            {/* ── Statistikat e Lojtarëve ───────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.head}>
                <Text style={styles.headTextBlack}>Statistikat e Lojtarëve</Text>
              </View>
              <View style={styles.headLine} />

              <View style={styles.tblWrap}>
                <View style={[styles.tr, styles.thRow]}>
                  <Text style={[styles.th, styles.colName]}>Lojtari</Text>
                  <Text style={[styles.th, styles.colStat]}>Gola</Text>
                  <Text style={[styles.th, styles.colStat]}>Asiste</Text>
                  <Text style={[styles.th, styles.colStat]}>Min</Text>
                  <View style={styles.colCard}>
                    <View style={[styles.cardSq, { backgroundColor: C.yellow }]} />
                  </View>
                  <View style={styles.colCard}>
                    <View style={[styles.cardSq, { backgroundColor: C.red }]} />
                  </View>
                </View>

                {STATS.map((p) => (
                  <View key={p.name} style={[styles.tr, styles.trBorder]}>
                    <Text
                      style={[styles.tdName, styles.colName]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      {p.name}
                    </Text>
                    <Text style={[styles.td, styles.colStat]}>{p.goals}</Text>
                    <Text style={[styles.td, styles.colStat]}>{p.assists}</Text>
                    <Text style={[styles.td, styles.colStat]}>{p.min}</Text>
                    <View style={styles.colCard}>
                      {p.yellow ? <View style={[styles.cardSq, { backgroundColor: C.yellow }]} /> : null}
                    </View>
                    <View style={styles.colCard}>
                      {p.red ? <View style={[styles.cardSq, { backgroundColor: C.red }]} /> : null}
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* ── Formacioni ────────────────────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.head}>
                <Text style={styles.headTextBlack}>Formacioni</Text>
              </View>
              <View style={styles.headLine} />

              <Text style={styles.sectionLabel}>Startuesit (11)</Text>

              <View style={styles.squadGrid}>
                {STARTERS.map((s) => (
                  <View key={s.name} style={styles.playerCard}>
                    <Text style={styles.playerName}>{s.name}</Text>
                    <Text style={styles.playerPosition}>{s.position}</Text>
                  </View>
                ))}
              </View>
            </View>
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

    /* ── Cards ───────────────────────────────────────────────── */
    card: {
      marginTop: 14,
      backgroundColor: C.blue2,
      borderWidth: 2,
      borderColor: C.border,
      borderRadius: 7,
      overflow: 'hidden',
    },

    cardGap: {
      marginTop: 14,
    },

    /* The first two cards: the palest strip behind the title, the deeper wash
       under it, the whole thing ruled in black. */
    cardFramed: {
      borderWidth: 1,
      borderColor: '#000000',
    },

    body: {
      backgroundColor: C.blue1,
    },

    head: {
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 10,
    },

    /* Card titles that sit on the left, over their own rule. */
    headLeft: {
      alignItems: 'flex-start',
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

    headTextGreen: {
      fontFamily: Fonts.bodyBold,
      fontSize: 14,
      lineHeight: 18,
      color: C.green,
    },

    headLine: {
      height: 1,
      backgroundColor: C.headLine,
    },

    /* ── Informacioni body ───────────────────────────────────── */
    bodyRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      paddingHorizontal: 10,
    },

    /* The venue over the competition down the left half; the score takes the
       right. Equal halves, so the rule between them sits on the centre. */
    infoCol: {
      flex: 1,
      justifyContent: 'center',
      paddingVertical: 12,
    },

    infoCell: {
      justifyContent: 'center',
    },

    /* Black rule between the two facts — the margin keeps it off the letters. */
    hRule: {
      height: 1,
      marginVertical: 8,
      backgroundColor: '#000000',
    },

    /* And the one splitting the facts off from the score. */
    vRule: {
      width: 1,
      marginVertical: 6,
      backgroundColor: '#000000',
    },

    resultCol: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
    },

    cellLabel: {
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 14,
      color: C.hint,
    },

    cellValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 11.5,
      lineHeight: 16,
      color: C.text,
      marginTop: 2,
    },

    resultScore: {
      fontFamily: Fonts.bodyBlack,
      fontSize: 34,
      lineHeight: 38,
      letterSpacing: -0.6,
      color: C.text,
    },

    resultLabel: {
      fontFamily: Fonts.bodyBold,
      fontSize: 10.5,
      lineHeight: 14,
      marginTop: 1,
    },

    /* ── Statistikat e mia ───────────────────────────────────── */
    statRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      paddingHorizontal: 4,
      paddingVertical: 10,
    },

    statCell: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: 6,
    },

    /* Short black rule closing each cell, under its figure. */
    statRule: {
      height: 1,
      marginTop: 6,
      backgroundColor: '#000000',
    },

    statLabel: {
      fontFamily: Fonts.body,
      fontSize: 10,
      lineHeight: 13,
      color: C.hint,
    },

    statValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 15,
      lineHeight: 20,
      color: C.text,
      marginTop: 3,
    },

    /* ── Statistikat e Lojtarëve ─────────────────────────────── */
    tblWrap: {
      paddingHorizontal: 8,
      paddingTop: 8,
      paddingBottom: 2,
    },

    thRow: {
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 30,
    },

    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    colName: {
      flex: 1,
    },

    colStat: {
      width: 36,
      textAlign: 'center',
    },

    colCard: {
      width: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },

    th: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 9.5,
      lineHeight: 12,
      color: C.gray,
    },

    tdName: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.text,
    },

    td: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.hint,
    },

    cardSq: {
      width: 10,
      height: 10,
      borderRadius: 2,
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
      backgroundColor: C.cardGreen,
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
