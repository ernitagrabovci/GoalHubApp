import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
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
import { ApiError } from '@/lib/api/errors';
import { financeStats, listFees } from '@/lib/api/finance';
import { badges } from '@/lib/api/notifications';
import type { ApiFee, FinanceStats } from '@/lib/api/types';
import { dmy, usd } from '@/lib/finance';
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

  white: '#F5F5F5',
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
   SUMMARY GRID (2x2) — the labels; the counts come from the API
   ========================================================= */

const SUMMARY_LABELS = ['Të paguar', 'Të papaguara', 'Me vonesë', 'Në total'];

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export function FinancierHome() {
  const router = useRouter();
  const { user, token, signOut } = useSession();

  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [recent, setRecent] = useState<ApiFee[]>([]);
  const [unread, setUnread] = useState(0);

  /* The headline totals and the recent-payments strip are one-shot. */
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    Promise.allSettled([
      financeStats(token, controller.signal),
      listFees(token, { status: 'paid' }, controller.signal),
      badges(token, controller.signal),
    ]).then(([totals, paid, counts]) => {
      if (controller.signal.aborted) return;

      const failure = [totals, paid, counts].find((r) => r.status === 'rejected');
      if (
        failure &&
        failure.status === 'rejected' &&
        failure.reason instanceof ApiError &&
        failure.reason.status === 401
      ) {
        signOut();
        router.replace('/login');
        return;
      }

      if (totals.status === 'fulfilled') setStats(totals.value);
      if (paid.status === 'fulfilled') setRecent(paid.value.data.slice(0, 6));
      if (counts.status === 'fulfilled') setUnread(counts.value.notifications);
    });

    return () => controller.abort();
  }, [token, router, signOut]);

  /* Each grid cell reads straight off the totals. */
  const summaryValues = stats
    ? [
        String(stats.paid),
        String(stats.unpaid),
        String(stats.overdue),
        String(stats.paid + stats.unpaid + stats.overdue),
      ]
    : ['—', '—', '—', '—'];

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
              HEADER + GREETING
             ================================================= */}

          <View style={styles.padded}>
            <HeaderBlock
              club={user?.club ?? '—'}
              unread={unread}
              onBell={() => open('/njoftimet-financierit')}
              onSettings={() => open('/settings')}
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
                value={stats ? usd(stats.collected) : '—'}
                color={C.green}
                valueSize={12.5}
                img={IMG.statCalc}
                imgStyle={styles.statImgStat}
              />

              <StatCard
                labelTop="Totali"
                labelBottom="papaguar"
                value={stats ? usd(stats.pending) : '—'}
                color={C.red}
                valueSize={12.5}
                img={IMG.statCalc}
                imgStyle={styles.statImgStat}
              />

              <StatCard
                labelTop="Vonëse"
                labelBottom="Kritike"
                value={stats ? String(stats.overdue) : '—'}
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
              {SUMMARY_LABELS.map((label, i) => (
                <View key={label} style={styles.gridCard}>
                  <Text style={styles.gridLabel} numberOfLines={1}>
                    {label}
                  </Text>
                  <Text style={styles.gridValue}>
                    {summaryValues[i]}
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

              {recent.length === 0 ? (
                <View style={styles.tblRow}>
                  <Text style={styles.tblName} numberOfLines={1}>
                    —
                  </Text>
                  <Text style={styles.tblDate} numberOfLines={1} />
                  <Text style={styles.tblAmount} numberOfLines={1} />
                </View>
              ) : (
                recent.map((p, index) => (
                  <View key={p.id}>
                    <View style={styles.tblRow}>
                      <Text style={styles.tblName} numberOfLines={1}>
                        {p.player?.name ?? '—'}
                      </Text>
                      <Text style={styles.tblDate} numberOfLines={1}>
                        {dmy(p.paid_at)}
                      </Text>
                      <Text style={styles.tblAmount} numberOfLines={1}>
                        {usd(Number(p.final_amount) || 0)}
                      </Text>
                    </View>

                    {index < recent.length - 1 ? (
                      <View style={styles.rowDivider} />
                    ) : null}
                  </View>
                ))
              )}

              {/* VIEW ALL FOOTER */}

              <Pressable
                onPress={() => open('/raportet-financiare')}
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
              onPress={() => open('/kuotat-financierit')}
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
  club,
  unread,
  onBell,
  onSettings,
}: {
  club: string;
  unread: number;
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
          <Text style={styles.clubName} numberOfLines={1}>
            {club}
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

          {unread > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unread > 99 ? '99+' : unread}
              </Text>
            </View>
          ) : null}
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
