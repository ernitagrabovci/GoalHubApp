import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * Regjistro prezencën — the trainer marks who turned up, opened from the
 * "Regjistro" button on a row of the training list.
 *
 * The session's own facts sit above the attendance sheet. The header row
 * carries the two "everyone" shortcuts in the same columns as each player's
 * pair of marks, and the sheet ends with the running tally and the save button.
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

  /* The table ground is the palest blue; the edit button one step deeper. */
  card: '#F6FBFF',
  blueSoft: '#E3EEFB',

  green: '#159447',
  red: '#E03131',
};

/* ── Attendance sheet ──────────────────────────────────────────────── */

type Mark = 'prezent' | 'mungon';

type Player = {
  name: string;
  nr: string;
  pos: string;
};

const PLAYERS: Player[] = [
  { name: 'Bekim Rexhepi', nr: '1', pos: 'Portier' },
  { name: 'Dardan Krasniqi', nr: '2', pos: 'Mbrojtës' },
  { name: 'Endrit Hoxha', nr: '4', pos: 'Mesfushor' },
  { name: 'Genc Morina', nr: '6', pos: 'Mesfushor' },
  { name: 'Ardit Llapashtica', nr: '9', pos: 'Sulmues' },
  { name: 'Hamdi Shala', nr: '11', pos: 'Sulmues' },
];

/* The two mark columns are as wide as the "everyone" buttons that head them,
   so a player's pair sits directly under the shortcuts. */
const W = {
  name: 100,
  nr: 28,
  pos: 68,
  prezent: 82,
  mungon: 80,
};

export default function RegisterAttendanceScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const params = useLocalSearchParams<{
    date?: string;
    time?: string;
    field?: string;
    type?: string;
    duration?: string;
  }>();

  const date = params.date ?? '18 Aug 2026';
  const time = params.time ?? '17:00';
  const field = params.field ?? 'Salla e Brendshme';
  const type = params.type ?? 'Taktike';
  const duration = params.duration ?? '90 min';

  const [marks, setMarks] = useState<(Mark | null)[]>(() => PLAYERS.map(() => null));

  const present = marks.filter((m) => m === 'prezent').length;
  const absent = marks.filter((m) => m === 'mungon').length;

  const setAll = (mark: Mark) => setMarks(PLAYERS.map(() => mark));

  /* Tapping the mark a player already carries takes it back off. */
  const toggle = (index: number, mark: Mark) =>
    setMarks((prev) => prev.map((m, i) => (i === index ? (m === mark ? null : mark) : m)));

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
                  {`Stërvitja - ${date}`}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {`${time} • ${field} • ${type}`}
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
            {/* ── Edit / delete the session ────────────────────────── */}
            <View style={styles.actionsRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edito stërvitjen"
                style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons name="pencil" size={I(14)} color={C.text} />
                <Text style={styles.editBtnText} numberOfLines={1}>
                  Edito stërvitjen
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Fshi stërvitjen"
                style={({ pressed }) => [styles.delBtn, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={I(14)} color={C.text} />
                <Text style={styles.delBtnText} numberOfLines={1}>
                  Fshi
                </Text>
              </Pressable>
            </View>

            {/* ── Session details ──────────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  Detajet e stërvitjes
                </Text>
              </View>

              <View style={styles.tblInner}>
                <View style={[styles.tr, styles.detailRow]}>
                  <View style={styles.detailCell}>
                    <Text style={styles.detailLabel} numberOfLines={1}>
                      Lloji
                    </Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {type}
                    </Text>
                  </View>
                  <View style={styles.detailCell}>
                    <Text style={styles.detailLabel} numberOfLines={1}>
                      Data
                    </Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {`${date}, ${time}`}
                    </Text>
                  </View>
                </View>

                <View style={[styles.tr, styles.detailRow]}>
                  <View style={styles.detailCell}>
                    <Text style={styles.detailLabel} numberOfLines={1}>
                      Kohëzgjatja
                    </Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {duration}
                    </Text>
                  </View>
                  <View style={styles.detailCell}>
                    <Text style={styles.detailLabel} numberOfLines={1}>
                      Fusha
                    </Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {field}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ── Attendance sheet ─────────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  Prezenca në stërvitje
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={[styles.tblInner, styles.tblFill]}
              >
                {/* One wrapper that takes the card's full width, so the header
                    rule and every row rule reach the far edge. */}
                <View style={styles.tblFill}>
                  <View style={[styles.tr, styles.headRow]}>
                    <Text style={[styles.th, { width: W.name }]} numberOfLines={1}>
                      Lojtari
                    </Text>
                    <Text style={[styles.th, { width: W.nr }]} numberOfLines={1}>
                      Nr.
                    </Text>
                    <Text style={[styles.th, { width: W.pos }]} numberOfLines={1}>
                      Pozita
                    </Text>

                    <View style={{ width: W.prezent }}>
                      <Pressable
                        onPress={() => setAll('prezent')}
                        accessibilityRole="button"
                        accessibilityLabel="Shëno të gjithë prezent"
                        style={({ pressed }) => [
                          styles.allBtn,
                          styles.allPresent,
                          styles.allBtnHead,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.allText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                          Të gjithë prezent
                        </Text>
                      </Pressable>
                    </View>

                    <View style={{ width: W.mungon }}>
                      <Pressable
                        onPress={() => setAll('mungon')}
                        accessibilityRole="button"
                        accessibilityLabel="Shëno të gjithë mungesë"
                        style={({ pressed }) => [
                          styles.allBtn,
                          styles.allAbsent,
                          styles.allBtnHead,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.allText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                          Të gjithë mungesë
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  {PLAYERS.map((p, i) => (
                    <View key={p.nr} style={[styles.tr, styles.trBorder]}>
                      <Text
                        style={[styles.td, styles.tdName, { width: W.name }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                      >
                        {p.name}
                      </Text>
                      <Text style={[styles.td, { width: W.nr }]} numberOfLines={1}>
                        {p.nr}
                      </Text>
                      <Text
                        style={[styles.td, { width: W.pos }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                      >
                        {p.pos}
                      </Text>

                      <View style={{ width: W.prezent }}>
                        <Pressable
                          onPress={() => toggle(i, 'prezent')}
                          accessibilityRole="button"
                          accessibilityLabel={`${p.name} prezent`}
                          style={({ pressed }) => [
                            styles.markBtn,
                            marks[i] === 'prezent' ? styles.markOn : styles.markOff,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Text
                            style={[
                              styles.markText,
                              marks[i] === 'prezent' && styles.markTextOn,
                            ]}
                            numberOfLines={1}
                          >
                            Prezent
                          </Text>
                        </Pressable>
                      </View>

                      <View style={{ width: W.mungon }}>
                        <Pressable
                          onPress={() => toggle(i, 'mungon')}
                          accessibilityRole="button"
                          accessibilityLabel={`${p.name} mungesë`}
                          style={({ pressed }) => [
                            styles.markBtn,
                            marks[i] === 'mungon' ? styles.markOn : styles.markOff,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Text
                            style={[styles.markText, marks[i] === 'mungon' && styles.markTextOn]}
                            numberOfLines={1}
                          >
                            Munges
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* ── Tally and save — under the table, on the page ────── */}
            <View style={styles.footRow}>
              <Text style={styles.footText} numberOfLines={1}>
                {`${present} prezent • ${absent} mungesë`}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ruaj prezencën"
                style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed]}
              >
                <Text style={styles.saveBtnText} numberOfLines={1}>
                  Ruaj prezencën
                </Text>
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

    /* ── Edit / delete ───────────────────────────────────────── */
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
    },

    editBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 32,
      paddingHorizontal: 12,
      backgroundColor: C.blueSoft,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    /* The whole phrase reads as a link, icon included. */
    editBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.text,
      textDecorationLine: 'underline',
    },

    delBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 32,
      paddingHorizontal: 12,
      backgroundColor: C.red,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    delBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.text,
    },

    /* ── Cards ───────────────────────────────────────────────── */
    card: {
      marginTop: 14,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 5,
      overflow: 'hidden',
    },

    /* The title is ruled off from the rows below it, like the other tables. */
    cardHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      paddingHorizontal: 10,
      paddingTop: 10,
      paddingBottom: 9,
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
    },

    cardTitle: {
      flexShrink: 1,
      fontFamily: Fonts.bodyBold,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.text,
    },

    /* ── Session details ─────────────────────────────────────── */
    /* Two label/value cells on a row, on the same rules as the tables. */
    detailRow: {
      alignItems: 'flex-start',
      gap: 10,
      paddingVertical: 8,
    },

    detailCell: {
      flex: 1,
    },

    detailLabel: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.hint,
    },

    detailValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 11.5,
      lineHeight: 16,
      color: C.text,
      marginTop: 2,
    },

    /* ── Attendance sheet ────────────────────────────────────── */
    tblInner: {
      paddingHorizontal: 10,
      paddingBottom: 10,
    },

    /* Stretches the rows to the card's width, so the rules run the full width
       instead of stopping where the last column ends. */
    tblFill: {
      flexGrow: 1,
    },

    headRow: {
      paddingTop: 10,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
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

    tdName: {
      fontFamily: Fonts.bodySemiBold,
    },

    /* ── Mark buttons ────────────────────────────────────────── */
    /* The header's shortcuts and every player's pair share one shape, so the
       two columns line up straight down the sheet. */
    allBtn: {
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
      borderWidth: 1,
      borderRadius: 4,
    },

    allBtnHead: {
      backgroundColor: 'transparent',
    },

    allPresent: {
      borderColor: C.green,
    },

    allAbsent: {
      borderColor: C.red,
    },

    /* The row of shortcuts is a heading, so its text stays quiet. */
    allText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 9.5,
      color: C.hint,
    },

    markBtn: {
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
      borderWidth: 1,
      borderRadius: 4,
    },

    /* The rows carry no colour of their own — a mark reads from its weight,
       not its hue. The coloured pair only heads the sheet. */
    markOff: {
      backgroundColor: 'transparent',
      borderColor: C.frame,
    },

    markOn: {
      backgroundColor: C.frame,
      borderColor: C.frame,
    },

    /* The row marks read as a choice, so they carry the full text colour; only
       the heading's two shortcuts stay quiet. */
    markText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10,
      color: C.text,
    },

    markTextOn: {
      color: '#FFFFFF',
    },

    /* ── Tally and save ──────────────────────────────────────── */
    /* Sits under the table's frame, on the page itself. */
    footRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginTop: 12,
    },

    footText: {
      fontFamily: Fonts.body,
      fontSize: 10,
      lineHeight: 13,
      color: C.hint,
    },

    saveBtn: {
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      backgroundColor: C.green,
      borderRadius: 4,
    },

    saveBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: '#FFFFFF',
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
