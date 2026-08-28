import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StatusChip, type StatusTone } from '@/components/status-chip';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Fonts, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import {
  ALL_MESSAGES,
  ALL_PLAYERS,
  ALL_TRAININGS,
  feesForRole,
  type Health,
} from '@/lib/data';
import { modulesForRole } from '@/lib/modules';
import { useLanguage } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { useTheme, useThemedStyles } from '@/lib/theme';

const HEALTH_TONE: Record<Health, StatusTone> = {
  active: 'emerald',
  injured: 'danger',
  rehabilitation: 'warning',
  suspended: 'purple',
};

function QuickTile({
  icon,
  tint,
  label,
  value,
  onPress,
}: {
  icon: IconSymbolName;
  tint: string;
  label: string;
  value: string;
  onPress: () => void;
}) {
  const { isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <BlurView intensity={14} tint={isDark ? 'dark' : 'light'} style={styles.quickTile}>
      <Pressable style={styles.quickTilePress} onPress={onPress}>
        <View style={[styles.quickIcon, { backgroundColor: `${tint}22` }]}>
          <IconSymbol name={icon} size={16} color={tint} />
        </View>
        <View style={styles.quickBody}>
          <Text style={styles.quickLabel} numberOfLines={1}>{label}</Text>
          <Text style={styles.quickValue} numberOfLines={1}>{value}</Text>
        </View>
      </Pressable>
    </BlurView>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, signOut } = useSession();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.signedOut}>
          <Image
            source={require('@/assets/images/goalhub-logo.png')}
            style={styles.signedOutLogo}
            resizeMode="contain"
          />
          <Text style={styles.signedOutTitle}>{t('home.signedOutTitle')}</Text>
          <Text style={styles.signedOutSub}>
            {t('home.signedOutSub')}
          </Text>
          <Pressable style={styles.signedOutButton} onPress={() => router.replace('/login')}>
            <Text style={styles.signedOutButtonText}>{t('home.goToSignIn')}</Text>
            <IconSymbol name="arrow.right" size={18} color={colors.textOnPrimary} />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const subtitle = t(`home.subtitle.${user.role}`);
  const child = ALL_PLAYERS.find((p) => p.name === 'Agon Gashi');
  const player = ALL_PLAYERS.find((p) => p.name === 'Ardit Llapashtica');
  const links = modulesForRole(user.role);
  const cols = links.length > 9 ? 4 : 3;
  const cellWidth = cols === 4 ? '22%' : '31%';
  const cellIcon = cols === 4 ? 34 : 44;
  const glyph = cols === 4 ? 16 : 20;
  const cellGap = cols === 4 ? Spacing.xs : Spacing.sm;
  const labelFont = cols === 4 ? 11 : 12;
  const currentFee = feesForRole(user.role)[0];
  const nextTraining = ALL_TRAININGS[0];
  const latestMessage = ALL_MESSAGES[0];

  const handleSignOut = () => {
    signOut();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.content}>
        {/* Ambient blobs behind the glass */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[styles.blob, styles.blobTop]} />
          <View style={[styles.blob, styles.blobBottom]} />
        </View>

        {/* Header */}
        <BlurView intensity={12} tint={isDark ? 'dark' : 'light'} style={styles.header}>
          <View style={styles.brand}>
            <Image
              source={require('@/assets/images/goalhub-logo.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
            <Text style={styles.brandText}>goalhub</Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable style={styles.rolePill} onPress={handleSignOut}>
              <IconSymbol name="logout" size={12} color={colors.mint} />
              <Text style={styles.rolePillText}>{t('home.switchRole')}</Text>
            </Pressable>
            <Pressable onPress={() => router.navigate('/profile')} hitSlop={8}>
              <View style={[styles.avatar, { backgroundColor: `${user.color}26` }]}>
                <Text style={[styles.avatarText, { color: user.color }]}>{user.initials}</Text>
              </View>
            </Pressable>
          </View>
        </BlurView>

        {/* Hero — name + player info, fills the top of the page */}
        <View style={styles.heroArea}>
          <View style={[styles.blob, styles.blobA]} />
          <View style={[styles.blob, styles.blobB]} />

          {user.role === 'player' && player ? (
            <Pressable style={styles.heroPress} onPress={() => router.push('/stats')}>
              <BlurView intensity={18} tint={isDark ? 'dark' : 'light'} style={styles.hero}>
                <View style={styles.jerseyBadge}>
                  <Text style={styles.jerseyNum}>{player.number}</Text>
                </View>
                <View style={styles.heroBody}>
                  <Text style={styles.heroName} numberOfLines={1}>{player.name}</Text>
                  <Text style={styles.heroMeta}>
                    {t('common.personMeta', {
                      position: player.position,
                      number: player.number,
                      age: player.age,
                    })}
                  </Text>
                  <View style={styles.heroTags}>
                    <StatusChip label={t(`health.${player.health}`)} tone={HEALTH_TONE[player.health]} />
                    <View style={styles.ratingChip}>
                      <IconSymbol name="star.fill" size={11} color="#f5a623" />
                      <Text style={styles.ratingText}>{player.rating.toFixed(1)}</Text>
                    </View>
                  </View>
                </View>
                <IconSymbol name="chevron.right" size={18} color={colors.textMuted} />
              </BlurView>
            </Pressable>
          ) : user.role === 'parent' && child ? (
            <Pressable style={styles.heroPress} onPress={() => router.push('/child')}>
              <BlurView intensity={18} tint={isDark ? 'dark' : 'light'} style={styles.hero}>
                <View style={styles.jerseyBadge}>
                  <Text style={styles.jerseyNum}>{child.number}</Text>
                </View>
                <View style={styles.heroBody}>
                  <Text style={styles.heroName} numberOfLines={1}>{child.name}</Text>
                  <Text style={styles.heroMeta}>
                    {t('common.personMeta', {
                      position: child.position,
                      number: child.number,
                      age: child.age,
                    })}
                  </Text>
                  <View style={styles.heroTags}>
                    <StatusChip label={t(`health.${child.health}`)} tone={HEALTH_TONE[child.health]} />
                    <View style={styles.ratingChip}>
                      <IconSymbol name="star.fill" size={11} color="#f5a623" />
                      <Text style={styles.ratingText}>{child.rating.toFixed(1)}</Text>
                    </View>
                  </View>
                </View>
                <IconSymbol name="chevron.right" size={18} color={colors.textMuted} />
              </BlurView>
            </Pressable>
          ) : user.role === 'trainer' ? (
            <Pressable style={styles.heroPress} onPress={() => router.push('/players')}>
              <BlurView intensity={18} tint={isDark ? 'dark' : 'light'} style={styles.hero}>
                <View style={[styles.jerseyBadge, { backgroundColor: `${colors.mint}1f` }]}>
                  <IconSymbol name="person.2.fill" size={32} color={colors.mint} />
                </View>
                <View style={styles.heroBody}>
                  <Text style={styles.heroName} numberOfLines={1}>{user.club}</Text>
                  <Text style={styles.heroMeta}>{subtitle}</Text>
                </View>
                <IconSymbol name="chevron.right" size={18} color={colors.textMuted} />
              </BlurView>
            </Pressable>
          ) : (
            <BlurView intensity={18} tint={isDark ? 'dark' : 'light'} style={styles.hero}>
              <View style={[styles.jerseyBadge, { backgroundColor: `${user.color}26` }]}>
                <Text style={[styles.jerseyNum, { color: user.color }]}>{user.initials}</Text>
              </View>
              <View style={styles.heroBody}>
                <Text style={styles.heroName} numberOfLines={1}>{user.name}</Text>
                <Text style={styles.heroMeta}>{subtitle}</Text>
              </View>
            </BlurView>
          )}
        </View>

        {/* Everything — floating glass frame, the biggest part */}
        <View style={styles.everythingWrap}>
          <BlurView intensity={14} tint={isDark ? 'dark' : 'light'} style={styles.everything}>
            <LinearGradient
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
              colors={['rgba(255, 255, 255, 0.10)', 'rgba(255, 255, 255, 0.02)', 'rgba(5, 15, 13, 0.35)']}
              locations={[0, 0.18, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            <View style={styles.everythingHead}>
              <IconSymbol name="square.grid.2x2.fill" size={14} color={colors.mint} />
              <Text style={styles.everythingTitle}>{t('home.everything')}</Text>
            </View>
            <ScrollView
              style={styles.gridScroll}
              contentContainerStyle={styles.grid}
              showsVerticalScrollIndicator={false}>
              {links.map((module) => (
                <Pressable
                  key={module.label}
                  style={[styles.cell, { width: cellWidth, gap: cellGap }]}
                  onPress={() =>
                    module.route
                      ? router.push(module.route as never)
                      : alert(t('common.comingSoon', { label: t(`module.${module.label}`) }))
                  }>
                  <View
                    style={[styles.cellIcon, { width: cellIcon, height: cellIcon, backgroundColor: `${module.color}1f` }]}>
                    <IconSymbol name={module.icon} size={glyph} color={module.color} />
                  </View>
                  <Text style={[styles.cellLabel, { fontSize: labelFont }]} numberOfLines={1}>
                    {t(`module.${module.label}`)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </BlurView>
        </View>

        {/* Quick at-a-glance strip */}
        <View style={styles.quickRow}>
          {nextTraining ? (
            <QuickTile
              icon="calendar"
              tint={colors.mint}
              label={t('home.nextUp')}
              value={`${nextTraining.day} ${t(`month.${nextTraining.month.toUpperCase()}`)}`}
              onPress={() => router.push('/trainings')}
            />
          ) : null}
          {currentFee ? (
            <QuickTile
              icon="dollarsign.circle.fill"
              tint={colors.emerald}
              label={t('home.feeStatus')}
              value={`${t(`month.${currentFee.month.toUpperCase()}`)} · ${currentFee.amount}`}
              onPress={() => router.push('/fees')}
            />
          ) : null}
          {latestMessage ? (
            <QuickTile
              icon="bubble.left.fill"
              tint={colors.info}
              label={t('module.Messages')}
              value={latestMessage.sender}
              onPress={() => router.navigate('/chat')}
            />
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  brandLogo: {
    width: 30,
    height: 30,
  },
  brandText: {
    fontFamily: Fonts.heading,
    fontSize: 20,
    letterSpacing: -0.5,
    color: colors.mint,
    textTransform: 'lowercase',
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  rolePillText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    color: colors.mint,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 12,
  },
  heroArea: {
    marginTop: Spacing.md,
    position: 'relative',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blobA: {
    width: 200,
    height: 200,
    top: -40,
    right: -40,
    backgroundColor: 'rgba(176, 228, 204, 0.025)',
  },
  blobB: {
    width: 150,
    height: 150,
    bottom: -30,
    left: -30,
    backgroundColor: 'rgba(83, 74, 183, 0.02)',
  },
  blobTop: {
    width: 180,
    height: 180,
    top: -40,
    right: -50,
    backgroundColor: 'rgba(176, 228, 204, 0.02)',
  },
  blobBottom: {
    width: 200,
    height: 200,
    bottom: -50,
    left: -50,
    backgroundColor: 'rgba(64, 138, 113, 0.025)',
  },
  heroPress: {
    borderRadius: Radius.xl,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    padding: Spacing.lg,
  },
  jerseyBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.mint}1f`,
    borderWidth: 1,
    borderColor: `${colors.mint}33`,
  },
  jerseyNum: {
    fontFamily: Fonts.heading,
    fontSize: 26,
    letterSpacing: -1,
    color: colors.mint,
  },
  heroBody: {
    flex: 1,
    gap: 2,
  },
  heroName: {
    fontFamily: Fonts.heading,
    fontSize: 22,
    letterSpacing: -0.5,
    color: colors.mint,
    textTransform: 'lowercase',
  },
  heroMeta: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  heroTags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  ratingText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: '#f5a623',
  },
  everythingWrap: {
    flex: 1,
    marginTop: Spacing.lg,
    backgroundColor: 'rgba(9, 20, 19, 0.01)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  everything: {
    flex: 1,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    padding: Spacing.md,
    backgroundColor: 'rgba(176, 224, 204, 0.05)',
  },
  everythingHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  everythingTitle: {
    flex: 1,
    fontFamily: Fonts.headingSemiBold,
    fontSize: 15,
    color: colors.mint,
    textTransform: 'lowercase',
  },
  gridScroll: {
    flex: 1,
  },
  grid: {
    flexGrow: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignContent: 'space-evenly',
    columnGap: Spacing.sm,
    rowGap: Spacing.md,
  },
  cell: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: Radius.lg,
  },
  cellIcon: {
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellLabel: {
    fontFamily: Fonts.bodyMedium,
    color: colors.text,
    textTransform: 'lowercase',
  },
  quickRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  quickTile: {
    flex: 1,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    minHeight: 54,
  },
  quickTilePress: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
  },
  quickIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBody: {
    flex: 1,
    gap: 1,
  },
  quickLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  quickValue: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: colors.text,
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
    color: colors.mint,
    textTransform: 'lowercase',
  },
  signedOutSub: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  signedOutButton: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  signedOutButtonText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textOnPrimary,
  },
});
