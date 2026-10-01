import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * Njoftimet — the financier's own inbox, opened from the bell in the financier
 * home header.
 *
 * Every notice the club sent about the money side, newest first: the headline
 * in bold, who sent it and what happened underneath, and the moment it arrived
 * down the right edge.
 *
 * Mirrors the player's page (njoftimet-lojtarit); keep the two in step.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',

  frame: '#000000',
  headLine: 'rgba(30,40,35,0.10)',
  rowLine: 'rgba(100,140,190,0.22)',

  card: '#F6FBFF',

  green: '#159447',
  blue: '#0766D8',
};

/* Who a notice can come from — each sender reads in its own colour. */
const SENDER_TONE: Record<string, string> = {
  Admini: C.blue,
  Trajneri: C.green,
  Sistemi: C.text,
};

type Notice = {
  title: string;
  sender: string;
  body: string;
  /* Date and time of arrival, as one stamp. */
  stamp: string;
};

const NOTICES: Notice[] = [
  {
    title: 'Pagesa e re u regjistrua',
    sender: 'Admini',
    body: 'Ardit Llapashtica: $40.00 për Janar 2027.',
    stamp: '06/08/2026 04:51',
  },
  {
    title: 'Fatura FAT-2025-0918 u shlye',
    sender: 'Admini',
    body: 'Mergim Berisha, $40.00 me transfer bankar.',
    stamp: '05/08/2026 19:12',
  },
  {
    title: 'Raporti mujor është gati',
    sender: 'Sistemi',
    body: 'Përmbledhja e arkëtimit për Dhjetor 2026.',
    stamp: '04/08/2026 08:00',
  },
  {
    title: 'Kuota e shkurtit mbetet e papaguar',
    sender: 'Sistemi',
    body: '4 anëtarë ende pa paguar.',
    stamp: '03/08/2026 17:20',
  },
  {
    title: 'Kategoria U19 ka 3 vonesa',
    sender: 'Sistemi',
    body: 'Afati kaloi më 10/01/2027.',
    stamp: '01/08/2026 11:05',
  },
  {
    title: 'Buxheti i sezonit u përditësua',
    sender: 'Admini',
    body: 'Totali: $25,230.00 për kategori aktive.',
    stamp: '29/07/2026 09:30',
  },
  {
    title: 'Kujtesë: mbyllja e muajit',
    sender: 'Sistemi',
    body: 'Regjistro pagesat e mbetura para 31/01/2027.',
    stamp: '27/07/2026 14:22',
  },
];

export default function FinancierNotificationsScreen() {
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
                <Text
                  style={styles.title}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  Njoftimet
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Të gjitha njoftimet e marra
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
            {/* ── Received notices ────────────────────────────────── */}
            <View style={styles.card}>
              {NOTICES.map((n, i) => (
                <View
                  key={`${n.title}-${n.stamp}`}
                  style={[styles.tr, i > 0 && styles.trBorder]}
                >
                  {/* Every row is flagged the same way, read or not. */}
                  <View style={styles.dot} />

                  <View style={styles.body}>
                    <Text style={styles.nTitle} numberOfLines={2}>
                      {n.title}
                    </Text>
                    <Text style={styles.nMeta} numberOfLines={2}>
                      <Text style={{ color: SENDER_TONE[n.sender] ?? C.text }}>{n.sender}</Text>
                      {` · ${n.body}`}
                    </Text>
                  </View>

                  <Text style={styles.nStamp} numberOfLines={2}>
                    {n.stamp}
                  </Text>
                </View>
              ))}
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

    /* ── Notices ─────────────────────────────────────────────── */
    card: {
      marginTop: 20,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 5,
      overflow: 'hidden',
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      minHeight: 58,
      paddingHorizontal: 10,
      paddingVertical: 15,
    },

    /* Every row but the first is ruled off from the one above it. */
    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      marginTop: 5,
      backgroundColor: C.frame,
    },

    body: {
      flex: 1,
    },

    nTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.text,
    },

    nMeta: {
      fontFamily: Fonts.body,
      fontSize: 10,
      lineHeight: 13,
      color: C.hint,
      marginTop: 2,
    },

    /* Sits down the right edge, level with the headline. */
    nStamp: {
      width: 82,
      marginTop: 1,
      textAlign: 'right',
      fontFamily: Fonts.body,
      fontSize: 9.5,
      lineHeight: 12,
      color: C.gray,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
