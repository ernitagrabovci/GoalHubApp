import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * One upcoming match, the trainer's own view — opened from "Shiko" on the
 * trainer's ndeshjet page. The fixture comes in as route params, so the page
 * always mirrors the row it was opened from.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',

  /* blue1 = the blue of the two row buttons; blue2 = the pale card blue. */
  blue1: '#E3EEFB',
  blue2: '#F6FBFF',

  frame: '#000000',
  border: 'rgba(100,140,190,0.30)',
  headLine: 'rgba(30,40,35,0.10)',

  green20: 'rgba(21,148,71,0.20)',
};

const SEASON_YEAR = '2026';

const INFO_LABELS = ['Kundershtari', 'Gara', 'Data', 'Vendodhja'];

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/** "AUG" → "Aug" for the readable date line. */
function monthName(mon: string): string {
  if (MONTHS.indexOf(mon.toUpperCase()) < 0) return mon;
  return mon.charAt(0).toUpperCase() + mon.slice(1).toLowerCase();
}

export default function TrainerMatchViewScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const params = useLocalSearchParams<{
    home?: string;
    away?: string;
    day?: string;
    mon?: string;
    time?: string;
    venue?: string;
    comp?: string;
  }>();

  const home = params.home ?? '';
  const away = params.away ?? '';
  const comp = params.comp ?? '';
  const title = away ? `${home} - ${away}` : home;

  /* The side we are not: the fixture is always listed with Prishtina in it. */
  const rival = home.includes('Prishtina') ? away : home;

  const day = `${params.day ?? ''} ${monthName(params.mon ?? '')} ${SEASON_YEAR}`.trim();
  const time = params.time ?? '';

  const values = [rival, comp, time ? `${day}, ${time}` : day, params.venue ?? ''];

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
                  {title}
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
            {/* ── Row actions ───────────────────────────────────── */}
            <View style={styles.actions}>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/cakto-formacion',
                    params: {
                      home,
                      away,
                      day: params.day ?? '',
                      mon: params.mon ?? '',
                      time,
                      venue: params.venue ?? '',
                      comp,
                    },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel="Cakto formacion"
                style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
              >
                <Text style={styles.actionText}>Cakto formacion</Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/fut-rezultatin', params: { home, away } })
                }
                accessibilityRole="button"
                accessibilityLabel="Fut rezultatin"
                style={({ pressed }) => [styles.actionBtn, pressed && styles.pressed]}
              >
                <Text style={styles.actionText}>Fut Rezultatin</Text>
              </Pressable>
            </View>

            {/* ── Informacioni / Statistikat ────────────────────── */}
            <View style={styles.duo}>
              {/* One table, two columns: the labels lead into the bold values. */}
              <View style={[styles.card, styles.duoCard]}>
                <View style={styles.head}>
                  <Text style={styles.headTextBlack}>Informacioni</Text>
                </View>
                <View style={styles.headLine} />

                {/* No rules between the pairs: the labels and values line up on
                    their own, and the deeper body holds them as one block. */}
                <View style={styles.infoBody}>
                  {INFO_LABELS.map((label, i) => (
                    <View key={label} style={styles.cellRow}>
                      <Text style={styles.cellLabel} numberOfLines={1}>
                        {label}
                      </Text>
                      <Text
                        style={styles.cellValue}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                      >
                        {values[i]}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={[styles.card, styles.duoCard]}>
                <View style={styles.head}>
                  <Text style={styles.headTextBlack} numberOfLines={2}>
                    Statistikat e lojtarëve
                  </Text>
                </View>
                <View style={styles.headLine} />

                <View style={[styles.notePad, styles.noteFill]}>
                  <Text style={styles.note}>Nuk ka statistika ende.</Text>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Shto statistika"
                    style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
                  >
                    <Text style={styles.addBtnText} numberOfLines={1}>
                      + Shto statistika
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* ── Formacioni ────────────────────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.head}>
                <Text style={styles.headTextBlack}>Formacioni</Text>
              </View>
              <View style={styles.headLine} />

              <View style={styles.notePad}>
                <Text style={styles.note}>Formacioni nuk është caktuar nga trajneri.</Text>
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

    /* ── Row actions ─────────────────────────────────────────── */
    /* Both are the same blue wash, black rim and black label. */
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
      marginTop: 12,
    },

    actionBtn: {
      height: 30,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.blue1,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    actionText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      color: C.text,
    },

    /* ── Cards ───────────────────────────────────────────────── */
    card: {
      backgroundColor: C.blue2,
      borderWidth: 2,
      borderColor: C.border,
      borderRadius: 7,
      overflow: 'hidden',
    },

    cardGap: {
      marginTop: 14,
    },

    /* Two cards on top, identical in width and height. */
    duo: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 8,
      marginTop: 14,
    },

    duoCard: {
      flex: 1,
    },

    head: {
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 10,
    },

    headTextBlack: {
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

    /* ── Informacioni rows ───────────────────────────────────── */
    /* A step deeper than the title strip above it, with no rules inside. */
    infoBody: {
      backgroundColor: C.blue1,
    },

    cellRow: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 34,
      paddingHorizontal: 10,
      gap: 6,
    },

    cellLabel: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 14,
      color: C.hint,
    },

    cellValue: {
      flex: 1,
      textAlign: 'right',
      fontFamily: Fonts.bodyBold,
      fontSize: 11,
      lineHeight: 14,
      color: C.text,
    },

    /* ── Empty states ────────────────────────────────────────── */
    /* The same step deeper as the Informacioni body, under a title strip that
       stays pale. */
    notePad: {
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 18,
      backgroundColor: C.blue1,
    },

    /* This card is stretched to its neighbour's height, so its body takes the
       slack instead of leaving a pale strip along the bottom. */
    noteFill: {
      flex: 1,
      justifyContent: 'center',
    },

    note: {
      textAlign: 'center',
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 15,
      color: C.hint,
    },

    /* Sits under the note, in the green wash the other add buttons use. */
    addBtn: {
      height: 28,
      marginTop: 14,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.green20,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    addBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: C.text,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
