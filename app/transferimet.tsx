import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * Transferimet — opened from the "Transferimet" card on "Lista e ekipeve".
 *
 * Same light #FAFBFA canvas. A blue "Transferim i shpejtë" form card up top,
 * then the "Lojtarët sipas ekipit" table, whose blank rows fill the page down
 * to the outlined footer button — the page itself never scrolls.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',

  card: '#F6FBFF',
  border: 'rgba(100,140,190,0.30)',
  rowLine: 'rgba(100,140,190,0.22)',
  headLine: 'rgba(30,40,35,0.10)',

  green: '#159447',

  ghost: '#9E9E9E',
  ghostLine: '#D6D6D6',
};

type Col = { key: string; label: string; width: number };

const COLS: Col[] = [
  { key: 'name', label: 'Emri', width: 54 },
  { key: 'team', label: 'Ekipi aktual', width: 80 },
  { key: 'pos', label: 'Pozicioni', width: 62 },
  { key: 'nr', label: 'Nr.', width: 22 },
];

export default function TransferimetScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const [tableH, setTableH] = useState(0);
  const rowH = I(36);
  const emptyRows = Math.max(2, Math.floor(tableH / rowH) - 1);

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
                  Transferimet e lojtarëve
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Lëviz lojtarë ndërmjet ekipeve
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={[styles.colPad, styles.bodyCol]}>
            {/* ── Transferim i shpejtë ───────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Transferim i shpejtë</Text>
              </View>

              <View style={styles.form}>
                <View style={styles.formRow}>
                  <View style={styles.formCol}>
                    <Text style={styles.label}>Lojtari:</Text>
                    <TextInput style={styles.input} placeholderTextColor={C.gray} />
                  </View>
                  <View style={styles.formCol}>
                    <Text style={styles.label}>Ekipi i ri:</Text>
                    <TextInput style={styles.input} placeholderTextColor={C.gray} />
                  </View>
                </View>

                <View style={[styles.formRow, styles.formRowEnd]}>
                  <View style={styles.formCol}>
                    <Text style={styles.label}>Arsye:</Text>
                    <TextInput style={styles.input} placeholderTextColor={C.gray} />
                  </View>
                  <View style={[styles.formCol, styles.formColEnd]}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Transfero lojtarin"
                      style={({ pressed }) => [styles.goBtn, pressed && styles.pressed]}
                    >
                      <Text style={styles.goBtnText}>Transfero</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>

            {/* ── Lojtarët sipas ekipit ─────────────────────────── */}
            <View style={[styles.card, styles.tableCard]}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Lojtarët sipas ekipit</Text>
              </View>

              <View
                style={styles.tblWrap}
                onLayout={(e) => setTableH(e.nativeEvent.layout.height)}
              >
                <View style={styles.tr}>
                  {COLS.map((c, i) => (
                    <Text
                      key={c.key}
                      style={[
                        styles.th,
                        i === 0 && styles.thFirst,
                        i === COLS.length - 1 && styles.thLast,
                        { width: c.width },
                      ]}
                    >
                      {c.label}
                    </Text>
                  ))}
                </View>

                {Array.from({ length: emptyRows }).map((_, i) => (
                  <View key={i} style={[styles.tr, styles.trBorder]}>
                    <View style={styles.rowSpacer} />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Transfero"
                      style={({ pressed }) => [styles.rowBtn, pressed && styles.pressed]}
                    >
                      <Text style={styles.rowBtnText}>Transfero</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
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

    /* Page body — fills the screen, so the page never scrolls vertically. */
    body: {
      flex: 1,
      minHeight: 0,
    },

    bodyCol: {
      flex: 1,
      minHeight: 0,
    },

    /* ── Shared table card ───────────────────────────────────── */
    card: {
      backgroundColor: C.card,
      borderWidth: 2,
      borderColor: C.border,
      borderRadius: 7,
      overflow: 'hidden',
    },

    tableCard: {
      flex: 1,
      minHeight: 0,
      marginTop: 14,
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
      color: C.text,
    },

    /* ── Transferim i shpejtë form ───────────────────────────── */
    form: {
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 14,
    },

    formRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 12,
    },

    /* Lets the "Transfero" button sit level with the Arsye input. */
    formRowEnd: {
      alignItems: 'flex-end',
      marginBottom: 0,
    },

    formCol: {
      flex: 1,
    },

    /* Keeps the "Arsye" input as wide as the "Lojtari" one. */
    formColEnd: {
      alignItems: 'flex-end',
    },

    label: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 15,
      color: C.gray,
      marginBottom: 5,
    },

    input: {
      height: 32,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
      paddingHorizontal: 9,
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 15,
      color: C.text,
    },

    goBtn: {
      height: 32,
      paddingHorizontal: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.green,
      borderRadius: 4,
    },

    goBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12.5,
      color: '#FFFFFF',
    },

    /* ── Lojtarët sipas ekipit table ─────────────────────────── */
    /* Rows area — measured so the blank rows can fill it exactly. */
    tblWrap: {
      flex: 1,
      minHeight: 0,
      paddingHorizontal: 8,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 36,
    },

    /* Pushes each row's action to the right end, clear of the columns. */
    rowSpacer: {
      flex: 1,
    },

    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    th: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      lineHeight: 14,
      color: C.gray,
      textAlign: 'center',
    },

    /* "Emri" sits at the start of the row, a little off the table's edge. */
    thFirst: {
      textAlign: 'left',
    },

    /* "Nr." is pushed to the far right of the row. */
    thLast: {
      textAlign: 'right',
    },

    /* ── Per-row outlined action ─────────────────────────────── */
    rowBtn: {
      height: 24,
      paddingHorizontal: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.ghostLine,
      borderRadius: 4,
    },

    rowBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: C.ghost,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
