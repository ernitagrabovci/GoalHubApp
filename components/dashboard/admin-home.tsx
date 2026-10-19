import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { type ReactNode, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { dashboardStats } from '@/lib/api/dashboard';
import { ApiError } from '@/lib/api/errors';
import { listMatches } from '@/lib/api/matches';
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

const C = {
  bg: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',
  cardBorder: 'rgba(30,40,35,0.12)',
  statBorder: '#E4A000',
  white: '#F5F5F5',
  green: '#159447',
  greenDark: '#0C6C36',
  lightGreen: '#DDF6E7',
  matchBg: '#F2FBF5',
  matchBorder: '#69C994',
  profileBg: '#E1F6EA',
  text: '#111111',
  text2: '#666666',
  muted: '#8A8A8A',
  faint: '#9E9E9E',
  red: '#D94B4B',
  orange: '#D99A4A',
  lavenderBg: '#F3ECF7',
  lavenderBorder: '#BCA6C4',
  beigeBg: '#F7EBD8',
  beigeBorder: '#E2C89B',
  promoBg: '#FBEFE8',
  promoBorder: 'rgba(217,77,77,0.22)',
};

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
  trainer: '#159447',
  assistant_trainer: '#159447',
  technical_staff: '#159447',
  player: '#D94B4B',
  parent: '#7B4F8E',
  financier: '#E4A000',
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
  const router = useRouter();
  const { user, token, signOut } = useSession();

  const [data, setData] = useState<DashboardStats | null>(null);
  const [teamData, setTeamData] = useState<TeamStats | null>(null);
  const [teams, setTeams] = useState<ApiTeam[] | null>(null);
  const [matches, setMatches] = useState<ApiMatch[] | null>(null);
  const [activity, setActivity] = useState<ActivityReport | null>(null);

  // These dashboard reads are one-shots — fetched together, and a failure of one
  // simply leaves its section empty. An abort is indistinguishable from a
  // timeout (both surface as status 0), so guard on our own signal.
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    Promise.allSettled([
      dashboardStats(token, controller.signal),
      teamStats(token, controller.signal),
      listTeams(token, controller.signal),
      listMatches(token, { status: 'upcoming' }, controller.signal),
      activityReport(token, controller.signal),
    ]).then(([dash, team, teamList, matchList, activityRes]) => {
      if (controller.signal.aborted) return;

      const failure = [dash, team, teamList, matchList, activityRes].find(
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
    });

    return () => controller.abort();
  }, [token, router, signOut]);

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
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.content}>
          <View style={styles.padded}>
            <HeaderBlock
              clubName={data?.club.name ?? '—'}
              onBell={() => router.push('/njoftimet')}
              onSettings={() => router.push('/settings')}
              onClub={() => router.push('/club-profile')}
            />

            {/* Welcome */}
            <View style={styles.welcome}>
              <Text style={styles.welcomeTitle}>Mirë se erdhe, {firstName}!</Text>
              <Text style={styles.welcomeSub}>Këtu është përmbledhja e klubit tënd sot.</Text>
            </View>
          </View>

          {/* Statistics carousel — intentionally overflows the right padding */}
          <View style={styles.statsWrap}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statsRow}
              bounces={false}
            >
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

              <StatCard
                labelTop="Trajnerët"
                labelBottom="Aktivë"
                value={count(teamData?.total_trainers)}
              >
                <View>
                  <Text style={styles.statSubLabel}>Sezoni</Text>
                  <Text style={styles.statSubValue}>{seasonName}</Text>
                </View>
              </StatCard>
            </ScrollView>
          </View>

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
                    <MaterialCommunityIcons name="chevron-right" size={I(22)} color={C.green} />
                  </Pressable>
                ))
              )}
            </View>

            {/* Recent activity + teams */}
            <View style={styles.twoCol}>
              <View style={styles.activityCard}>
                <View style={styles.cardHead}>
                  <MaterialCommunityIcons name="heart-pulse" size={I(16)} color={C.green} />
                  <Text style={styles.cardHeadText}>Raportet</Text>
                </View>
                {activity === null ? (
                  <View style={styles.activityRow}>
                    <View style={[styles.activityDot, { backgroundColor: C.faint }]} />
                    <View style={styles.activityBody}>
                      <Text style={styles.activityText}>…</Text>
                    </View>
                  </View>
                ) : recentLogins.length === 0 ? (
                  <View style={styles.activityRow}>
                    <View style={[styles.activityDot, { backgroundColor: C.faint }]} />
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
                <SeeAllFooter color={C.text} onPress={() => router.push('/raportet')} />
              </View>

              <View style={styles.teamsCard}>
                <View style={[styles.cardHead, styles.cardHeadLav]}>
                  <MaterialCommunityIcons name="shield-account-outline" size={I(17)} color="#7B4F8E" />
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
                <SeeAllFooter color={C.text} onPress={() => router.push('/teams')} />
              </View>
            </View>

            {/* Promotional cards */}
            <View style={styles.twoCol}>
              <Pressable
                style={({ pressed }) => [styles.promoPlayers, pressed && styles.pressed]}
                onPress={() => router.push('/players')}
              >
                <MaterialCommunityIcons name="soccer" size={I(17)} color={C.red} style={styles.promoIcon} />
                <Text style={styles.promoSmall}>Shiko të gjithë</Text>
                <Text style={styles.promoBig}>Lojtarët</Text>
                <Image source={IMG.young} style={styles.promoPlayerImg} resizeMode="contain" />
                <View style={[styles.promoBtn, { backgroundColor: C.red }]}>
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
                <View style={[styles.promoBtn, { backgroundColor: C.orange }]}>
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
  onBell,
  onSettings,
  onClub,
}: {
  clubName: string;
  onBell: () => void;
  onSettings: () => void;
  onClub: () => void;
}) {
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
          <MaterialCommunityIcons name="chevron-down" size={I(12)} color={C.muted} />
        </View>
      </View>
      <View style={styles.headerRight}>
        <Pressable onPress={onBell} hitSlop={6} style={({ pressed }) => [styles.roundBtn, pressed && styles.pressed]}>
          <MaterialCommunityIcons name="bell-outline" size={I(20)} color={C.text} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </Pressable>
        <Pressable
          onPress={onSettings}
          hitSlop={6}
          style={({ pressed }) => [styles.settingsBtn, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons name="cog-outline" size={I(20)} color={C.greenDark} />
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
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{labelTop}</Text>
      <Text style={styles.statLabel}>{labelBottom}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <View style={styles.statFoot}>{children}</View>
      {image ? <Image source={image} style={[styles.statImg, imageStyle]} resizeMode="contain" /> : null}
    </View>
  );
}

function SectionHead({ title, onSeeAll }: { title: string; onSeeAll: () => void }) {
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

const styles = StyleSheet.create(scaled({
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
    color: C.text,
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
    color: C.text2,
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
    backgroundColor: C.white,
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
    backgroundColor: C.profileBg,
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
    backgroundColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: C.bg,
  },
  badgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 9.5,
    color: C.white,
  },

  /* Welcome */
  welcome: {
    marginTop: 12,
  },
  welcomeTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 22,
    letterSpacing: -0.5,
    color: C.text,
    lineHeight: 28,
  },
  welcomeSub: {
    fontFamily: Fonts.body,
    fontSize: 13.5,
    color: C.muted,
    marginTop: 3,
  },

  /* Stats carousel */
  statsWrap: {
    marginTop: 12,
  },
  statsRow: {
    paddingLeft: 27,
    paddingRight: 27,
    gap: 8,
  },
  statCard: {
    width: 114,
    height: 110,
    backgroundColor: C.white,
    borderWidth: 1,
    /* Matches the orange rim on the headline squares of the detail pages. */
    borderColor: C.statBorder,
    borderRadius: 8,
    padding: 11,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 1,
  },
  statLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: C.muted,
    lineHeight: 15,
  },
  statValue: {
    fontFamily: Fonts.bodyBold,
    fontSize: 26,
    color: C.text,
    letterSpacing: -0.5,
    marginTop: 4,
    lineHeight: 32,
  },
  statFoot: {
    marginTop: 4,
  },
  statDown: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11.5,
    color: C.red,
    lineHeight: 14,
  },
  statDownSub: {
    fontFamily: Fonts.body,
    fontSize: 10.5,
    color: '#C25454',
    lineHeight: 13,
  },
  statSubLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: C.muted,
    lineHeight: 14,
  },
  statSubValue: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12.5,
    color: C.text2,
    lineHeight: 16,
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
    color: C.text,
  },
  seeAll: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13.5,
    color: C.green,
  },

  /* Matches */
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
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  matchRowSep: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#F5F5F5',
  },
  matchEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  matchEmptyText: {
    fontFamily: Fonts.body,
    fontSize: 12.5,
    color: C.muted,
  },
  pressed: {
    opacity: 0.6,
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
    backgroundColor: C.white,
    borderWidth: 1,
    borderColor: 'rgba(100,140,190,0.30)',
    borderRadius: 7,
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
    color: C.text,
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
    color: '#555555',
    lineHeight: 15,
  },
  activityName: {
    fontFamily: Fonts.bodySemiBold,
    color: '#222222',
  },
  activityTime: {
    fontFamily: Fonts.body,
    fontSize: 10.5,
    color: C.faint,
    marginTop: 1,
  },

  /* Teams card — one continuous card, 1px full-width dividers */
  teamsCard: {
    flex: 1,
    backgroundColor: C.lavenderBg,
    borderWidth: 1,
    borderColor: C.lavenderBorder,
    borderRadius: 7,
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
    color: '#3A3042',
    flexShrink: 1,
  },
  teamRowCount: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12.5,
    color: C.text,
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
    backgroundColor: C.promoBg,
    borderWidth: 1,
    borderColor: C.promoBorder,
    borderRadius: 8,
    overflow: 'hidden',
    padding: 12,
  },
  promoMedical: {
    flex: 1,
    height: 134,
    backgroundColor: C.beigeBg,
    borderWidth: 1,
    borderColor: C.beigeBorder,
    borderRadius: 8,
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
    color: C.text2,
  },
  promoBig: {
    fontFamily: Fonts.bodyBold,
    fontSize: 18,
    letterSpacing: -0.2,
    color: C.text,
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
    color: C.text2,
    textAlign: 'right',
  },
  medBig: {
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
    letterSpacing: -0.3,
    color: C.text,
    marginTop: 1,
    textAlign: 'right',
  },
  promoBtn: {
    position: 'absolute',
    right: 9,
    bottom: 9,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignItems: 'center',
  },
  promoBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13.5,
    color: C.white,
  },
}));
