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
 * Fut rezultatin — opened from the button of the same name on the trainer's
 * fixtures, both on the match page and on the row of the fixtures table. The
 * trainer sets the final score and each player's line, then saves.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',

  /* Every card and control is rimmed in a thin black line. */
  frame: '#000000',
  headLine: 'rgba(30,40,35,0.10)',
  rowLine: 'rgba(100,140,190,0.22)',

  blue1: '#E3EEFB',
  blue2: '#F6FBFF',

  green: '#159447',
  red: '#E03131',
  green10: 'rgba(21,148,71,0.10)',
  green20: 'rgba(21,148,71,0.20)',
};

/* The score in each of the two boxes below the team names. */
const SCORES = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

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

/* The eleven who played, carrying the line from the played-match page. */
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

export default function EnterResultScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const params = useLocalSearchParams<{ home?: string; away?: string }>();

  const home = params.home ?? 'FC Prishtina';
  const away = params.away ?? '';
  /* The side we are not: the fixture is always listed with Prishtina in it. */
  const rival = home.includes('Prishtina') ? away : home;

  const [homeScore, setHomeScore] = useState('0');
  const [awayScore, setAwayScore] = useState('0');
  const [stats, setStats] = useState<StatRow[]>(STATS);
  /* Which score box is unrolled, or null when both are shut. */
  const [openBox, setOpenBox] = useState<'home' | 'away' | null>(null);

  const setStat = (name: string, key: ColKey, value: string) =>
    setStats((prev) => prev.map((r) => (r.name === name ? { ...r, [key]: value } : r)));

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
                  {rival ? `Statistikat - vs ${rival}` : 'Statistikat'}
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
            {/* ── Rezultati final ───────────────────────────────── */}
            {/* Lifted while a box is unrolled, so the options fall over the
                table below instead of under it. */}
            <View
              style={[
                styles.card,
                styles.scoreCard,
                openBox && styles.cardLift,
              ]}
            >
              <View style={styles.head}>
                <Text style={styles.headTextBlack} numberOfLines={1}>
                  Rezultati final
                </Text>
              </View>
              <View style={styles.headLine} />

              <View style={styles.scoreBody}>
                <View style={styles.namesRow}>
                  <Text
                    style={styles.teamName}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    {home}
                  </Text>
                  <View style={styles.dashGap} />
                  <Text
                    style={styles.teamName}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    {away}
                  </Text>
                </View>

                <View style={styles.scoreRow}>
                  <View style={styles.scoreCol}>
                    <ScoreBox
                      value={homeScore}
                      tone={C.green}
                      label={`Golat e ${home}`}
                      open={openBox === 'home'}
                      setOpen={(v) => setOpenBox(v ? 'home' : null)}
                      onChange={setHomeScore}
                    />
                  </View>
                  <Text style={styles.scoreDash}>-</Text>
                  <View style={styles.scoreCol}>
                    <ScoreBox
                      value={awayScore}
                      tone={C.red}
                      label={`Golat e ${away}`}
                      open={openBox === 'away'}
                      setOpen={(v) => setOpenBox(v ? 'away' : null)}
                      onChange={setAwayScore}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* ── Statistikat e lojtarëve ───────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.head}>
                <Text style={styles.headTextBlack} numberOfLines={1}>
                  Statistikat e lojtarëve
                </Text>
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

            {/* ── Save ──────────────────────────────────────────── */}
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Ruaj rezultatin"
              style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed]}
            >
              <Text style={styles.saveText} numberOfLines={1}>
                Ruaj rezultatin
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* One score box                                                       */
/* ------------------------------------------------------------------ */

function ScoreBox({
  value,
  tone,
  label,
  open,
  setOpen,
  onChange,
}: {
  value: string;
  tone: string;
  label: string;
  open: boolean;
  setOpen: (open: boolean) => void;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.scoreWrap}>
      <Pressable
        onPress={() => setOpen(!open)}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [styles.scoreBox, { borderColor: tone }, pressed && styles.pressed]}
      >
        <Text style={styles.scoreValue} numberOfLines={1}>
          {value}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={I(13)} color={C.text} />
      </Pressable>

      {open ? (
        <View style={styles.scoreOpts}>
          {SCORES.map((s) => {
            const active = s === value;
            return (
              <Pressable
                key={s}
                onPress={() => {
                  onChange(s);
                  setOpen(false);
                }}
                accessibilityRole="button"
                accessibilityLabel={s}
                style={[styles.scoreOpt, active && styles.scoreOptActive]}
              >
                <Text
                  style={[styles.scoreOptText, active && styles.scoreOptTextActive]}
                  numberOfLines={1}
                >
                  {s}
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

    scroll: {
      paddingBottom: 24,
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

    /* The score box unrolls past this card's foot, so nothing may clip it. */
    scoreCard: {
      overflow: 'visible',
    },

    cardLift: {
      zIndex: 30,
      elevation: 30,
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

    /* ── Rezultati final ─────────────────────────────────────── */
    scoreBody: {
      backgroundColor: C.blue1,
      borderBottomLeftRadius: 4,
      borderBottomRightRadius: 4,
    },

    /* The two names sit centred over their own box below. */
    namesRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 10,
      paddingTop: 12,
    },

    teamName: {
      flex: 1,
      textAlign: 'center',
      fontFamily: Fonts.bodyBold,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.text,
    },

    dashGap: {
      width: 18,
    },

    scoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingTop: 9,
      paddingBottom: 14,
    },

    scoreCol: {
      flex: 1,
      alignItems: 'center',
    },

    scoreDash: {
      width: 18,
      textAlign: 'center',
      fontFamily: Fonts.bodyBold,
      fontSize: 15,
      color: C.text,
    },

    /* The two rectangles carry the tone on their rim only — the inside stays
       clear, so the body colour shows through. */
    scoreWrap: {
      width: 96,
    },

    scoreBox: {
      height: 42,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderRadius: 4,
    },

    scoreValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 16,
      color: C.text,
    },

    /* Floats over the statistics table so opening it moves nothing. */
    scoreOpts: {
      position: 'absolute',
      top: 45,
      left: 0,
      right: 0,
      zIndex: 40,
      elevation: 12,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
      overflow: 'hidden',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
    },

    scoreOpt: {
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },

    scoreOptActive: {
      backgroundColor: C.green10,
    },

    scoreOptText: {
      fontFamily: Fonts.body,
      fontSize: 12,
      color: C.text,
    },

    scoreOptTextActive: {
      fontFamily: Fonts.bodyBold,
      color: C.green,
    },

    /* ── Statistikat e lojtarëve ─────────────────────────────── */
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

    /* ── Save ────────────────────────────────────────────────── */
    saveBtn: {
      minHeight: 34,
      marginTop: 14,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      backgroundColor: C.green20,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    saveText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12,
      color: C.text,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
