import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * Video Strategjia — opened from the card of the same name on the trainer's
 * Akademia page. The uploaded clips, laid out as a thumbnail grid inside the
 * green-ruled tray the other menus use.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',

  /* The thin, see-through tray and its tab. */
  tray: '#4DBB7B',
  white: '#FFFFFF',

  /* The button rims, and the play glyph at the heart of each card. */
  frame: '#000000',
  green20: 'rgba(21,148,71,0.20)',
};

/**
 * Each clip wears its level's colour: the tone at 20% laid flat on the page
 * (so the card is opaque, not a wash showing the texture through), and the
 * same tone at full strength for its rim and for the level word itself.
 */
const TONES = {
  green: { bg: '#CCE6D6', solid: '#159447' },
  blue: { bg: '#E3EEFB', solid: '#86BCFD' },
  purple: { bg: '#EBE8FA', solid: '#B09AF9' },
};

type Tone = keyof typeof TONES;

type Video = {
  id: string;
  title: string;
  level: string;
  category: string;
  tone: Tone;
};

const VIDEOS: Video[] = [
  {
    id: 'pasim',
    title: 'Stërvitje pasim - Niveli fillestar',
    level: 'Fillestar',
    category: 'Teknika',
    tone: 'green',
  },
  {
    id: 'presing',
    title: 'Presing i lartë - Niveli mesëm',
    level: 'Mesëm',
    category: 'Taktika',
    tone: 'blue',
  },
  {
    id: 'koordinim',
    title: 'Koordinim me shkallë - Niveli fillestar',
    level: 'Fillestar',
    category: 'Fizike',
    tone: 'green',
  },
  {
    id: 'ndertim',
    title: 'Ndërtimi i lojës - Niveli avancuar',
    level: 'Avancuar',
    category: 'Taktika',
    tone: 'purple',
  },
];

export default function StrategicVideoScreen() {
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
                <Text style={styles.title} numberOfLines={1}>
                  Video Strategjia
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Analiza video dhe skenare taktike
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
            {/* ── Ngarko video ──────────────────────────────────── */}
            <Pressable
              onPress={() => router.push('/ngarko-video-trajner' as never)}
              accessibilityRole="button"
              accessibilityLabel="Ngarko video"
              style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
            >
              <Text style={styles.addText} numberOfLines={1}>
                + Ngarko video
              </Text>
            </Pressable>

            <View style={styles.trayWrap}>
              {/* A thin see-through tray, ruled in green. */}
              <View style={styles.tray}>
                {VIDEOS.map((v) => {
                  const tone = TONES[v.tone];
                  return (
                    <Pressable
                      key={v.id}
                      onPress={() => router.push('/detajet-video-trajner' as never)}
                      accessibilityRole="button"
                      accessibilityLabel={v.title}
                      style={({ pressed }) => [
                        styles.card,
                        { backgroundColor: tone.bg, borderColor: tone.solid },
                        pressed && styles.pressed,
                      ]}
                    >
                      {/* The play mark sits centred in the space above the text. */}
                      <View style={styles.playArea}>
                        <MaterialCommunityIcons name="play" size={I(36)} color={C.frame} />
                      </View>

                      <Text
                        style={styles.cardTitle}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.65}
                      >
                        {v.title}
                      </Text>

                      <View style={styles.meta}>
                        <Text style={[styles.metaLevel, { color: tone.solid }]} numberOfLines={1}>
                          {v.level}
                        </Text>
                        <Text style={styles.metaDot}> • </Text>
                        <Text style={styles.metaCategory} numberOfLines={1}>
                          {v.category}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* The tray's tab label, riding on its top rim. */}
              <View style={styles.pillWrap} pointerEvents="none">
                <View style={styles.pill}>
                  <Text style={styles.pillText}>Videot e ngarkuara</Text>
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

    /* ── Ngarko video ────────────────────────────────────────── */
    /* Hugs its own label, pinned to the left rather than spanning the page. */
    addBtn: {
      alignSelf: 'flex-start',
      minHeight: 34,
      marginTop: 12,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      backgroundColor: C.green20,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    addText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12,
      color: C.text,
    },

    /* ── Tray ────────────────────────────────────────────────── */
    /* Room above the tray for the tab to sit on its rim. */
    trayWrap: {
      position: 'relative',
      marginTop: 54,
    },

    tray: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      borderWidth: 1,
      borderColor: C.tray,
      backgroundColor: 'transparent',
      borderRadius: 8,
      padding: 8,
      columnGap: 10,
      rowGap: 10,
    },

    /* ── Video cards ─────────────────────────────────────────── */
    /* Cut to the same block as the dashboard's menu cards. */
    card: {
      width: '48%',
      height: 100,
      paddingHorizontal: 8,
      paddingTop: 6,
      paddingBottom: 7,
      borderRadius: 9,
      borderWidth: 1,
    },

    /* Takes the slack, so the play mark stays centred above the text block. */
    playArea: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },

    cardTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.text,
    },

    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },

    metaLevel: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 9.5,
      lineHeight: 12,
    },

    metaDot: {
      fontFamily: Fonts.body,
      fontSize: 9.5,
      lineHeight: 12,
      color: C.gray,
    },

    metaCategory: {
      fontFamily: Fonts.body,
      fontSize: 9.5,
      lineHeight: 12,
      color: C.gray,
    },

    /* ── Tray tab ────────────────────────────────────────────── */
    pillWrap: {
      position: 'absolute',
      top: -28,
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 10,
    },

    pill: {
      height: 28,
      paddingHorizontal: 14,
      backgroundColor: C.white,
      borderWidth: 1,
      borderColor: C.tray,
      borderTopLeftRadius: 7,
      borderTopRightRadius: 7,
      alignItems: 'center',
      justifyContent: 'center',
    },

    pillText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13,
      lineHeight: 16,
      color: C.text,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
