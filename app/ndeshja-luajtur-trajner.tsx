import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
 * A played match, the trainer's own view — opened from "Shiko" on the results
 * table in ndeshjet-trajner. The fixture's facts, the players' statistics and
 * the starting eleven that was called up.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',

  /* blue1 = the deeper blue of the buttons and the body; blue2 = pale card. */
  blue1: '#E3EEFB',
  blue2: '#F6FBFF',

  border: 'rgba(100,140,190,0.30)',
  rowLine: 'rgba(100,140,190,0.22)',
  headLine: 'rgba(30,40,35,0.10)',

  /* The starting-eleven cards. */
  cardGreen: 'rgba(158,253,134,0.20)',
};

const INFO_LABELS = ['Kundershtari', 'Gara', 'Data', 'Vendodhja'];

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

type ColKey = 'goals' | 'assists' | 'minutes' | 'yellow' | 'red' | 'nota';

const COLS: { key: ColKey | 'name'; label: string; width: number }[] = [
  { key: 'name', label: 'Lojtari', width: 118 },
  { key: 'goals', label: '⚽ Gola', width: 58 },
  { key: 'assists', label: '🅰️ Asiste', width: 64 },
  { key: 'minutes', label: '⏱ Minuta', width: 62 },
  { key: 'yellow', label: '🟨 Karton', width: 62 },
  { key: 'red', label: '🟥 Karton', width: 62 },
  { key: 'nota', label: '⭐ Nota', width: 58 },
];

type StatRow = {
  name: string;
  goals: string;
  assists: string;
  minutes: string;
  yellow: string;
  red: string;
  nota: string;
};

/* The same eleven and the same line the "Fut rezultatin" page holds. */
const STATS: StatRow[] = [
  { name: 'Driton Demiri', goals: '0', assists: '0', minutes: '90', yellow: '0', red: '0', nota: '7.5' },
  { name: 'Enver Mustafa', goals: '0', assists: '1', minutes: '90', yellow: '1', red: '0', nota: '6.8' },
  { name: 'Ardit Lapashtica', goals: '1', assists: '0', minutes: '90', yellow: '0', red: '0', nota: '7.9' },
  { name: 'Narti Cerkini', goals: '0', assists: '0', minutes: '90', yellow: '0', red: '0', nota: '6.5' },
  { name: 'Blerim Krasniqi', goals: '0', assists: '2', minutes: '78', yellow: '0', red: '0', nota: '7.2' },
  { name: 'Endrit Gashi', goals: '0', assists: '0', minutes: '90', yellow: '1', red: '0', nota: '6.9' },
  { name: 'Leart Berisha', goals: '1', assists: '0', minutes: '90', yellow: '0', red: '0', nota: '8.1' },
  { name: 'Riad Hoxha', goals: '0', assists: '1', minutes: '64', yellow: '0', red: '0', nota: '6.4' },
  { name: 'Arbnor Zeka', goals: '0', assists: '0', minutes: '90', yellow: '0', red: '1', nota: '5.8' },
  { name: 'Dion Nimani', goals: '0', assists: '0', minutes: '26', yellow: '0', red: '0', nota: '6.2' },
  { name: 'Yll Demaku', goals: '0', assists: '0', minutes: '12', yellow: '0', red: '0', nota: '6.0' },
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

export default function TrainerPlayedMatchScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const params = useLocalSearchParams<{
    home?: string;
    away?: string;
    comp?: string;
    date?: string;
    time?: string;
  }>();

  const home = params.home ?? '';
  const away = params.away ?? '';
  const title = away ? `${home} - ${away}` : home;

  /* The side we are not: the fixture is always listed with Prishtina in it. */
  const atHome = home.includes('Prishtina');
  const rival = atHome ? away : home;

  const date = params.date ?? '';
  const time = params.time ?? '';

  const [stats, setStats] = useState<StatRow[]>(STATS);

  const setStat = (name: string, key: ColKey, value: string) =>
    setStats((prev) => prev.map((r) => (r.name === name ? { ...r, [key]: value } : r)));

  const values = [
    rival,
    params.comp ?? '',
    `${formatDate(date)}, ${time}`,
    atHome ? 'Shtëpi' : 'Musafir',
  ];

  /* The same shape of params the fixtures table hands to the other pages. */
  const fixture = {
    home,
    away,
    day: date.split('/')[0] ?? '',
    mon: MONTHS[Number(date.split('/')[1]) - 1] ?? '',
    time,
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
            {/* One action only: the result is corrected, never deleted. */}
            <View style={styles.actions}>
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/fut-rezultatin', params: { home, away } })
                }
                accessibilityRole="button"
                accessibilityLabel="Edito rezultatin"
                style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
              >
                <Text style={styles.actionText}>Edito rezultatin</Text>
              </Pressable>
            </View>

            {/* ── Informacioni ──────────────────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.head}>
                <Text style={styles.headTextBlack}>Informacioni</Text>
              </View>
              <View style={styles.headLine} />

              {/* Labels lead into their values; no rules between the pairs, and
                  the deeper body holds them as one block. */}
              <View style={styles.infoBody}>
                {INFO_LABELS.map((label, i) => (
                  <View key={label} style={styles.cellRow}>
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
            </View>

            {/* ── Statistikat e lojtarëve ───────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.head}>
                <Text style={styles.headTextBlack}>Statistikat e lojtarëve</Text>
              </View>
              <View style={styles.headLine} />

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
                  </View>

                  {stats.map((row, i) => (
                    <View key={row.name} style={[styles.tr, i > 0 && styles.trBorder]}>
                      {COLS.map((c) =>
                        c.key === 'name' ? (
                          <Text
                            key={c.key}
                            style={[styles.tdName, { width: c.width }]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.8}
                          >
                            {row.name}
                          </Text>
                        ) : (
                          <TextInput
                            key={c.key}
                            value={row[c.key]}
                            onChangeText={(text) => setStat(row.name, c.key as ColKey, text)}
                            keyboardType={c.key === 'nota' ? 'decimal-pad' : 'number-pad'}
                            allowFontScaling={false}
                            style={[styles.tdInput, { width: c.width }]}
                          />
                        ),
                      )}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* ── Edito formacionin ─────────────────────────────── */}
            <View style={styles.actions}>
              <Pressable
                onPress={() => router.push({ pathname: '/cakto-formacion', params: fixture })}
                accessibilityRole="button"
                accessibilityLabel="Edito formacionin"
                style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
              >
                <Text style={styles.actionText}>Edito formacionin</Text>
              </Pressable>
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

    /* A blue wash under a black rim and label. */
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

    headTextBlack: {
      fontFamily: Fonts.bodyBold,
      fontSize: 14,
      lineHeight: 18,
      color: C.text,
    },

    headLine: {
      height: 1,
      backgroundColor: C.headLine,
    },

    /* ── Informacioni rows ───────────────────────────────────── */
    /* A step deeper than the title strip above it, with no rules inside. */
    infoBody: {
      backgroundColor: C.blue1,
    },

    cellRow: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 34,
      paddingHorizontal: 10,
      gap: 6,
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

    /* ── Statistikat table ───────────────────────────────────── */
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
      fontSize: 10,
      lineHeight: 13,
      color: C.hint,
    },

    tdName: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11,
      lineHeight: 14,
      color: C.text,
    },

    /* A bare box per figure, ruled in grey so the rows read lighter than the
       headings above them. */
    tdInput: {
      height: 26,
      paddingHorizontal: 0,
      paddingVertical: 0,
      textAlign: 'center',
      fontFamily: Fonts.body,
      fontSize: 11,
      color: C.text,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: C.gray,
      borderRadius: 3,
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
