import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ROLE_DASHBOARD, type EventItem } from '@/lib/role-content';
import { ROLE_LABELS, useSession } from '@/lib/session';

const TONE_COLORS: Record<EventItem['tone'], string> = {
  emerald: '#2fbf71',
  warning: '#f5a623',
  info: '#5aa7e6',
  purple: '#8f86e8',
  mint: Colors.mint,
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
  const roleColor = user.color;

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
          <View style={styles.headerRight}>
            <View style={styles.clubChip}>
              <View style={styles.liveDot} />
              <Text style={styles.clubChipText}>{user.club}</Text>
            </View>
            <Pressable onPress={() => router.push('/modal')} hitSlop={8} style={styles.iconButton}>
              <IconSymbol name="gearshape.fill" size={20} color={Colors.textMuted} />
            </Pressable>
            <View style={[styles.avatar, { backgroundColor: `${roleColor}26` }]}>
              <Text style={[styles.avatarText, { color: roleColor }]}>{user.initials}</Text>
            </View>
          </View>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <ThemedText type="label">GoalHub · {ROLE_LABELS[user.role]}</ThemedText>
            <Pressable style={styles.rolePill} onPress={handleSignOut}>
              <IconSymbol name="logout" size={13} color={Colors.mint} />
              <Text style={styles.rolePillText}>switch role</Text>
            </Pressable>
          </View>
          <Text style={styles.heroTitle}>{dash.greeting}</Text>
          <Text style={styles.heroSub}>{dash.subtitle}</Text>
          <View style={styles.userRow}>
            <View style={[styles.userDot, { backgroundColor: roleColor }]} />
            <Text style={styles.userName}>{user.name}</Text>
          </View>
        </View>

        {/* Stats */}
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

        {/* Quick actions */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionLabel}>quick actions</Text>
          <Text style={styles.sectionLink}>view all</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickRow}>
          {dash.actions.map((action) => (
            <Pressable
              key={action.label}
              style={styles.quickItem}
              onPress={() => alert(`${action.label} — coming soon`)}>
              <View style={[styles.quickIcon, { backgroundColor: `${action.tint}22` }]}>
                <IconSymbol name={action.icon} size={22} color={action.tint} />
              </View>
              <Text style={styles.quickLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Browse modules */}
        <Pressable style={styles.modulesLink} onPress={() => router.push('/explore')}>
          <View style={styles.modulesLinkIcon}>
            <IconSymbol name="square.grid.2x2.fill" size={20} color={Colors.mint} />
          </View>
          <View style={styles.modulesLinkBody}>
            <Text style={styles.modulesLinkTitle}>browse all modules</Text>
            <Text style={styles.modulesLinkSub}>every feature for your role</Text>
          </View>
          <IconSymbol name="chevron.right" size={18} color={Colors.textMuted} />
        </Pressable>

        {/* Upcoming */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionLabel}>upcoming</Text>
          <Text style={styles.sectionLink}>calendar</Text>
        </View>
        {dash.events.map((event) => {
          const tone = TONE_COLORS[event.tone];
          return (
            <Pressable
              key={`${event.day}-${event.title}`}
              style={styles.eventCard}
              onPress={() => alert('coming soon')}>
              <View style={[styles.dateBox, { borderColor: `${tone}55` }]}>
                <Text style={[styles.dateDay, { color: tone }]}>{event.day}</Text>
                <Text style={styles.dateNum}>{event.month}</Text>
              </View>
              <View style={styles.eventBody}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.eventMeta}>{event.meta}</Text>
              </View>
              <IconSymbol name="chevron.right" size={18} color={Colors.textMuted} />
            </Pressable>
          );
        })}
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  clubChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.emerald,
  },
  clubChipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.textSecondary,
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
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -1,
    color: Colors.mint,
    textTransform: 'lowercase',
    marginTop: Spacing.xs,
  },
  heroSub: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textMuted,
    maxWidth: 300,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  userDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  userName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.xl,
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
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: Spacing.xxl,
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 18,
    color: Colors.mint,
    textTransform: 'lowercase',
  },
  sectionLink: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.emerald,
  },
  quickRow: {
    gap: Spacing.lg,
  },
  quickItem: {
    alignItems: 'center',
    gap: Spacing.sm,
    width: 64,
  },
  quickIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.textMuted,
  },
  modulesLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.xl,
  },
  modulesLinkIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modulesLinkBody: {
    flex: 1,
    gap: 2,
  },
  modulesLinkTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.text,
  },
  modulesLinkSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  dateBox: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
  },
  dateDay: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 15,
  },
  dateNum: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1,
    color: Colors.textMuted,
    marginTop: 1,
  },
  eventBody: {
    flex: 1,
    gap: 2,
  },
  eventTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.text,
  },
  eventMeta: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
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
