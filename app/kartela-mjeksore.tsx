import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * Kartela mjekësore — opened from the medical card on the admin dashboard.
 * Three headline counts, the players currently carrying a problem, and the
 * full injury log.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',

  /* blue1 = the deeper blue of the filter buttons; blue2 = the pale card blue. */
  blue1: '#E3EEFB',
  blue2: '#F6FBFF',

  border: 'rgba(100,140,190,0.30)',
  rowLine: 'rgba(100,140,190,0.22)',
  headLine: 'rgba(30,40,35,0.10)',

  green: '#159447',
  red: '#E03131',
  orange: '#E4A000',
};

const TEAMS = ['Të gjitha ekipet', 'Ekipi i Parë', 'U21', 'U19', 'U17', 'U15'];
const STATUSES = ['Të gjitha statuset', 'I lënduar', 'Në rehabilitim', 'I shëruar'];

/** Width of the trailing "Shiko" column in the injury log. */
const INJ_ACTION_W = 58;

/** Gloss sweep laid over the frosted squares — bright corner, pale middle. */
const SQ_GLOSS = [
  'rgba(255,255,255,0.78)',
  'rgba(255,255,255,0.16)',
  'rgba(255,255,255,0.46)',
] as const;

/** One colour per medical status, reused by both tables. */
const STATUS_TONE: Record<string, string> = {
  'I lënduar': C.red,
  'Në rehabilitim': C.orange,
  Aktiv: C.green,
  'I shëruar': C.green,
};

const SUMMARY = [
  { label: 'Lojtarë aktiv', value: '77', note: 'Gati për lojë', tone: C.green },
  { label: 'Lojtarë të lënduar', value: '4', note: 'Pa lojë', tone: C.red },
  { label: 'Lojtarë në rehabilitim', value: '0', note: 'Kthim në pagese', tone: C.orange },
];

type Problem = {
  name: string;
  team: string;
  status: string;
  lastInjury: string;
  expectedReturn: string;
};

const PROBLEMS: Problem[] = [
  { name: 'Driton Demiri', team: 'Ekipi i Parë', status: 'I lënduar', lastInjury: 'Grumbullim muskujsh', expectedReturn: '12/09/2026' },
  { name: 'Enver Mustafa', team: 'Ekipi i Parë', status: 'Në rehabilitim', lastInjury: 'Përrdredhje e kyçit', expectedReturn: '05/09/2026' },
  { name: 'Ardit Lapashtica', team: 'Ekipi i Parë', status: 'I lënduar', lastInjury: 'Thyerje e gishtit', expectedReturn: '20/09/2026' },
  { name: 'Narti Cerkini', team: 'Ekipi i Parë', status: 'I lënduar', lastInjury: 'Gripi', expectedReturn: '01/09/2026' },
  { name: 'Blerim Krasniqi', team: 'U21', status: 'Në rehabilitim', lastInjury: 'Lëndim i shputës', expectedReturn: '18/09/2026' },
  { name: 'Endrit Gashi', team: 'U19', status: 'I lënduar', lastInjury: 'Grumbullim muskujsh', expectedReturn: '02/10/2026' },
  { name: 'Leart Berisha', team: 'U19', status: 'I lënduar', lastInjury: 'Dëmtim i shpatullës', expectedReturn: '10/10/2026' },
  { name: 'Riad Hoxha', team: 'U17', status: 'Në rehabilitim', lastInjury: 'Përrdredhje e kyçit', expectedReturn: '22/09/2026' },
  { name: 'Arbnor Zeka', team: 'U17', status: 'I lënduar', lastInjury: 'Dëmtim i kofshës', expectedReturn: '30/09/2026' },
  { name: 'Dion Nimani', team: 'U15', status: 'I lënduar', lastInjury: 'Thyerje e dorës', expectedReturn: '15/10/2026' },
];

type Injury = {
  name: string;
  team: string;
  type: string;
  during: string;
  date: string;
  status: string;
  returnDate: string;
  /** The three fields only the detail page shows. */
  serviceDate: string;
  desc: string;
  treatment: string;
};

const INJURIES: Injury[] = [
  { name: 'Driton Demiri', team: 'Ekipi i Parë', type: 'Muskulor', during: 'Ndeshje', date: '18/08/2026', status: 'I lënduar', returnDate: '12/09/2026', serviceDate: '25/08/2026', desc: 'Ndjen dhimbje në kofshën e djathtë', treatment: 'Pushim dhe terapi akulli' },
  { name: 'Enver Mustafa', team: 'Ekipi i Parë', type: 'Kyç', during: 'Stërvitje', date: '11/08/2026', status: 'Në rehabilitim', returnDate: '05/09/2026', serviceDate: '16/08/2026', desc: 'Kyçi i majtë i ënjtur', treatment: 'Fizioterapi çdo ditë' },
  { name: 'Ardit Lapashtica', team: 'Ekipi i Parë', type: 'Gisht', during: 'Stërvitje', date: '04/08/2026', status: 'I lënduar', returnDate: '20/09/2026', serviceDate: '09/08/2026', desc: 'Gishti i unazës i thyer', treatment: 'Imobilizim tre javë' },
  { name: 'Narti Cerkini', team: 'Ekipi i Parë', type: 'Gripi', during: 'Tjetër', date: '27/08/2026', status: 'I lënduar', returnDate: '01/09/2026', serviceDate: '10/09/2026', desc: 'po i shkojn hunet', treatment: 'me pi çaja' },
  { name: 'Blerim Krasniqi', team: 'U21', type: 'Shputë', during: 'Ndeshje', date: '21/07/2026', status: 'Në rehabilitim', returnDate: '18/09/2026', serviceDate: '27/07/2026', desc: 'Dhimbje në shputën e këmbës', treatment: 'Masazh dhe pushim' },
  { name: 'Endrit Gashi', team: 'U19', type: 'Muskulor', during: 'Stërvitje', date: '14/07/2026', status: 'I shëruar', returnDate: '30/07/2026', serviceDate: '18/07/2026', desc: 'Grumbullim muskujsh', treatment: 'Ngrohje dhe shtrirje' },
  { name: 'Leart Berisha', team: 'U19', type: 'Shpatullë', during: 'Ndeshje', date: '07/07/2026', status: 'I lënduar', returnDate: '10/10/2026', serviceDate: '12/07/2026', desc: 'Shpatulla e djathtë e dëmtuar', treatment: 'Fizioterapi dy javë' },
  { name: 'Riad Hoxha', team: 'U17', type: 'Kyç', during: 'Stërvitje', date: '30/06/2026', status: 'Në rehabilitim', returnDate: '22/09/2026', serviceDate: '05/07/2026', desc: 'Përrdredhje e lehtë e kyçit', treatment: 'Fasho dhe pushim' },
  { name: 'Arbnor Zeka', team: 'U17', type: 'Kofshë', during: 'Ndeshje', date: '23/06/2026', status: 'I shëruar', returnDate: '14/07/2026', serviceDate: '28/06/2026', desc: 'Dëmtim i kofshës së pasme', treatment: 'Terapi akulli' },
];

export default function MedicalCardScreen() {
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
                <Text style={styles.title} numberOfLines={1}>
                  Kartela mjeksore
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Statusi shëndetësor i lojtarëve
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
          {/* ── Headline counts ─────────────────────────────────── */}
          {/* Only three, so they share the row instead of scrolling. */}
          <View style={styles.summaryRow}>
            {SUMMARY.map((s) => (
              <View key={s.label} style={styles.sqShadow}>
                <View style={styles.sq}>
                  {/* Frost the canvas grid, then lay a gloss sweep over it. */}
                  <BlurView
                    pointerEvents="none"
                    intensity={22}
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

                  <View style={styles.sqBody}>
                    <Text
                      style={styles.sqLabel}
                      numberOfLines={2}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {s.label}
                    </Text>
                    <Text style={[styles.sqValue, { color: s.tone }]}>{s.value}</Text>
                    <Text style={[styles.sqHint, { color: s.tone }]} numberOfLines={2}>
                      {s.note}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.colPad}>
            {/* ── Lojtarë me probleme mjeksore ──────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.head}>
                <Text style={styles.headText}>Lojtarë me probleme mjeksore</Text>
              </View>
              <View style={styles.headLine} />

              {/* Table — scroll sideways so no column gets squeezed */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={styles.tblInner}
              >
                <View>
                  <View style={styles.tr}>
                    <Text style={[styles.th, styles.thLeft, { width: 110 }]}>Emri</Text>
                    <Text style={[styles.th, { width: 58 }]}>Ekipi</Text>
                    <Text style={[styles.th, { width: 80 }]}>Statusi</Text>
                    <Text style={[styles.th, { width: 102 }]}>Lëndimi i fundit</Text>
                    <Text style={[styles.th, { width: 92 }]}>Kthimi i pritshëm</Text>
                  </View>

                  {PROBLEMS.map((p, i) => (
                    <View key={`${p.name}-${i}`} style={[styles.tr, styles.trBorder]}>
                      <Text
                        style={[styles.tdName, styles.thLeft, { width: 110 }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                      >
                        {p.name}
                      </Text>
                      <Text style={[styles.td, { width: 58 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                        {p.team}
                      </Text>
                      <Text
                        style={[styles.td, styles.tdStatus, { width: 80, color: STATUS_TONE[p.status] ?? C.hint }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                      >
                        {p.status}
                      </Text>
                      <Text style={[styles.td, { width: 102 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                        {p.lastInjury}
                      </Text>
                      <Text style={[styles.td, { width: 92 }]} numberOfLines={1}>
                        {p.expectedReturn}
                      </Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* ── Lëndimet ──────────────────────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.head}>
                <Text style={styles.headText}>Lëndimet</Text>
              </View>
              <View style={styles.headLine} />

              <View style={styles.filters}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Filtro sipas ekipit"
                  style={({ pressed }) => [styles.filterBtn, pressed && styles.pressed]}
                >
                  <Text style={styles.filterText}>{TEAMS[0]}</Text>
                  <MaterialCommunityIcons name="chevron-down" size={I(13)} color={C.text} />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Filtro sipas statusit"
                  style={({ pressed }) => [styles.filterBtn, pressed && styles.pressed]}
                >
                  <Text style={styles.filterText}>{STATUSES[0]}</Text>
                  <MaterialCommunityIcons name="chevron-down" size={I(13)} color={C.text} />
                </Pressable>
              </View>

              {/* Table — scroll sideways so no column gets squeezed */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={styles.tblInner}
              >
                <View>
                  <View style={styles.tr}>
                    <Text style={[styles.th, styles.thLeft, { width: 96 }]}>Lojtari</Text>
                    <Text style={[styles.th, { width: 54 }]}>Ekipi</Text>
                    <Text style={[styles.th, { width: 68 }]}>Lloji</Text>
                    <Text style={[styles.th, { width: 78 }]}>Ndodhi gjatë</Text>
                    <Text style={[styles.th, { width: 64 }]}>Data</Text>
                    <Text style={[styles.th, { width: 70 }]}>Statusi</Text>
                    <Text style={[styles.th, { width: 60 }]}>Kthimi</Text>
                    <View style={{ width: INJ_ACTION_W }} />
                  </View>

                  {INJURIES.map((inj) => (
                    <View key={`${inj.name}-${inj.date}`} style={[styles.tr, styles.trBorder]}>
                      <Text
                        style={[styles.tdName, styles.thLeft, { width: 96 }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                      >
                        {inj.name}
                      </Text>
                      <Text style={[styles.td, { width: 54 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                        {inj.team}
                      </Text>
                      <Text style={[styles.td, { width: 68 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                        {inj.type}
                      </Text>
                      <Text style={[styles.td, { width: 78 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                        {inj.during}
                      </Text>
                      <Text style={[styles.td, { width: 64 }]} numberOfLines={1}>
                        {inj.date}
                      </Text>
                      <Text
                        style={[styles.td, styles.tdStatus, { width: 70, color: STATUS_TONE[inj.status] ?? C.hint }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                      >
                        {inj.status}
                      </Text>
                      <Text style={[styles.td, { width: 60 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                        {inj.returnDate}
                      </Text>
                      <View style={[styles.colAction, { width: INJ_ACTION_W }]}>
                        <Pressable
                          onPress={() =>
                            router.push({
                              pathname: '/detajet-lendimit',
                              params: {
                                name: inj.name,
                                team: inj.team,
                                type: inj.type,
                                during: inj.during,
                                date: inj.date,
                                returnDate: inj.returnDate,
                                serviceDate: inj.serviceDate,
                                desc: inj.desc,
                                treatment: inj.treatment,
                              },
                            })
                          }
                          accessibilityRole="button"
                          accessibilityLabel={`Shiko lëndimin e ${inj.name}`}
                          style={({ pressed }) => [styles.viewBtn, pressed && styles.pressed]}
                        >
                          <Text style={styles.viewBtnText}>Shiko</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
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

    /* ── Headline counts ─────────────────────────────────────── */
    summaryRow: {
      flexDirection: 'row',
      paddingLeft: 27,
      paddingRight: 27,
      paddingTop: 4,
      gap: 8,
    },

    /* Shadow lives on the wrapper: `overflow: hidden` on the pane itself would
       clip it away on iOS. */
    sqShadow: {
      /* Three cards share the row, so each grows to a third of it. */
      flex: 1,
      height: 122,
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
      padding: 11,
    },

    /* Fixed two-line block so all three values sit on the same line. */
    sqLabel: {
      minHeight: 30,
      fontFamily: Fonts.bodyBold,
      fontSize: 12,
      lineHeight: 15,
      color: C.gray,
    },

    sqValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 26,
      lineHeight: 32,
      letterSpacing: -0.5,
      color: C.text,
      marginTop: 4,
    },

    sqHint: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.gray,
      marginTop: 4,
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
      justifyContent: 'center',
      paddingHorizontal: 10,
      paddingVertical: 10,
    },

    headText: {
      textAlign: 'center',
      fontFamily: Fonts.bodyBold,
      fontSize: 15,
      lineHeight: 19,
      color: C.text,
    },

    headLine: {
      height: 1,
      backgroundColor: C.headLine,
    },

    /* ── Filter row ──────────────────────────────────────────── */
    filters: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 4,
      paddingTop: 10,
    },

    filterBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      height: 32,
      paddingHorizontal: 10,
      backgroundColor: C.blue1,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
    },

    filterText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11,
      color: C.text,
    },

    /* ── Tables ──────────────────────────────────────────────── */
    tblInner: {
      paddingHorizontal: 4,
      paddingTop: 6,
      paddingBottom: 4,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 34,
    },

    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    colAction: {
      alignItems: 'flex-end',
    },

    th: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.gray,
      textAlign: 'center',
    },

    thLeft: {
      textAlign: 'left',
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
      textAlign: 'center',
    },

    tdStatus: {
      fontFamily: Fonts.bodySemiBold,
    },

    /* Clear fill, black rim and black label. */
    viewBtn: {
      height: 22,
      paddingHorizontal: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
    },

    viewBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10,
      color: '#000000',
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
