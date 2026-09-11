import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * Cilësimet e njoftimeve — the fourth settings sub-page.
 *
 * Same light #FAFBFA canvas. Three compact stacked cards: platform switches,
 * email statuses and the automation schedule. Dense admin sizing throughout —
 * the rows are ~37px with 8px titles, the switches are 38×17.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',

  card: '#F6FBFF',
  cardBorder: 'rgba(100,140,190,0.30)',
  rowLine: 'rgba(100,140,190,0.22)',
  headLine: 'rgba(100,140,190,0.25)',

  on: '#08A600',
  off: '#B8BEC1',

  dotGreen: '#08A600',
  dotYellow: '#E5B600',
  dotGray: '#8B8F91',
  dotBlue: '#4D8FA8',
};

type Pref = { key: string; title: string; desc: string };

const PLATFORM_PREFS: Pref[] = [
  {
    key: 'injury',
    title: 'Lëndim i regjistruar',
    desc: 'Njofton administratorin kur trajneri regjistron lëndim',
  },
  {
    key: 'overdueFee',
    title: 'Kuotë e vonuar',
    desc: 'Njofton kur kuota e anëtarësisë kalon afatin',
  },
  {
    key: 'criticalFee',
    title: 'Kuotë kritike (>30 ditë)',
    desc: 'Njofton kur kuota kalon >30 ditë pa pagesë',
  },
  {
    key: 'attendance',
    title: 'Konfirmim prezence',
    desc: 'Njofton trajnerin kur lojtarët konfirmojnë prezencën',
  },
  {
    key: 'newMessage',
    title: 'Mesazh i ri',
    desc: 'Njofton kur arrin mesazh të ri',
  },
  {
    key: 'upcomingMatch',
    title: 'Ndeshje e afërt (24h)',
    desc: 'Njofton klubin 24 orë para ndeshjes',
  },
];

const INITIAL_PREFS: Record<string, boolean> = {
  injury: true,
  overdueFee: true,
  criticalFee: true,
  attendance: false,
  newMessage: true,
  upcomingMatch: true,
};

type EmailRow = { title: string; desc: string; active: boolean };

const EMAIL_ROWS: EmailRow[] = [
  { title: 'Email mirëseardhje', desc: 'Pas regjistrimit të llogarisë', active: true },
  { title: 'Email kuotë të vonuar', desc: 'Kur kuota kalon afatin e pagesës', active: true },
  { title: 'Email faturë e krijuar', desc: 'Kur krijohet faturë e re', active: false },
  { title: 'Email rivendosje fjalëkalimi', desc: 'Automatikisht nga sistemi', active: true },
];

type Automation = { title: string; time: string; dot: string };

const AUTOMATIONS: Automation[] = [
  { title: 'Përditëso statusin e kuotave', time: 'Çdo ditë – 00:01', dot: C.dotGreen },
  { title: 'Njoftime kuota kritike', time: 'Çdo e hënë – 09:00', dot: C.dotYellow },
  { title: 'Pastro njoftimet e vjetra', time: 'Çdo e hënë – 09:00', dot: C.dotGray },
  { title: 'Backup i të dhënave', time: 'Çdo natë – 02:00', dot: C.dotBlue },
];

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.cardHeadText}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function Toggle({ on, onPress }: { on: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      style={({ pressed }) => [
        styles.toggle,
        { backgroundColor: on ? C.on : C.off },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.knob, on ? styles.knobOn : styles.knobOff]} />
    </Pressable>
  );
}

function NotificationRow({
  title,
  desc,
  on,
  onToggle,
  last,
}: {
  title: string;
  desc: string;
  on: boolean;
  onToggle: () => void;
  last: boolean;
}) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDesc}>{desc}</Text>
      </View>
      <Toggle on={on} onPress={onToggle} />
    </View>
  );
}

function StatusRow({
  title,
  desc,
  active,
  last,
}: {
  title: string;
  desc: string;
  active: boolean;
  last: boolean;
}) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDesc}>{desc}</Text>
      </View>
      <View style={[styles.pill, { backgroundColor: active ? C.on : C.off }]}>
        <Text style={styles.pillText}>{active ? 'Aktiv' : 'Joaktiv'}</Text>
      </View>
    </View>
  );
}

function AutomationRow({
  title,
  time,
  dot,
  last,
}: {
  title: string;
  time: string;
  dot: string;
  last: boolean;
}) {
  return (
    <View style={[styles.row, styles.autoRow, last && styles.rowLast]}>
      <View style={styles.autoLeft}>
        <View style={[styles.dot, { backgroundColor: dot }]} />
        <Text style={styles.autoTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>
      <Text style={styles.autoTime}>{time}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const [prefs, setPrefs] = useState<Record<string, boolean>>(INITIAL_PREFS);
  const toggle = (key: string) => setPrefs((p) => ({ ...p, [key]: !p[key] }));

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
                <Text style={styles.title}>Cilësimet e njoftimeve</Text>
                <Text style={styles.subtitle}>Menaxho njoftimet dhe email-et automatike</Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.colPad}>
            {/* ── Njoftimet e platformës ───────────────────────── */}
            <Card title="Njoftimet e platformës">
              <Text style={styles.cardDesc}>
                Njoftimet automatike që dërgohen brenda platformës.
              </Text>

              <View style={styles.rows}>
                {PLATFORM_PREFS.map((p, i) => (
                  <NotificationRow
                    key={p.key}
                    title={p.title}
                    desc={p.desc}
                    on={prefs[p.key]}
                    onToggle={() => toggle(p.key)}
                    last={i === PLATFORM_PREFS.length - 1}
                  />
                ))}
              </View>

              <View style={styles.saveWrap}>
                <Pressable
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed]}
                >
                  <Text style={styles.saveBtnText}>Ruaj preferencat</Text>
                </Pressable>
              </View>
            </Card>

            {/* ── Njoftimet me email ───────────────────────────── */}
            <Card title="Njoftimet me email">
              <Text style={styles.cardDesc}>Email-et automatike dërgohen nga sistemi.</Text>

              <View style={styles.rows}>
                {EMAIL_ROWS.map((r, i) => (
                  <StatusRow
                    key={r.title}
                    title={r.title}
                    desc={r.desc}
                    active={r.active}
                    last={i === EMAIL_ROWS.length - 1}
                  />
                ))}
              </View>
            </Card>

            {/* ── Orari i automatizimeve ───────────────────────── */}
            <Card title="Orari i automatizimeve">
              <Text style={styles.cardDesc}>Detyrat automatike që ekzekutohen nga sistemi.</Text>

              <View style={styles.rows}>
                {AUTOMATIONS.map((a, i) => (
                  <AutomationRow
                    key={a.title}
                    title={a.title}
                    time={a.time}
                    dot={a.dot}
                    last={i === AUTOMATIONS.length - 1}
                  />
                ))}
              </View>
            </Card>
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
      paddingBottom: 8,
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

    /* ── Card ────────────────────────────────────────────────── */
    card: {
      marginTop: 12,
      backgroundColor: C.card,
      borderWidth: 2,
      borderColor: C.cardBorder,
      borderRadius: 8,
    },

    cardHead: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
    },

    cardHeadText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 16,
      lineHeight: 20,
      letterSpacing: -0.2,
      color: C.text,
    },

    cardDesc: {
      paddingHorizontal: 16,
      paddingTop: 13,
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 16,
      color: C.gray,
    },

    /* ── Rows ────────────────────────────────────────────────── */
    rows: {
      paddingHorizontal: 16,
    },

    row: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 58,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: C.rowLine,
    },

    rowLast: {
      borderBottomWidth: 0,
    },

    rowText: {
      flex: 1,
      paddingRight: 10,
    },

    rowTitle: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 14,
      lineHeight: 18,
      letterSpacing: -0.2,
      color: C.text,
    },

    rowDesc: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 16,
      color: C.gray,
      marginTop: 1,
    },

    /* ── Switch ──────────────────────────────────────────────── */
    toggle: {
      width: 44,
      height: 24,
      borderRadius: 999,
      justifyContent: 'center',
    },

    knob: {
      position: 'absolute',
      top: 3,
      width: 18,
      height: 18,
      borderRadius: 999,
      backgroundColor: '#FFFFFF',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1,
      elevation: 2,
    },

    knobOn: {
      right: 3,
    },

    knobOff: {
      left: 3,
    },

    /* ── Email status pill ───────────────────────────────────── */
    pill: {
      width: 50,
      height: 24,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
    },

    pillText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11,
      lineHeight: 13,
      color: '#FFFFFF',
    },

    /* ── Automation row ──────────────────────────────────────── */
    autoRow: {
      minHeight: 52,
    },

    autoLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingRight: 10,
    },

    dot: {
      width: 7,
      height: 7,
      borderRadius: 999,
    },

    autoTitle: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 14,
      lineHeight: 18,
      letterSpacing: -0.2,
      color: C.text,
    },

    autoTime: {
      fontFamily: Fonts.body,
      fontSize: 13,
      lineHeight: 17,
      color: C.gray,
    },

    /* ── Save button ─────────────────────────────────────────── */
    saveWrap: {
      paddingHorizontal: 16,
      paddingTop: 13,
      paddingBottom: 15,
    },

    saveBtn: {
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.on,
      borderRadius: 3,
    },

    saveBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 14,
      lineHeight: 17,
      color: '#FFFFFF',
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
