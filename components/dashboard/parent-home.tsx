import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * GoalHub Parent Home Dashboard (Prindi)
 *
 * Light-only, fixed-dp, mirrors the trainer/player dashboard visual language
 * (389 x 873 reference) but with a parent-specific structure:
 * - greeting with the signed-in parent's name
 * - stats carousel (registered children / open fees / active injuries)
 * - next-training event bar
 * - dark-green child summary card (Agon Gashi) — NOT on the trainer screen
 * - a compact centered 3-card menu (Ndeshjet / Trajnimet / Pagesat)
 * - bottom Home / Chat navigation remains in the (tabs) layout
 *
 * Important:
 * - Images are decorative foreground elements (absolute, cropped, overflow
 *   hidden). Do NOT center them or give them their own white boxes.
 * - Content is intentionally compact so it fits without scrolling.
 */

const C = {
  bg: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  white: '#FFFFFF',
  text: '#111111',

  gray: '#666666',
  muted: '#888888',

  border: '#D9DEDB',
  cardBorder: 'rgba(30,40,35,0.10)',

  green: '#159447',
  greenBorder: '#4DBB7B',
  lightGreen: '#DDF6E7',
  veryLightGreen: '#F1FBF5',
  profileBg: '#E0F6E9',

  greenDeep: '#14734F',
  greenDark: '#0C6C36',
};

/* =========================================================
   ASSETS
   ========================================================= */

const IMG = {
  /* Brand */
  fcp: require('@/assets/dashboard/fcp.png'),

  /* Statistics */
  statPlayer: require('@/assets/dashboard/lojtaret.png'),
  statCalc: require('@/assets/dashboard/stat-calculator.png'),
  ball: require('@/assets/dashboard/ndeshjet.png'),

  /* Main menu */
  ndeshjet: require('@/assets/dashboard/ndeshjet.png'),
  trajnimet: require('@/assets/dashboard/trajnimet.png'),
  pagesatArt: require('@/assets/dashboard/pagesat-art.png'),
};

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export function ParentHome() {
  const router = useRouter();
  const { user } = useSession();

  const open = (route: string) => {
    router.push(route as never);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.content}>

          {/* =================================================
              BACKGROUND VERTICAL LINES
             ================================================= */}

          <View pointerEvents="none" style={styles.lines}>
            {Array.from({ length: 50 }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.line,
                  {
                    left: index * 9,
                  },
                ]}
              />
            ))}
          </View>

          {/* =================================================
              HEADER + GREETING
             ================================================= */}

          <View style={styles.padded}>
            <HeaderBlock
              onBell={() => open('/notifications')}
              onSettings={() => open('/profile')}
            />

            <View style={styles.welcome}>
              <Text style={styles.welcomeTitle}>
                Dashboard!
              </Text>

              <Text style={styles.welcomeSub} numberOfLines={1}>
                Mirë se vini, {user?.name ?? ''}
              </Text>
            </View>
          </View>

          {/* =================================================
              STATISTICS CAROUSEL
             ================================================= */}

          <View style={styles.statsWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={styles.statsRow}
            >
              <StatCard
                labelTop="Fëmijë të"
                labelBottom="regjistruar"
                value="1"
                img={IMG.statPlayer}
                imgStyle={styles.statImgPlayer}
                imgCover
              />

              <StatCard
                labelTop="Kuota të"
                labelBottom="hapura"
                value="2"
                img={IMG.statCalc}
                imgStyle={styles.statImgCalc}
              />

              <StatCard
                labelTop="Lëndimet"
                labelBottom="aktive"
                value="0"
                img={IMG.ball}
                imgStyle={styles.statImgBall}
              />

              <StatCard
                labelTop="Vlerësimi"
                labelBottom="i fundit"
                value="6.9"
              />
            </ScrollView>
          </View>

          {/* =================================================
              NEXT TRAINING (full content width)
             ================================================= */}

          <View style={styles.padded}>
            <Pressable
              onPress={() => open('/trainings')}
              style={({ pressed }) => [
                styles.eventBar,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.eventIcon}>
                <MaterialCommunityIcons
                  name="calendar-month-outline"
                  size={I(18)}
                  color={C.green}
                />
              </View>

              <View style={styles.eventBody}>
                <Text style={styles.eventLabel}>
                  Tjetra
                </Text>

                <Text
                  style={styles.eventText}
                  numberOfLines={1}
                >
                  29 GUSHT • 09:00 • Trajnim Taktik
                </Text>
              </View>

              <MaterialCommunityIcons
                name="chevron-right"
                size={I(21)}
                color={C.green}
              />
            </Pressable>
          </View>

          {/* =================================================
              CHILD SUMMARY CARD (full content width)
             ================================================= */}

          <View style={styles.padded}>
            <Pressable
              onPress={() => open('/child')}
              style={({ pressed }) => [
                styles.childCard,
                pressed && styles.pressed,
              ]}
            >
              {/* DECORATIVE GIANT NUMBER */}
              <Text style={styles.childDeco}>
                9
              </Text>

              <View style={styles.childBody}>
                <Text style={styles.childEyebrow}>
                  Prind
                </Text>

                <Text style={styles.childName} numberOfLines={1}>
                  Agon Gashi
                </Text>

                <View style={styles.childChips}>
                  <View style={styles.chipAktiv}>
                    <Text style={styles.chipAktivText}>
                      Aktiv
                    </Text>
                  </View>

                  <View style={styles.chipRating}>
                    <MaterialCommunityIcons
                      name="star"
                      size={I(12)}
                      color="#F5C04A"
                    />
                    <Text style={styles.chipRatingText}>
                      6.9
                    </Text>
                  </View>
                </View>
              </View>

              <MaterialCommunityIcons
                name="chevron-right"
                size={I(22)}
                color="rgba(255,255,255,0.85)"
                style={styles.childChevron}
              />
            </Pressable>
          </View>

          {/* =================================================
              MENU
             ================================================= */}

          <View style={styles.padded}>

          <View style={styles.menuWrap}>

            {/* MAIN GREEN BORDER */}

            <View style={styles.menuContainer}>

              {MENU.map((card) => (
                <Pressable
                  key={card.id}
                  onPress={() => open(card.route)}
                  style={({ pressed }) => [
                    styles.menuCard,
                    {
                      backgroundColor: card.bg,
                      borderColor: card.border,
                    },
                    pressed && styles.pressed,
                  ]}
                >

                  {/* CARD TITLE */}

                  <Text
                    style={styles.menuTitle}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    {card.title}
                  </Text>

                  {/* CARD IMAGE */}

                  {card.img ? (
                    <Image
                      source={card.img}
                      style={card.imgStyle}
                      resizeMode="contain"
                    />
                  ) : null}

                  {/* CONTINUE BUTTON */}

                  <View
                    style={[
                      styles.vazhdo,
                      {
                        backgroundColor: card.btnBg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.vazhdoText,
                        {
                          color: card.btnColor,
                        },
                      ]}
                    >
                      Vazhdo
                    </Text>
                  </View>

                </Pressable>
              ))}

            </View>

            {/* MENU TAB */}

            <View
              style={styles.menuPillWrap}
              pointerEvents="none"
            >
              <View style={styles.menuPill}>
                <Text style={styles.menuPillText}>
                  Menu
                </Text>
              </View>
            </View>

          </View>

          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* =========================================================
   HEADER
   ========================================================= */

function HeaderBlock({
  onBell,
  onSettings,
}: {
  onBell: () => void;
  onSettings: () => void;
}) {
  return (
    <View style={styles.header}>

      {/* FC PRISHTINA LOGO */}

      <Image
        source={IMG.fcp}
        style={styles.headerLogo}
        resizeMode="contain"
      />

      {/* GOALHUB BRAND */}

      <View style={styles.brandCol}>
        <Text style={styles.brandName}>
          GoalHub
        </Text>

        <View style={styles.clubRow}>
          <Text style={styles.clubName}>
            FC Prishtina
          </Text>

          <MaterialCommunityIcons
            name="chevron-down"
            size={I(12)}
            color={C.muted}
          />
        </View>
      </View>

      {/* RIGHT BUTTONS */}

      <View style={styles.headerRight}>

        {/* NOTIFICATIONS */}

        <Pressable
          onPress={onBell}
          hitSlop={6}
          style={({ pressed }) => [
            styles.roundBtn,
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons
            name="bell-outline"
            size={I(20)}
            color={C.text}
          />

          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              3
            </Text>
          </View>
        </Pressable>

        {/* SETTINGS */}

        <Pressable
          onPress={onSettings}
          hitSlop={6}
          style={({ pressed }) => [
            styles.settingsBtn,
            pressed && styles.pressed,
          ]}
        >
          <MaterialCommunityIcons
            name="cog-outline"
            size={I(20)}
            color={C.green}
          />
        </Pressable>

      </View>
    </View>
  );
}

/* =========================================================
   STATISTICS CARD
   ========================================================= */

type StatCardProps = {
  labelTop: string;
  labelBottom: string;
  value: string;
  img?: number;
  imgStyle?: object;
  imgCover?: boolean;
};

function StatCard({
  labelTop,
  labelBottom,
  value,
  img,
  imgStyle,
  imgCover,
}: StatCardProps) {
  return (
    <View style={styles.statCard}>

      {/* IMAGE */}

      {img ? (
        <Image
          source={img}
          style={imgStyle}
          resizeMode={imgCover ? 'cover' : 'contain'}
        />
      ) : null}

      {/* TEXT */}

      <Text style={styles.statLabel}>
        {labelTop}
      </Text>

      <Text style={styles.statLabel}>
        {labelBottom}
      </Text>

      <Text style={styles.statValue}>
        {value}
      </Text>

    </View>
  );
}

/* =========================================================
   STYLES
   ========================================================= */

const styles = StyleSheet.create(scaled({

  /* =======================================================
     PAGE
     ======================================================= */

  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },

  scroll: {
    paddingBottom: 10,
  },

  content: {
    flexGrow: 0,
    position: 'relative',
  },

  padded: {
    paddingHorizontal: 28,
  },

  pressed: {
    opacity: 0.65,
  },

  /* =======================================================
     BACKGROUND LINES
     ======================================================= */

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

  /* =======================================================
     HEADER
     ======================================================= */

  header: {
    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 10,

    height: 40,
  },

  headerLogo: {
    width: 35,
    height: 38,
  },

  brandCol: {
    marginLeft: 8,
    justifyContent: 'center',
  },

  brandName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
    lineHeight: 19,

    letterSpacing: -0.35,

    color: C.text,
  },

  clubRow: {
    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 0,
  },

  clubName: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12.5,

    lineHeight: 16,

    color: C.gray,
  },

  headerRight: {
    flex: 1,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',

    gap: 9,
  },

  roundBtn: {
    width: 36,
    height: 36,

    borderRadius: 18,

    backgroundColor: C.white,

    borderWidth: 1,
    borderColor: 'rgba(30,40,35,0.10)',

    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.055,
    shadowRadius: 3,

    elevation: 1,
  },

  settingsBtn: {
    width: 36,
    height: 36,

    borderRadius: 18,

    backgroundColor: C.profileBg,

    alignItems: 'center',
    justifyContent: 'center',
  },

  badge: {
    position: 'absolute',

    top: -2,
    right: -2,

    minWidth: 15,
    height: 15,

    borderRadius: 8,

    backgroundColor: C.green,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 3,

    borderWidth: 1.5,
    borderColor: C.bg,
  },

  badgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 9,

    lineHeight: 11,

    color: C.white,
  },

  /* =======================================================
     WELCOME
     ======================================================= */

  welcome: {
    marginTop: 22,
  },

  welcomeTitle: {
    fontFamily: Fonts.bodyBold,

    fontSize: 20,
    lineHeight: 24,

    letterSpacing: -0.45,

    color: C.text,
  },

  welcomeSub: {
    fontFamily: Fonts.body,

    fontSize: 12,
    lineHeight: 16,

    color: C.muted,

    marginTop: 1,
  },

  /* =======================================================
     STATISTICS CAROUSEL
     ======================================================= */

  statsWrap: {
    marginTop: 22,
  },

  statsRow: {
    paddingLeft: 28,
    paddingRight: 28,

    gap: 7,
  },

  statCard: {
    width: 118,
    height: 104,

    position: 'relative',

    backgroundColor: C.white,

    borderWidth: 1,
    borderColor: '#BC6C25',

    borderRadius: 8,

    paddingTop: 8,
    paddingLeft: 10,
    paddingRight: 8,

    overflow: 'hidden',

    shadowColor: 'hsl(24, 71%, 50%)',
    shadowOffset: {
      width: 2,
      height: 1,
    },
    shadowOpacity: 0.035,
    shadowRadius: 3,

    elevation: 1,
  },

  statLabel: {
    fontFamily: Fonts.bodySemiBold,

    fontSize: 10.5,
    lineHeight: 11,

    color: C.muted,

    zIndex: 3,
  },

  statValue: {
    fontFamily: Fonts.bodyBold,

    fontSize: 24,
    lineHeight: 26,

    letterSpacing: -0.5,

    color: C.text,

    marginTop: 0,

    zIndex: 3,
  },

  /* =======================================================
     STATISTICS IMAGES
     ======================================================= */

  statImgPlayer: {
    position: 'absolute',

    width: 80,
    height: 100,

    right: -50,
    bottom: -14,

    zIndex: 1,
  },

  statImgCalc: {
    position: 'absolute',

    width: 100,
    height: 100,

    right: -45,
    bottom: -22,

    zIndex: 1,
  },

  statImgBall: {
    position: 'absolute',

    width: 92,
    height: 92,

    right: -40,
    bottom: -28,

    zIndex: 1,
  },

  /* =======================================================
     NEXT EVENT
     ======================================================= */

  eventBar: {
    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 26,

    minHeight: 53,

    backgroundColor: C.veryLightGreen,

    borderWidth: 1,
    borderColor: '#69C894',

    borderRadius: 8,

    paddingVertical: 5,
    paddingLeft: 9,
    paddingRight: 7,
  },

  eventIcon: {
    width: 34,
    height: 30,

    borderRadius: 6,

    backgroundColor: '#E2F5E9',

    alignItems: 'center',
    justifyContent: 'center',
  },

  eventBody: {
    flex: 1,

    marginLeft: 9,
  },

  eventLabel: {
    fontFamily: Fonts.bodyMedium,

    fontSize: 10.5,
    lineHeight: 13,

    color: C.muted,
  },

  eventText: {
    fontFamily: Fonts.bodySemiBold,

    fontSize: 12.5,
    lineHeight: 16,

    color: C.text,

    marginTop: 0,
  },

  /* =======================================================
     CHILD SUMMARY CARD
     ======================================================= */

  childCard: {
    height: 104,

    marginTop: 26,

    flexDirection: 'row',
    alignItems: 'center',

    position: 'relative',

    backgroundColor: C.greenDeep,

    borderRadius: 12,

    paddingLeft: 14,
    paddingRight: 8,

    overflow: 'hidden',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,

    elevation: 3,
  },

  childDeco: {
    position: 'absolute',

    right: 30,
    bottom: -26,

    fontFamily: Fonts.bodyBlack,

    fontSize: 150,
    lineHeight: 158,

    letterSpacing: -8,

    color: 'rgba(190,235,215,0.16)',

    zIndex: 0,
  },

  childBody: {
    flex: 1,

    zIndex: 1,
  },

  childEyebrow: {
    fontFamily: Fonts.bodyMedium,

    fontSize: 10.5,
    lineHeight: 13,

    color: 'rgba(255,255,255,0.72)',
  },

  childName: {
    fontFamily: Fonts.bodyBold,

    fontSize: 20,
    lineHeight: 24,

    letterSpacing: -0.4,

    color: C.white,

    marginTop: 10,
  },

  childChips: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 6,

    marginTop: 9,
  },

  chipAktiv: {
    backgroundColor: '#DDF8E9',

    borderRadius: 99,

    paddingVertical: 5,
    paddingHorizontal: 15,
  },

  chipAktivText: {
    fontFamily: Fonts.bodySemiBold,

    fontSize: 10.5,
    lineHeight: 13,

    color: C.greenDark,
  },

  chipRating: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 4,

    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',

    borderRadius: 99,

    paddingVertical: 5,
    paddingHorizontal: 15,
  },

  chipRatingText: {
    fontFamily: Fonts.bodySemiBold,

    fontSize: 10.5,
    lineHeight: 13,

    color: C.white,
  },

  childChevron: {
    zIndex: 2,
  },

  /* =======================================================
     MENU WRAPPER
     ======================================================= */

  menuWrap: {
    position: 'relative',

    marginTop: 40,
  },

  /* =======================================================
     MAIN GREEN MENU CONTAINER
     ======================================================= */

  menuContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',

    backgroundColor: C.white,

    borderWidth: 1,
    borderColor: C.greenBorder,

    borderRadius: 8,

    padding: 8,

    columnGap: 10,
    rowGap: 14,
  },

  /* =======================================================
     MENU CARDS
     ======================================================= */

  menuCard: {
    width: '48%',

    height: 110,

    position: 'relative',

    borderRadius: 9,

    borderWidth: 1,

    overflow: 'hidden',
  },

  /* =======================================================
     MENU TITLES
     ======================================================= */

  menuTitle: {
    position: 'absolute',

    top: 16,
    left: 10,
    right: 10,

    fontFamily: Fonts.bodyBlack,

    fontSize: 22,
    lineHeight: 22,

    letterSpacing: 0.5,

    color: C.text,

    zIndex: 3,
  },

  /* =======================================================
     MENU IMAGES
     ======================================================= */

  /*
   * IMPORTANT:
   *
   * These are intentionally NOT centered.
   *
   * They are oversized decorative foreground elements.
   * The card clips them using overflow: hidden.
   */

  menuImgNdeshjet: {
    position: 'absolute',

    width: 110,
    height: 110,

    left: -38,
    bottom: -44,

    zIndex: 1,
  },

  menuImgTrajnimet: {
    position: 'absolute',

    width: 120,
    height: 120,

    left: -52,
    bottom: -16,

    zIndex: 1,
  },

  menuImgPagesat: {
    position: 'absolute',

    width: 120,
    height: 200,

    left: -44,
    top: 3,

    zIndex: 1,
  },

  /* =======================================================
     VAZHDO BUTTON
     ======================================================= */

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

  /* =======================================================
     MENU TAB
     ======================================================= */

  menuPillWrap: {
    position: 'absolute',

    top: -18,

    left: 0,
    right: 0,

    alignItems: 'center',

    zIndex: 10,
  },

  menuPill: {
    width: 88,
    height: 28,

    backgroundColor: C.white,

    borderWidth: 1,
    borderColor: C.border,

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
}));

/* =========================================================
   MENU DATA
   ========================================================= */

type MenuCard = {
  id: string;
  title: string;
  route: string;

  bg: string;
  border: string;

  btnBg: string;
  btnColor: string;

  img?: number | null;
  imgStyle?: object;
};

/**
 * PARENT MENU — exactly 3 items (2-col grid, second row left-aligned):
 *
 * Ndeshjet    Trajnimet
 * Pagesat
 */

const MENU: MenuCard[] = [

  /* =======================================================
     1. NDESHJET
     ======================================================= */

  {
    id: 'ndeshjet',

    title: 'Ndeshjet',

    route: '/matches',

    bg: '#F8EBD8',
    border: '#F0D9AE',

    btnBg: '#D99A4A',
    btnColor: '#FFFFFF',

    img: IMG.ndeshjet,
    imgStyle: styles.menuImgNdeshjet,
  },

  /* =======================================================
     2. TRAJNIMET
     ======================================================= */

  {
    id: 'trajnimet',

    title: 'Trajnimet',

    route: '/trainings',

    bg: '#E8F3FF',
    border: '#C6E0FA',

    btnBg: '#78B8F5',
    btnColor: '#FFFFFF',

    img: IMG.trajnimet,
    imgStyle: styles.menuImgTrajnimet,
  },

  /* =======================================================
     3. PAGESAT
     ======================================================= */

  {
    id: 'pagesat',

    title: 'Pagesat',

    route: '/fees',

    bg: '#EFE9FB',
    border: '#D9C9F2',

    btnBg: '#7B5FD9',
    btnColor: '#FFFFFF',

    img: IMG.pagesatArt,
    imgStyle: styles.menuImgPagesat,
  },
];
