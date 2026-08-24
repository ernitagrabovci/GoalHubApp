import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DateTile, IconTile, InitialsTile, ListRow } from '@/components/list-row';
import { StatusChip, type StatusTone } from '@/components/status-chip';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_MESSAGES, ALL_PLAYERS, ALL_TRAININGS, feesForRole, type FeeStatus, type Health } from '@/lib/data';
import { ROLE_DASHBOARD } from '@/lib/role-content';
import { ROLE_LABELS, useSession, type Role } from '@/lib/session';

const FEE_TONE: Record<FeeStatus, StatusTone> = {
  paid: 'emerald',
  unpaid: 'warning',
  delayed: 'purple',
  critical: 'danger',
};

const HEALTH_TONE: Record<Health, StatusTone> = {
  active: 'emerald',
  injured: 'danger',
  rehabilitation: 'warning',
  suspended: 'purple',
};

type QuickLink = { label: string; icon: IconSymbolName; tint: string; route: string };

const HOME_LINKS: Record<Role, QuickLink[]> = {
  administrator: [
    { label: 'Players', icon: 'person.2.fill', tint: '#B0E4CC', route: '/players' },
    { label: 'Fees', icon: 'dollarsign.circle.fill', tint: '#2fbf71', route: '/fees' },
    { label: 'Medical', icon: 'stethoscope', tint: '#E24B4A', route: '/medical' },
    { label: 'Trainings', icon: 'calendar', tint: '#408A71', route: '/trainings' },
  ],
  trainer: [
    { label: 'Trainings', icon: 'calendar', tint: '#408A71', route: '/trainings' },
    { label: 'Players', icon: 'person.2.fill', tint: '#B0E4CC', route: '/players' },
    { label: 'Medical', icon: 'stethoscope', tint: '#E24B4A', route: '/medical' },
  ],
  player: [
    { label: 'My Stats', icon: 'chart.bar.fill', tint: '#f5a623', route: '/stats' },
    { label: 'Fees', icon: 'dollarsign.circle.fill', tint: '#2fbf71', route: '/fees' },
    { label: 'Medical', icon: 'stethoscope', tint: '#E24B4A', route: '/medical' },
  ],
  parent: [
    { label: 'My Child', icon: 'person.fill', tint: '#8f86e8', route: '/child' },
    { label: 'Fees', icon: 'dollarsign.circle.fill', tint: '#2fbf71', route: '/fees' },
    { label: 'Medical', icon: 'stethoscope', tint: '#E24B4A', route: '/medical' },
  ],
  financier: [
    { label: 'Fees', icon: 'dollarsign.circle.fill', tint: '#2fbf71', route: '/fees' },
    { label: 'Expenses', icon: 'receipt', tint: '#408A71', route: '/expenses' },
    { label: 'Reports', icon: 'chart.bar.fill', tint: '#B0E4CC', route: '/reports' },
  ],
};

export default function HomeScreen() {
  const router = useRouter();
  const { user, signOut } = useSession();

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar style="light" />
        <View style={styles.signedOut}>
          <Image
            source={require('@/assets/images/goalhub-logo.png')}
            style={styles.signedOutLogo}
            resizeMode="contain"
          />
          <Text style={styles.signedOutTitle}>you&apos;re signed out</Text>
          <Text style={styles.signedOutSub}>
            Sign in to see your personal dashboard.
          </Text>
          <Pressable style={styles.signedOutButton} onPress={() => router.replace('/login')}>
            <Text style={styles.signedOutButtonText}>go to sign in</Text>
            <IconSymbol name="arrow.right" size={18} color={Colors.textOnPrimary} />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const dash = ROLE_DASHBOARD[user.role];
  const child = ALL_PLAYERS.find((p) => p.name === 'Agon Gashi');
  const player = ALL_PLAYERS.find((p) => p.name === 'Ardit Llapashtica');
  const fees = feesForRole(user.role);
  const currentFee = fees[0];
  const nextTraining = ALL_TRAININGS[0];
  const latestMessage = ALL_MESSAGES[0];

  const handleSignOut = () => {
    signOut();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brand}>
            <Image
              source={require('@/assets/images/goalhub-logo.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
            <Text style={styles.brandText}>goalhub</Text>
          </View>
          <Pressable onPress={() => router.navigate('/profile')} hitSlop={8}>
            <View style={[styles.avatar, { backgroundColor: `${user.color}26` }]}>
              <Text style={[styles.avatarText, { color: user.color }]}>{user.initials}</Text>
            </View>
          </Pressable>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <Text style={styles.heroKicker}>GoalHub · {ROLE_LABELS[user.role]}</Text>
            <Pressable style={styles.rolePill} onPress={handleSignOut}>
              <IconSymbol name="logout" size={13} color={Colors.mint} />
              <Text style={styles.rolePillText}>switch role</Text>
            </Pressable>
          </View>
          <Text style={styles.heroTitle}>{dash.greeting}</Text>
          <Text style={styles.heroSub}>{dash.subtitle}</Text>
        </View>

        {/* Child / person card */}
        {user.role === 'parent' && child ? (
          <Pressable style={styles.childCard} onPress={() => router.push('/child')}>
            <InitialsTile initials={child.initials} color={child.color} size={56} />
            <View style={styles.childBody}>
              <Text style={styles.childKicker}>your child</Text>
              <Text style={styles.childName}>{child.name}</Text>
              <Text style={styles.childMeta}>
                {child.position} · No. {child.number} · age {child.age}
              </Text>
              <View style={styles.childTags}>
                <StatusChip label={child.health} tone={HEALTH_TONE[child.health]} />
                <View style={styles.ratingChip}>
                  <IconSymbol name="star.fill" size={11} color="#f5a623" />
                  <Text style={styles.ratingText}>{child.rating.toFixed(1)}</Text>
                </View>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={18} color={Colors.textMuted} />
          </Pressable>
        ) : user.role === 'player' && player ? (
          <Pressable style={styles.childCard} onPress={() => router.push('/stats')}>
            <InitialsTile initials={player.initials} color={player.color} size={56} />
            <View style={styles.childBody}>
              <Text style={styles.childKicker}>your profile</Text>
              <Text style={styles.childName}>{player.name}</Text>
              <Text style={styles.childMeta}>
                {player.position} · No. {player.number} · age {player.age}
              </Text>
              <View style={styles.childTags}>
                <StatusChip label={player.health} tone={HEALTH_TONE[player.health]} />
                <View style={styles.ratingChip}>
                  <IconSymbol name="star.fill" size={11} color="#f5a623" />
                  <Text style={styles.ratingText}>{player.rating.toFixed(1)}</Text>
                </View>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={18} color={Colors.textMuted} />
          </Pressable>
        ) : user.role === 'trainer' ? (
          <Pressable style={styles.childCard} onPress={() => router.push('/players')}>
            <IconTile icon="person.2.fill" color={Colors.mint} size={56} />
            <View style={styles.childBody}>
              <Text style={styles.childKicker}>your squad</Text>
              <Text style={styles.childName}>{user.club}</Text>
              <Text style={styles.childMeta}>{user.subtitle}</Text>
            </View>
            <IconSymbol name="chevron.right" size={18} color={Colors.textMuted} />
          </Pressable>
        ) : (
          <View style={styles.childCard}>
            <InitialsTile initials={user.initials} color={user.color} size={56} />
            <View style={styles.childBody}>
              <Text style={styles.childKicker}>you</Text>
              <Text style={styles.childName}>{user.name}</Text>
              <Text style={styles.childMeta}>{user.subtitle}</Text>
            </View>
          </View>
        )}

        {/* Key stats */}
        {user.role === 'player' || user.role === 'trainer' ? (
          <View style={styles.statsGrid}>
            {dash.stats.map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: `${stat.tint}1f` }]}>
                  <IconSymbol name={stat.icon} size={18} color={stat.tint} />
                </View>
                <View>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* Fee status — hidden for trainer, who doesn't manage club fees */}
        {user.role !== 'trainer' && currentFee ? (
          <Pressable style={styles.infoCard} onPress={() => router.push('/fees')}>
            <View style={[styles.infoIcon, { backgroundColor: `${Colors.emerald}22` }]}>
              <IconSymbol name="dollarsign.circle.fill" size={20} color={Colors.emerald} />
            </View>
            <View style={styles.infoBody}>
              <Text style={styles.infoLabel}>fee status</Text>
              <Text style={styles.infoTitle}>
                {currentFee.month} · {currentFee.amount}
              </Text>
              <Text style={styles.infoSub}>{currentFee.name}</Text>
            </View>
            <StatusChip label={currentFee.status} tone={FEE_TONE[currentFee.status]} />
          </Pressable>
        ) : null}

        {/* Next up */}
        {nextTraining ? (
          <Pressable style={styles.infoCard} onPress={() => router.push('/trainings')}>
            <DateTile day={nextTraining.day} month={nextTraining.month} color={Colors.mint} />
            <View style={styles.infoBody}>
              <Text style={styles.infoLabel}>next up</Text>
              <Text style={styles.infoTitle}>{nextTraining.type} training</Text>
              <Text style={styles.infoSub}>
                {nextTraining.field} · {nextTraining.time} · {nextTraining.present}/{nextTraining.total} present
              </Text>
            </View>
            <IconSymbol name="chevron.right" size={18} color={Colors.textMuted} />
          </Pressable>
        ) : null}

        {/* Quick access */}
        <Text style={styles.sectionLabel}>your stuff</Text>
        <View style={styles.grid}>
          {HOME_LINKS[user.role].map((link) => (
            <Pressable
              key={link.label}
              style={styles.cell}
              onPress={() => router.push(link.route as never)}>
              <View style={[styles.cellIcon, { backgroundColor: `${link.tint}1f` }]}>
                <IconSymbol name={link.icon} size={22} color={link.tint} />
              </View>
              <Text style={styles.cellLabel}>{link.label}</Text>
            </Pressable>
          ))}
          <Pressable style={styles.cell} onPress={() => router.push('/explore')}>
            <View style={[styles.cellIcon, { backgroundColor: `${Colors.mint}1f` }]}>
              <IconSymbol name="square.grid.2x2.fill" size={22} color={Colors.mint} />
            </View>
            <Text style={styles.cellLabel}>all modules</Text>
          </Pressable>
        </View>

        {/* Recent chat */}
        {latestMessage ? (
          <>
            <Text style={styles.sectionLabel}>latest from chat</Text>
            <ListRow
              title={latestMessage.sender}
              subtitle={latestMessage.preview}
              leading={<InitialsTile initials={latestMessage.initials} color={latestMessage.color} />}
              trailing={
                <View style={styles.chatTrailing}>
                  <Text style={styles.chatTime}>{latestMessage.time}</Text>
                  {latestMessage.unread ? <View style={styles.unreadDot} /> : null}
                </View>
              }
              onPress={() => router.navigate('/chat')}
            />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  brandLogo: {
    width: 32,
    height: 32,
  },
  brandText: {
    fontFamily: Fonts.heading,
    fontSize: 22,
    letterSpacing: -0.5,
    color: Colors.mint,
    textTransform: 'lowercase',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 13,
  },
  hero: {
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroKicker: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textSecondary,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  rolePillText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.mint,
  },
  heroTitle: {
    fontFamily: Fonts.heading,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -1,
    color: Colors.mint,
    textTransform: 'lowercase',
  },
  heroSub: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textMuted,
    maxWidth: 320,
  },
  childCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.xl,
  },
  childBody: {
    flex: 1,
    gap: 2,
  },
  childKicker: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  childName: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 18,
    color: Colors.mint,
  },
  childMeta: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  childTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: `${Colors.surfaceAlt}`,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  ratingText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: '#f5a623',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.md,
  },
  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBody: {
    flex: 1,
    gap: 1,
  },
  infoLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  infoTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.text,
  },
  infoSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontFamily: Fonts.heading,
    fontSize: 26,
    letterSpacing: -0.5,
    color: Colors.mint,
  },
  statLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionLabel: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 18,
    color: Colors.mint,
    textTransform: 'lowercase',
    marginTop: Spacing.xxl,
    marginBottom: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.lg,
  },
  cell: {
    width: '31%',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
  },
  cellIcon: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.text,
    textTransform: 'lowercase',
  },
  chatTrailing: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
  },
  chatTime: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.textMuted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.mint,
  },
  signedOut: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    gap: Spacing.sm,
  },
  signedOutLogo: {
    width: 72,
    height: 72,
    marginBottom: Spacing.md,
  },
  signedOutTitle: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    color: Colors.mint,
    textTransform: 'lowercase',
  },
  signedOutSub: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  signedOutButton: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  signedOutButtonText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.textOnPrimary,
  },
});
