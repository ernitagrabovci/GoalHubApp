import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * Single player page — opened from the "Progres i mirë / Progres i keq"
 * verdict button on a ratings card. Identity + season numbers, finances,
 * latest ratings, attendance, personal details and the injury history.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',
  hintSoft: '#E2E2E2',

  /* blue1 = the deeper blue of the dropdown button; blue2 = the pale blue of
     the cards/tables. Card heads sit on blue2, card bodies on blue1. */
  blue1: '#E3EEFB',
  blue2: '#F6FBFF',

  border: '#000000',
  rowLine: '#000000',
  headLine: '#000000',

  green: '#159447',
  greenSoft: '#DDF6E7',
  redDark: '#9E1B1B',
  red: '#E03131',
  redSoft: '#ED5050',
  orange: '#E4A000',
  blue: '#1749B8',
};

const IMG = {
  star: require('@/assets/dashboard/star.png'),
};

/* Season totals shown in the identity card. */
const STATS = [
  { label: 'Ndeshjet', value: '1', tone: C.text },
  { label: 'Golat', value: '0', tone: C.green },
  { label: 'Asiste', value: '0', tone: C.blue },
];

const STATS2 = [
  { label: 'K.verdha', value: '0', tone: C.orange },
  { label: 'K.kuq', value: '0', tone: C.red },
  { label: 'Minuta', value: '0', tone: C.text },
];

/* Financial squares, two per row. Two share the "e papaguar" label, so each
   needs its own key. */
const MONEY = [
  { key: 'papaguar-0', label: 'e papaguar', value: '0', tone: C.green },
  { key: 'papaguar-1', label: 'e papaguar', value: '1', tone: C.redDark },
  { key: 'vonese', label: 'me vonesë', value: '0', tone: C.orange },
  { key: 'kritike', label: 'kritike', value: '0', tone: C.redSoft },
];

const ATTENDANCE = [
  { label: 'prezent', value: '0', dot: C.green },
  { label: 'mungesë', value: '0', dot: C.red },
  { label: 'pa status', value: '0', dot: C.hintSoft },
];

const DETAILS = [
  { label: 'Mosha', value: '21 vjeç' },
  { label: 'Kombësia', value: 'Kosovar' },
  { label: 'Email', value: 'narti@gmail.com' },
  { label: 'Licensa FFK', value: '111' },
  { label: 'Kontrata nga', value: '25 gusht 2026' },
  { label: 'Kontrata deri', value: '26 gusht 2027' },
];

export default function PlayerProfileScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const params = useLocalSearchParams<{ name?: string; team?: string; nr?: string; pos?: string }>();
  const name = params.name ?? 'Narti Cerkini';
  const team = params.team ?? 'Ekipi i Parë';
  const nr = params.nr ?? '1';
  const pos = params.pos ?? 'Portier';

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
                  {name}
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
            {/* ── Player selector ───────────────────────────────── */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Zgjidh lojtarin"
              style={({ pressed }) => [styles.playerBtn, pressed && styles.pressed]}
            >
              <Text style={styles.playerBtnText} numberOfLines={1}>
                {name}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={I(15)} color="#000000" />
            </Pressable>

            {/* ── Identity + finances ───────────────────────────── */}
            <View style={styles.duo}>
              {/* Identity card */}
              <View style={[styles.duoCard, styles.card]}>
                <View style={styles.identityTop}>
                  <View style={styles.profileBox}>
                    <MaterialCommunityIcons name="account" size={I(34)} color="#000000" />
                  </View>
                  <View style={styles.identityText}>
                    <Text style={styles.playerName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                      {name}
                    </Text>
                    <Text style={styles.playerSub} numberOfLines={1}>
                      Nr.{nr} {pos}
                    </Text>
                    <Text style={styles.playerTeam} numberOfLines={1}>
                      {team}
                    </Text>
                    <View style={styles.activePill}>
                      <Text style={styles.activePillText}>Aktiv</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.blackRule} />

                <View style={styles.body}>
                  <View style={styles.statRow}>
                    {STATS.map((s) => (
                      <View key={s.label} style={styles.statCol}>
                        <Text style={[styles.statValue, { color: s.tone }]}>{s.value}</Text>
                        <Text style={styles.statLabel} numberOfLines={1}>
                          {s.label}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View style={[styles.statRow, styles.statRowLast]}>
                    {STATS2.map((s) => (
                      <View key={s.label} style={styles.statCol}>
                        <Text style={[styles.statValue, { color: s.tone }]}>{s.value}</Text>
                        <Text style={styles.statLabel} numberOfLines={1}>
                          {s.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>

              {/* Financial card */}
              <View style={[styles.duoCard, styles.card]}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  Gjendja financiare
                </Text>
                <View style={styles.thinRule} />

                <View style={styles.body}>
                  <View style={styles.moneyRow}>
                    {MONEY.slice(0, 2).map((m) => (
                      <View key={m.key} style={styles.moneySq}>
                        <Text style={[styles.moneyValue, { color: m.tone }]}>{m.value}</Text>
                        <Text style={styles.moneyLabel} numberOfLines={1}>
                          {m.label}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.moneyRow}>
                    {MONEY.slice(2).map((m) => (
                      <View key={m.key} style={styles.moneySq}>
                        <Text style={[styles.moneyValue, { color: m.tone }]}>{m.value}</Text>
                        <Text style={styles.moneyLabel} numberOfLines={1}>
                          {m.label}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.totalBox}>
                    <Text style={styles.totalLabel}>Totali i paguar</Text>
                    <Text style={styles.totalValue}>$0.00</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ── Vlerësimet e fundit ───────────────────────────── */}
            <View style={[styles.wideCard, styles.card]}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Vlerësimet e fundit</Text>
              </View>
              <View style={[styles.bodyFlat, styles.empty]}>
                <View style={styles.starWrap}>
                  {/* Same artwork scaled up and tinted black, sitting behind the
                      star — gives a uniform outline that keeps the sharp tips. */}
                  <Image source={IMG.star} style={styles.starOutline} tintColor="#000000" />
                  <Image source={IMG.star} style={styles.starImg} resizeMode="contain" />
                </View>
                <Text style={styles.emptyText}>Nuk ka vlerësime akoma.</Text>
              </View>
            </View>

            {/* ── Prezenca + details ────────────────────────────── */}
            <View style={styles.duo}>
              {/* Attendance card */}
              <View style={[styles.duoCard, styles.card]}>
                <View style={styles.prezencaTop}>
                  <Text style={styles.cardTitle}>Prezenca</Text>
                  <Text style={styles.prezencaPct}>0%</Text>
                </View>
                <View style={styles.grayRule} />

                <View style={styles.body}>
                  {ATTENDANCE.map((a) => (
                    <View key={a.label} style={styles.attRow}>
                      <View style={styles.attLeft}>
                        <View style={[styles.dot, { backgroundColor: a.dot }]} />
                        <Text style={styles.attLabel} numberOfLines={1}>
                          {a.label}
                        </Text>
                      </View>
                      <Text style={styles.attValue}>{a.value}</Text>
                    </View>
                  ))}

                  <View style={styles.totalRow}>
                    <Text style={styles.totalRowLabel}>total stërvitje</Text>
                    <Text style={styles.totalRowValue}>16</Text>
                  </View>
                </View>
              </View>

              {/* Personal details card */}
              <View style={[styles.duoCard, styles.card]}>
                {DETAILS.map((d, i) => (
                  <View
                    key={d.label}
                    style={[styles.detRow, i < DETAILS.length - 1 && styles.detRowLine]}
                  >
                    <Text style={styles.detLabel} numberOfLines={1}>
                      {d.label}
                    </Text>
                    <Text style={styles.detValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                      {d.value}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* ── Historiku i lëndimeve ─────────────────────────── */}
            <View style={[styles.wideCard, styles.card]}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Historiku i lëndimeve</Text>
              </View>

              <View style={[styles.bodyFlat, styles.injuryRow]}>
                <View style={styles.injuryText}>
                  <Text style={styles.injuryName} numberOfLines={1}>
                    Gripi
                  </Text>
                  <Text style={styles.injurySub} numberOfLines={2}>
                    Lënduar: 27 Aug 2026 - Kthimi i pritshëm: 01 Sep 2026
                  </Text>
                </View>
                <View style={styles.healedPill}>
                  <Text style={styles.healedPillText}>i shëruar</Text>
                </View>
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

    /* ── Player selector ─────────────────────────────────────── */
    playerBtn: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      height: 36,
      paddingHorizontal: 12,
      backgroundColor: C.blue2,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
      marginTop: 4,
    },

    playerBtnText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12,
      color: '#000000',
    },

    /* ── Parallel card rows ──────────────────────────────────── */
    duo: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 8,
      marginTop: 12,
    },

    /* Shared shell for the column cards and the full-width ones. */
    card: {
      backgroundColor: C.blue2,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 7,
      overflow: 'hidden',
    },

    /* Card body: pulled out to the card's edges so blue1 reads as a filled
       lower half rather than an inset panel. flexGrow lets it take up the
       slack when the parallel card in the row is taller, so blue1 always
       reaches the bottom edge. */
    body: {
      flex: 1,
      marginHorizontal: -10,
      marginBottom: -10,
      paddingHorizontal: 10,
      paddingTop: 8,
      paddingBottom: 8,
      backgroundColor: C.blue1,
    },

    /* Same, for the full-width cards that have no inner padding. */
    bodyFlat: {
      backgroundColor: C.blue1,
    },

    duoCard: {
      flex: 1,
      paddingHorizontal: 10,
      paddingTop: 10,
      paddingBottom: 10,
    },

    wideCard: {
      marginTop: 12,
      overflow: 'hidden',
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
      fontSize: 15,
      lineHeight: 19,
      color: C.text,
    },

    cardTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.text,
    },

    /* The rules close the blue2 head and run edge to edge so each card reads
       as one long line splitting head from body; the body's paddingTop
       supplies the space underneath. */
    thinRule: {
      height: 1,
      marginHorizontal: -10,
      backgroundColor: C.text,
      marginTop: 6,
    },

    blackRule: {
      height: 1,
      marginHorizontal: -10,
      backgroundColor: C.text,
      marginTop: 8,
    },

    grayRule: {
      height: 1,
      marginHorizontal: -10,
      backgroundColor: C.hintSoft,
      marginTop: 6,
    },

    /* ── Identity card ───────────────────────────────────────── */
    identityTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    profileBox: {
      width: 64,
      height: 64,
      borderRadius: 8,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#000000',
      alignItems: 'center',
      justifyContent: 'center',
    },

    identityText: {
      flex: 1,
    },

    playerName: {
      fontFamily: Fonts.bodyBold,
      fontSize: 13,
      lineHeight: 16,
      color: C.text,
    },

    playerSub: {
      fontFamily: Fonts.body,
      fontSize: 10,
      lineHeight: 13,
      color: C.hint,
      marginTop: 1,
    },

    playerTeam: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.hint,
      marginTop: 5,
    },

    activePill: {
      alignSelf: 'flex-start',
      marginTop: 4,
      paddingHorizontal: 9,
      paddingVertical: 2,
      borderRadius: 999,
      backgroundColor: C.green,
    },

    activePillText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 9.5,
      lineHeight: 12,
      color: '#FFFFFF',
    },

    statRow: {
      flexDirection: 'row',
      marginBottom: 6,
    },

    statRowLast: {
      marginBottom: 0,
    },

    statCol: {
      flex: 1,
      alignItems: 'center',
    },

    statValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 15,
      lineHeight: 19,
    },

    statLabel: {
      fontFamily: Fonts.body,
      fontSize: 9,
      lineHeight: 12,
      color: C.hint,
      marginTop: 1,
    },

    /* ── Financial card ──────────────────────────────────────── */
    moneyRow: {
      flexDirection: 'row',
      gap: 6,
      marginBottom: 6,
    },

    moneySq: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 5,
    },

    moneyValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 17,
      lineHeight: 21,
    },

    moneyLabel: {
      fontFamily: Fonts.body,
      fontSize: 8.5,
      lineHeight: 11,
      color: C.hint,
      marginTop: 1,
    },

    totalBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 46,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 5,
    },

    totalLabel: {
      fontFamily: Fonts.body,
      fontSize: 9.5,
      color: C.hint,
    },

    totalValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 11.5,
      color: C.green,
    },

    /* ── Empty state ─────────────────────────────────────────── */
    empty: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 22,
    },

    starWrap: {
      width: 64,
      height: 64,
      alignItems: 'center',
      justifyContent: 'center',
    },

    starOutline: {
      position: 'absolute',
      width: 64,
      height: 64,
    },

    starImg: {
      width: 58,
      height: 58,
    },

    emptyText: {
      marginTop: 10,
      fontFamily: Fonts.body,
      fontSize: 12,
      color: C.hint,
    },

    /* ── Prezenca ────────────────────────────────────────────── */
    prezencaTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },

    prezencaPct: {
      fontFamily: Fonts.bodyBold,
      fontSize: 13,
      color: C.red,
    },

    attRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 5,
    },

    attLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flex: 1,
    },

    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },

    attLabel: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      color: C.hint,
    },

    attValue: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: C.text,
    },

    totalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 40,
      marginTop: 12,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
      backgroundColor: C.blue2,
    },

    totalRowLabel: {
      fontFamily: Fonts.body,
      fontSize: 9.5,
      color: C.hint,
    },

    totalRowValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 11.5,
      color: C.text,
    },

    /* ── Details ─────────────────────────────────────────────── */
    detRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 6,
      gap: 6,
    },

    detRowLine: {
      borderBottomWidth: 1,
      borderBottomColor: C.rowLine,
    },

    detLabel: {
      fontFamily: Fonts.body,
      fontSize: 10,
      color: C.hint,
    },

    detValue: {
      flexShrink: 1,
      textAlign: 'right',
      fontFamily: Fonts.bodyBold,
      fontSize: 10,
      color: C.text,
    },

    /* ── Injury history ──────────────────────────────────────── */
    injuryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },

    injuryText: {
      flex: 1,
    },

    injuryName: {
      fontFamily: Fonts.bodyBold,
      fontSize: 13,
      lineHeight: 16,
      color: C.text,
    },

    injurySub: {
      fontFamily: Fonts.body,
      fontSize: 10,
      lineHeight: 13,
      color: C.hint,
      marginTop: 2,
    },

    healedPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: C.green,
    },

    healedPillText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10,
      lineHeight: 13,
      color: '#FFFFFF',
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
