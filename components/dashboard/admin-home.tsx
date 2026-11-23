import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { type ReactNode, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { DashboardHero } from '@/components/dashboard/dashboard-hero';
import { DashboardC } from '@/constants/dashboard-theme';
import { useAppColors, usePaletteStyles, type AppColorsOf } from '@/lib/app-theme';
import { useGlass } from '@/lib/glass';
import { Fonts } from '@/constants/theme';
import { dashboardStats } from '@/lib/api/dashboard';
import { ApiError, loadErrorMessage } from '@/lib/api/errors';
import { listMatches } from '@/lib/api/matches';
import { badges } from '@/lib/api/notifications';
import { activityReport } from '@/lib/api/reports';
import { listTeams, teamStats } from '@/lib/api/teams';
import type {
  ActivityReport,
  ApiMatch,
  ApiTeam,
  DashboardStats,
  TeamStats,
} from '@/lib/api/types';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * GoalHub Admin Home Dashboard (light-only).
 * Faithful reproduction of the FC Prishtina admin home reference:
 * white background with faint vertical lines, brand header, stats carousel,
 * today's matches, activity + teams cards, promo cards. The floating bottom
 * nav (Home / Përdoruesit / Pagesat / Chat) is rendered by the (tabs) tab bar.
 * Content stays in Albanian, hardcoded to match the reference exactly.
 */

const DIVIDER = 'rgba(30,40,35,0.10)';
const DIVIDER_LAV = 'rgba(123,79,142,0.22)';

const IMG = {
  fcp: require('@/assets/dashboard/fcp.png'),
  statPlayer: require('@/assets/dashboard/stat-player.png'),
  statGrupe: require('@/assets/dashboard/stat-grupe.png'),
  calc: require('@/assets/dashboard/calculator.png'),
  young: require('@/assets/dashboard/young-player.png'),
  doctor: require('@/assets/dashboard/doctor.png'),
};

/* The activity report carries logins, not a feed — each row is one of them. */
const ROLE_TONE: Record<string, string> = {
  administrator: '#1B5FA0',
  trainer: '#2E7D5B',
  assistant_trainer: '#2E7D5B',
  technical_staff: '#2E7D5B',
  player: '#D94B4B',
  parent: '#7B4F8E',
  financier: '#B45309',
};

const ROLE_NAME: Record<string, string> = {
  administrator: 'Administratori',
  trainer: 'Trajneri',
  assistant_trainer: 'Asistenti',
  technical_staff: 'Stafi teknik',
  player: 'Lojtari',
  parent: 'Prindi',
  financier: 'Financieri',
};

/** An ISO timestamp → "5 ditë më parë". */
function ago(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';

  const mins = Math.max(0, Math.round((Date.now() - d.getTime()) / 60000));
  if (mins < 1) return 'tani';
  if (mins < 60) return `${mins} min më parë`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} orë më parë`;

  const days = Math.floor(hours / 24);
  return days < 7 ? `${days} ditë më parë` : `${Math.floor(days / 7)} javë më parë`;
}

/** Today's date as `YYYY-MM-DD`, for comparing against `scheduled_at`. */
function localDay(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isToday(iso: string | null): boolean {
  return localDay(iso) === localDay(new Date().toISOString());
}

function hhmm(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function AdminHome() {
  const glass = useGlass();
  const C = useAppColors(DashboardC);
  const styles = usePaletteStyles(createStyles, C);
  const router = useRouter();
  const { user, token, signOut } = useSession();

  const [data, setData] = useState<DashboardStats | null>(null);
  const [teamData, setTeamData] = useState<TeamStats | null>(null);
  const [teams, setTeams] = useState<ApiTeam[] | null>(null);
  const [matches, setMatches] = useState<ApiMatch[] | null>(null);
  const [activity, setActivity] = useState<ActivityReport | null>(null);
  const [unread, setUnread] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // These dashboard reads are one-shots — fetched together. A failed feed keeps
  // its own section empty; the banner under the greeting says the data did not
  // arrive and offers a retry rather than failing silently. An abort is
  // indistinguishable from a timeout (both surface as status 0), so guard on
  // our own signal.
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    Promise.allSettled([
      dashboardStats(token, controller.signal),
      teamStats(token, controller.signal),
      listTeams(token, controller.signal),
      listMatches(token, { status: 'upcoming' }, controller.signal),
      activityReport(token, controller.signal),
      badges(token, controller.signal),
    ]).then(([dash, team, teamList, matchList, activityRes, badgeCounts]) => {
      if (controller.signal.aborted) return;

      const failure = [dash, team, teamList, matchList, activityRes, badgeCounts].find(
        (r) => r.status === 'rejected',
      );
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

      if (dash.status === 'fulfilled') setData(dash.value);
      if (team.status === 'fulfilled') setTeamData(team.value);
      if (teamList.status === 'fulfilled') setTeams(teamList.value.data);
      if (matchList.status === 'fulfilled') setMatches(matchList.value.data);
      if (activityRes.status === 'fulfilled') setActivity(activityRes.value);
      if (badgeCounts.status === 'fulfilled') setUnread(badgeCounts.value.notifications);

      const failed = [dash, team, teamList, matchList, activityRes, badgeCounts].find(
        (r) => r.status === 'rejected',
      );
      if (failed && failed.status === 'rejected') {
        setLoadError(
          loadErrorMessage(failed.reason, 'Nuk mund të ngarkohen të dhënat. Kontrollo lidhjen.'),
        );
      }
    });

    return () => controller.abort();
  }, [token, router, signOut, reloadKey]);

  const retry = () => {
    setLoadError(null);
    setReloadKey((value) => value + 1);
  };

  const stats = data?.stats;
  const seasonName = data?.season?.name ?? teamData?.season ?? '—';
  const count = (value: number | undefined) => (value == null ? '—' : String(value));
  const income = stats ? `€${Math.round(Number(stats.monthly_income))}` : '—';
  const firstName = user?.name.split(' ')[0] ?? 'Admin';
  const clubName = data?.club.name ?? '—';
  const todayMatches = (matches ?? []).filter((m) => isToday(m.scheduled_at));
  const recentLogins = (activity?.recent_logins ?? []).slice(0, 3);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.content}>
          <DashboardHero>
          <View style={styles.padded}>
            <HeaderBlock
              clubName={data?.club.name ?? '—'}
              unread={unread}
              onBell={() => router.push('/njoftimet')}
              onSettings={() => router.push('/settings')}
              onClub={() => router.push('/club-profile')}
            />

            {/* Welcome */}
            <View style={styles.welcome}>
              <Text style={styles.welcomeTitle}>Mirë se erdhe, {firstName}!</Text>
              <Text style={styles.welcomeSub}>Këtu është përmbledhja e klubit tënd sot.</Text>
            </View>

            {loadError ? (
              <View style={styles.loadError}>
                <Text style={styles.loadErrorText}>{loadError}</Text>
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
          </View>

          {/* Statistics — one unified card with hairline dividers */}
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
                image={IMG.statPlayer}
                imageStyle={styles.statImgPlayer}
                labelTop="Lojtarë"
                labelBottom="Aktivë"
                value={count(stats?.players)}
              >
                <View>
                  <Text style={styles.statSubValue}>{count(stats?.injured)}</Text>
                  <Text style={styles.statSubLabel}>të lënduar</Text>
                </View>
              </StatCard>

              <View style={styles.statDivider} />

              <StatCard
                image={IMG.statGrupe}
                imageStyle={styles.statImgGrupe}
                labelTop="Numri i"
                labelBottom="Grupeve"
                value={count(stats?.teams)}
              >
                <View>
                  <Text style={styles.statSubLabel}>Sezoni</Text>
                  <Text style={styles.statSubValue}>{seasonName}</Text>
                </View>
              </StatCard>

              <View style={styles.statDivider} />

              <StatCard
                image={IMG.calc}
                imageStyle={styles.statImgCalc}
                labelTop="Të"
                labelBottom="Ardhurat"
                value={income}
              >
                <View>
                  <Text style={styles.statDown}>↓ {count(stats?.delayed_fees)} pagesa</Text>
                  <Text style={styles.statDownSub}>të vonuara</Text>
                </View>
              </StatCard>

              <View style={styles.statDivider} />

              <StatCard
                image={IMG.statGrupe}
                imageStyle={styles.statImgGrupe}
                labelTop="Trajnerët"
                labelBottom="Aktivë"
                value={count(teamData?.total_trainers)}
              >
                <View>
                  <Text style={styles.statSubLabel}>Sezoni</Text>
                  <Text style={styles.statSubValue}>{seasonName}</Text>
                </View>
              </StatCard>
            </View>
          </View>
          </DashboardHero>

          <View style={styles.padded}>
            {/* Today's matches */}
            <SectionHead title="Ndeshjet e sotme" onSeeAll={() => router.push('/ndeshjet')} />
            <View style={styles.matchesCard}>
              {matches === null ? (
                <View style={styles.matchEmpty}>
                  <Text style={styles.matchEmptyText}>…</Text>
                </View>
              ) : todayMatches.length === 0 ? (
                <View style={styles.matchEmpty}>
                  <Text style={styles.matchEmptyText}>Nuk ka ndeshje sot.</Text>
                </View>
              ) : (
                todayMatches.map((m, i) => (
                  <Pressable
                    key={m.id}
                    onPress={() => router.push('/ndeshjet')}
                    style={({ pressed }) => [
                      styles.matchRow,
                      i > 0 && styles.matchRowSep,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.ageBadge}>
                      <Text style={styles.ageText} numberOfLines={1}>
                        {m.team?.name ?? '—'}
                      </Text>
                    </View>
                    <View style={styles.teamHome}>
                      <Image source={IMG.fcp} style={styles.matchLogo} resizeMode="contain" />
                      <Text style={styles.teamName} numberOfLines={1}>
                        {clubName}
                      </Text>
                    </View>
                    <View style={styles.vsCol}>
                      <Text style={styles.vsText}>vs</Text>
                      <Text style={styles.timeText}>{hhmm(m.scheduled_at)}</Text>
                    </View>
                    <View style={styles.teamAway}>
                      <Text style={styles.teamNameAway} numberOfLines={1}>
                        {m.opponent ?? '—'}
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={I(22)} color={C.greenText} />
                  </Pressable>
                ))
              )}
            </View>

            {/* Recent activity + teams */}
            <View style={styles.twoCol}>
              <View style={styles.activityCard}>
                <View style={styles.cardHead}>
                  <MaterialCommunityIcons name="heart-pulse" size={I(16)} color={C.greenText} />
                  <Text style={styles.cardHeadText}>Raportet</Text>
                </View>
                {activity === null ? (
                  <View style={styles.activityRow}>
                    <View style={[styles.activityDot, { backgroundColor: C.faintFill }]} />
                    <View style={styles.activityBody}>
                      <Text style={styles.activityText}>…</Text>
                    </View>
                  </View>
                ) : recentLogins.length === 0 ? (
                  <View style={styles.activityRow}>
                    <View style={[styles.activityDot, { backgroundColor: C.faintFill }]} />
                    <View style={styles.activityBody}>
                      <Text style={styles.activityText}>Nuk ka aktivitet.</Text>
                    </View>
                  </View>
                ) : (
                  recentLogins.map((a) => (
                    <View key={a.id} style={styles.activityRow}>
                      <View
                        style={[
                          styles.activityDot,
                          { backgroundColor: ROLE_TONE[a.role] ?? C.faint },
                        ]}
                      />
                      <View style={styles.activityBody}>
                        <Text style={styles.activityText} numberOfLines={2}>
                          {`${ROLE_NAME[a.role] ?? a.role} u kyç`}
                          <Text style={styles.activityName}>{` — ${a.name}`}</Text>
                        </Text>
                        <Text style={styles.activityTime}>{ago(a.last_login_at)}</Text>
                      </View>
                    </View>
                  ))
                )}
                <SeeAllFooter color={C.textText} onPress={() => router.push('/raportet')} />
              </View>

              <View style={styles.teamsCard}>
                <View style={[styles.cardHead, styles.cardHeadLav]}>
                  <MaterialCommunityIcons name="shield-account-outline" size={I(17)} color={C.promoIconText} />
                  <Text style={styles.cardHeadText}>Ekipet</Text>
                </View>
                {teams === null ? (
                  <View style={styles.teamRow}>
                    <Text style={styles.teamRowName}>…</Text>
                  </View>
                ) : teams.length === 0 ? (
                  <View style={styles.teamRow}>
                    <Text style={styles.teamRowName}>Nuk ka ekipe.</Text>
                  </View>
                ) : (
                  teams.slice(0, 4).map((t) => (
                    <View key={t.id} style={styles.teamRow}>
                      <Text style={styles.teamRowName} numberOfLines={1}>
                        {t.name}
                      </Text>
                      <Text style={styles.teamRowCount}>{`${t.players_count ?? 0} lojtarë`}</Text>
                    </View>
                  ))
                )}
                <SeeAllFooter color={C.textText} onPress={() => router.push('/teams')} />
              </View>
            </View>

            {/* Promotional cards */}
            <View style={styles.twoCol}>
              <Pressable
                style={({ pressed }) => [styles.promoPlayers, pressed && styles.pressed]}
                onPress={() => router.push('/players')}
              >
                <MaterialCommunityIcons name="soccer" size={I(17)} color={C.redText} style={styles.promoIcon} />
                <Text style={styles.promoSmall}>Shiko të gjithë</Text>
                <Text style={styles.promoBig}>Lojtarët</Text>
                <Image source={IMG.young} style={styles.promoPlayerImg} resizeMode="contain" />
                <View style={[styles.promoBtn, { backgroundColor: C.redFill }]}>
                  <Text style={styles.promoBtnText}>Vazhdo</Text>
                </View>
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.promoMedical, pressed && styles.pressed]}
                onPress={() => router.push('/kartela-mjeksore')}
              >
                <Image source={IMG.doctor} style={styles.promoDoctorImg} resizeMode="contain" />
                <View style={styles.medTextWrap}>
                  <Text style={styles.medSmall}>Kartela</Text>
                  <Text style={styles.medBig}>Mjekësore</Text>
                </View>
                <View style={[styles.promoBtn, { backgroundColor: C.orangeFill }]}>
                  <Text style={styles.promoBtnText}>Vazhdo</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HeaderBlock({
  clubName,
  unread,
  onBell,
  onSettings,
  onClub,
}: {
  clubName: string;
  unread: number;
  onBell: () => void;
  onSettings: () => void;
  onClub: () => void;
}) {
  const C = useAppColors(DashboardC);
  const styles = usePaletteStyles(createStyles, C);
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onClub}
        hitSlop={8}
        style={({ pressed }) => pressed && styles.pressed}
      >
        <Image source={IMG.fcp} style={styles.headerLogo} resizeMode="contain" />
      </Pressable>
      <View style={styles.brandCol}>
        <Text style={styles.brandName}>GoalHub</Text>
        <View style={styles.clubRow}>
          <Text style={styles.clubName} numberOfLines={1}>
            {clubName}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={I(12)} color={C.heroMutedText} />
        </View>
      </View>
      <View style={styles.headerRight}>
        <Pressable onPress={onBell} hitSlop={6} style={({ pressed }) => [styles.roundBtn, pressed && styles.pressed]}>
          <MaterialCommunityIcons name="bell-outline" size={I(20)} color={C.textText} />
          {unread > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
            </View>
          ) : null}
        </Pressable>
        <Pressable
          onPress={onSettings}
          hitSlop={6}
          style={({ pressed }) => [styles.settingsBtn, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons name="cog-outline" size={I(20)} color={C.greenDarkText} />
        </Pressable>
      </View>
    </View>
  );
}

type StatCardProps = {
  labelTop: string;
  labelBottom: string;
  value: string;
  image?: number;
  imageStyle?: object;
  children: ReactNode;
};

function StatCard({ labelTop, labelBottom, value, image, imageStyle, children }: StatCardProps) {
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
      <View style={styles.statFoot}>{children}</View>
      {image ? <Image source={image} style={[styles.statImg, imageStyle]} resizeMode="contain" /> : null}
    </View>
  );
}

function SectionHead({ title, onSeeAll }: { title: string; onSeeAll: () => void }) {
  const C = useAppColors(DashboardC);
  const styles = usePaletteStyles(createStyles, C);
  return (
    <View style={styles.sectionHead}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable onPress={onSeeAll} hitSlop={8}>
        <Text style={styles.seeAll}>Shiko të gjitha</Text>
      </Pressable>
    </View>
  );
}

function SeeAllFooter({ color, onPress }: { color: string; onPress: () => void }) {
  const C = useAppColors(DashboardC);
  const styles = usePaletteStyles(createStyles, C);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.footer, pressed && styles.pressed]}
    >
      <Text style={[styles.footerText, { color }]}>Shiko të gjitha</Text>
    </Pressable>
  );
}

const createStyles = (C: AppColorsOf<typeof DashboardC>) => StyleSheet.create(scaled({
  safe: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 14,
  },
  content: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: 27,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  headerLogo: {
    width: 24,
    height: 36,
  },
  brandCol: {
    marginLeft: 10,
  },
  brandName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
    letterSpacing: -0.3,
    color: C.textText,
    lineHeight: 20,
  },
  clubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  clubName: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: C.heroMutedText,
  },
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
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
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
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
    fontSize: 9.5,
    color: C.whiteText,
  },

  /* Welcome */
  welcome: {
    marginTop: 12,
  },
  welcomeTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 22,
    letterSpacing: -0.5,
    color: C.textText,
    lineHeight: 28,
  },
  welcomeSub: {
    fontFamily: Fonts.body,
    fontSize: 13.5,
    color: C.heroSubText,
    marginTop: 3,
  },

  /* Statistics — one unified card */
  statsWrap: {
    marginTop: 12,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginHorizontal: 27,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.statBorderBorder,
    backgroundColor: C.glassBaseFill,
    overflow: 'hidden',
    shadowColor: '#0B3B33',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 5,
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
  statItem: {
    flex: 1,
    minWidth: 0,
    height: 96,
    padding: 8,
    overflow: 'hidden',
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: 12,
    backgroundColor: C.glassDividerFill,
  },
  statLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 9.5,
    color: C.statLabelText,
    lineHeight: 11.5,
  },
  statValue: {
    fontFamily: Fonts.bodyBold,
    fontSize: 19,
    color: C.textText,
    letterSpacing: -0.5,
    marginTop: 2,
    lineHeight: 23,
  },
  statFoot: {
    marginTop: 2,
  },
  statDown: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 9.5,
    color: C.redText,
    lineHeight: 11.5,
  },
  statDownSub: {
    fontFamily: Fonts.body,
    fontSize: 9,
    color: C.statDownSubText,
    lineHeight: 11,
  },
  statSubLabel: {
    fontFamily: Fonts.body,
    fontSize: 9,
    color: C.statSubLabelText,
    lineHeight: 11,
  },
  statSubValue: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    color: C.statSubValueText,
    lineHeight: 13,
  },
  statImg: {
    position: 'absolute',
  },
  statImgPlayer: {
    width: 46,
    height: 62,
    right: -4,
    bottom: -6,
  },
  statImgGrupe: {
    width: 40,
    height: 76,
    right: -2,
    bottom: -6,
  },
  statImgCalc: {
    width: 40,
    height: 84,
    right: 0,
    bottom: -2,
    opacity: 0.97,
  },

  /* Section headers */
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 7,
  },
  sectionTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16.5,
    letterSpacing: -0.2,
    color: C.textText,
  },
  seeAll: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13.5,
    color: C.seeAllText,
  },

  /* Matches */
  matchesCard: {
    backgroundColor: C.matchBgFill,
    borderWidth: 1,
    borderColor: C.matchBorderBorder,
    borderRadius: 12,
    overflow: 'hidden',
  },
  matchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  matchRowSep: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(23,37,30,0.08)',
  },
  matchEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  matchEmptyText: {
    fontFamily: Fonts.body,
    fontSize: 12.5,
    color: C.mutedText,
  },
  pressed: {
    opacity: 0.6,
  },

  /* Compact failure strip: the feeds are independent, so it sits under the
     greeting and clears on retry. */
  loadError: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 12,
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
  ageBadge: {
    backgroundColor: C.lightGreenFill,
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    marginRight: 9,
  },
  ageText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: C.greenDarkText,
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
    color: C.text2Text,
    flexShrink: 1,
  },
  teamNameAway: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13.5,
    color: C.text2Text,
    flexShrink: 1,
  },
  vsCol: {
    alignItems: 'center',
    marginHorizontal: 6,
  },
  vsText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: C.faintText,
    textTransform: 'uppercase',
    lineHeight: 15,
  },
  timeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: C.mutedText,
    lineHeight: 15,
  },

  /* Two column pair */
  twoCol: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    alignItems: 'stretch',
  },

  /* Activity card — one continuous card, 1px full-width dividers */
  activityCard: {
    flex: 1,
    backgroundColor: C.whiteFill,
    borderWidth: 1,
    borderColor: C.cardBorderBorder,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
  },
  cardHeadLav: {
    borderBottomColor: DIVIDER_LAV,
  },
  cardHeadText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13.5,
    color: C.textText,
  },
  activityRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER,
  },
  activityDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginTop: 4,
  },
  activityBody: {
    flex: 1,
  },
  activityText: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    color: C.text2Text,
    lineHeight: 15,
  },
  activityName: {
    fontFamily: Fonts.bodySemiBold,
    color: C.textText,
  },
  activityTime: {
    fontFamily: Fonts.body,
    fontSize: 10.5,
    color: C.faintText,
    marginTop: 1,
  },

  /* Teams card — one continuous card, 1px full-width dividers */
  teamsCard: {
    flex: 1,
    backgroundColor: C.lavenderBgFill,
    borderWidth: 1,
    borderColor: C.lavenderBorderBorder,
    borderRadius: 12,
    overflow: 'hidden',
  },
  teamRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: DIVIDER_LAV,
  },
  teamRowName: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12.5,
    color: C.teamRowNameText,
    flexShrink: 1,
  },
  teamRowCount: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12.5,
    color: C.textText,
    marginLeft: 6,
  },

  /* Integrated footer — part of the same card, separated by the row divider */
  footer: {
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13.5,
  },

  /* Promo cards */
  promoPlayers: {
    flex: 1,
    height: 134,
    backgroundColor: C.promoBgFill,
    borderWidth: 1,
    borderColor: C.promoBorderBorder,
    borderRadius: 12,
    overflow: 'hidden',
    padding: 12,
  },
  promoMedical: {
    flex: 1,
    height: 134,
    backgroundColor: C.beigeBgFill,
    borderWidth: 1,
    borderColor: C.beigeBorderBorder,
    borderRadius: 12,
    overflow: 'hidden',
    padding: 12,
  },
  promoIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  promoSmall: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: C.text2Text,
  },
  promoBig: {
    fontFamily: Fonts.bodyBold,
    fontSize: 18,
    letterSpacing: -0.2,
    color: C.textText,
    marginTop: 1,
  },
  promoPlayerImg: {
    position: 'absolute',
    width: 102,
    height: 80,
    left: -12,
    bottom: -8,
  },
  promoDoctorImg: {
    position: 'absolute',
    width: 58,
    height: 116,
    left: -2,
    bottom: -2,
  },
  medTextWrap: {
    position: 'absolute',
    top: 9,
    right: 12,
    alignItems: 'flex-end',
  },
  medSmall: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13.5,
    color: C.text2Text,
    textAlign: 'right',
  },
  medBig: {
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
    letterSpacing: -0.3,
    color: C.textText,
    marginTop: 1,
    textAlign: 'right',
  },
  promoBtn: {
    position: 'absolute',
    right: 9,
    bottom: 9,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignItems: 'center',
  },
  promoBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13.5,
    color: C.whiteText,
  },
}));
