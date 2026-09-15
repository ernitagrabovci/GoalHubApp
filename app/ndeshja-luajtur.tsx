import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * A played match — opened from "Shiko" on the results table in ndeshjet. Shows
 * the same informacioni block as an upcoming match, plus the score and, since
 * the match is over, the player statistics and the starting eleven.
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

  green: '#159447',
  red: '#E03131',
  yellow: '#FFC800',

  /* The starting-eleven cards. */
  cardGreen: 'rgba(158,253,134,0.20)',
};

const INFO_LABELS = ['Ekipi', 'Fiziku', 'Taktikat', 'Stabilitet'];

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

type StatRow = {
  name: string;
  goals: number;
  assists: number;
  min: number;
  yellow: boolean;
  red: boolean;
  nota: number;
};

const STATS: StatRow[] = [
  { name: 'Driton Demiri', goals: 0, assists: 0, min: 90, yellow: false, red: false, nota: 7.5 },
  { name: 'Enver Mustafa', goals: 0, assists: 1, min: 90, yellow: true, red: false, nota: 6.8 },
  { name: 'Ardit Lapashtica', goals: 1, assists: 0, min: 90, yellow: false, red: false, nota: 7.9 },
  { name: 'Narti Cerkini', goals: 0, assists: 0, min: 90, yellow: false, red: false, nota: 6.5 },
  { name: 'Blerim Krasniqi', goals: 0, assists: 2, min: 78, yellow: false, red: false, nota: 7.2 },
  { name: 'Endrit Gashi', goals: 0, assists: 0, min: 90, yellow: true, red: false, nota: 6.9 },
  { name: 'Leart Berisha', goals: 1, assists: 0, min: 90, yellow: false, red: false, nota: 8.1 },
  { name: 'Riad Hoxha', goals: 0, assists: 1, min: 64, yellow: false, red: false, nota: 6.4 },
  { name: 'Arbnor Zeka', goals: 0, assists: 0, min: 90, yellow: false, red: true, nota: 5.8 },
  { name: 'Dion Nimani', goals: 0, assists: 0, min: 26, yellow: false, red: false, nota: 6.2 },
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

export default function PlayedMatchScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const params = useLocalSearchParams<{
    home?: string;
    away?: string;
    team?: string;
    comp?: string;
    date?: string;
    time?: string;
    score?: string;
  }>();

  const home = params.home ?? '';
  const away = params.away ?? '';
  const score = params.score ?? '';
  const title = away ? `${home} - ${away}` : home;

  const result = RESULT[outcome(home, score)];

  const values = [
    params.team ?? '',
    home.includes('Prishtina') ? 'Shtëpi' : 'Musafir',
    params.comp ?? '',
    `${formatDate(params.date ?? '')}, ${params.time ?? ''}`,
  ];

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
                accessibilityRole="button"
                accessibilityLabel="Edito ndeshjen"
                style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
              >
                <Text style={styles.actionText}>Edito</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fshi ndeshjen"
                style={({ pressed }) => [styles.deleteBtn, pressed && styles.pressed]}
              >
                <Text style={styles.actionText}>Fshi</Text>
              </Pressable>
            </View>

            {/* ── Informacioni / E luajtur ──────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.headRow}>
                <Text style={styles.headTextBlack}>Informacioni</Text>
                <Text style={styles.headTextGreen}>E luajtur</Text>
              </View>
              <View style={styles.headLine} />

              <View style={styles.bodyRow}>
                {/* Left half — labels, the rule, then their values. */}
                <View style={styles.infoHalf}>
                  <View style={styles.labelsCol}>
                    {INFO_LABELS.map((label, i) => (
                      <View key={label} style={[styles.cell, i > 0 && styles.cellBorder]}>
                        <Text style={styles.cellLabel} numberOfLines={1}>
                          {label}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.valuesCol}>
                    {values.map((value, i) => (
                      <View key={`${value}-${i}`} style={[styles.cell, i > 0 && styles.cellBorder]}>
                        <Text
                          style={styles.cellValue}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.6}
                        >
                          {value}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={styles.vRule} />

                {/* Right half — the score and the verdict. */}
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

            {/* ── Statistikat e lojtarëve ───────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.head}>
                <Text style={styles.headTextBlack}>Statistikat e lojtarëve</Text>
              </View>
              <View style={styles.headLine} />

              <View style={styles.tblWrap}>
                <View style={styles.tr}>
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
                  <Text style={[styles.th, styles.colNota]}>Nota</Text>
                </View>

                <View style={styles.noteRow}>
                  <Text style={styles.note}>Statistikat janë regjistruar nga trajneri.</Text>
                </View>

                {STATS.map((p, i) => (
                  <View key={p.name} style={[styles.tr, styles.trBorder]}>
                    <Text style={[styles.tdName, styles.colName]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
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
                    <Text style={[styles.td, styles.colNota]}>{p.nota.toFixed(1)}</Text>
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

    /* Labels and values share the left half; the score takes the right half. */
    infoHalf: {
      flex: 1,
      flexDirection: 'row',
    },

    /* Labels are all short, so the values get the larger share of the half. */
    labelsCol: {
      flex: 0.8,
    },

    /* Black rule dividing the sections — a margin keeps it off the letters. */
    vRule: {
      width: 1,
      marginVertical: 6,
      marginHorizontal: 8,
      backgroundColor: '#000000',
    },

    valuesCol: {
      flex: 1.5,
    },

    resultCol: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },

    /* Rows grow with their content instead of holding a fixed height. */
    cell: {
      minHeight: 34,
      justifyContent: 'center',
      paddingVertical: 6,
    },

    cellBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    cellLabel: {
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 14,
      color: C.hint,
    },

    cellValue: {
      textAlign: 'right',
      fontFamily: Fonts.bodyBold,
      fontSize: 11,
      lineHeight: 14,
      color: C.text,
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

    /* ── Statistikat table ───────────────────────────────────── */
    tblWrap: {
      paddingHorizontal: 8,
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

    colNota: {
      width: 40,
      textAlign: 'center',
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

    noteRow: {
      alignItems: 'center',
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    note: {
      textAlign: 'center',
      fontFamily: Fonts.body,
      fontSize: 10,
      lineHeight: 14,
      color: C.gray,
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
