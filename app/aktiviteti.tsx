import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * Aktiviteti — opened from "Vazhdo" on the Aktiviteti card over on the users
 * list. Two logs of what the club's accounts have been doing.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',

  cardBg: '#E3EEFB',
  headBg: '#F6FBFF',
  frame: '#000000',
  headLine: 'rgba(30,40,35,0.10)',
  rowLine: 'rgba(100,140,190,0.22)',

  green: '#159447',
  orange: '#E4A000',
  blue: '#2F80ED',
};

/* ── The two logs ──────────────────────────────────────────────────── */

type Entry = {
  name: string;
  role: string;
  action: string;
  time: string;
  /** Tint of the dot that leads each row — the account's role. */
  tone: string;
};

const RECENT_LOGINS: Entry[] = [
  {
    name: 'Admin GoalHub',
    role: 'Administrator',
    action: 'Hyrje në sistem',
    time: '3 orë më parë',
    tone: C.green,
  },
  {
    name: 'Regjep Hyseni',
    role: 'Trajner Kryesor',
    action: 'Hyrje në sistem',
    time: '5 orë më parë',
    tone: C.green,
  },
  {
    name: 'Besnik Gashi',
    role: 'Prind',
    action: 'Hyrje në sistem',
    time: '7 orë më parë',
    tone: C.blue,
  },
  {
    name: 'Arben Krasniqi',
    role: 'Administrator',
    action: 'Hyrje në sistem',
    time: 'Dje, 21:14',
    tone: C.green,
  },
  {
    name: 'Drita Berisha',
    role: 'Trajner',
    action: 'Hyrje në sistem',
    time: 'Dje, 18:02',
    tone: C.green,
  },
  {
    name: 'Kastriot Avdiu',
    role: 'Lojtar',
    action: 'Hyrje në sistem',
    time: 'Dje, 16:40',
    tone: C.orange,
  },
];

const NEW_ACCOUNTS: Entry[] = [
  {
    name: 'Endrit Hoxha',
    role: 'Lojtar',
    action: 'Llogari e re',
    time: '2 ditë më parë',
    tone: C.orange,
  },
  {
    name: 'Luan Gashi',
    role: 'Financier',
    action: 'Llogari e re',
    time: '4 ditë më parë',
    tone: C.blue,
  },
  {
    name: 'Fatime Morina',
    role: 'Prind',
    action: 'Llogari e re',
    time: '1 javë më parë',
    tone: C.blue,
  },
  {
    name: 'Valon Dema',
    role: 'Trajner',
    action: 'Llogari e re',
    time: '2 javë më parë',
    tone: C.green,
  },
];

/** One log line: tinted dot, who and what, then when. */
function ActivityRow({ entry, pill }: { entry: Entry; pill?: boolean }) {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: entry.tone }]} />

      <View style={styles.rowText}>
        <Text style={styles.rowName} numberOfLines={1}>
          {entry.name}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {entry.role} · {entry.action}
        </Text>
      </View>

      {pill ? (
        <View style={styles.pill}>
          <Text style={styles.pillText}>Aktiv</Text>
        </View>
      ) : null}

      <Text style={styles.rowTime} numberOfLines={1}>
        {entry.time}
      </Text>
    </View>
  );
}

export default function ActivityScreen() {
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
                  Aktiviteti
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Historiku i hyrjeve dhe veprimeve të përdoruesve
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
            {/* ── Recent logins ─────────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.head}>
                <Text style={styles.headText} numberOfLines={1}>
                  Hyrjet e fundit
                </Text>
              </View>
              <View style={styles.headLine} />

              {RECENT_LOGINS.map((e, index) => (
                <View key={e.name} style={index > 0 ? styles.rowBorder : null}>
                  <ActivityRow entry={e} />
                </View>
              ))}
            </View>

            {/* ── New accounts ──────────────────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.head}>
                <Text style={styles.headText} numberOfLines={1}>
                  Llogaritë e reja
                </Text>
              </View>
              <View style={styles.headLine} />

              {NEW_ACCOUNTS.map((e, index) => (
                <View key={e.name} style={index > 0 ? styles.rowBorder : null}>
                  <ActivityRow entry={e} pill />
                </View>
              ))}

              <Pressable
                onPress={() => router.push('/perdoruesit')}
                accessibilityRole="button"
                accessibilityLabel="Shiko të gjithë përdoruesit"
                style={({ pressed }) => [styles.footer, pressed && styles.pressed]}
              >
                <Text style={styles.footerText}>Shiko të gjithë përdoruesit</Text>
                <MaterialCommunityIcons name="arrow-right" size={I(16)} color={C.text} />
              </Pressable>
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
      marginTop: 6,
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

    headText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 15,
      lineHeight: 19,
      color: C.text,
    },

    headLine: {
      height: 1,
      backgroundColor: C.headLine,
    },

    /* ── Log rows ────────────────────────────────────────────── */
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: 54,
      paddingHorizontal: 12,
    },

    rowBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    /* Centred against the two text lines by the row's own alignment. */
    dot: {
      width: 9,
      height: 9,
      borderRadius: 5,
    },

    rowText: {
      flex: 1,
    },

    rowName: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.text,
    },

    rowMeta: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 14,
      color: C.hint,
      marginTop: 1,
    },

    pill: {
      borderRadius: 10,
      paddingHorizontal: 9,
      paddingVertical: 3,
      backgroundColor: C.green,
    },

    pillText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 9.5,
      lineHeight: 12,
      color: '#FFFFFF',
    },

    rowTime: {
      minWidth: 76,
      textAlign: 'right',
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 14,
      color: C.gray,
    },

    /* ── Footer link ─────────────────────────────────────────── */
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      minHeight: 48,
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    footerText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12.5,
      color: C.text,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
