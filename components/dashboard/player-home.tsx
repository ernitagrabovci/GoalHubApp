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

/**
 * GoalHub Player Home Dashboard
 *
 * Mirrors the trainer home visual language (389 x 873 reference), but for a
 * single player.
 *
 * Important:
 * - Uses the real supplied assets.
 * - Images are treated as decorative foreground elements.
 * - Cards use absolute image positioning and clipping.
 * - Stats are horizontally scrollable with a partially visible 4th card.
 * - Main menu is a compact 2-column grid (6 items).
 * - Bottom Home / Chat navigation remains in the (tabs) layout.
 */

const C = {
  bg: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  white: '#FFFFFF',
  text: '#111111',

  gray: '#666666',
  muted: '#888888',
  faint: '#9E9E9E',

  border: '#D9DEDB',
  cardBorder: 'rgba(30,40,35,0.10)',

  green: '#159447',
  greenDark: '#0C6C36',
  greenBorder: '#4DBB7B',
  lightGreen: '#DDF6E7',
  veryLightGreen: '#F1FBF5',
  matchBg: '#F2FBF5',
  matchBorder: '#69C894',
  profileBg: '#E0F6E9',

  red: '#D94B4B',
};

/* =========================================================
   ASSETS
   ========================================================= */

const IMG = {
  /* Brand */
  fcp: require('@/assets/dashboard/fcp.png'),

  /* Statistics */
  statPlayer: require('@/assets/dashboard/lojtaret.png'),
  prezenca: require('@/assets/dashboard/prezenca.jpg'),
  stervitje: require('@/assets/dashboard/stervitje.png'),

  /* Main menu */
  ndeshjet: require('@/assets/dashboard/ndeshjet.png'),
  trajnimet: require('@/assets/dashboard/trajnimet.png'),
  akademia: require('@/assets/dashboard/akademia.png'),
  tabela: require('@/assets/dashboard/tabela-taktike.png'),
  grupet: require('@/assets/dashboard/grupet.png'),

  /* Menu — Pagesat */
  pagesatArt: require('@/assets/dashboard/pagesat-art.png'),

  /* Away teams */
  malisheva: require('@/assets/dashboard/malisheva.png'),
  gjilani: require('@/assets/dashboard/gjilani.png'),
};

/* =========================================================
   UPCOMING MATCHES
   ========================================================= */

type UpcomingMatch = {
  age: string;
  away: string;
  awayLogo: number;
  time: string;
};

const UPCOMING: UpcomingMatch[] = [
  { age: 'U15', away: 'KF Malisheva', awayLogo: IMG.malisheva, time: '18:00' },
  { age: 'U15', away: 'KF Gjilani', awayLogo: IMG.gjilani, time: '16:00' },
];

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export function PlayerHome() {
  const router = useRouter();

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
              onSettings={() => open('/settings')}
            />

            <View style={styles.welcome}>
              <Text style={styles.welcomeTitle}>
                Dashboard!
              </Text>

              <Text style={styles.welcomeSub}>
                Mirë se vini, Ardit Llapashtica
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
                labelTop="Numri i"
                labelBottom="fanellës"
                value="9"
                img={IMG.statPlayer}
                imgStyle={styles.statImgPlayer}
                imgCover
              />

              <StatCard
                labelTop="Prezenca"
                labelBottom="juaj"
                value="67%"
                img={IMG.prezenca}
                imgStyle={styles.statImgPrezenca}
                imgCover
              />

              <StatCard
                labelTop="Vlerësimi"
                labelBottom="i fundit"
                value="7.8"
                img={IMG.stervitje}
                imgStyle={styles.statImgStervitje}
                imgCover
              />

              <StatCard
                labelTop="Prani"
                labelBottom="Mësimet"
                value="0%"
              />
            </ScrollView>
          </View>

          {/* =================================================
              EVENT + MENU
             ================================================= */}

          <View style={styles.padded}>

            {/* NEXT TRAINING */}

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

            {/* =================================================
                UPCOMING MATCHES
               ================================================= */}

            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>
                Ndeshjet e radhës
              </Text>

              <Pressable
                onPress={() => open('/matches')}
                hitSlop={8}
              >
                <Text style={styles.seeAll}>
                  Shiko të gjitha
                </Text>
              </Pressable>
            </View>

            <View style={styles.matchesCard}>
              {UPCOMING.map((m, index) => (
                <Pressable
                  key={`${m.age}-${m.away}`}
                  onPress={() => open('/matches')}
                  style={({ pressed }) => [
                    styles.matchRow,
                    index > 0 && styles.matchRowSep,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.ageBadge}>
                    <Text style={styles.ageText}>
                      {m.age}
                    </Text>
                  </View>

                  <View style={styles.teamHome}>
                    <Image
                      source={IMG.fcp}
                      style={styles.matchLogo}
                      resizeMode="contain"
                    />
                    <Text style={styles.teamName} numberOfLines={1}>
                      Fc Prishtina
                    </Text>
                  </View>

                  <View style={styles.vsCol}>
                    <Text style={styles.vsText}>
                      vs
                    </Text>
                    <Text style={styles.timeText}>
                      {m.time}
                    </Text>
                  </View>

                  <View style={styles.teamAway}>
                    <Text style={styles.teamNameAway} numberOfLines={1}>
                      {m.away}
                    </Text>
                    <Image
                      source={m.awayLogo}
                      style={styles.matchLogo}
                      resizeMode="contain"
                    />
                  </View>

                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={I(20)}
                    color={C.green}
                  />
                </Pressable>
              ))}
            </View>

            {/* =================================================
                MENU
               ================================================= */}

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
                      style={[
                        styles.menuTitle,
                        card.long && styles.menuTitleLong,
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit={!!card.long}
                      minimumFontScale={0.6}
                    >
                      {card.title}
                    </Text>

                    {/* SMALL FOOTBALL ICON */}

                    {card.soccerIcon ? (
                      <MaterialCommunityIcons
                        name="soccer"
                        size={I(17)}
                        color={C.red}
                        style={styles.menuIcon}
                      />
                    ) : null}

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
    paddingBottom: 6,
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

    marginTop: 7,

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
    marginTop: 10,
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
    marginTop: 10,
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

    paddingTop: 9,
    paddingLeft: 10,
    paddingRight: 8,

    overflow: 'hidden',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.035,
    shadowRadius: 3,

    elevation: 1,
  },

  statLabel: {
    fontFamily: Fonts.bodySemiBold,

    fontSize: 11,
    lineHeight: 14,

    color: C.muted,

    zIndex: 3,
  },

  statValue: {
    fontFamily: Fonts.bodyBold,

    fontSize: 25,
    lineHeight: 28,

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

    width: 100,
    height: 100,

    right: -50,
    bottom: -14,

    zIndex: 1,
  },

  statImgDoctor: {
    position: 'absolute',

    width: 100,
    height: 120,

    right: -50,
    bottom: 5,

    zIndex: 1,
  },

  statImgStervitje: {
    position: 'absolute',

    width: 100,
    height: 120,

    right: -50,
    bottom: -1,

    zIndex: 1,
  },

  statImgPrezenca: {
    position: 'absolute',

    width: 120,
    height: 110,

    right: -48,
    bottom: 2,

    zIndex: 1,
  },

  /* =======================================================
     NEXT EVENT
     ======================================================= */

  eventBar: {
    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 10,

    minHeight: 40,

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
     UPCOMING MATCHES
     ======================================================= */

  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    marginBottom: 4,
  },

  sectionTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16.5,
    letterSpacing: -0.2,
    color: C.text,
  },

  seeAll: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13.5,
    color: C.green,
  },

  matchesCard: {
    backgroundColor: C.matchBg,
    borderWidth: 1,
    borderColor: C.matchBorder,
    borderRadius: 7,
    overflow: 'hidden',
  },

  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 12,
  },

  matchRowSep: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#FFFFFF',
  },

  ageBadge: {
    backgroundColor: C.lightGreen,
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginRight: 9,
  },

  ageText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: C.greenDark,
  },

  teamHome: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  teamAway: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 5,
  },

  matchLogo: {
    width: 24,
    height: 24,
  },

  teamName: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13.5,
    color: '#3A3A3A',
    flexShrink: 1,
  },

  teamNameAway: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13.5,
    color: '#3A3A3A',
    flexShrink: 1,
  },

  vsCol: {
    alignItems: 'center',
    marginHorizontal: 6,
  },

  vsText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: C.faint,
    textTransform: 'uppercase',
    lineHeight: 15,
  },

  timeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: C.muted,
    lineHeight: 15,
  },

  /* =======================================================
     MENU WRAPPER
     ======================================================= */

  menuWrap: {
    position: 'relative',

    marginTop: 18,
  },

  /* =======================================================
     MAIN GREEN MENU CONTAINER
     ======================================================= */

  menuContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',

    borderWidth: 1,
    borderColor: C.greenBorder,

    borderRadius: 8,

    padding: 8,

    columnGap: 10,
    rowGap: 12,
  },

  /* =======================================================
     MENU CARDS
     ======================================================= */

  menuCard: {
    width: '48%',

    height: 100,

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

  menuTitleLong: {
    fontSize: 22,

    letterSpacing: 0,
  },

  /* =======================================================
     SOCCER ICON
     ======================================================= */

  menuIcon: {
    position: 'absolute',

    top: 10,
    right: 5,

    zIndex: 4,
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

  menuImgLojtaret: {
    position: 'absolute',

    width: 100,
    height: 100,

    left: -25,
    bottom: -35,

    zIndex: 1,
  },

  menuImgNdeshjet: {
    position: 'absolute',

    width: 100,
    height: 100,

    left: -35,
    bottom: -45,

    zIndex: 1,
  },

  menuImgTrajnimet: {
    position: 'absolute',

    width: 120,
    height: 120,

    left: -55,
    bottom: -5,

    zIndex: 1,
  },

  menuImgAkademia: {
    position: 'absolute',

    width: 100,
    height: 100,

    left: -25,
    bottom: -35,

    zIndex: 1,
  },

  menuImgTabela: {
    position: 'absolute',

    width: 100,
    height: 100,

    left: -2,
    bottom: -25,

    zIndex: 1,
  },

  menuImgUshtrimet: {
    position: 'absolute',

    width: 70,
    height: 70,

    left: 4,
    bottom: -2,

    zIndex: 1,
  },

  menuImgGrupet: {
    position: 'absolute',

    width: 120,
    height: 120,

    left: -15,
    bottom: -15,

    zIndex: 1,
  },

  menuImgMjeksia: {
    position: 'absolute',

    width: 250,
    height: 120,

    left: -127,
    bottom: -14,

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

    top: -14,

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
}));

/* =========================================================
   MENU DATA
   ========================================================= */

type MenuCard = {
  id: string;
  title: string;
  route: string;

  long?: boolean;
  soccerIcon?: boolean;

  bg: string;
  border: string;

  btnBg: string;
  btnColor: string;

  img?: number | null;
  imgStyle?: object;
};

/**
 * PLAYER MENU — 6 items:
 *
 * Ndeshjet       Trajnimet
 * Akademia       Tabela Taktike
 * Grupet         Pagesat
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
     3. AKADEMIA
     ======================================================= */

  {
    id: 'akademia',

    title: 'Akademia',

    route: '/academy',

    bg: '#FDECF2',
    border: '#F3C2D2',

    btnBg: '#E34D63',
    btnColor: '#FFFFFF',

    img: IMG.akademia,
    imgStyle: styles.menuImgAkademia,
  },

  /* =======================================================
     4. TABELA TAKTIKE
     ======================================================= */

  {
    id: 'tabela',

    title: 'Tabela Taktike',

    route: '/tactical',

    long: true,

    bg: '#EAF7EF',
    border: '#BFE3CD',

    btnBg: '#159447',
    btnColor: '#FFFFFF',

    img: IMG.tabela,
    imgStyle: styles.menuImgTabela,
  },

  /* =======================================================
     5. GRUPET
     ======================================================= */

  {
    id: 'grupet',

    title: 'Grupet',

    route: '/groups',

    bg: '#EEF2F4',
    border: '#D5DEE3',

    btnBg: '#D6DFE4',
    btnColor: '#2A2A2A',

    img: IMG.grupet,
    imgStyle: styles.menuImgGrupet,
  },

  /* =======================================================
     6. PAGESAT
     ======================================================= */

  {
    id: 'pagesat',

    title: 'Pagesat',

    route: '/fees',

    bg: '#FDF6E0',
    border: '#F1E1AC',

    btnBg: '#D9A93A',
    btnColor: '#FFFFFF',

    img: IMG.pagesatArt,
    imgStyle: styles.menuImgPagesat,
  },
];