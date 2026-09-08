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
 * GoalHub Finance Home Dashboard (Financieri)
 *
 * Light-only, fixed-dp, mirrors the trainer/player/parent dashboard visual
 * language (389 x 873 reference) with the PAYMENTS (Pagesat) structure:
 * - greeting with the signed-in financier's name
 * - stats carousel (total paid / total unpaid / overdue-critical)
 * - 2x2 compact payment summary grid
 * - "Pagesat e fundit" recent-payments table
 * - large lavender "Pagesat" feature card
 * - bottom Home / Chat navigation lives in the (tabs) layout
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
  greenDark: '#0C6C36',
  red: '#E54848',
  gold: '#D2A900',

  greenBorder: '#4DBB7B',
  lightGreen: '#DDF6E7',

  profileBg: '#E0F6E9',
};

/* =========================================================
   ASSETS
   ========================================================= */

const IMG = {
  /* Brand */
  fcp: require('@/assets/dashboard/fcp.png'),

  /* Statistics */
  statCalc: require('@/assets/dashboard/stat-calculator.png'),

  /* Feature card */
  pagesatArt: require('@/assets/dashboard/pagesat-art.png'),
};

/* =========================================================
   RECENT PAYMENTS (6 rows)
   ========================================================= */

const PAYMENTS = [
  { name: 'Ardit Llapashtica', date: '2026-04-09 00:00:00', amount: '€150.00' },
  { name: 'Agon Gashi', date: '2026-04-08 00:00:00', amount: '€120.00' },
  { name: 'Era Gashi', date: '2026-04-07 00:00:00', amount: '€110.00' },
  { name: 'Art Gashi', date: '2026-04-06 00:00:00', amount: '€110.00' },
  { name: 'Mergim Berisha', date: '2026-04-05 00:00:00', amount: '€150.00' },
  { name: 'Dren Hyseni', date: '2026-04-04 00:00:00', amount: '€150.00' },
];

/* =========================================================
   SUMMARY GRID (2x2)
   ========================================================= */

const SUMMARY = [
  { label: 'Të paguar', value: '336' },
  { label: 'Të papaguara', value: '336' },
  { label: 'Me vonesë', value: '168' },
  { label: 'Kritike', value: '168' },
];

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export function FinancierHome() {
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
                labelTop="Totali"
                labelBottom="paguar"
                value="€16,800.00"
                color={C.green}
                valueSize={12.5}
                img={IMG.statCalc}
                imgStyle={styles.statImgStat}
              />

              <StatCard
                labelTop="Totali"
                labelBottom="papaguar"
                value="€17,030.00"
                color={C.red}
                valueSize={12.5}
                img={IMG.statCalc}
                imgStyle={styles.statImgStat}
              />

              <StatCard
                labelTop="Vonëse"
                labelBottom="Kritike"
                value="336"
                color={C.gold}
                valueSize={24}
                img={IMG.statCalc}
                imgStyle={styles.statImgStat}
              />
            </ScrollView>
          </View>

          {/* =================================================
              2x2 SUMMARY GRID
             ================================================= */}

          <View style={styles.padded}>
            <View style={styles.grid}>
              {SUMMARY.map((item) => (
                <View key={item.label} style={styles.gridCard}>
                  <Text style={styles.gridLabel} numberOfLines={1}>
                    {item.label}
                  </Text>
                  <Text style={styles.gridValue}>
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* =================================================
              RECENT PAYMENTS TABLE
             ================================================= */}

          <View style={styles.padded}>
            <View style={styles.tblCard}>

              {/* TABLE TITLE */}

              <Text style={styles.tblTitle}>
                Pagesat e fundit
              </Text>

              <View style={styles.rowDivider} />

              {/* ROWS */}

              {PAYMENTS.map((p, index) => (
                <View key={p.name}>
                  <View style={styles.tblRow}>
                    <Text style={styles.tblName} numberOfLines={1}>
                      {p.name}
                    </Text>
                    <Text style={styles.tblDate} numberOfLines={1}>
                      {p.date}
                    </Text>
                    <Text style={styles.tblAmount} numberOfLines={1}>
                      {p.amount}
                    </Text>
                  </View>

                  {index < PAYMENTS.length - 1 ? (
                    <View style={styles.rowDivider} />
                  ) : null}
                </View>
              ))}

              {/* VIEW ALL FOOTER */}

              <Pressable
                onPress={() => open('/fees')}
                style={({ pressed }) => [
                  styles.tblFooter,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.tblFooterText}>
                  Shiko të gjitha
                </Text>

                <MaterialCommunityIcons
                  name="chevron-right"
                  size={I(15)}
                  color={C.text}
                />
              </Pressable>
            </View>
          </View>

          {/* =================================================
              PAGESAT FEATURE CARD
             ================================================= */}

          <View style={styles.padded}>
            <Pressable
              onPress={() => open('/fees')}
              style={({ pressed }) => [
                styles.featCard,
                pressed && styles.pressed,
              ]}
            >
              {/* DECORATIVE PAYMENT IMAGES */}

              <Image
                source={IMG.pagesatArt}
                style={styles.featLeft}
                resizeMode="contain"
              />

              <Image
                source={IMG.pagesatArt}
                style={styles.featRight}
                resizeMode="contain"
              />

              {/* CONTENT */}

              <View style={styles.featBody}>
                <Text style={styles.featTitle}>
                  Pagesat
                </Text>

                <View style={styles.featBtn}>
                  <Text style={styles.featBtnText}>
                    Vazhdo
                  </Text>
                </View>
              </View>
            </Pressable>
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
  color: string;
  valueSize: number;
  img?: number;
  imgStyle?: object;
};

function StatCard({
  labelTop,
  labelBottom,
  value,
  color,
  valueSize,
  img,
  imgStyle,
}: StatCardProps) {
  return (
    <View style={styles.statCard}>

      {/* IMAGE */}

      {img ? (
        <Image
          source={img}
          style={imgStyle}
          resizeMode="contain"
        />
      ) : null}

      {/* TEXT */}

      <Text style={styles.statLabel} numberOfLines={1}>
        {labelTop}
      </Text>

      <Text style={styles.statLabel} numberOfLines={1}>
        {labelBottom}
      </Text>

      <Text
        style={[
          styles.statValue,
          {
            color,
            fontSize: valueSize,
            lineHeight: valueSize + 2,
          },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
      >
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
    paddingHorizontal: 24,
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

    marginTop: 4,

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
    paddingLeft: 24,
    paddingRight: 24,

    gap: 7,
  },

  statCard: {
    width: 118,
    height: 100,

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
    lineHeight: 13,

    color: C.muted,

    zIndex: 3,
  },

  statValue: {
    fontFamily: Fonts.bodyBold,

    marginTop: 3,

    zIndex: 3,
  },

  /* =======================================================
     STATISTICS IMAGES
     ======================================================= */

  statImgStat: {
    position: 'absolute',

    width: 100,
    height: 100,

    right: -45,
    bottom: -22,

    zIndex: 1,
  },

  /* =======================================================
     SUMMARY GRID
     ======================================================= */

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',

    justifyContent: 'space-between',

    marginTop: 10,

    rowGap: 8,
  },

  gridCard: {
    width: '48%',

    height: 60,

    backgroundColor: C.lightGreen,

    borderWidth: 1,
    borderColor: C.greenBorder,

    borderRadius: 10,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 4,
  },

  gridLabel: {
    fontFamily: Fonts.bodySemiBold,

    fontSize: 11.5,
    lineHeight: 15,

    color: C.gray,

    textAlign: 'center',
  },

  gridValue: {
    fontFamily: Fonts.bodyBold,

    fontSize: 25,
    lineHeight: 28,

    letterSpacing: -0.5,

    color: C.gray,

    marginTop: 8,
  },

  /* =======================================================
     RECENT PAYMENTS TABLE
     ======================================================= */

  tblCard: {
    marginTop: 14,

    backgroundColor: C.white,

    borderWidth: 1,
    borderColor: C.greenBorder,

    borderRadius: 8,

    overflow: 'hidden',
  },

  tblTitle: {
    fontFamily: Fonts.bodyBold,

    fontSize: 13,
    lineHeight: 16,

    color: C.text,

    paddingVertical: 10,
    paddingHorizontal: 12,
  },

  tblRow: {
    flexDirection: 'row',
    alignItems: 'center',

    height: 27,

    paddingHorizontal: 12,
  },

  rowDivider: {
    height: 1.5,

    marginHorizontal: 1,

    backgroundColor: C.greenBorder,

    borderRadius: 1,
  },

  tblName: {
    fontFamily: Fonts.bodySemiBold,

    fontSize: 12,
    lineHeight: 15,

    color: C.text,

    width: 92,

    marginRight: 6,
  },

  tblDate: {
    fontFamily: Fonts.body,

    fontSize: 10.5,
    lineHeight: 13,

    color: C.muted,

    flex: 1,

    textAlign: 'center',
  },

  tblAmount: {
    fontFamily: Fonts.bodyBold,

    fontSize: 12,
    lineHeight: 15,

    color: C.green,

    width: 64,

    textAlign: 'right',
  },

  tblFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    gap: 2,

    paddingVertical: 10,
  },

  tblFooterText: {
    fontFamily: Fonts.bodySemiBold,

    fontSize: 11.5,
    lineHeight: 15,

    color: C.text,
  },

  /* =======================================================
     PAGESAT FEATURE CARD
     ======================================================= */

  featCard: {
    height: 120,

    marginTop: 16,

    position: 'relative',

    backgroundColor: '#E7E4FA',

    borderWidth: 1,
    borderColor: '#C9C2ED',

    borderRadius: 12,

    overflow: 'hidden',

    alignItems: 'center',
    justifyContent: 'center',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,

    elevation: 3,
  },

  featLeft: {
    position: 'absolute',

    width: 120,
    height: 200,

    left: -44,
    top: 3,

    zIndex: 1,
  },

  featRight: {
    position: 'absolute',

    width: 120,
    height: 250,

    right: -40,
    top: -80,

    zIndex: 1,
  },

  featBody: {
    alignItems: 'center',

    zIndex: 3,
  },

  featTitle: {
    fontFamily: Fonts.bodyBlack,

    fontSize: 28,
    lineHeight: 32,

    letterSpacing: -0.5,

    color: '#1E1A45',
  },

  featBtn: {
    marginTop: 8,

    minWidth: 76,
    height: 26,

    borderRadius: 6,

    backgroundColor: '#4B3BC4',

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 14,
  },

  featBtnText: {
    fontFamily: Fonts.bodySemiBold,

    fontSize: 12,
    lineHeight: 15,

    color: C.white,
  },
}));
