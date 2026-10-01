import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * Prezenca — the child's attendance, opened from the "Prezenca" card on the
 * child's page.
 *
 * Read-only for a parent: one table of the season's trainings with how the
 * child was marked at each.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',

  /* The card's pale blue wash and its blue rim. */
  blue2: '#F6FBFF',
  border: 'rgba(100,140,190,0.30)',
  rowLine: 'rgba(100,140,190,0.22)',
  headLine: 'rgba(30,40,35,0.10)',

  green: '#159447',
  red: '#E03131',
};

/* How a training can be marked, each reading in its own colour. */
const TONE: Record<string, string> = {
  Prezent: C.green,
  Mungesë: C.red,
  'Pa status': C.gray,
};

type Session = {
  type: string;
  date: string;
  status: string;
};

const SESSIONS: Session[] = [
  { type: 'Trajnim Taktik', date: '12/08/2026', status: 'Prezent' },
  { type: 'Kondicionim Fizik', date: '11/08/2026', status: 'Prezent' },
  { type: 'Trajnim Teknik', date: '09/08/2026', status: 'Mungesë' },
  { type: 'Ndeshje Kontrolli', date: '07/08/2026', status: 'Prezent' },
  { type: 'Trajnim Taktik', date: '05/08/2026', status: 'Prezent' },
  { type: 'Pushim Aktiv', date: '03/08/2026', status: 'Pa status' },
  { type: 'Kondicionim Fizik', date: '01/08/2026', status: 'Prezent' },
  { type: 'Trajnim Teknik', date: '30/07/2026', status: 'Prezent' },
];

export default function ChildAttendanceScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const params = useLocalSearchParams<{ name?: string }>();
  const name = params.name ?? 'Agon Gashi';

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
                  {`Prezenca e ${name}`}
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
            {/* ── Stërvitjet dhe prania ─────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.tblInner}>
                <View style={[styles.tr, styles.thRow]}>
                  <Text style={[styles.th, styles.colType]} numberOfLines={1}>
                    Stërvitja
                  </Text>
                  <Text style={[styles.th, styles.colDate]} numberOfLines={1}>
                    Data
                  </Text>
                  <Text style={[styles.th, styles.colStatus]} numberOfLines={1}>
                    Statusi
                  </Text>
                </View>

                {SESSIONS.map((s) => (
                  <View key={`${s.type}-${s.date}`} style={[styles.tr, styles.trBorder]}>
                    <Text
                      style={[styles.td, styles.colType, styles.tdStrong]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      {s.type}
                    </Text>
                    <Text style={[styles.td, styles.colDate]} numberOfLines={1}>
                      {s.date}
                    </Text>
                    <Text
                      style={[
                        styles.td,
                        styles.colStatus,
                        styles.tdStrong,
                        { color: TONE[s.status] ?? C.text },
                      ]}
                      numberOfLines={1}
                    >
                      {s.status}
                    </Text>
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

    /* ── Table ───────────────────────────────────────────────── */
    card: {
      marginTop: 14,
      backgroundColor: C.blue2,
      borderWidth: 2,
      borderColor: C.border,
      borderRadius: 7,
      overflow: 'hidden',
    },

    /* Keeps the rules clear of the card's rim. */
    tblInner: {
      paddingHorizontal: 10,
      paddingBottom: 8,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 2,
      minHeight: 42,
    },

    thRow: {
      paddingTop: 9,
      paddingBottom: 7,
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
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
      color: C.gray,
      textAlign: 'center',
    },

    tdStrong: {
      fontFamily: Fonts.bodyBold,
      color: C.text,
    },

    colType: {
      flex: 1.6,
    },

    colDate: {
      flex: 1,
    },

    colStatus: {
      flex: 1,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
