import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
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
import { DashboardHero } from '@/components/dashboard/dashboard-hero';
import { DashboardC } from '@/constants/dashboard-theme';
import { useAppColors, usePaletteStyles, type AppColorsOf } from '@/lib/app-theme';
import { useGlass } from '@/lib/glass';
import { Fonts } from '@/constants/theme';
import { listMyChildren } from '@/lib/api/children';
import { ApiError, loadErrorMessage } from '@/lib/api/errors';
import { badges } from '@/lib/api/notifications';
import type { ApiChild, ChildrenResponse } from '@/lib/api/types';
import { statusLabel } from '@/lib/player-status';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';
import { trainingDate, trainingTime, typeName } from '@/lib/trainings';

/**
 * GoalHub Parent Home Dashboard (Prindi)
 *
 * Light-only, fixed-dp, mirrors the trainer/player dashboard visual language
 * (389 x 873 reference) but with a parent-specific structure:
 * - greeting with the signed-in parent's name
 * - stats carousel (registered children / open fees / active injuries)
 * - next-training event bar
 * - one dark-green long card per registered child, named after the child
 * - bottom Home / Chat navigation remains in the (tabs) layout
 *
 * Important:
 * - Images are decorative foreground elements (absolute, cropped, overflow
 *   hidden). Do NOT center them or give them their own white boxes.
 * - Content is intentionally compact so it fits without scrolling.
 */

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
  star: require('@/assets/dashboard/star.png'),
};

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export function ParentHome() {
  const glass = useGlass();
  const C = useAppColors(DashboardC);
  const styles = usePaletteStyles(createStyles, C);
  const router = useRouter();
  const { token, signOut, user } = useSession();

  const [children, setChildren] = useState<ApiChild[] | null>(null);
  const [totals, setTotals] = useState<ChildrenResponse['totals'] | null>(null);
  const [unread, setUnread] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    Promise.all([
      listMyChildren(token, controller.signal),
      /* The badge count is optional — it must not blank the child list. */
      badges(token, controller.signal).catch(() => null),
    ])
      .then(([res, counts]) => {
        if (controller.signal.aborted) return;
        setChildren(res.data);
        setTotals(res.totals);
        if (counts) setUnread(counts.notifications);
        setError(null);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          signOut();
          router.replace('/login');
          return;
        }
        setError(loadErrorMessage(err, 'Nuk mund të ngarkohen fëmijët.'));
      });

    return () => controller.abort();
  }, [token, router, signOut, reloadKey]);

  const retry = () => {
    setError(null);
    setReloadKey((value) => value + 1);
  };

  const open = (route: string) => {
    router.push(route as never);
  };

  const list = children ?? [];

  // The most recent rating across all the children, for the last stat card.
  const lastRatingChild = list.reduce<ApiChild | null>((best, c) => {
    if (!c.last_rating) return best;
    if (!best?.last_rating) return c;
    const a = new Date(c.last_rating.rated_at ?? 0).getTime();
    const b = new Date(best.last_rating.rated_at ?? 0).getTime();
    return a > b ? c : best;
  }, null);
  const lastRating =
    lastRatingChild?.last_rating?.average != null
      ? Number(lastRatingChild.last_rating.average).toFixed(1)
      : '—';

  // The soonest upcoming session across the children, for the "Tjetra" bar.
  const nextChild = list.reduce<ApiChild | null>((best, c) => {
    if (!c.next_training) return best;
    if (!best?.next_training) return c;
    const a = new Date(c.next_training.scheduled_at ?? 0).getTime();
    const b = new Date(best.next_training.scheduled_at ?? 0).getTime();
    return a < b ? c : best;
  }, null);
  const next = nextChild?.next_training ?? null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.content}>

          <DashboardHero>

          {/* =================================================
              HEADER + GREETING
             ================================================= */}

          <View style={styles.padded}>
            <HeaderBlock
              club={user?.club ?? '—'}
              unread={unread}
              onBell={() => open('/njoftimet-prindit')}
              onSettings={() => open('/settings')}
            />

            <View style={styles.welcome}>
              <Text style={styles.welcomeTitle}>
                Paneli
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
            <View style={styles.statsCard}>
              <BlurView
                intensity={55}
                tint={glass.tint}
                experimentalBlurMethod="dimezisBlurView"
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <LinearGradient
                colors={glass.highlight}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <LinearGradient
                colors={glass.sweep}
                locations={[0, 0.38, 0.62, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.statsGloss}
                pointerEvents="none"
              />
              <LinearGradient
                colors={glass.sweepSoft}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.statsGloss2}
                pointerEvents="none"
              />
              <View pointerEvents="none" style={styles.statsSheen} />

              <StatCard
                labelTop="Fëmijë të"
                labelBottom="regjistruar"
                value={totals ? String(totals.children) : '…'}
              />

              <View style={styles.statDivider} />

              <StatCard
                labelTop="Kuota të"
                labelBottom="hapura"
                value={totals ? String(totals.open_fees) : '…'}
              />

              <View style={styles.statDivider} />

              <StatCard
                labelTop="Lëndimet"
                labelBottom="aktive"
                value={totals ? String(totals.active_injuries) : '…'}
              />

              <View style={styles.statDivider} />

              <StatCard
                labelTop="Vlerësimi"
                labelBottom="i fundit"
                value={children ? lastRating : '…'}
              />
            </View>
          </View>
          </DashboardHero>

          {/* =================================================
              NEXT TRAINING (full content width)
             ================================================= */}

          {next && nextChild ? (
            <View style={styles.padded}>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/stervitjet-femiut',
                    params: {
                      id: String(nextChild.id),
                      name: nextChild.name ?? '',
                      team: nextChild.team?.name ?? '',
                    },
                  })
                }
                style={({ pressed }) => [
                  styles.eventBar,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.eventIcon}>
                  <MaterialCommunityIcons
                    name="calendar-month-outline"
                    size={I(18)}
                    color={C.greenText}
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
                    {`${trainingDate(next.scheduled_at)} • ${trainingTime(next.scheduled_at)} • ${typeName(next.type)}`}
                  </Text>
                </View>

                <MaterialCommunityIcons
                  name="chevron-right"
                  size={I(21)}
                  color={C.greenText}
                />
              </Pressable>
            </View>
          ) : null}

          {/* =================================================
              CHILDREN — one long card per registered child
             ================================================= */}

          <View style={styles.padded}>
            {error ? (
              <View style={styles.loadError}>
                <Text style={styles.loadErrorText}>{error}</Text>
                <Pressable
                  onPress={retry}
                  accessibilityRole="button"
                  accessibilityLabel="Provo përsëri"
                  style={({ pressed }) => [styles.loadRetry, pressed && styles.pressed]}
                >
                  <Text style={styles.loadRetryText}>Provo përsëri</Text>
                </Pressable>
              </View>
            ) : null}

            {list.map((child) => {
              const nr = child.jersey_number != null ? String(child.jersey_number) : '';
              const status = statusLabel(child.health_status);
              const rating =
                child.last_rating?.average != null
                  ? Number(child.last_rating.average).toFixed(1)
                  : '—';

              return (
                <Pressable
                  key={child.id}
                  onPress={() =>
                    router.push({
                      pathname: '/femiu',
                      params: {
                        id: String(child.id),
                        name: child.name ?? '',
                        team: child.team?.name ?? '',
                        nr,
                        status,
                      },
                    })
                  }
                  style={({ pressed }) => [
                    styles.childCard,
                    pressed && styles.pressed,
                  ]}
                >
                  {/* DECORATIVE GIANT NUMBER */}
                  <Text style={styles.childDeco}>
                    {nr}
                  </Text>

                  <View style={styles.childBody}>
                    <Text style={styles.childEyebrow}>
                      Prind
                    </Text>

                    <Text style={styles.childName} numberOfLines={1}>
                      {child.name ?? 'Fëmija'}
                    </Text>

                    <View style={styles.childChips}>
                      <View style={styles.chipAktiv}>
                        <Text style={styles.chipAktivText}>
                          {status}
                        </Text>
                      </View>

                      <View style={styles.chipRating}>
                        <MaterialCommunityIcons
                          name="star"
                          size={I(12)}
                          color="#F5C04A"
                        />
                        <Text style={styles.chipRatingText}>
                          {rating}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={I(22)}
                    color="rgba(245,245,245,0.85)"
                    style={styles.childChevron}
                  />
                </Pressable>
              );
            })}

            {list.length === 0 && !error ? (
              <Text style={styles.listNote} numberOfLines={2}>
                {children ? 'Nuk ka fëmijë të regjistruar.' : '…'}
              </Text>
            ) : null}
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
  const C = useAppColors(DashboardC);
  const styles = usePaletteStyles(createStyles, C);
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
            {club}
          </Text>

          <MaterialCommunityIcons
            name="chevron-down"
            size={I(12)}
            color={C.heroMutedText}
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
            color={C.textText}
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
            color={C.greenText}
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
};

function StatCard({ labelTop, labelBottom, value }: StatCardProps) {
  const C = useAppColors(DashboardC);
  const styles = usePaletteStyles(createStyles, C);
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {labelTop}
      </Text>

      <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {labelBottom}
      </Text>

      <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5}>
        {value}
      </Text>
    </View>
  );
}

/* =========================================================
   STYLES
   ========================================================= */

const createStyles = (C: AppColorsOf<typeof DashboardC>) => StyleSheet.create(scaled({

  /* =======================================================
     PAGE
     ======================================================= */

  safe: {
    flex: 1,
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

  /* Compact failure strip above the child cards; clears on retry. */
  loadError: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 24,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: C.whiteFill,
    borderWidth: 1,
    borderColor: C.borderBorder,
    borderRadius: 10,
  },

  loadErrorText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: C.textText,
  },

  loadRetry: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: C.greenBorder,
    borderRadius: 10,
  },

  loadRetryText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: C.greenText,
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

    color: C.textText,
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

    color: C.heroMutedText,
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

    backgroundColor: C.whiteFill,

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

    backgroundColor: C.profileBgFill,

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

    backgroundColor: C.greenFill,

    alignItems: 'center',
    justifyContent: 'center',

    paddingHorizontal: 3,

    borderWidth: 1.5,
    borderColor: C.bgBorder,
  },

  badgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 9,

    lineHeight: 11,

    color: C.whiteText,
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

    color: C.textText,
  },

  welcomeSub: {
    fontFamily: Fonts.body,

    fontSize: 12,
    lineHeight: 16,

    color: C.heroSubText,

    marginTop: 1,
  },

  /* =======================================================
     STATISTICS CAROUSEL
     ======================================================= */

  statsWrap: {
    marginTop: 22,
  },

  statsCard: {
    flexDirection: 'row',
    alignItems: 'stretch',

    marginLeft: 28,
    marginRight: 28,

    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.statBorderBorder,

    backgroundColor: C.glassBaseFill,

    overflow: 'hidden',

    shadowColor: '#0B3B33',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.18,
    shadowRadius: 14,

    elevation: 5,
  },

  statItem: {
    flex: 1,
    minWidth: 0,
    height: 94,

    position: 'relative',

    justifyContent: 'center',

    paddingLeft: 10,
    paddingRight: 8,

    overflow: 'hidden',
  },

  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: 12,
    backgroundColor: C.glassDividerFill,
  },

  statsGloss: {
    position: 'absolute',
    top: -130,
    left: -150,
    right: -150,
    height: 340,
    transform: [{ rotate: '-16deg' }],
  },

  statsGloss2: {
    position: 'absolute',
    top: 62,
    left: 30,
    right: -170,
    height: 80,
    transform: [{ rotate: '-16deg' }],
  },

  statsSheen: {
    position: 'absolute',
    top: 1.5,
    left: 10,
    right: 10,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: C.glassEdgeFill,
  },

  statLabel: {
    fontFamily: Fonts.bodySemiBold,

    fontSize: 11.5,
    lineHeight: 14.5,

    color: C.statLabelSoftText,

    zIndex: 3,
  },

  statValue: {
    fontFamily: Fonts.bodyBold,

    fontSize: 25,
    lineHeight: 28,

    letterSpacing: -0.5,

    color: C.textText,

    marginTop: 1,

    zIndex: 3,
  },

  /* =======================================================
     NEXT EVENT
     ======================================================= */

  eventBar: {
    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 26,

    minHeight: 53,

    backgroundColor: C.veryLightGreenFill,

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

    backgroundColor: C.eventIconBgFill,

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

    color: C.mutedText,
  },

  eventText: {
    fontFamily: Fonts.bodySemiBold,

    fontSize: 12.5,
    lineHeight: 16,

    color: C.textText,

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

    backgroundColor: C.greenDeepFill,

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

    color: 'rgba(245,245,245,0.72)',
  },

  childName: {
    fontFamily: Fonts.bodyBold,

    fontSize: 20,
    lineHeight: 24,

    letterSpacing: -0.4,

    color: C.whiteText,

    marginTop: 10,
  },

  childChips: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 6,

    marginTop: 9,
  },

  chipAktiv: {
    backgroundColor: C.chipAktivBgFill,

    borderRadius: 99,

    paddingVertical: 5,
    paddingHorizontal: 15,
  },

  chipAktivText: {
    fontFamily: Fonts.bodySemiBold,

    fontSize: 10.5,
    lineHeight: 13,

    color: C.greenDarkText,
  },

  chipRating: {
    flexDirection: 'row',
    alignItems: 'center',

    gap: 4,

    backgroundColor: 'rgba(245,245,245,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(245,245,245,0.24)',

    borderRadius: 99,

    paddingVertical: 5,
    paddingHorizontal: 15,
  },

  chipRatingText: {
    fontFamily: Fonts.bodySemiBold,

    fontSize: 10.5,
    lineHeight: 13,

    color: C.whiteText,
  },

  childChevron: {
    zIndex: 2,
  },

  /* The load error / empty-list line, above the child cards. */
  listNote: {
    marginTop: 24,
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 16,
    color: C.mutedText,
  },
}));
