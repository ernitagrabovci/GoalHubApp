import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { BlurView } from 'expo-blur';
import {
  Animated,
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
 * Sezoni — page opened from the club profile's "Sezoni" card. Same visual
 * language as the dashboards/competitions: #FAFBFA canvas, light-blue cards,
 * compact grids. Shows a competition selector + "new season" control, the
 * current season card (info grid, statistics, win-rate bar) and the season
 * history card with per-season actions.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',
  card: '#F6FBFF',
  border: 'rgba(100,140,190,0.30)',
  headLine: 'rgba(30,40,35,0.10)',
  text: '#111111',
  title: '#050505',
  gray: '#737373',
  label: '#666666',
  selectBorder: '#777777',
  mint: '#DCEEE8',
  mintBorder: '#7A9B91',
  blue: '#1749B8',
  green: '#059A55',
  barGreen: '#05A85A',
  barGray: '#A8A8A8',
  orange: '#E4A000',
  red: '#C90000',
  fshiBorder: '#F05252',
  aktivBorder: '#28B889',
  white: '#FFFFFF',
};

const DIVIDER = 'rgba(30,40,35,0.10)';

/* Create-season modal palette (matches the reference popup) */
const MO = {
  card: '#F7FAFA',
  border: '#079B58',
  divider: '#39B887',
  warn: '#EBA748',
  inputBg: '#FAFCFC',
  fieldBorder: '#777777',
  label: '#666666',
  text: '#080808',
  cancel: '#ED5050',
  create: '#14A51C',
  white: '#FFFFFF',
  selBorder: '#999999',
  selOn: '#079B58',
  err: '#C90000',
};

const COMP_OPTIONS = [
  { name: 'Kupa e Kosovës', tag: 'Kupë' },
  { name: 'Liga e Dytë e Kosovës', tag: 'Ligë' },
  { name: 'Ndeshje Miqësore', tag: 'Miqësore' },
  { name: 'Superliga e Kosovës', tag: 'Ligë' },
];

type Stat = { label: string; value: string; color: string };

const STATS: Stat[] = [
  { label: 'Ndeshja', value: '20', color: C.blue },
  { label: 'Fitore', value: '4', color: C.green },
  { label: 'Barazime', value: '3', color: C.orange },
  { label: 'Humbje', value: '3', color: C.red },
  { label: 'Gola', value: '22', color: C.blue },
];

/* 4-column info grid rows: label, value, label, value */
type InfoRow = [string, string, string, string];

const INFO: InfoRow[] = [
  ['Sezoni', '2025/2026', 'Kompeticion', 'Kupa e Kosovës'],
  ['Filloi', '01 Jul 2024', 'Mbaron', '30 Jun 2025'],
  ['Ndeshje luajtur', '10 / 10', 'Golat', '22 shënuar · 18 pësuar'],
];

const CURRENT_COMP = 'Kupa e Kosovës';

type Hist = {
  id: number;
  season: string;
  range: string;
  comps: string[];
  closed: boolean;
  active: boolean;
};

const SEED: Hist = {
  id: 1,
  season: '2025/2026',
  range: '01 Jul 2025 — 30 Jun 2026',
  comps: ['Superliga e Kosovës', 'Kupa e Kosovës'],
  closed: true,
  active: false,
};

let nextHistId = 2;

export default function SezoniScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const [history, setHistory] = useState<Hist[]>([SEED]);
  const [compOpen, setCompOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const handleCreateSeason = (d: { season: string; range: string; comps: string[] }) => {
    setHistory((prev) => [
      ...prev,
      {
        id: nextHistId++,
        season: d.season,
        range: d.range,
        comps: d.comps,
        closed: false,
        active: false,
      },
    ]);
    setCreateOpen(false);
  };

  const toggleClosed = (id: number) =>
    setHistory((prev) => prev.map((h) => (h.id === id ? { ...h, closed: !h.closed } : h)));

  const setActive = (id: number) =>
    setHistory((prev) =>
      prev.map((h) => (h.id === id ? { ...h, active: !h.active } : h)),
    );

  const removeSeason = (id: number) =>
    setHistory((prev) => prev.filter((h) => h.id !== id));

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

        {/* Very subtle circular background pattern in the empty space below */}
        <View pointerEvents="none" style={styles.deco}>
          <View style={styles.decoRingOuter} />
          <View style={styles.decoRingInner} />
          <View style={styles.decoFill} />
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
                <Text style={styles.title}>Sezoni</Text>
                <Text style={styles.subtitle}>Menaxhimi i sezoneve sportive</Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          scrollEnabled={!createOpen}
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.colPad}>
            {/* ── Competition control row ────────────────────────── */}
            <View style={styles.controlRow}>
              <Text style={styles.ctlLabel}>Kompeticion</Text>
              <Pressable
                onPress={() => setCompOpen((v) => !v)}
                accessibilityRole="button"
                style={({ pressed }) => [styles.ctlSelect, pressed && styles.pressed]}
              >
                <Text style={styles.ctlSelectText} numberOfLines={1}>
                  {CURRENT_COMP}
                </Text>
                <MaterialCommunityIcons name="chevron-down" size={I(13)} color={C.gray} />
              </Pressable>
              <Pressable
                onPress={() => setCreateOpen(true)}
                accessibilityRole="button"
                style={({ pressed }) => [styles.ctlNew, pressed && styles.pressed]}
              >
                <Text style={styles.ctlNewText} numberOfLines={1}>
                  + Hap nje sezon te re
                </Text>
              </Pressable>
            </View>

            {compOpen ? (
              <View style={styles.compOptBox}>
                {['Kupa e Kosovës', 'Superliga e Kosovës', 'Liga e Dytë'].map((c) => {
                  const active = c === CURRENT_COMP;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => setCompOpen(false)}
                      style={[styles.compOpt, active && styles.compOptActive]}
                    >
                      <Text style={[styles.compOptText, active && styles.compOptTextActive]}>
                        {c}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {/* ── Current season card ────────────────────────────── */}
            <View style={[styles.card, styles.mainGap]}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>{CURRENT_COMP}</Text>
              </View>
              <View style={styles.cardBody}>
                {/* info grid */}
                <View style={styles.infoTable}>
                  {INFO.map(([l1, v1, l2, v2], idx) => (
                    <View key={idx} style={styles.iRow}>
                      <Text style={[styles.iLabel, styles.c1]} numberOfLines={1}>
                        {l1}
                      </Text>
                      <Text style={[styles.iValue, styles.c2]} numberOfLines={1}>
                        {v1}
                      </Text>
                      <Text style={[styles.iLabel, styles.c3]} numberOfLines={1}>
                        {l2}
                      </Text>
                      <Text style={[styles.iValue, styles.c4]} numberOfLines={1}>
                        {v2}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* statistics */}
                <Text style={styles.statsTitle}>Statistikat e sezonit</Text>
                <View style={styles.statsRow}>
                  {STATS.map((s) => (
                    <View key={s.label} style={styles.stat}>
                      <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                      <Text style={styles.statLabel}>{s.label}</Text>
                    </View>
                  ))}
                </View>

                {/* win-rate / fitness bar */}
                <View style={styles.fitRow}>
                  <Text style={styles.fitLabel}>Shkalla e fitoreve</Text>
                  <Text style={styles.fitPct}>40%</Text>
                </View>
                <View style={styles.bar}>
                  <View style={styles.barFill} />
                </View>
              </View>
            </View>

            {/* ── Season history card ────────────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Historia e sezoneve</Text>
              </View>
              {history.map((h) => (
                <View key={h.id} style={styles.histItem}>
                  <View style={styles.histLeft}>
                    <Text style={[styles.histSeason, h.active && { color: C.green }]}>
                      {h.season}
                    </Text>
                    <Text style={styles.histRange}>{h.range}</Text>
                    <View style={styles.histComps}>
                      {h.comps.map((c) => (
                        <Text key={c} style={styles.histComp} numberOfLines={1}>
                          {c}
                        </Text>
                      ))}
                    </View>
                  </View>
                  <View style={styles.histRight}>
                    <Pressable
                      onPress={() => toggleClosed(h.id)}
                      accessibilityRole="button"
                      style={({ pressed }) => [styles.statusBtn, pressed && styles.pressed]}
                    >
                      <Text style={styles.statusText} numberOfLines={1}>
                        {h.closed ? 'I mbyllur' : 'I hapur'}
                      </Text>
                    </Pressable>
                    <View style={styles.histActions}>
                      <Pressable
                        onPress={() => setActive(h.id)}
                        accessibilityRole="button"
                        style={({ pressed }) => [
                          styles.hBtn,
                          styles.aktivBtn,
                          h.active && styles.aktivBtnOn,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text
                          style={[styles.aktivText, h.active && styles.aktivTextOn]}
                          numberOfLines={1}
                        >
                          {h.active ? 'Aktive' : 'Aktivizo'}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => removeSeason(h.id)}
                        accessibilityRole="button"
                        style={({ pressed }) => [
                          styles.hBtn,
                          styles.fshiBtn,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.fshiText} numberOfLines={1}>
                          Fshi
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
              {history.length === 0 ? (
                <Text style={styles.emptyText}>Nuk ka sezone ende.</Text>
              ) : null}
            </View>
          </View>
        </ScrollView>

      </View>

      {/* Overlay sits on the SafeAreaView so the blur covers the whole screen —
          including the top (status bar) and bottom (home indicator) bands that
          otherwise stay white because they fall outside the canvas. */}
      {createOpen ? (
        <View style={styles.ovWrap}>
          <BlurView style={styles.ovFill} intensity={45} tint="dark" />
          <Pressable
            style={[styles.ovFill, styles.ovDim]}
            onPress={() => setCreateOpen(false)}
            accessibilityRole="button"
            accessibilityLabel="Mbylle dritaren"
          />
          <CreateSeasonModal
            onClose={() => setCreateOpen(false)}
            onCreate={handleCreateSeason}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

type SeasonDraft = { season: string; range: string; comps: string[] };

function CreateSeasonModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (d: SeasonDraft) => void;
}) {
  const [seasonName, setSeasonName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [showError, setShowError] = useState(false);
  const [anim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
  }, [anim]);

  const toggle = (name: string) =>
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );

  const submit = () => {
    const comps = COMP_OPTIONS.filter((c) => selected.includes(c.name)).map((c) => c.name);
    if (!seasonName.trim() || !startDate.trim() || !endDate.trim() || comps.length === 0) {
      setShowError(true);
      return;
    }
    onCreate({
      season: seasonName.trim(),
      range: `${startDate.trim()} — ${endDate.trim()}`,
      comps,
    });
  };

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] });

  return (
    <Animated.View
      style={[styles.mCard, { opacity: anim, transform: [{ translateY }] }]}
      accessibilityViewIsModal
    >
      <View style={styles.mHeader}>
        <Text style={styles.mTitle}>Hap sezon të ri</Text>
      </View>
      <View style={styles.mDivider} />

      <View style={styles.mContent}>
        <View style={styles.mWarn}>
          <Text style={styles.mWarnText}>
            Sezoni aktual do të mbetet aktiv derisa ta mbyllni manualisht.
          </Text>
        </View>

        <Text style={styles.mFieldLabel}>Emri i sezonit</Text>
        <TextInput
          value={seasonName}
          onChangeText={setSeasonName}
          allowFontScaling={false}
          style={styles.mInput}
        />

        <View style={styles.mDateRow}>
          <View style={styles.mDateCol}>
            <Text style={styles.mDateLabel}>Data e fillimit</Text>
            <TextInput
              value={startDate}
              onChangeText={setStartDate}
              allowFontScaling={false}
              style={styles.mInput}
            />
          </View>
          <View style={styles.mDateCol}>
            <Text style={styles.mDateLabel}>Data e mbarimit</Text>
            <TextInput
              value={endDate}
              onChangeText={setEndDate}
              allowFontScaling={false}
              style={styles.mInput}
            />
          </View>
        </View>

        <View style={styles.mBox}>
          <Text style={styles.mBoxTitle}>Kompeticionet</Text>
          {COMP_OPTIONS.map((opt) => {
            const on = selected.includes(opt.name);
            return (
              <Pressable
                key={opt.name}
                onPress={() => toggle(opt.name)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                style={({ pressed }) => [styles.mOpt, pressed && styles.pressed]}
              >
                <View style={[styles.mRadio, on && styles.mRadioOn]}>
                  {on ? <View style={styles.mRadioDot} /> : null}
                </View>
                <Text style={styles.mOptText} numberOfLines={1}>
                  {opt.name} ({opt.tag})
                </Text>
              </Pressable>
            );
          })}
        </View>

        {showError ? (
          <Text style={styles.mErr}>
            Plotëso të gjitha fushat dhe zgjidh të paktën një kompeticion.
          </Text>
        ) : null}

        <View style={styles.mActions}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={({ pressed }) => [styles.mBtn, styles.mBtnCancel, pressed && styles.pressed]}
          >
            <Text style={styles.mBtnText}>Anulo</Text>
          </Pressable>
          <Pressable
            onPress={submit}
            accessibilityRole="button"
            style={({ pressed }) => [styles.mBtn, styles.mBtnCreate, pressed && styles.pressed]}
          >
            <Text style={styles.mBtnText}>Krijo sezonin</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

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

    deco: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: -120,
      height: 340,
      alignItems: 'center',
      justifyContent: 'flex-end',
      zIndex: 0,
    },

    decoRingOuter: {
      position: 'absolute',
      width: 340,
      height: 340,
      borderRadius: 170,
      borderWidth: 1,
      borderColor: 'rgba(21,148,71,0.05)',
      bottom: -120,
    },

    decoRingInner: {
      position: 'absolute',
      width: 220,
      height: 220,
      borderRadius: 110,
      borderWidth: 1,
      borderColor: 'rgba(34,87,122,0.06)',
      bottom: -70,
    },

    decoFill: {
      position: 'absolute',
      width: 130,
      height: 130,
      borderRadius: 65,
      backgroundColor: 'rgba(34,87,122,0.04)',
      bottom: -30,
      left: 30,
    },

    colPad: {
      alignSelf: 'center',
      width: '100%',
      paddingHorizontal: 27,
    },

    header: {
      backgroundColor: C.page,
      paddingTop: 16,
      paddingBottom: 14,
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
      paddingBottom: 220,
    },

    /* Competition control row */
    controlRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },

    ctlLabel: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      color: C.text,
      marginRight: 5,
    },

    ctlSelect: {
      width: 110,
      height: 31,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: C.selectBorder,
      borderRadius: 2,
      paddingHorizontal: 7,
    },

    ctlSelectText: {
      flex: 1,
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: C.text,
    },

    ctlNew: {
      height: 31,
      marginLeft: 16,
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.mint,
      borderWidth: 1,
      borderColor: C.mintBorder,
      borderRadius: 2,
      paddingHorizontal: 8,
    },

    ctlNewText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: C.text,
    },

    compOptBox: {
      marginTop: -6,
      marginBottom: 14,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: C.selectBorder,
      borderRadius: 3,
      overflow: 'hidden',
    },

    compOpt: {
      height: 34,
      justifyContent: 'center',
      paddingHorizontal: 11,
    },

    compOptActive: {
      backgroundColor: 'rgba(5, 168, 90, 0.10)',
    },

    compOptText: {
      fontFamily: Fonts.body,
      fontSize: 12,
      color: C.text,
    },

    compOptTextActive: {
      fontFamily: Fonts.bodyBold,
      color: C.green,
    },

    /* Cards */
    card: {
      backgroundColor: C.card,
      borderWidth: 2,
      borderColor: C.border,
      borderRadius: 8,
    },

    mainGap: {
      marginTop: 0,
    },

    cardGap: {
      marginTop: 14,
    },

    cardHead: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingTop: 11,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
      borderTopLeftRadius: 7,
      borderTopRightRadius: 7,
    },

    cardHeadText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 13,
      color: C.text,
      textAlign: 'center',
    },

    cardBody: {
      paddingHorizontal: 16,
      paddingVertical: 14,
    },

    /* Info grid (4 columns) */
    infoTable: {
      marginTop: 2,
    },

    iRow: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 20,
    },

    iLabel: {
      fontFamily: Fonts.body,
      fontSize: 10,
      color: C.label,
    },

    iValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 10,
      color: C.text,
      textAlign: 'right',
    },

    c1: {
      width: 66,
    },

    c2: {
      width: 60,
    },

    c3: {
      width: 66,
      marginLeft: 14,
    },

    c4: {
      flex: 1,
    },

    /* Statistics */
    statsTitle: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      color: C.text,
      marginTop: 18,
      marginBottom: 12,
    },

    statsRow: {
      flexDirection: 'row',
    },

    stat: {
      flex: 1,
      alignItems: 'center',
    },

    statValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 14,
      lineHeight: 17,
    },

    statLabel: {
      fontFamily: Fonts.body,
      fontSize: 9.5,
      color: C.gray,
      marginTop: 2,
    },

    /* Win-rate bar */
    fitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 20,
    },

    fitLabel: {
      fontFamily: Fonts.bodyMedium,
      fontSize: 11,
      color: C.text,
    },

    fitPct: {
      fontFamily: Fonts.bodyBold,
      fontSize: 11,
      color: C.text,
    },

    bar: {
      marginTop: 7,
      height: 6,
      borderRadius: 1,
      backgroundColor: C.barGray,
      overflow: 'hidden',
    },

    barFill: {
      width: '40%',
      height: 6,
      borderRadius: 1,
      backgroundColor: C.barGreen,
    },

    /* History item */
    histItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: DIVIDER,
    },

    histLeft: {
      flex: 1,
      marginRight: 8,
    },

    histSeason: {
      fontFamily: Fonts.bodyBold,
      fontSize: 14,
      color: C.text,
    },

    histRange: {
      fontFamily: Fonts.body,
      fontSize: 10,
      color: C.gray,
      marginTop: 2,
    },

    histComps: {
      marginTop: 9,
    },

    histComp: {
      fontFamily: Fonts.body,
      fontSize: 10,
      color: C.gray,
      lineHeight: 15,
    },

    histRight: {
      alignItems: 'flex-end',
    },

    statusBtn: {
      height: 30,
      minWidth: 78,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: C.selectBorder,
      borderRadius: 2,
      paddingHorizontal: 10,
    },

    statusText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10,
      color: C.text,
    },

    histActions: {
      flexDirection: 'row',
      gap: 6,
      marginTop: 18,
    },

    hBtn: {
      height: 30,
      minWidth: 74,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderRadius: 2,
      paddingHorizontal: 10,
    },

    aktivBtn: {
      borderColor: C.aktivBorder,
      backgroundColor: 'transparent',
    },

    aktivBtnOn: {
      backgroundColor: 'rgba(40,184,137,0.14)',
    },

    aktivText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10,
      color: C.green,
    },

    aktivTextOn: {
      color: C.green,
    },

    fshiBtn: {
      borderColor: C.fshiBorder,
      backgroundColor: 'transparent',
    },

    fshiText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10,
      color: C.red,
    },

    emptyText: {
      fontFamily: Fonts.body,
      fontSize: 13,
      color: C.gray,
      textAlign: 'center',
      paddingVertical: 18,
    },

    pressed: {
      opacity: 0.5,
    },

    /* ── Create-season modal ─────────────────────────────────── */
    /* In-tree overlay so BlurView shares the page's native layer and can
       actually frost the content behind the card. Blur + dim are absolute
       siblings; only the card is in flow, so it lands dead-centre. */
    ovWrap: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 20,
    },

    ovFill: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },

    ovDim: {
      backgroundColor: 'rgba(0,0,0,0.28)',
    },

    mCard: {
      width: '94%',
      maxWidth: 380,
      backgroundColor: MO.card,
      borderWidth: 1,
      borderColor: MO.border,
      borderRadius: 6,
      overflow: 'hidden',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 8,
    },

    mHeader: {
      height: 46,
      alignItems: 'center',
      justifyContent: 'center',
    },

    mTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 20,
      lineHeight: 24,
      color: MO.text,
    },

    mDivider: {
      height: 1,
      backgroundColor: MO.divider,
    },

    mContent: {
      paddingHorizontal: 16,
      paddingTop: 4,
      paddingBottom: 16,
    },

    mWarn: {
      marginTop: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: MO.warn,
      borderRadius: 6,
      paddingVertical: 7,
      paddingHorizontal: 12,
    },

    mWarnText: {
      fontFamily: Fonts.body,
      fontSize: 9,
      lineHeight: 12.5,
      color: MO.white,
      textAlign: 'center',
    },

    mFieldLabel: {
      fontFamily: Fonts.body,
      fontSize: 9,
      color: MO.label,
      marginTop: 12,
      marginBottom: 4,
    },

    mInput: {
      height: 33,
      backgroundColor: MO.inputBg,
      borderWidth: 1,
      borderColor: MO.fieldBorder,
      borderRadius: 3,
      paddingHorizontal: 8,
      paddingVertical: 0,
      fontSize: 11,
      fontFamily: Fonts.body,
      color: MO.text,
    },

    mDateRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    },

    mDateCol: {
      flex: 1,
    },

    mDateLabel: {
      fontFamily: Fonts.body,
      fontSize: 9,
      color: MO.label,
      marginBottom: 4,
    },

    mBox: {
      marginTop: 12,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: MO.fieldBorder,
      borderRadius: 2,
      padding: 8,
    },

    mBoxTitle: {
      fontFamily: Fonts.body,
      fontSize: 10,
      color: MO.label,
      marginBottom: 4,
    },

    mOpt: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 3,
    },

    mRadio: {
      width: 13,
      height: 13,
      borderRadius: 6.5,
      borderWidth: 1,
      borderColor: MO.selBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },

    mRadioOn: {
      borderColor: MO.selOn,
    },

    mRadioDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: MO.selOn,
    },

    mOptText: {
      fontFamily: Fonts.body,
      fontSize: 9.5,
      color: MO.text,
    },

    mErr: {
      fontFamily: Fonts.body,
      fontSize: 9,
      color: MO.err,
      marginTop: 10,
      textAlign: 'right',
    },

    mActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 10,
      marginTop: 14,
    },

    mBtn: {
      width: 86,
      height: 33,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 3,
    },

    mBtnCancel: {
      backgroundColor: MO.cancel,
    },

    mBtnCreate: {
      backgroundColor: MO.create,
    },

    mBtnText: {
      fontFamily: Fonts.bodyMedium,
      fontSize: 10.5,
      color: MO.white,
    },
  }),
);
