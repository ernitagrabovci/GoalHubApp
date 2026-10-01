import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
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
 * Kuotat e anëtarësisë — the whole club's membership fees, opened from
 * "Vazhdo" on the Pagesat card of the financier home.
 *
 * The financier works the list from the top down, so the rows that still owe
 * money are always lifted above the settled ones: an unpaid row offers
 * "Regjistro pagesën", a settled one only "Shiko".
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

  blue1: '#E3EEFB',
  blue2: '#F6FBFF',
  blueBtn: '#86BCFD',

  green: '#159447',
  red: '#E03131',
  orange: '#E4A000',
};

/* One colour per payment status. */
const STATUS_TONE: Record<string, string> = {
  Paguar: C.green,
  Papaguar: C.orange,
  Skaduar: C.red,
};

/* The dropdown's options — every team in the club, plus the whole club. */
const TEAMS = ['Të gjitha', 'Ekipi i Parë', 'Ekipi i Dytë', 'U19', 'U17'];

type Quota = {
  name: string;
  team: string;
  period: string;
  amount: string;
  due: string;
  status: string;
};

const QUOTAS: Quota[] = [
  { name: 'Ardit Llapashtica', team: 'Ekipi i Parë', period: 'Shkurt 2027', amount: '$90.00', due: '10/02/2027', status: 'Papaguar' },
  { name: 'Agon Gashi', team: 'Ekipi i Parë', period: 'Shkurt 2027', amount: '$90.00', due: '10/02/2027', status: 'Papaguar' },
  { name: 'Era Gashi', team: 'U19', period: 'Shkurt 2027', amount: '$40.00', due: '10/02/2027', status: 'Papaguar' },
  { name: 'Art Gashi', team: 'U17', period: 'Shkurt 2027', amount: '$40.00', due: '10/02/2027', status: 'Papaguar' },
  { name: 'Fisnik Berisha', team: 'Ekipi i Dytë', period: 'Janar 2027', amount: '$40.00', due: '10/01/2027', status: 'Skaduar' },
  { name: 'Mergim Berisha', team: 'Ekipi i Parë', period: 'Janar 2027', amount: '$40.00', due: '10/01/2027', status: 'Skaduar' },
  { name: 'Bekim Rexhepi', team: 'Ekipi i Parë', period: 'Janar 2027', amount: '$40.00', due: '10/01/2027', status: 'Paguar' },
  { name: 'Dardan Krasniqi', team: 'Ekipi i Parë', period: 'Dhjetor 2026', amount: '$40.00', due: '10/12/2026', status: 'Paguar' },
  { name: 'Endrit Hoxha', team: 'Ekipi i Parë', period: 'Dhjetor 2026', amount: '$40.00', due: '10/12/2026', status: 'Paguar' },
  { name: 'Dren Hyseni', team: 'Ekipi i Dytë', period: 'Dhjetor 2026', amount: '$40.00', due: '10/12/2026', status: 'Paguar' },
];

/* Unpaid first, then the overdue, then everything already settled. */
const RANK: Record<string, number> = { Papaguar: 0, Skaduar: 1, Paguar: 2 };

const ROWS = [...QUOTAS].sort((a, b) => (RANK[a.status] ?? 3) - (RANK[b.status] ?? 3));

/* Table columns — fixed widths so nothing gets squeezed; the frame scrolls. */
const COL_NAME = 104;
const COL_TEAM = 88;
const COL_PERIOD = 90;
const COL_AMOUNT = 58;
const COL_DUE = 72;
const COL_STATUS = 66;
const COL_ACTION = 88;

const PAGES = [1, 2, 3, 4];

export default function MembershipFeesScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const [team, setTeam] = useState(TEAMS[0]);
  const [teamOpen, setTeamOpen] = useState(false);

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
                  Kuotat e anëtarësisë
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  845 rekorde
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
            {/* ── Team dropdown ─────────────────────────────────── */}
            {/* Lifted while the list is unrolled, so the options fall over the
                table below instead of under it. */}
            <View style={[styles.pickRow, teamOpen && styles.pickRowOpen]}>
              <View style={styles.pickWrap}>
                <Pressable
                  onPress={() => setTeamOpen(!teamOpen)}
                  accessibilityRole="button"
                  accessibilityLabel="Filtro sipas ekipit"
                  style={({ pressed }) => [styles.pickBox, pressed && styles.pressed]}
                >
                  <Text style={styles.pickText} numberOfLines={1}>
                    {team}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={I(14)} color={C.text} />
                </Pressable>

                {teamOpen ? (
                  <View style={styles.pickOpts}>
                    {TEAMS.map((t) => {
                      const active = t === team;
                      return (
                        <Pressable
                          key={t}
                          onPress={() => {
                            setTeam(t);
                            setTeamOpen(false);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={t}
                          style={[styles.pickOpt, active && styles.pickOptActive]}
                        >
                          <Text
                            style={[styles.pickOptText, active && styles.pickOptTextActive]}
                            numberOfLines={1}
                          >
                            {t}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            </View>

            {/* ── Search ────────────────────────────────────────── */}
            <View style={styles.searchRow}>
              <View style={styles.searchBar}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Kërko anëtar..."
                  placeholderTextColor={C.gray}
                  accessibilityLabel="Kërko anëtar"
                />
                <MaterialCommunityIcons name="magnify" size={I(17)} color={C.text} />
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Kërko"
                style={({ pressed }) => [styles.searchBtn, pressed && styles.pressed]}
              >
                <Text style={styles.searchBtnText}>Kërko</Text>
              </Pressable>
            </View>

            {/* ── List ──────────────────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.head}>
                <Text
                  style={styles.headText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  List
                </Text>
              </View>
              <View style={styles.headLine} />

              {/* Table — scroll sideways so no column gets squeezed */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={styles.tblInner}
              >
                <View>
                  <View style={styles.tr}>
                    <Text style={[styles.th, styles.thLeft, { width: COL_NAME }]}>Emri</Text>
                    <Text style={[styles.th, { width: COL_TEAM }]}>Ekipi</Text>
                    <Text style={[styles.th, { width: COL_PERIOD }]}>Periudha</Text>
                    <Text style={[styles.th, { width: COL_AMOUNT }]}>Shuma</Text>
                    <Text style={[styles.th, { width: COL_DUE }]}>Afati</Text>
                    <Text style={[styles.th, { width: COL_STATUS }]}>Statusi</Text>
                    <View style={{ width: COL_ACTION }} />
                  </View>

                  {ROWS.map((r, i) => {
                    const unpaid = r.status !== 'Paguar';

                    return (
                      <View key={`${r.name}-${r.period}-${i}`} style={[styles.tr, styles.trBorder]}>
                        <Text
                          style={[styles.tdName, styles.thLeft, { width: COL_NAME }]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          {r.name}
                        </Text>
                        <Text style={[styles.td, { width: COL_TEAM }]} numberOfLines={1}>
                          {r.team}
                        </Text>
                        <Text style={[styles.td, { width: COL_PERIOD }]} numberOfLines={1}>
                          {r.period}
                        </Text>
                        <Text style={[styles.td, { width: COL_AMOUNT }]} numberOfLines={1}>
                          {r.amount}
                        </Text>
                        <Text style={[styles.td, { width: COL_DUE }]} numberOfLines={1}>
                          {r.due}
                        </Text>
                        <Text
                          style={[
                            styles.td,
                            styles.tdStatus,
                            { width: COL_STATUS, color: STATUS_TONE[r.status] ?? C.hint },
                          ]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          {r.status}
                        </Text>

                        <View style={[styles.colAction, { width: COL_ACTION }]}>
                          {unpaid ? (
                            /* Nothing owed has been registered yet, so the row
                               carries the action that clears it. */
                            <Pressable
                              onPress={() =>
                                router.push({
                                  pathname: '/regjistro-pagesen-financierit',
                                  params: {
                                    name: r.name,
                                    team: r.team,
                                    period: r.period,
                                    amount: r.amount,
                                    due: r.due,
                                    status: r.status,
                                  },
                                })
                              }
                              accessibilityRole="button"
                              accessibilityLabel={`Regjistro pagesën e ${r.name}`}
                              style={({ pressed }) => [styles.actReg, pressed && styles.pressed]}
                            >
                              <Text
                                style={styles.actRegText}
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                minimumFontScale={0.8}
                              >
                                Regjistro pagesën
                              </Text>
                            </Pressable>
                          ) : (
                            <Pressable
                              onPress={() =>
                                router.push({
                                  pathname: '/detajet-pageses-financierit',
                                  params: {
                                    name: r.name,
                                    team: r.team,
                                    period: r.period,
                                    amount: r.amount,
                                    due: r.due,
                                    status: r.status,
                                  },
                                })
                              }
                              accessibilityRole="button"
                              accessibilityLabel={`Shiko ${r.name}`}
                              style={({ pressed }) => [styles.actShiko, pressed && styles.pressed]}
                            >
                              <Text style={styles.actShikoText}>Shiko</Text>
                            </Pressable>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {/* ── Pager ─────────────────────────────────────────── */}
            <View style={styles.pager}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Faqja e mëparshme"
                hitSlop={8}
                style={({ pressed }) => [styles.pagerArrow, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons name="chevron-left" size={I(22)} color={C.text} />
              </Pressable>

              {PAGES.map((p) => (
                <Pressable
                  key={p}
                  accessibilityRole="button"
                  accessibilityLabel={`Faqja ${p}`}
                  style={({ pressed }) => [styles.pageSq, pressed && styles.pressed]}
                >
                  <Text style={styles.pageSqText}>{p}</Text>
                </Pressable>
              ))}

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Faqja tjetër"
                hitSlop={8}
                style={({ pressed }) => [styles.pagerArrow, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons name="chevron-right" size={I(22)} color={C.text} />
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

    /* ── Team dropdown ───────────────────────────────────────── */
    pickRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginTop: 12,
    },

    pickRowOpen: {
      zIndex: 30,
      elevation: 30,
    },

    pickWrap: {
      width: 152,
    },

    pickBox: {
      height: 34,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
      paddingHorizontal: 9,
      backgroundColor: C.blue1,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    pickText: {
      flex: 1,
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11,
      lineHeight: 14,
      color: C.text,
    },

    /* Floats over the table so opening it moves nothing. */
    pickOpts: {
      position: 'absolute',
      top: 37,
      left: 0,
      right: 0,
      zIndex: 40,
      elevation: 12,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
      overflow: 'hidden',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
    },

    pickOpt: {
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },

    pickOptActive: {
      backgroundColor: C.blue1,
    },

    pickOptText: {
      fontFamily: Fonts.body,
      fontSize: 11,
      color: C.text,
    },

    pickOptTextActive: {
      fontFamily: Fonts.bodyBold,
      color: C.blueBtn,
    },

    /* ── Search ──────────────────────────────────────────────── */
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
    },

    /* The field wears the magnifier on its right edge. */
    searchBar: {
      flex: 1,
      height: 34,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 9,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    searchInput: {
      flex: 1,
      paddingHorizontal: 0,
      paddingVertical: 0,
      fontFamily: Fonts.body,
      fontSize: 11,
      color: C.text,
    },

    searchBtn: {
      height: 34,
      paddingHorizontal: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.blue1,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    searchBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      color: C.text,
    },

    /* ── Card ────────────────────────────────────────────────── */
    card: {
      marginTop: 14,
      backgroundColor: C.blue2,
      borderWidth: 2,
      borderColor: C.rowLine,
      borderRadius: 7,
      overflow: 'hidden',
    },

    head: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 10,
      paddingVertical: 10,
    },

    headText: {
      textAlign: 'center',
      fontFamily: Fonts.bodyBold,
      fontSize: 15,
      lineHeight: 19,
      color: C.text,
    },

    headLine: {
      height: 1,
      backgroundColor: C.headLine,
    },

    /* ── Table ───────────────────────────────────────────────── */
    tblInner: {
      paddingHorizontal: 4,
      paddingTop: 6,
      paddingBottom: 4,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 34,
    },

    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    colAction: {
      alignItems: 'flex-end',
    },

    th: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.gray,
      textAlign: 'center',
    },

    thLeft: {
      textAlign: 'left',
    },

    tdName: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.text,
    },

    td: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.hint,
      textAlign: 'center',
    },

    tdStatus: {
      fontFamily: Fonts.bodySemiBold,
    },

    /* The dropdown's fill and rim — the row's one action while the fee is
       still owed. */
    actReg: {
      height: 22,
      paddingHorizontal: 6,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.blue1,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    actRegText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 8.5,
      color: C.text,
    },

    /* Clear fill, black rim and black label — the settled row's one action. */
    actShiko: {
      height: 22,
      paddingHorizontal: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    actShikoText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10,
      color: C.frame,
    },

    /* ── Pager ───────────────────────────────────────────────── */
    pager: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 6,
      marginTop: 12,
    },

    pagerArrow: {
      alignItems: 'center',
      justifyContent: 'center',
    },

    pageSq: {
      width: 34,
      height: 34,
      borderRadius: 5,
      backgroundColor: C.blueBtn,
      alignItems: 'center',
      justifyContent: 'center',
    },

    pageSqText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 14,
      color: '#FFFFFF',
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
