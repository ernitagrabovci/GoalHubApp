import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * Femiu — one child's page, opened from the child's card on the parent home.
 *
 * The parent only watches, so this is a hub: the same six destinations a
 * player has, but read-only from the outside.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',

  white: '#FFFFFF',
  border: '#D9DEDB',

  /* The thin green rim around the menu. */
  greenBorder: '#4DBB7B',
};

/* =========================================================
   ASSETS
   ========================================================= */

const IMG = {
  profili: require('@/assets/dashboard/lojtaret.png'),
  prezenca: require('@/assets/dashboard/prezenca.jpg'),
  vleresimet: require('@/assets/dashboard/star.png'),
  kuotat: require('@/assets/dashboard/pagesat-art.png'),
  stervitjet: require('@/assets/dashboard/trajnimet.png'),
  ndeshjet: require('@/assets/dashboard/ndeshjet.png'),
};

export default function ChildScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const params = useLocalSearchParams<{
    name?: string;
    team?: string;
    number?: string;
    status?: string;
  }>();

  const name = params.name ?? 'Fëmija';
  const team = params.team ?? 'Ekipi i parë';
  const number = params.number ?? '';
  const status = params.status ?? 'Aktiv';

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
                  {`${team} • Nr ${number} • ${status}`}
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
            <View style={styles.menuWrap}>
              {/* THIN GREEN FRAME */}
              <View style={styles.menuContainer}>
                {MENU.map((card) => {
                  const face = (
                    <>
                      {/* CARD TITLE */}
                      <Text
                        style={styles.menuTitle}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                      >
                        {card.title}
                      </Text>

                      {/* CARD IMAGE — decorative, bottom-left, clipped by the card */}
                      <Image source={card.img} style={card.imgStyle} resizeMode="contain" />

                      {/* CONTINUE BUTTON */}
                      <View style={[styles.vazhdo, { backgroundColor: card.btnBg }]}>
                        <Text style={[styles.vazhdoText, { color: card.btnColor }]}>
                          Vazhdo
                        </Text>
                      </View>
                    </>
                  );

                  const skin = [
                    styles.menuCard,
                    { backgroundColor: card.bg, borderColor: card.border },
                  ];

                  const route = card.route;

                  /* Cards without a destination are display-only. */
                  if (!route) {
                    return (
                      <View key={card.id} style={skin}>
                        {face}
                      </View>
                    );
                  }

                  return (
                    <Pressable
                      key={card.id}
                      onPress={() =>
                        router.push({
                          pathname: route,
                          params: { name, team, nr: number },
                        })
                      }
                      accessibilityRole="button"
                      accessibilityLabel={card.title}
                      style={({ pressed }) => [...skin, pressed && styles.pressed]}
                    >
                      {face}
                    </Pressable>
                  );
                })}
              </View>

              {/* MENU TAB */}
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

    /* ── Menu ────────────────────────────────────────────────── */
    menuWrap: {
      position: 'relative',

      /* Clears the pill sitting above the frame. */
      marginTop: 40,
    },

    menuContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',

      backgroundColor: C.white,

      borderWidth: 1,
      borderColor: C.greenBorder,

      borderRadius: 8,

      padding: 8,

      columnGap: 10,
      rowGap: 12,
    },

    menuCard: {
      width: '48%',

      height: 104,

      position: 'relative',

      borderRadius: 9,

      borderWidth: 1,

      overflow: 'hidden',
    },

    menuTitle: {
      position: 'absolute',

      top: 14,
      left: 10,
      right: 10,

      fontFamily: Fonts.bodyBlack,

      fontSize: 18,
      lineHeight: 19,

      letterSpacing: 0.3,

      color: C.text,

      zIndex: 3,
    },

    /*
     * The images are intentionally NOT centered: they are oversized
     * decorative elements the card clips with overflow: hidden.
     */
    menuImgProfili: {
      position: 'absolute',
      width: 100,
      height: 100,
      left: -28,
      bottom: -36,
      zIndex: 1,
    },

    menuImgPrezenca: {
      position: 'absolute',
      width: 104,
      height: 104,
      left: -30,
      bottom: -34,
      zIndex: 1,
    },

    menuImgVleresimet: {
      position: 'absolute',
      width: 84,
      height: 84,
      left: -16,
      bottom: -16,
      zIndex: 1,
    },

    menuImgKuotat: {
      position: 'absolute',
      width: 104,
      height: 140,
      left: -34,
      bottom: -34,
      zIndex: 1,
    },

    menuImgStervitjet: {
      position: 'absolute',
      width: 116,
      height: 116,
      left: -48,
      bottom: -8,
      zIndex: 1,
    },

    menuImgNdeshjet: {
      position: 'absolute',
      width: 100,
      height: 100,
      left: -34,
      bottom: -42,
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
    },

    /* The pill's full height sits above the frame, so its bottom edge lands
       exactly on the frame's top line. */
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
      borderColor: C.border,

      /* Open at the bottom so the pill and the frame share one line. */
      borderBottomWidth: 0,

      borderTopLeftRadius: 7,
      borderTopRightRadius: 7,

      alignItems: 'center',
      justifyContent: 'center',
    },

    menuPillText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.text,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);

/* =========================================================
   MENU DATA
   ========================================================= */

type MenuCard = {
  id: string;
  title: string;

  bg: string;
  border: string;

  btnBg: string;
  btnColor: string;

  img: number;
  imgStyle: object;

  /* Omitted while the destination does not exist yet — the card stays a
     display-only tile until it does. */
  route?:
    | '/profili-femiut'
    | '/prezenca-femiut'
    | '/vleresimet-femiut'
    | '/kuotat-femiut'
    | '/stervitjet-femiut'
    | '/ndeshjet-femiut';
};

/**
 * The child's six destinations, 2-column grid, in reading order:
 *
 * Profili       Prezenca
 * Vlerësimet    Kuotat
 * Stërvitjet    Ndeshjet
 */

const MENU: MenuCard[] = [
  {
    id: 'profili',
    title: 'Profili',

    bg: '#FFF2F2',
    border: '#F6D5D5',

    btnBg: '#D94B4B',
    btnColor: '#FFFFFF',

    img: IMG.profili,
    imgStyle: styles.menuImgProfili,

    route: '/profili-femiut',
  },
  {
    id: 'prezenca',
    title: 'Prezenca',

    bg: '#E8F3FF',
    border: '#C6E0FA',

    btnBg: '#78B8F5',
    btnColor: '#FFFFFF',

    img: IMG.prezenca,
    imgStyle: styles.menuImgPrezenca,

    route: '/prezenca-femiut',
  },
  {
    id: 'vleresimet',
    title: 'Vlerësimet',

    bg: '#F8EBD8',
    border: '#F0D9AE',

    btnBg: '#D99A4A',
    btnColor: '#FFFFFF',

    img: IMG.vleresimet,
    imgStyle: styles.menuImgVleresimet,

    route: '/vleresimet-femiut',
  },
  {
    id: 'kuotat',
    title: 'Kuotat',

    bg: '#EFE9FB',
    border: '#D9C9F2',

    btnBg: '#7B5FD9',
    btnColor: '#FFFFFF',

    img: IMG.kuotat,
    imgStyle: styles.menuImgKuotat,

    route: '/kuotat-femiut',
  },
  {
    id: 'stervitjet',
    title: 'Stërvitjet',

    bg: '#E7F6EC',
    border: '#BFE7CD',

    btnBg: '#2E9E5B',
    btnColor: '#FFFFFF',

    img: IMG.stervitjet,
    imgStyle: styles.menuImgStervitjet,

    route: '/stervitjet-femiut',
  },
  {
    id: 'ndeshjet',
    title: 'Ndeshjet',

    bg: '#FDECF2',
    border: '#F3C2D2',

    btnBg: '#E34D63',
    btnColor: '#FFFFFF',

    img: IMG.ndeshjet,
    imgStyle: styles.menuImgNdeshjet,

    route: '/ndeshjet-femiut',
  },
];
