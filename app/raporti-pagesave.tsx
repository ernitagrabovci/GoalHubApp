import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * Club-wide payment report — opened from "Vazhdo" on the Raporti card in the
 * Pagesat tab. A month selector sits beside the running totals, over a
 * twelve-month breakdown.
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
  tableLine: 'rgba(0,0,0,0.35)',

  green: '#159447',
  red: '#E03131',

  inputBorder: '#777777',
  /* Fields sit straight on the card, so they show its fill. */
  fieldBg: 'transparent',
  ph: '#A8A8A8',
};

/** The season's billing months, newest first. */
const MONTHS = [
  'Shtator 2026',
  'Tetor 2026',
  'Nëntor 2026',
  'Dhjetor 2026',
  'Janar 2027',
  'Shkurt 2027',
  'Mars 2027',
];

type Month = { month: string; collected: string; pending: string };

/** The twelve rows sum to the totals shown on the right-hand card. */
const MONTHLY: Month[] = [
  { month: 'Shtator 2026', collected: '$1.850.00', pending: '$620.00' },
  { month: 'Gusht 2026', collected: '$1.720.00', pending: '$540.00' },
  { month: 'Korrik 2026', collected: '$1.480.00', pending: '$380.00' },
  { month: 'Qershor 2026', collected: '$1.360.00', pending: '$420.00' },
  { month: 'Maj 2026', collected: '$1.510.00', pending: '$610.00' },
  { month: 'Prill 2026', collected: '$1.430.00', pending: '$520.00' },
  { month: 'Mars 2026', collected: '$1.390.00', pending: '$700.00' },
  { month: 'Shkurt 2026', collected: '$1.320.00', pending: '$760.00' },
  { month: 'Janar 2026', collected: '$1.240.00', pending: '$830.00' },
  { month: 'Dhjetor 2025', collected: '$1.180.00', pending: '$920.00' },
  { month: 'Nëntor 2025', collected: '$1.190.00', pending: '$1.130.00' },
  { month: 'Tetor 2025', collected: '$1.170.00', pending: '$1.160.00' },
];

export default function PaymentReportScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const [month, setMonth] = useState(MONTHS[0]);

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
                  Raporti i pagesave
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Përmbledhje e kuotave të mbledhura
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
            {/* ── Month picker / totals, side by side ───────────── */}
            <View style={styles.twoCol}>
              {/* Left — the selected month */}
              <View style={styles.colCard}>
                <View style={styles.head}>
                  <Text
                    style={styles.headText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    Raporti mujor
                  </Text>
                </View>
                <View style={styles.headLine} />

                <View style={styles.mBody}>
                  <Text style={styles.mLabel}>Muaji:</Text>
                  <PSelect value={month} options={MONTHS} onChange={setMonth} />

                  <View style={styles.mBoxes}>
                    <View style={styles.qBox}>
                      <Text
                        style={styles.qBoxLabel}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                      >
                        Pagesa të mbledhura
                      </Text>
                      <Text
                        style={styles.qBoxAmount}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.6}
                      >
                        $40.00
                      </Text>
                    </View>

                    <View style={styles.qBox}>
                      <Text
                        style={styles.qBoxLabel}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                      >
                        Pagesa në pritje
                      </Text>
                      <Text
                        style={[styles.qBoxAmount, styles.qBoxRed]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.6}
                      >
                        $30.00
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Right — the running totals */}
              <View style={styles.colCard}>
                <View style={styles.head}>
                  <Text
                    style={styles.headText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    Gjithsej
                  </Text>
                </View>
                <View style={styles.headLine} />

                <View style={styles.tBody}>
                  <View style={styles.qBox}>
                    <Text
                      style={styles.qBoxLabel}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.75}
                    >
                      Gjithsej të mbledhura
                    </Text>
                    <Text
                      style={styles.qBoxAmount}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.5}
                    >
                      $16.840.00
                    </Text>
                  </View>

                  <View style={styles.qBox}>
                    <Text
                      style={styles.qBoxLabel}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.75}
                    >
                      Gjithsej në pritje
                    </Text>
                    <Text
                      style={[styles.qBoxAmount, styles.qBoxRed]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.5}
                    >
                      $8.590.00
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ── Twelve-month detail ───────────────────────────── */}
            <View style={[styles.card, styles.lightCard]}>
              <View style={styles.head}>
                <Text
                  style={styles.headText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  Detaje mujore - 12 muajt e fundit
                </Text>
              </View>
              <View style={styles.headLineTable} />

              {/* Columns divide the card width, so every row rule runs edge to edge. */}
              <View style={styles.tblInner}>
                <View style={styles.tr}>
                  <Text style={[styles.th, styles.thLeft, styles.cMonth]}>Muaji</Text>
                  <Text style={[styles.th, styles.cCollected]}>Të mbledhura</Text>
                  <Text style={[styles.th, styles.cPending]}>Në pritje</Text>
                </View>

                {MONTHLY.map((m) => (
                  <View key={m.month} style={[styles.tr, styles.trBorder]}>
                    <Text
                      style={[styles.tdName, styles.thLeft, styles.cMonth]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      {m.month}
                    </Text>
                    <Text
                      style={[styles.td, styles.tdCollected, styles.cCollected]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      {m.collected}
                    </Text>
                    <Text
                      style={[styles.td, styles.tdPending, styles.cPending]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      {m.pending}
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
/* In-flow dropdown                                                    */
/* ------------------------------------------------------------------ */

/** The options open directly under the field. */
function PSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        style={({ pressed }) => [styles.sel, pressed && styles.pressed]}
      >
        <Text style={styles.selText} numberOfLines={1}>
          {value}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={I(11)} color="#777777" />
      </Pressable>
      {open ? (
        <View style={styles.opts}>
          {options.map((o) => {
            const active = o === value;
            return (
              <Pressable
                key={o}
                onPress={() => {
                  onChange(o);
                  setOpen(false);
                }}
                style={[styles.opt, active && styles.optActive]}
              >
                <Text style={[styles.optText, active && styles.optTextActive]} numberOfLines={1}>
                  {o}
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

    /* Same rule, but for the pale trailing card where C.headLine disappears. */
    headLineTable: {
      height: 1,
      backgroundColor: C.tableLine,
    },

    /* ── Two columns ─────────────────────────────────────────── */
    twoCol: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },

    /* Both cards stretch to the taller one, so the pair reads as a set. */
    colCard: {
      flex: 1,
      backgroundColor: C.cardBg,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 7,
      overflow: 'hidden',
    },

    /* The trailing month list carries no fields, so it stays light throughout. */
    lightCard: {
      backgroundColor: C.headBg,
    },

    /* ── Month picker column ─────────────────────────────────── */
    mBody: {
      paddingHorizontal: 9,
      paddingTop: 6,
      paddingBottom: 8,
    },

    mLabel: {
      fontFamily: Fonts.body,
      fontSize: 10,
      lineHeight: 13,
      color: C.hint,
      marginBottom: 4,
    },

    mBoxes: {
      marginTop: 10,
      alignItems: 'center',
      gap: 8,
    },

    /* ── Totals column ───────────────────────────────────────── */
    tBody: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 8,
      gap: 8,
    },

    /* Inset from the column so they read as tall, narrow plates. */
    qBox: {
      width: '82%',
      minHeight: 56,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 5,
      alignItems: 'center',
      justifyContent: 'center',
    },

    qBoxLabel: {
      textAlign: 'center',
      fontFamily: Fonts.body,
      fontSize: 9,
      lineHeight: 12,
      color: C.hint,
    },

    qBoxAmount: {
      textAlign: 'center',
      fontFamily: Fonts.bodyBold,
      fontSize: 24,
      lineHeight: 28,
      color: C.green,
      marginTop: 1,
    },

    qBoxRed: {
      color: C.red,
    },

    /* ── Month detail table ──────────────────────────────────── */
    /* No horizontal padding here: the row rule is drawn on the row itself, so
       the gutter has to live inside `tr` for the line to reach the card edge. */
    tblInner: {
      paddingTop: 6,
      paddingBottom: 4,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      minHeight: 32,
    },

    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.tableLine,
    },

    /* Columns share the card width so nothing overflows and every row rule
       lands on the same edge-to-edge span. */
    cMonth: {
      flex: 1.3,
    },

    cCollected: {
      flex: 1.15,
    },

    cPending: {
      flex: 1,
    },

    th: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      lineHeight: 15,
      color: C.gray,
      textAlign: 'center',
    },

    thLeft: {
      textAlign: 'left',
    },

    tdName: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 15,
      color: C.text,
    },

    td: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 15,
      color: C.hint,
      textAlign: 'center',
    },

    /* Colour ties each column back to its box on the cards above. */
    tdCollected: {
      fontFamily: Fonts.bodySemiBold,
      color: C.green,
    },

    tdPending: {
      fontFamily: Fonts.bodySemiBold,
      color: C.red,
    },

    /* ── Dropdown ────────────────────────────────────────────── */
    sel: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 31,
      gap: 4,
      paddingHorizontal: 8,
      backgroundColor: C.fieldBg,
      borderWidth: 1,
      borderColor: C.inputBorder,
      borderRadius: 4,
    },

    selText: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 11.5,
      color: C.text,
    },

    opts: {
      marginTop: 3,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: C.inputBorder,
      borderRadius: 4,
      overflow: 'hidden',
    },

    opt: {
      height: 25,
      justifyContent: 'center',
      paddingHorizontal: 8,
    },

    optActive: {
      backgroundColor: 'rgba(22,165,29,0.10)',
    },

    optText: {
      fontFamily: Fonts.body,
      fontSize: 10,
      color: C.text,
    },

    optTextActive: {
      fontFamily: Fonts.bodySemiBold,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
