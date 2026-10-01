import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * One membership quota — opened from "Shiko" on the financier's Kuotat e
 * anëtarësisë list. The row's own values come in as route params, so the page
 * always mirrors the entry it was opened from.
 *
 * Only settled rows offer "Shiko", so the foot of the page always reads as a
 * completed payment.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',

  /* Cards are two-tone: a lighter title strip over a deeper body. */
  cardBg: '#E3EEFB',
  headBg: '#F6FBFF',
  frame: '#000000',
  headLine: 'rgba(30,40,35,0.10)',

  green: '#159447',
  red: '#E03131',
  orange: '#E4A000',
};

const STATUS_TONE: Record<string, string> = {
  Paguar: C.green,
  Papaguar: C.orange,
  Skaduar: C.red,
};

/* When the payment was registered. */
const PAID_AT = '2025-09-08 00:00:00';

export default function FinancierPaymentDetailScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const params = useLocalSearchParams<{
    name?: string;
    team?: string;
    period?: string;
    amount?: string;
    due?: string;
    status?: string;
  }>();

  const name = params.name ?? 'Luan Jashari';
  const team = params.team ?? 'Ekipi i Parë';
  const period = params.period ?? 'Janar 2027';
  const amount = params.amount ?? '$40.00';
  const due = params.due ?? '10/01/2027';
  const status = params.status ?? 'Paguar';

  const tone = STATUS_TONE[status] ?? C.green;

  /* Labels down the left, this quota's own values opposite them. */
  const DETAILS: [string, string][] = [
    ['Lojtari', name],
    ['Ekipi', team],
    ['Periudha', period],
    ['Shuma', amount],
    ['Afati', due],
    ['Statusi', status],
    ['Data e pagesës', PAID_AT],
    ['Metoda', 'Kesh'],
    ['Nr. faturës', 'FAT-2025-0918'],
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
                  {`Kuota - ${name}`}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Detajet e pagesës
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
            {/* ── Detajet ───────────────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.head}>
                <Text
                  style={styles.headText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  Detajet
                </Text>
              </View>
              <View style={styles.headLine} />

              <View style={styles.body}>
                {DETAILS.map(([label, value]) => {
                  const isStatus = label === 'Statusi';

                  return (
                    <View key={label} style={styles.dRow}>
                      <Text
                        style={styles.dLabel}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                      >
                        {label}
                      </Text>
                      <Text
                        style={[styles.dValue, isStatus && { color: tone }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.6}
                      >
                        {value}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* ── Payment settled ───────────────────────────────── */}
            <View style={styles.doneCard}>
              <View style={styles.doneCircle}>
                <MaterialCommunityIcons name="check-bold" size={I(30)} color="#FFFFFF" />
              </View>

              <Text style={[styles.doneStatus, { color: tone }]} numberOfLines={1}>
                {status}
              </Text>

              <Text style={styles.doneStamp} numberOfLines={1}>
                {PAID_AT}
              </Text>
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

    /* ── Card shell ──────────────────────────────────────────── */
    card: {
      marginTop: 14,
      backgroundColor: C.cardBg,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 7,
      overflow: 'hidden',
    },

    /* Lighter than the card body, so the title reads as its own strip. */
    head: {
      backgroundColor: C.headBg,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
      paddingVertical: 9,
    },

    headText: {
      textAlign: 'center',
      fontFamily: Fonts.bodyBold,
      fontSize: 14,
      lineHeight: 18,
      color: C.text,
    },

    headLine: {
      height: 1,
      backgroundColor: C.headLine,
    },

    /* ── Detail rows ─────────────────────────────────────────── */
    body: {
      paddingHorizontal: 11,
      paddingVertical: 8,
    },

    dRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      minHeight: 26,
    },

    /* The values run longer than the labels, so they take the bigger share. */
    dLabel: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 14,
      color: C.hint,
    },

    dValue: {
      flex: 1.25,
      textAlign: 'right',
      fontFamily: Fonts.bodyBold,
      fontSize: 11,
      lineHeight: 14,
      color: C.text,
    },

    /* ── Settled ─────────────────────────────────────────────── */
    /* Badge, verdict and stamp all sit inside the one blue plate. */
    doneCard: {
      marginTop: 14,
      paddingVertical: 18,
      backgroundColor: C.cardBg,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 7,
      alignItems: 'center',
      justifyContent: 'center',
    },

    doneCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: C.green,
      alignItems: 'center',
      justifyContent: 'center',
    },

    doneStatus: {
      marginTop: 12,
      textAlign: 'center',
      fontFamily: Fonts.bodyBold,
      fontSize: 18,
      lineHeight: 22,
    },

    doneStamp: {
      marginTop: 3,
      textAlign: 'center',
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 16,
      color: C.text,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
