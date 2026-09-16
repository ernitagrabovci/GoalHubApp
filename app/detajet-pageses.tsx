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
 * One payment — opened from "Detajet" on the player's quota table. The row's
 * player and team come in as route params, so the page mirrors the entry it
 * was opened from.
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
  rowLine: 'rgba(100,140,190,0.22)',
  headLine: 'rgba(30,40,35,0.10)',
  /* The trailing quota list sits on the palest card, where the faint rules
     above wash out — its rules go solid black instead. */
  tableLine: 'rgba(0,0,0,0.35)',

  link: '#2F80ED',
  green: '#159447',
  greenBtn: '#16A51D',
  red: '#E03131',
  orange: '#E4A000',

  inputBorder: '#777777',
  /* Fields sit straight on the card, so they show its fill. */
  fieldBg: 'transparent',
  ph: '#A8A8A8',
};

const PAY_METHODS = ['Kesh', 'Transfer bankar', 'Kartë bankare', 'Online'];

/** Left table — labels and the bold values that sit opposite them. */
const PROFILE: [string, string][] = [
  ['Ekipi', 'Ekipi i Parë'],
  ['Pozicioni', 'Sulmues'],
  ['Nr. fanellës', '9'],
  ['Email', 'ardit@goalhub.com'],
  ['Lloji', 'Nxënës/Anëtar'],
  ['Kuota mujore', '$0.00'],
  ['Afati (ditë)', '7'],
  ['Cikli', '-'],
  ['Kontr. fillon', '-'],
  ['Kontr. mbaron', '-'],
];

const STATUS_TONE: Record<string, string> = {
  Paguar: C.green,
  Papaguar: C.orange,
  Skaduar: C.red,
};

type Other = { period: string; amount: string; status: string; due: string };

const OTHER_QUOTAS: Other[] = [
  { period: 'Janar 2027', amount: '$40.00', status: 'Paguar', due: '10/01/2027' },
  { period: 'Shkurt 2027', amount: '$90.00', status: 'Papaguar', due: '10/02/2027' },
  { period: 'Mars 2027', amount: '$90.00', status: 'Skaduar', due: '10/03/2027' },
];


export default function PaymentDetailScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const params = useLocalSearchParams<{ name?: string; team?: string }>();
  const name = params.name ?? '';
  const team = params.team ?? '';

  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [method, setMethod] = useState(PAY_METHODS[0]);
  const [invoice, setInvoice] = useState('');

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
                  {name}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {team} · Sulmues · Periudha 01/02/2026
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
            {/* ── Profile / quota, side by side ─────────────────── */}
            <View style={styles.twoCol}>
              {/* Left — the player's profile */}
              <View style={styles.colCard}>
                <View style={styles.head}>
                  <Text
                    style={styles.headText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    Profili i lojtarit
                  </Text>
                </View>
                <View style={styles.headLine} />

                <View style={styles.pBody}>
                  {PROFILE.map(([label, value]) => (
                    <View key={label} style={styles.pRow}>
                      <Text
                        style={styles.pLabel}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                      >
                        {label}
                      </Text>
                      <Text
                        style={styles.pValue}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.6}
                      >
                        {value}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.pLine} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Shiko profilin e plotë"
                  style={({ pressed }) => [styles.pLinkWrap, pressed && styles.pressed]}
                >
                  <Text style={styles.pLink} numberOfLines={2}>
                    Shiko profilin e plotë
                  </Text>
                </Pressable>
              </View>

              {/* Right — the quota being viewed */}
              <View style={styles.colCard}>
                <View style={styles.head}>
                  <Text
                    style={styles.headText}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    Detajet e kuotës
                  </Text>
                </View>
                <View style={styles.headLine} />

                <View style={styles.qBoxes}>
                  <View style={styles.qBox}>
                    <Text style={styles.qBoxLabel}>Shuma</Text>
                    <Text
                      style={styles.qBoxAmount}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      $40.00
                    </Text>
                  </View>

                  <View style={styles.qBox}>
                    <Text style={styles.qBoxLabel}>Periudha</Text>
                    <Text style={styles.qBoxValue} numberOfLines={1}>
                      01/02/2026
                    </Text>
                  </View>

                  <View style={styles.qBox}>
                    <Text style={styles.qBoxLabel} numberOfLines={1}>
                      Afati i pagesës
                    </Text>
                    <Text
                      style={[styles.qBoxValue, styles.qBoxValueOrange]}
                      numberOfLines={1}
                    >
                      10/02/2026
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ── Register a payment ────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.head}>
                <Text style={styles.headText}>Regjistro pagesën</Text>
              </View>
              <View style={styles.headLine} />

              <View style={styles.form}>
                {/* Date and method share a row, each taking half the form. */}
                <View style={styles.fieldRow}>
                  <View style={styles.fieldCol}>
                    <Text style={styles.formLabel}>Data e pagesës</Text>
                    <View style={styles.clockRow}>
                      <TextInput
                        value={day}
                        onChangeText={setDay}
                        placeholder="DD"
                        placeholderTextColor={C.ph}
                        maxLength={2}
                        keyboardType="number-pad"
                        allowFontScaling={false}
                        style={styles.dateBox}
                      />
                      <Text style={styles.sep}>/</Text>
                      <TextInput
                        value={month}
                        onChangeText={setMonth}
                        placeholder="MM"
                        placeholderTextColor={C.ph}
                        maxLength={2}
                        keyboardType="number-pad"
                        allowFontScaling={false}
                        style={styles.dateBox}
                      />
                      <Text style={styles.sep}>/</Text>
                      <TextInput
                        value={year}
                        onChangeText={setYear}
                        placeholder="YYYY"
                        placeholderTextColor={C.ph}
                        maxLength={4}
                        keyboardType="number-pad"
                        allowFontScaling={false}
                        style={styles.yearBox}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldCol}>
                    <Text style={styles.formLabel}>Metoda e pagesës:</Text>
                    <PSelect value={method} options={PAY_METHODS} onChange={setMethod} />
                  </View>
                </View>

                <Text style={[styles.formLabel, styles.formGap]}>Nr. Fatura:</Text>
                <TextInput
                  value={invoice}
                  onChangeText={setInvoice}
                  allowFontScaling={false}
                  style={styles.input}
                />

                <Text style={[styles.formLabel, styles.formGap]}>Dokumenti i pagesës:</Text>

                {/* Same upload zone as the register-payment popup. */}
                <View style={styles.fileZone}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Ngarko dokumentin e pagesës"
                    style={({ pressed }) => [styles.fileBtn, pressed && styles.pressed]}
                  >
                    <View style={styles.fileCircle}>
                      <MaterialCommunityIcons
                        name="cloud-upload-outline"
                        size={I(22)}
                        color="#FFFFFF"
                      />
                    </View>
                  </Pressable>
                  <Text style={styles.fileHint}>Choose file</Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Regjistro pagesën"
                  style={({ pressed }) => [styles.greenBtn, pressed && styles.pressed]}
                >
                  <Text style={styles.greenBtnText}>Regjistro pagesën</Text>
                </Pressable>
              </View>
            </View>

            {/* ── Other quotas ──────────────────────────────────── */}
            <View style={[styles.card, styles.lightCard]}>
              <View style={styles.head}>
                <Text
                  style={styles.headText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  Kuotat tjera - {name}
                </Text>
              </View>
              <View style={styles.headLineTable} />

              {/* Columns divide the card width, so every row rule runs edge to edge. */}
              <View style={styles.tblInner}>
                <View style={styles.tr}>
                  <Text style={[styles.th, styles.thLeft, styles.cPeriod]}>Periudha</Text>
                  <Text style={[styles.th, styles.cAmount]}>Shuma</Text>
                  <Text style={[styles.th, styles.cStatus]}>Statusi</Text>
                  <Text style={[styles.th, styles.cDue]}>Afati</Text>
                </View>

                {OTHER_QUOTAS.map((q, i) => (
                  <View key={`${q.period}-${i}`} style={[styles.tr, styles.trBorder]}>
                    <Text
                      style={[styles.tdName, styles.thLeft, styles.cPeriod]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      {q.period}
                    </Text>
                    <Text style={[styles.td, styles.cAmount]} numberOfLines={1}>
                      {q.amount}
                    </Text>
                    <Text
                      style={[
                        styles.td,
                        styles.tdStatus,
                        styles.cStatus,
                        { color: STATUS_TONE[q.status] ?? C.hint },
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      {q.status}
                    </Text>
                    <Text style={[styles.td, styles.cDue]} numberOfLines={1}>
                      {q.due}
                    </Text>
                  </View>
                ))}

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Shiko të gjitha"
                  style={({ pressed }) => [styles.allRow, pressed && styles.pressed]}
                >
                  <Text style={styles.allText}>Shiko të gjitha</Text>
                </Pressable>
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

    colCard: {
      flex: 1,
      backgroundColor: C.cardBg,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 7,
      overflow: 'hidden',
    },

    /* The trailing quota list carries no fields, so it stays light throughout. */
    lightCard: {
      backgroundColor: C.headBg,
    },

    /* ── Player profile rows ─────────────────────────────────── */
    pBody: {
      paddingHorizontal: 7,
      paddingVertical: 6,
    },

    pRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      minHeight: 19,
    },

    /* The values run longer than the labels, so they take the bigger share. */
    pLabel: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 9,
      lineHeight: 12,
      color: C.hint,
    },

    pValue: {
      flex: 1.15,
      textAlign: 'right',
      fontFamily: Fonts.bodyBold,
      fontSize: 9,
      lineHeight: 12,
      color: C.text,
    },

    pLine: {
      height: 1,
      backgroundColor: C.rowLine,
    },

    pLinkWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
      paddingVertical: 9,
    },

    pLink: {
      textAlign: 'center',
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10,
      lineHeight: 13,
      color: C.link,
    },

    /* ── Quota boxes ─────────────────────────────────────────── */
    /* Full width, but only as tall as their contents; the trio centres in the
       column rather than stretching to fill it. */
    qBoxes: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 5,
      gap: 10,
    },

    /* Inset from the column so they read as tall, narrow plates. */
    qBox: {
      width: '82%',
      minHeight: 58,
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

    qBoxValue: {
      textAlign: 'center',
      fontFamily: Fonts.bodyBold,
      fontSize: 15,
      lineHeight: 19,
      color: C.text,
      marginTop: 2,
    },

    qBoxValueOrange: {
      color: C.orange,
    },

    /* ── Register form ───────────────────────────────────────── */
    form: {
      paddingHorizontal: 10,
      paddingTop: 9,
      paddingBottom: 12,
    },

    formLabel: {
      fontFamily: Fonts.body,
      fontSize: 10,
      lineHeight: 13,
      color: C.hint,
      marginBottom: 4,
    },

    formGap: {
      marginTop: 12,
    },

    /* Date on the left, payment method on the right. */
    fieldRow: {
      flexDirection: 'row',
      gap: 8,
    },

    fieldCol: {
      flex: 1,
    },

    clockRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    dateBox: {
      width: 32,
      height: 30,
      backgroundColor: C.fieldBg,
      borderWidth: 1,
      borderColor: C.inputBorder,
      borderRadius: 4,
      textAlign: 'center',
      fontFamily: Fonts.body,
      fontSize: 11,
      color: C.text,
    },

    yearBox: {
      width: 52,
      height: 30,
      backgroundColor: C.fieldBg,
      borderWidth: 1,
      borderColor: C.inputBorder,
      borderRadius: 4,
      textAlign: 'center',
      fontFamily: Fonts.body,
      fontSize: 11,
      color: C.text,
    },

    sep: {
      fontFamily: Fonts.body,
      fontSize: 12,
      color: C.hint,
    },

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

    input: {
      height: 31,
      backgroundColor: C.fieldBg,
      borderWidth: 1,
      borderColor: C.inputBorder,
      borderRadius: 4,
      paddingHorizontal: 8,
      fontFamily: Fonts.body,
      fontSize: 11.5,
      color: C.text,
    },

    /* Mirrors the register-payment popup's upload zone, hugging the left edge. */
    fileZone: {
      height: 96,
      alignItems: 'flex-start',
      justifyContent: 'center',
    },

    fileBtn: {
      alignItems: 'center',
    },

    fileCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: C.green,
      alignItems: 'center',
      justifyContent: 'center',
    },

    fileHint: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 15,
      color: C.text,
      marginTop: 8,
    },

    greenBtn: {
      height: 38,
      marginTop: 12,
      borderRadius: 5,
      backgroundColor: C.greenBtn,
      alignItems: 'center',
      justifyContent: 'center',
    },

    greenBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13,
      lineHeight: 16,
      color: '#FFFFFF',
    },

    /* ── Other-quotas table ──────────────────────────────────── */
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

    /* Columns share the card width so nothing overflows and every row rule
       lands on the same edge-to-edge span. */
    cPeriod: {
      flex: 1.5,
    },

    cAmount: {
      flex: 1,
    },

    cStatus: {
      flex: 1.15,
    },

    cDue: {
      flex: 1.35,
    },

    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.tableLine,
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

    tdStatus: {
      fontFamily: Fonts.bodySemiBold,
    },

    allRow: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 11,
      borderTopWidth: 1,
      borderTopColor: C.tableLine,
    },

    allText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 13,
      lineHeight: 16,
      color: C.text,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
