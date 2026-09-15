import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { type ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

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
  white: '#FFFFFF',
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
  malisheva: require('@/assets/dashboard/malisheva.png'),
  gjilani: require('@/assets/dashboard/gjilani.png'),
  ulpiana: require('@/assets/dashboard/ulpiana.png'),
  statPlayer: require('@/assets/dashboard/stat-player.png'),
  statGrupe: require('@/assets/dashboard/stat-grupe.png'),
  calc: require('@/assets/dashboard/calculator.png'),
  young: require('@/assets/dashboard/young-player.png'),
  doctor: require('@/assets/dashboard/doctor.png'),
};

type Match = {
  age: string;
  away: string;
  awayLogo: number;
  time: string;
};

const MATCHES: Match[] = [
  { age: 'U17', away: 'KF Malisheva', awayLogo: IMG.malisheva, time: '18:00' },
  { age: 'U15', away: 'KF Gjilani', awayLogo: IMG.gjilani, time: '16:00' },
  { age: 'U15', away: 'KF Ulpiana', awayLogo: IMG.ulpiana, time: '14:00' },
];

const ACTIVITY = [
  {
    dot: '#D94B4B',
    title: 'Lëndimi i regjistruar',
    name: '— Nartl Çeripin',
    time: '5 ditë më parë',
  },
  {
    dot: '#1B5FA0',
    title: 'N. Çerkin i regjistruar',
    name: '— Ekipi i Parë',
    time: '6 ditë më parë',
  },
  {
    dot: '#159447',
    title: 'Pagesa €50.00',
    name: '— E. Hoxha',
    time: '2 javë më parë',
  },
];

const TEAMS = [
  { name: 'Ekipi i Parë', count: '25 lojtarë' },
  { name: 'U21', count: '18 lojtarë' },
  { name: 'U17', count: '16 lojtarë' },
  { name: 'U15', count: '14 lojtarë' },
];

export function AdminHome() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.content}>
          {/* Faint vertical stripe texture behind everything */}
          <View pointerEvents="none" style={styles.lines}>
            {Array.from({ length: lineCount }).map((_, i) => (
              <View key={i} style={[styles.line, { left: i * 9 }]} />
            ))}
          </View>

          <View style={styles.padded}>
            <HeaderBlock
              onBell={() => router.push('/notifications')}
              onSettings={() => router.push('/settings')}
              onClub={() => router.push('/club-profile')}
            />

            {/* Welcome */}
            <View style={styles.welcome}>
              <Text style={styles.welcomeTitle}>Mirë se erdhe, Admin!</Text>
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
                value="85"
              >
                <View>
                  <Text style={styles.statUp}>↑ 5 më shumë</Text>
                  <Text style={styles.statUpSub}>të kaluarën</Text>
                </View>
              </StatCard>

              <StatCard
                image={IMG.statGrupe}
                imageStyle={styles.statImgGrupe}
                labelTop="Numri i"
                labelBottom="Grupeve"
                value="5"
              >
                <View>
                  <Text style={styles.statSubLabel}>Sezoni</Text>
                  <Text style={styles.statSubValue}>2026/27</Text>
                </View>
              </StatCard>

              <StatCard
                image={IMG.calc}
                imageStyle={styles.statImgCalc}
                labelTop="Të"
                labelBottom="Ardhurat"
                value="€0"
              >
                <View>
                  <Text style={styles.statDown}>↓ 33€ pagesa</Text>
                  <Text style={styles.statDownSub}>të vonuara</Text>
                </View>
              </StatCard>

              <StatCard labelTop="Trajnerët" labelBottom="Aktivë" value="12">
                <View>
                  <Text style={styles.statSubLabel}>Sezoni</Text>
                  <Text style={styles.statSubValue}>2026/27</Text>
                </View>
              </StatCard>
            </ScrollView>
          </View>

          <View style={styles.padded}>
            {/* Today's matches */}
            <SectionHead title="Ndeshjet e sotme" onSeeAll={() => router.push('/ndeshjet')} />
            <View style={styles.matchesCard}>
              {MATCHES.map((m, i) => (
                <Pressable
                  key={`${m.age}-${m.away}`}
                  onPress={() => router.push('/ndeshjet')}
                  style={({ pressed }) => [
                    styles.matchRow,
                    i > 0 && styles.matchRowSep,
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.ageBadge}>
                    <Text style={styles.ageText}>{m.age}</Text>
                  </View>
                  <View style={styles.teamHome}>
                    <Image source={IMG.fcp} style={styles.matchLogo} resizeMode="contain" />
                    <Text style={styles.teamName} numberOfLines={1}>
                      Fc Prishtina
                    </Text>
                  </View>
                  <View style={styles.vsCol}>
                    <Text style={styles.vsText}>vs</Text>
                    <Text style={styles.timeText}>{m.time}</Text>
                  </View>
                  <View style={styles.teamAway}>
                    <Text style={styles.teamNameAway} numberOfLines={1}>
                      {m.away}
                    </Text>
                    <Image source={m.awayLogo} style={styles.matchLogo} resizeMode="contain" />
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={I(22)} color={C.green} />
                </Pressable>
              ))}
            </View>

            {/* Recent activity + teams */}
            <View style={styles.twoCol}>
              <View style={styles.activityCard}>
                <View style={styles.cardHead}>
                  <MaterialCommunityIcons name="heart-pulse" size={I(16)} color={C.green} />
                  <Text style={styles.cardHeadText}>Aktivitetet e fundit</Text>
                </View>
                {ACTIVITY.map((a, i) => (
                  <View key={i} style={styles.activityRow}>
                    <View style={[styles.activityDot, { backgroundColor: a.dot }]} />
                    <View style={styles.activityBody}>
                      <Text style={styles.activityText} numberOfLines={2}>
                        {a.title}
                        <Text style={styles.activityName}> {a.name}</Text>
                      </Text>
                      <Text style={styles.activityTime}>{a.time}</Text>
                    </View>
                  </View>
                ))}
                <SeeAllFooter color={C.text} onPress={() => router.push('/notifications')} />
              </View>

              <View style={styles.teamsCard}>
                <View style={[styles.cardHead, styles.cardHeadLav]}>
                  <MaterialCommunityIcons name="shield-account-outline" size={I(17)} color="#7B4F8E" />
                  <Text style={styles.cardHeadText}>Ekipet</Text>
                </View>
                {TEAMS.map((team) => (
                  <View key={team.name} style={styles.teamRow}>
                    <Text style={styles.teamRowName} numberOfLines={1}>
                      {team.name}
                    </Text>
                    <Text style={styles.teamRowCount}>{team.count}</Text>
                  </View>
                ))}
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
                onPress={() => router.push('/medical')}
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
  onBell,
  onSettings,
  onClub,
}: {
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
          <Text style={styles.clubName}>FC Prishtina</Text>
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
    backgroundColor: C.bg,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 14,
  },
  content: {
    flex: 1,
  },
  lines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  line: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: C.line,
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
    borderColor: C.cardBorder,
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
    fontFamily: Fonts.bodySemiBold,
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
  statUp: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11.5,
    color: C.green,
    lineHeight: 14,
  },
  statUpSub: {
    fontFamily: Fonts.body,
    fontSize: 10.5,
    color: C.greenDark,
    lineHeight: 13,
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
    borderTopColor: '#FFFFFF',
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
