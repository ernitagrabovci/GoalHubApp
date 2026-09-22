import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * Raportet — opened from the "Shiko të gjithë" footer of the Raportet card
 * on the admin dashboard.
 *
 * Two promo cards, the player filter row, the wide individual table with its
 * pager, then the attendance and goals-by-position breakdowns.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',
  ghost: '#A8A8A8',

  cardBg: '#E3EEFB',
  headBg: '#F6FBFF',
  frame: '#000000',
  headLine: 'rgba(30,40,35,0.10)',
  rowLine: 'rgba(100,140,190,0.22)',

  blueSoft: '#E3EEFB',
  blue: '#2F80ED',
  green: '#159447',
  orange: '#E4A000',
  red: '#E03131',

  /* Unfilled part of every progress rail. */
  track: 'rgba(0,0,0,0.10)',
};

const IMG = {
  ndeshjet: require('@/assets/dashboard/ndeshjet.png'),
  pagesat: require('@/assets/dashboard/pagesat-art.png'),
};

/* ── Individual report table ───────────────────────────────────────── */

type ColKey =
  | 'name'
  | 'team'
  | 'pos'
  | 'nd'
  | 'gola'
  | 'asiste'
  | 'min'
  | 'kv'
  | 'kk'
  | 'prani'
  | 'vler';

type Col = { key: ColKey; label: string; width: number };

const COLS: Col[] = [
  { key: 'name', label: 'Lojtari', width: 104 },
  { key: 'team', label: 'Ekipi', width: 60 },
  { key: 'pos', label: 'Poz', width: 40 },
  { key: 'nd', label: 'Nd', width: 34 },
  { key: 'gola', label: 'Gola', width: 44 },
  { key: 'asiste', label: 'Asiste', width: 48 },
  { key: 'min', label: 'Min', width: 44 },
  { key: 'kv', label: 'KV', width: 34 },
  { key: 'kk', label: 'KK', width: 34 },
  { key: 'prani', label: 'Prani', width: 64 },
  { key: 'vler', label: 'Vlerësimi', width: 68 },
];

/** The three columns that carry a tone; everything else stays plain. */
const TD_TONE: Partial<Record<ColKey, string>> = {
  gola: C.green,
  kv: C.orange,
  kk: C.red,
};

type Row = {
  name: string;
  team: string;
  pos: string;
  nd: number;
  gola: number;
  asiste: number;
  min: number;
  kv: number;
  kk: number;
  prani: number;
  vler: string;
};

const ROWS: Row[] = [
  { name: 'Kastriot Avdiu', team: 'U13', pos: 'SU', nd: 8, gola: 12, asiste: 3, min: 623, kv: 0, kk: 0, prani: 63, vler: '7.5' },
  { name: 'Ardit Rexha', team: 'E. i Parë', pos: 'SU', nd: 14, gola: 18, asiste: 6, min: 1180, kv: 0, kk: 0, prani: 92, vler: '8.4' },
  { name: 'Erion Hoxha', team: 'U21', pos: 'MF', nd: 13, gola: 5, asiste: 9, min: 1042, kv: 0, kk: 0, prani: 88, vler: '7.8' },
  { name: 'Bledar Krasniqi', team: 'E. i Parë', pos: 'MB', nd: 15, gola: 2, asiste: 3, min: 1310, kv: 0, kk: 0, prani: 95, vler: '7.9' },
  { name: 'Migena Shahini', team: 'U17', pos: 'MB', nd: 11, gola: 1, asiste: 4, min: 902, kv: 0, kk: 0, prani: 81, vler: '7.2' },
  { name: 'Endrit Nushi', team: 'U21', pos: 'PO', nd: 12, gola: 0, asiste: 0, min: 1080, kv: 4, kk: 0, prani: 90, vler: '8.1' },
  { name: 'Lira Sula', team: 'U15', pos: 'SU', nd: 9, gola: 7, asiste: 2, min: 640, kv: 0, kk: 0, prani: 74, vler: '6.9' },
  { name: 'Dritan Jakupi', team: 'U19', pos: 'MF', nd: 12, gola: 4, asiste: 5, min: 980, kv: 0, kk: 0, prani: 86, vler: '7.6' },
  { name: 'Klea Hyseni', team: 'U15', pos: 'MB', nd: 8, gola: 0, asiste: 1, min: 560, kv: 0, kk: 0, prani: 68, vler: '6.4' },
  { name: 'Gentian Meta', team: 'U13', pos: 'PO', nd: 10, gola: 0, asiste: 0, min: 780, kv: 2, kk: 1, prani: 79, vler: '7.1' },
];

const PAGES = [1, 2, 3, 4];

/* ── Attendance by team ────────────────────────────────────────────── */

type Attendance = { team: string; pct: number; present: number; absent: number };

const ATTENDANCE: Attendance[] = [
  { team: 'Ekipi i Parë', pct: 89, present: 201, absent: 25 },
  { team: 'U21', pct: 84, present: 160, absent: 30 },
  { team: 'U17', pct: 78, present: 132, absent: 37 },
  { team: 'U15', pct: 71, present: 118, absent: 48 },
  { team: 'U13', pct: 65, present: 96, absent: 52 },
];

/* ── Goals by position ─────────────────────────────────────────────── */

type Goals = { pos: string; total: number; color: string };

const GOALS: Goals[] = [
  { pos: 'Sulmues', total: 107, color: C.orange },
  { pos: 'Mesfushorë', total: 65, color: C.blue },
  { pos: 'Mbrojtës', total: 2, color: C.green },
  { pos: 'Portier', total: 0, color: C.track },
];

/** Widest value on the scale, so the longest bar fills the rail. */
const GOALS_MAX = 107;

/* ------------------------------------------------------------------ */

/** A hint rail with its filled share laid over it. */
function MiniBar({ pct, color, width }: { pct: number; color: string; width: number }) {
  return (
    <View style={[styles.bar, { width }]}>
      <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color }]} />
    </View>
  );
}

export default function ReportsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

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
                <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                  Raportet e lojtarëve
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Statistikat individuale dhe prezenca
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
            {/* ── Promo cards ───────────────────────────────────── */}
            <View style={styles.twoCol}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Raportet e ndeshjeve"
                onPress={() => router.push('/raporti-ndeshjeve')}
                style={({ pressed }) => [styles.promo, styles.promoMatches, pressed && styles.pressed]}
              >
                <Text style={styles.promoTitle} numberOfLines={2}>
                  Raportet e ndeshjeve
                </Text>
                <Image source={IMG.ndeshjet} style={styles.promoImgMatches} resizeMode="contain" />
                <View style={[styles.promoBtn, { backgroundColor: C.red }]}>
                  <Text style={styles.promoBtnText}>Vazhdo</Text>
                </View>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Raportet e pagesave"
                onPress={() => router.push('/raporti-pagesave')}
                style={({ pressed }) => [styles.promo, styles.promoPayments, pressed && styles.pressed]}
              >
                <Text style={styles.promoTitle} numberOfLines={2}>
                  Raportet e pagesave
                </Text>
                <Image source={IMG.pagesat} style={styles.promoImgPayments} resizeMode="contain" />
                <View style={[styles.promoBtn, { backgroundColor: C.orange }]}>
                  <Text style={styles.promoBtnText}>Vazhdo</Text>
                </View>
              </Pressable>
            </View>

            {/* ── Filters ───────────────────────────────────────── */}
            <View style={styles.filterRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Filtro: Të gjitha ekipet"
                style={({ pressed }) => [styles.filterBox, pressed && styles.pressed]}
              >
                <Text style={styles.filterText} numberOfLines={1}>
                  Të gjitha ekipet
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={I(14)} color={C.text} />
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Filtro: Të gjitha pozicionet"
                style={({ pressed }) => [styles.filterBox, pressed && styles.pressed]}
              >
                <Text style={styles.filterText} numberOfLines={1}>
                  Të gjitha pozicionet
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={I(14)} color={C.text} />
              </Pressable>
            </View>

            {/* ── Individual player report ──────────────────────── */}
            <View style={styles.card}>
              <View style={styles.head}>
                <Text style={styles.headText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                  Raporti individual i lojtarëve
                </Text>
              </View>
              <View style={styles.headLine} />

              {/* Eleven columns, so the table runs off the card sideways. */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={styles.tblInner}
              >
                <View>
                  <View style={[styles.tr, styles.thRow]}>
                    {COLS.map((c) => (
                      <Text
                        key={c.key}
                        style={[styles.th, { width: c.width }, TD_TONE[c.key] ? { color: TD_TONE[c.key] } : null]}
                        numberOfLines={1}
                      >
                        {c.label}
                      </Text>
                    ))}
                  </View>

                  {ROWS.map((r) => (
                    <View key={r.name} style={[styles.tr, styles.trBorder]}>
                      {COLS.map((c) => {
                        if (c.key === 'name') {
                          return (
                            <Text
                              key={c.key}
                              style={[styles.td, styles.tdName, { width: c.width }]}
                              numberOfLines={1}
                            >
                              {r.name}
                            </Text>
                          );
                        }
                        if (c.key === 'prani') {
                          return (
                            <View key={c.key} style={[styles.tdBar, { width: c.width }]}>
                              <MiniBar pct={r.prani} color={C.green} width={46} />
                              <Text style={styles.barLabel}>{r.prani}%</Text>
                            </View>
                          );
                        }
                        const tone = TD_TONE[c.key];
                        return (
                          <Text
                            key={c.key}
                            style={[styles.td, { width: c.width }, tone ? { color: tone } : null]}
                            numberOfLines={1}
                          >
                            {r[c.key]}
                          </Text>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </ScrollView>
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

            {/* ── Attendance ────────────────────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.headRow}>
                <Text style={styles.headText} numberOfLines={1}>
                  Prezenca në stërvitje
                </Text>
                <Text style={styles.headHint}>sipas ekipit</Text>
              </View>
              <View style={styles.headLine} />

              <View style={styles.body}>
                {ATTENDANCE.map((a) => (
                  <View key={a.team} style={styles.statBlock}>
                    <View style={styles.statTop}>
                      <Text style={styles.statLabel} numberOfLines={1}>
                        {a.team}
                      </Text>
                      <Text style={styles.statValue}>{a.pct}%</Text>
                    </View>

                    {/* One rail, split present / absent. */}
                    <View style={styles.splitBar}>
                      <View style={[styles.splitFill, { flex: a.pct, backgroundColor: C.green }]} />
                      <View
                        style={[styles.splitFill, { flex: 100 - a.pct, backgroundColor: C.red }]}
                      />
                    </View>

                    <View style={styles.statFoot}>
                      <Text style={[styles.footText, { color: C.green }]}>{a.present} prezent</Text>
                      <Text style={[styles.footText, { color: C.red }]}>{a.absent} mungesë</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>

            {/* ── Goals by position ─────────────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.headRow}>
                <Text style={styles.headText} numberOfLines={1}>
                  Golat sipas pozicionit
                </Text>
                <Text style={styles.headHint}>sipas ekipit</Text>
              </View>
              <View style={styles.headLine} />

              <View style={styles.body}>
                {GOALS.map((g) => (
                  <View key={g.pos} style={styles.statBlock}>
                    <View style={styles.statTop}>
                      <Text style={styles.statLabel} numberOfLines={1}>
                        {g.pos}
                      </Text>
                      <Text style={styles.statValue}>{g.total}</Text>
                    </View>

                    <View style={styles.goalBar}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${(g.total / GOALS_MAX) * 100}%`,
                            backgroundColor: g.color,
                          },
                        ]}
                      />
                    </View>
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

    /* ── Promo cards ─────────────────────────────────────────── */
    twoCol: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },

    promo: {
      width: '48%',
      height: 106,
      position: 'relative',
      borderRadius: 9,
      borderWidth: 1,
      overflow: 'hidden',
    },

    promoMatches: {
      backgroundColor: '#FDEBEB',
      borderColor: '#F2C2C2',
    },

    promoPayments: {
      backgroundColor: '#FBF0DC',
      borderColor: '#EFD6A6',
    },

    promoTitle: {
      position: 'absolute',
      top: 8,
      left: 2,
      right: 5,
      textAlign: 'center',
      fontFamily: Fonts.bodyBold,
      fontSize: 22,
      lineHeight: 22,
      color: C.text,
      zIndex: 3,
    },

    promoImgMatches: {
      position: 'absolute',
      width: 104,
      height: 104,
      left: -30,
      bottom: -48,
      zIndex: 1,
    },

    promoImgPayments: {
      position: 'absolute',
      width: 100,
      height: 120,
      left: -40,
      bottom: -44,
      zIndex: 1,
    },

    promoBtn: {
      position: 'absolute',
      right: 8,
      bottom: 8,
      minWidth: 64,
      height: 27,
      borderRadius: 5,
      paddingHorizontal: 9,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 5,
    },

    promoBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11,
      lineHeight: 14,
      color: '#FFFFFF',
    },

    /* ── Filters ─────────────────────────────────────────────── */
    filterRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 14,
    },

    /* Sized to its own label rather than splitting the row in half. */
    filterBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 32,
      paddingHorizontal: 9,
      backgroundColor: C.blueSoft,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    filterText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12.5,
      color: C.text,
    },

    /* ── Tables ──────────────────────────────────────────────── */
    card: {
      marginTop: 14,
      backgroundColor: C.cardBg,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 7,
      overflow: 'hidden',
    },

    cardGap: {
      marginTop: 16,
    },

    head: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 11,
      backgroundColor: C.headBg,
    },

    headRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 11,
      backgroundColor: C.headBg,
    },

    headText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 15,
      lineHeight: 19,
      color: C.text,
    },

    headHint: {
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 14,
      color: C.gray,
    },

    headLine: {
      height: 1,
      backgroundColor: C.headLine,
    },

    /* ── Individual report table ─────────────────────────────── */
    tblInner: {
      paddingHorizontal: 10,
      paddingBottom: 10,
    },

    thRow: {
      paddingTop: 9,
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 40,
    },

    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    th: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      lineHeight: 15,
      color: C.gray,
      textAlign: 'center',
    },

    td: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 15,
      color: C.text,
      textAlign: 'center',
    },

    tdName: {
      fontFamily: Fonts.bodySemiBold,
      textAlign: 'left',
    },

    tdBar: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
    },

    bar: {
      height: 5,
      borderRadius: 3,
      backgroundColor: C.track,
      overflow: 'hidden',
    },

    barFill: {
      height: '100%',
      borderRadius: 3,
    },

    barLabel: {
      fontFamily: Fonts.body,
      fontSize: 10,
      lineHeight: 12,
      color: C.gray,
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
      backgroundColor: '#86BCFD',
      alignItems: 'center',
      justifyContent: 'center',
    },

    pageSqText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 14,
      color: '#FFFFFF',
    },

    /* ── Statistic breakdowns ────────────────────────────────── */
    body: {
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 14,
      gap: 16,
    },

    statBlock: {
      gap: 5,
    },

    statTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },

    statLabel: {
      flex: 1,
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.text,
    },

    statValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 13,
      lineHeight: 16,
      color: C.text,
    },

    splitBar: {
      flexDirection: 'row',
      height: 7,
      borderRadius: 4,
      overflow: 'hidden',
      backgroundColor: C.track,
    },

    splitFill: {
      height: '100%',
    },

    statFoot: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },

    footText: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
    },

    goalBar: {
      height: 7,
      borderRadius: 4,
      backgroundColor: C.track,
      overflow: 'hidden',
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
