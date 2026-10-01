import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * One clip, opened from the play mark on a Video Strategjia card. The
 * description up top, then the clip's facts beside the level it is filed
 * under — that level restated on its own, big, in a green card.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',

  frame: '#000000',
  headLine: 'rgba(30,40,35,0.10)',

  /* blue1 = the deeper card body; blue2 = the pale title strip. */
  blue1: '#E3EEFB',
  blue2: '#F6FBFF',

  green: '#159447',
};

/** The level this clip is filed under. */
const LEVEL = 'Fillestar';

/**
 * Each level owns a colour: the rim at full strength, the wash at 20%. The
 * level card reads its tone from here, so moving a clip between levels only
 * means changing LEVEL.
 */
const LEVEL_TONES: Record<string, { rim: string; wash: string }> = {
  Fillestar: { rim: '#159447', wash: 'rgba(21,148,71,0.20)' },
  Mesëm: { rim: '#2F80ED', wash: 'rgba(47,128,237,0.20)' },
  Avancuar: { rim: '#B09AF9', wash: 'rgba(176,154,249,0.20)' },
};

const TONE = LEVEL_TONES[LEVEL];

/** The clip's facts, in the order they are stacked in the Detajet card. */
const DETAILS: { label: string; value: string; green?: boolean }[] = [
  { label: 'Niveli', value: LEVEL },
  { label: 'Kategoria', value: 'Teknika' },
  { label: 'Lloji', value: 'MP4' },
  { label: 'Trajneri', value: 'Rexhep Hyseni' },
  { label: 'Shpërndarë', value: 'PO', green: true },
];

export default function VideoDetailScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

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
                <View style={styles.titleRow}>
                  <MaterialCommunityIcons name="play" size={I(20)} color={C.text} />
                  <Text style={styles.title} numberOfLines={1}>
                    Dribling 1v1 - ushtrime
                  </Text>
                </View>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {`${LEVEL} • Teknika • 12/08/2026`}
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
            {/* ── Përshkrimi ────────────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.head}>
                <Text style={styles.headText} numberOfLines={1}>
                  Përshkrimi
                </Text>
              </View>
              <View style={styles.headLine} />

              <View style={styles.body}>
                <Text style={styles.desc}>material i ndarë për ekipin</Text>
              </View>
            </View>

            {/* ── Detajet beside the level ──────────────────────── */}
            <View style={styles.twoRow}>
              <View style={[styles.card, styles.detailCard]}>
                <View style={[styles.head, styles.detailHead]}>
                  <Text style={styles.headText} numberOfLines={1}>
                    Detajet
                  </Text>
                </View>
                <View style={styles.headLine} />

                <View style={[styles.body, styles.detailBody]}>
                  {DETAILS.map((d) => (
                    <DetailRow key={d.label} label={d.label} value={d.value} green={d.green} />
                  ))}
                </View>
              </View>

              {/* The level, restated on its own in its own colour. */}
              <View
                style={[
                  styles.levelCard,
                  { backgroundColor: TONE.wash, borderColor: TONE.rim },
                ]}
              >
                <Text style={styles.levelValue} numberOfLines={1}>
                  {LEVEL}
                </Text>
                <Text style={styles.levelLabel}>Niveli i materialit</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* One line of the Detajet card                                        */
/* ------------------------------------------------------------------ */

function DetailRow({
  label,
  value,
  green,
}: {
  label: string;
  value: string;
  green?: boolean;
}) {
  return (
    <View style={styles.dRow}>
      <Text style={styles.dLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[styles.dValue, green && styles.dValueGreen]} numberOfLines={1}>
        {value}
      </Text>
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

    /* The play mark rides ahead of the title, the way the card shows it. */
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },

    title: {
      flexShrink: 1,
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

    /* ── Cards ───────────────────────────────────────────────── */
    /* A hairline rim — the black should read as an edge, not a frame. */
    card: {
      marginTop: 14,
      backgroundColor: C.blue2,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 7,
      overflow: 'visible',
    },

    head: {
      alignItems: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 11,
      backgroundColor: C.blue2,
      borderTopLeftRadius: 6,
      borderTopRightRadius: 6,
    },

    headText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 14,
      lineHeight: 18,
      color: C.text,
    },

    headLine: {
      height: 1,
      backgroundColor: C.headLine,
    },

    body: {
      backgroundColor: C.blue1,
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 14,
      borderBottomLeftRadius: 6,
      borderBottomRightRadius: 6,
    },

    desc: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 18,
      color: C.text,
    },

    /* ── Detajet beside the level ────────────────────────────── */
    twoRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 10,
    },

    detailCard: {
      flex: 1.6,
    },

    /* Cut shorter than the Përshkrimi card above it, so the pair sits low. */
    detailHead: {
      paddingVertical: 8,
    },

    detailBody: {
      paddingTop: 8,
      paddingBottom: 8,
    },

    dRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
      minHeight: 19,
    },

    dLabel: {
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 14,
      color: C.gray,
    },

    dValue: {
      flexShrink: 1,
      textAlign: 'right',
      fontFamily: Fonts.bodyBold,
      fontSize: 11,
      lineHeight: 14,
      color: C.text,
    },

    /* Only the shared-with-the-team flag is coloured. */
    dValueGreen: {
      color: C.green,
    },

    /* Rim and wash both come from the level's tone, applied inline. */
    levelCard: {
      flex: 1,
      marginTop: 14,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
      paddingVertical: 12,
      borderWidth: 2,
      borderRadius: 7,
    },

    levelValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 20,
      lineHeight: 24,
      color: C.text,
    },

    levelLabel: {
      textAlign: 'center',
      fontFamily: Fonts.body,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.text,
      marginTop: 6,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
