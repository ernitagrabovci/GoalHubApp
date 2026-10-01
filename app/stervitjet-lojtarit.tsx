import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * Stërvitjet — opened from "Stërvitjet" on the player's dashboard. The squad's
 * training schedule: what, when and where, and whether the player turned up.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',

  frame: '#000000',
  headLine: 'rgba(30,40,35,0.10)',
  rowLine: 'rgba(100,140,190,0.22)',

  /* blue2 = the table card's wash. */
  blue2: '#F6FBFF',
};

type ColKey = 'type' | 'when' | 'where' | 'attendance';

const COLS: { key: ColKey; label: string; width: number }[] = [
  { key: 'type', label: 'Lloji', width: 124 },
  { key: 'when', label: 'Data & Ora', width: 128 },
  { key: 'where', label: 'Lokacioni', width: 116 },
  { key: 'attendance', label: 'Prezenca', width: 82 },
];

/* The single row button, plus the gap before it. */
const ACTION_W = 56;

type Session = {
  type: string;
  when: string;
  where: string;
  attendance: string;
  duration: string;
};

const SESSIONS: Session[] = [
  {
    type: 'Trajnim Taktik',
    when: '29 Aug 2026 • 09:00',
    where: 'Fusha Kryesore',
    attendance: 'Prezent',
    duration: '90 min',
  },
  {
    type: 'Kondicionim',
    when: '27 Aug 2026 • 17:30',
    where: 'Fusha 2',
    attendance: 'Prezent',
    duration: '75 min',
  },
  {
    type: 'Teknikë',
    when: '25 Aug 2026 • 09:00',
    where: 'Fusha Kryesore',
    attendance: 'Mungesë',
    duration: '60 min',
  },
  {
    type: 'Fizik',
    when: '23 Aug 2026 • 18:00',
    where: 'Palestra',
    attendance: 'Prezent',
    duration: '60 min',
  },
  {
    type: 'Ndeshje miqësore',
    when: '21 Aug 2026 • 16:00',
    where: 'Fusha Kryesore',
    attendance: 'Prezent',
    duration: '90 min',
  },
  {
    type: 'Taktikë',
    when: '19 Aug 2026 • 09:00',
    where: 'Fusha 2',
    attendance: 'Prezent',
    duration: '75 min',
  },
  {
    type: 'Gjuajtje',
    when: '17 Aug 2026 • 17:30',
    where: 'Fusha Kryesore',
    attendance: 'Mungesë',
    duration: '60 min',
  },
  {
    type: 'Rikuperim',
    when: '15 Aug 2026 • 10:00',
    where: 'Palestra',
    attendance: 'Prezent',
    duration: '45 min',
  },
];

export default function PlayerTrainingsScreen() {
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
                  Stërvitjet
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Orari i stërvitjeve të ekipit tuaj
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
            {/* ── Stërvitjet ────────────────────────────────────── */}
            <View style={styles.card}>
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

                  {SESSIONS.map((s) => (
                    <View key={`${s.type}-${s.when}`} style={[styles.tr, styles.trBorder]}>
                      <Text
                        style={[styles.td, styles.tdType, { width: 124 }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                      >
                        {s.type}
                      </Text>
                      <Text style={[styles.td, { width: 128 }]} numberOfLines={1}>
                        {s.when}
                      </Text>
                      <Text style={[styles.td, { width: 116 }]} numberOfLines={1}>
                        {s.where}
                      </Text>
                      <Text style={[styles.td, { width: 82 }]} numberOfLines={1}>
                        {s.attendance}
                      </Text>

                      {/* Transparent, riding on the row itself. */}
                      <View style={[styles.actions, { width: ACTION_W }]}>
                        <Pressable
                          onPress={() => {
                            const [date, time] = s.when.split(' • ');
                            router.push({
                              pathname: '/stervitja-lojtarit',
                              params: {
                                date,
                                time,
                                field: s.where,
                                type: s.type,
                                duration: s.duration,
                              },
                            });
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Shiko ${s.type}`}
                          style={({ pressed }) => [styles.actView, pressed && styles.pressed]}
                        >
                          <Text style={styles.actViewText}>Shiko</Text>
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

    /* ── Stërvitjet table ────────────────────────────────────── */
    card: {
      marginTop: 14,
      backgroundColor: C.blue2,
      borderWidth: 2,
      borderColor: C.rowLine,
      borderRadius: 7,
      overflow: 'hidden',
    },

    tblInner: {
      paddingHorizontal: 10,
      paddingBottom: 10,
    },

    /* Stretches the rows to the card's width, so the rules run the full width
       instead of stopping where the last column ends. */
    tblFill: {
      flexGrow: 1,
    },

    thRow: {
      paddingTop: 10,
      paddingBottom: 8,
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
      fontSize: 10.5,
      lineHeight: 13,
      color: C.gray,
    },

    td: {
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 14,
      color: C.text,
    },

    tdType: {
      fontFamily: Fonts.bodySemiBold,
    },

    /* Transparent, so the row reads through it. */
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    actView: {
      height: 24,
      paddingHorizontal: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    actViewText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: C.text,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
