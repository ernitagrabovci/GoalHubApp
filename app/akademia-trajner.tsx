import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * Akademia, the trainer's own view — opened from the "Akademia" card on the
 * trainer dashboard. A "Menu" tray holding four ways into the coaching
 * material, each card cut like the dashboard's menu cards: the picture in the
 * bottom-left corner, the title up top, the Vazhdo button bottom-right.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',

  /* The thin, see-through tray the four cards sit in. */
  tray: '#4DBB7B',
  trayBg: 'transparent',
  white: '#FFFFFF',
};

/* ---------------------------------------------------------------- */
/* The four cards                                                     */
/* ---------------------------------------------------------------- */

type Card = {
  id: string;
  title: string;
  /* Absent while a section has no page of its own yet. */
  route?: string;
  /* Card wash, rim and the Vazhdo button's fill. */
  bg: string;
  border: string;
  btnBg: string;
  img: number;
  imgStyle: object;
};

export default function TrainerAcademyScreen() {
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
                  Akademia
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Ushtrime, video dhe materiale
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
            {/* ── Menu ──────────────────────────────────────────── */}
            <View style={styles.menuWrap}>
              {/* A thin see-through tray, ruled in green. */}
              <View style={styles.menuTray}>
                {CARDS.map((card) => (
                  <Pressable
                    key={card.id}
                    onPress={card.route ? () => router.push(card.route as never) : undefined}
                    accessibilityRole="button"
                    accessibilityLabel={card.title}
                    style={({ pressed }) => [
                      styles.card,
                      { backgroundColor: card.bg, borderColor: card.border },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text
                      style={styles.cardTitle}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.6}
                    >
                      {card.title}
                    </Text>

                    {/* Oversized decorative picture, clipped by the card. */}
                    <Image source={card.img} style={card.imgStyle} resizeMode="contain" />

                    <View style={[styles.vazhdo, { backgroundColor: card.btnBg }]}>
                      <Text style={styles.vazhdoText} numberOfLines={1}>
                        Vazhdo
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>

              {/* The tray's tab label, riding on its top rim. */}
              <View style={styles.menuPillWrap} pointerEvents="none">
                <View style={styles.menuPill}>
                  <Text style={styles.menuPillText}>Menu</Text>
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

    /* ── Menu tray ───────────────────────────────────────────── */
    /* Room above the tray for the "Menu" tab to sit on its rim. */
    menuWrap: {
      position: 'relative',
      marginTop: 54,
    },

    menuTray: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      borderWidth: 1,
      borderColor: C.tray,
      backgroundColor: C.trayBg,
      borderRadius: 8,
      padding: 8,
      columnGap: 10,
      rowGap: 10,
    },

    /* ── Cards ───────────────────────────────────────────────── */
    card: {
      width: '48%',
      height: 100,
      position: 'relative',
      borderRadius: 9,
      borderWidth: 1,
      overflow: 'hidden',
    },

    cardTitle: {
      position: 'absolute',
      top: 14,
      left: 10,
      right: 10,
      fontFamily: Fonts.bodyBlack,
      fontSize: 20,
      lineHeight: 21,
      letterSpacing: 0.3,
      color: C.text,
      zIndex: 3,
    },

    /* Oversized on purpose and pinned to the bottom-left corner; the card's
       overflow clips whatever runs past its foot and left edge. */
    cardImg: {
      position: 'absolute',
      width: 100,
      height: 100,
      left: -25,
      bottom: -35,
      zIndex: 1,
    },

    vazhdo: {
      position: 'absolute',
      right: 8,
      bottom: 7,
      minWidth: 66,
      height: 28,
      borderRadius: 5,
      paddingHorizontal: 9,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 5,
    },

    vazhdoText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11,
      lineHeight: 14,
      color: C.white,
    },

    /* ── Menu tab ────────────────────────────────────────────── */
    /* Lifted clear of the tray, so the tab's foot rests on the rim instead of
       hanging down into the cards. */
    menuPillWrap: {
      position: 'absolute',
      top: -28,
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 10,
    },

    menuPill: {
      width: 100,
      height: 28,
      backgroundColor: C.white,
      borderWidth: 1,
      borderColor: C.tray,
      borderTopLeftRadius: 7,
      borderTopRightRadius: 7,
      alignItems: 'center',
      justifyContent: 'center',
    },

    menuPillText: {
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

/* ------------------------------------------------------------------ */
/* Card data                                                           */
/* ------------------------------------------------------------------ */

/**
 * Two per row, in this order:
 *
 * Libraria        Video strategjike
 * Planet e sesioneve  Ushtrime
 */

const CARDS: Card[] = [
  {
    id: 'libraria',
    title: 'Libraria',
    route: '/libraria-trajner',
    bg: '#FFF2F2',
    border: '#F6CFCF',
    btnBg: '#D94B4B',
    img: require('@/assets/dashboard/akademia.png'),
    imgStyle: styles.cardImg,
  },
  {
    id: 'video',
    title: 'Video strategjike',
    route: '/video-strategjike-trajner',
    bg: '#F8EBD8',
    border: '#F0D9AE',
    btnBg: '#D99A4A',
    img: require('@/assets/dashboard/tabela-taktike.png'),
    imgStyle: styles.cardImg,
  },
  {
    id: 'sesionet',
    title: 'Planet e sesioneve',
    route: '/planet-sesioneve-trajner',
    bg: '#E8F3FF',
    border: '#C6E0FA',
    btnBg: '#78B8F5',
    img: require('@/assets/dashboard/trajnimet.png'),
    imgStyle: styles.cardImg,
  },
  {
    id: 'ushtrime',
    title: 'Ushtrime',
    route: '/ushtrimet-trajner',
    bg: '#FFF2F2',
    border: '#F6CFCF',
    btnBg: '#D94B4B',
    img: require('@/assets/dashboard/ushtrimet.png'),
    imgStyle: styles.cardImg,
  },
];
