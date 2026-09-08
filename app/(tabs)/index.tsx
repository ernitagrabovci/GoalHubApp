import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminHome } from '@/components/dashboard/admin-home';
import { FinancierHome } from '@/components/dashboard/financier-home';
import { ParentHome } from '@/components/dashboard/parent-home';
import { PlayerHome } from '@/components/dashboard/player-home';
import { TrainerHome } from '@/components/dashboard/trainer-home';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { ALL_TRAININGS } from '@/lib/data';
import { modulesForRole } from '@/lib/modules';
import { useLanguage } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { useTheme, useThemedStyles } from '@/lib/theme';

/** Rich brand gradient for the hero — forest → emerald. Works on both themes. */
const HERO_GRADIENT: [string, string, string] = ['#0E3327', '#1E6B4F', '#2E8B63'];

const IMG = (p: string) =>
  `https://images.pexels.com/${p}?w=600&h=600&fit=crop&auto=compress`;

/** Photo per menu module (curated from Pexels) so each tile reads like a real image. */
const MODULE_IMAGES: Record<string, string> = {
  Players: IMG('photos/38154270/pexels-photo-38154270.jpeg'),
  Trainers: IMG('photos/8941613/pexels-photo-8941613.jpeg'),
  Parents: IMG('photos/4241360/pexels-photo-4241360.jpeg'),
  Teams: IMG('photos/38092701/pexels-photo-38092701.jpeg'),
  Users: IMG('photos/37926430/pexels-photo-37926430.jpeg'),
  Club: IMG('photos/30651230/pexels-photo-30651230.jpeg'),
  Matches: IMG('photos/38881884/pexels-photo-38881884.jpeg'),
  Trainings: IMG('photos/7187827/pexels-photo-7187827.jpeg'),
  Academy: IMG('photos/8941608/pexels-photo-8941608.jpeg'),
  'Tactical Board': IMG('photos/8910026/pexels-photo-8910026.jpeg'),
  Drills: IMG('photos/37391217/pexels-photo-37391217.jpeg'),
  Groups: IMG('photos/38615873/pexels-photo-38615873.jpeg'),
  Medical: IMG('photos/12428449/pexels-photo-12428449.jpeg'),
  Competitions: IMG('photos/8994432/pexels-photo-8994432.jpeg'),
  Payments: IMG('photos/259100/pexels-photo-259100.jpeg'),
  Finance: IMG('photos/259249/pexels-photo-259249.jpeg'),
  Messages: IMG('photos/5246965/pexels-photo-5246965.jpeg'),
  Reports: IMG('photos/7948058/pexels-photo-7948058.jpeg'),
  Settings: IMG('photos/38105639/pexels-photo-38105639.jpeg'),
  Admin: IMG('photos/35499482/pexels-photo-35499482.jpeg'),
};

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useSession();
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

  // The administrator role gets the dedicated light-only dashboard (floating pill nav).
  if (user.role === 'administrator') {
    return <AdminHome />;
  }

  // The trainer role gets the dedicated light-only trainer dashboard (Home | Chat pill).
  if (user.role === 'trainer') {
    return <TrainerHome />;
  }

  // The player role gets the dedicated light-only player dashboard (Home | Chat pill).
  if (user.role === 'player') {
    return <PlayerHome />;
  }

  // The parent role gets the dedicated light-only parent dashboard (Home | Chat pill).
  if (user.role === 'parent') {
    return <ParentHome />;
  }

  // The financier role gets the dedicated light-only payments dashboard (Home | Chat pill).
  if (user.role === 'financier') {
    return <FinancierHome />;
  }

  const firstName = user.name.split(' ')[0];
  const links = modulesForRole(user.role);
  const cols = links.length > 9 ? 3 : 2;
  const cellWidth = cols === 3 ? '31%' : '48%';
  const glyph = cols === 3 ? 34 : 46;
  const labelFont = cols === 3 ? 12 : 14;
  const cellGap = cols === 3 ? Spacing.xs : Spacing.sm;
  const nextTraining = ALL_TRAININGS[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.content}>
        {/* Ambient blobs behind the glass */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[styles.blob, styles.blobTop]} />
          <View style={[styles.blob, styles.blobBottom]} />
        </View>

        <View style={styles.scroll}>
          {/* Header — logo, greeting, bell + avatar */}
          <View style={styles.header}>
            <Image
              source={require('@/assets/images/goalhub-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <View style={styles.greetingWrap}>
              <Text style={styles.greeting} numberOfLines={1}>
                {t('home.hello')}, {firstName}
              </Text>
            </View>
            <View style={styles.headerRight}>
              <Pressable
                onPress={() => router.push('/notifications')}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={t('notifications.title')}
                style={({ pressed }) => [styles.bellBtn, pressed && styles.bellPressed]}>
                <MaterialCommunityIcons name="bell" size={20} color={colors.mint} />
              </Pressable>
              <Pressable onPress={() => router.navigate('/profile')} hitSlop={8}>
                <View style={[styles.avatar, { backgroundColor: `${user.color}26` }]}>
                  <Text style={[styles.avatarText, { color: user.color }]}>{user.initials}</Text>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Hero — bold brand gradient, sports-poster number watermark */}
          <LinearGradient colors={HERO_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
            <Text style={styles.heroNumber}>{user.initials}</Text>
            <View style={styles.heroBody}>
              <Text style={styles.heroEyebrow}>{t(`role.${user.role}`)} · {t(`home.greeting.${user.role}`)}</Text>
              <Text style={styles.heroName} numberOfLines={1}>{user.name}</Text>
            </View>
          </LinearGradient>

          {/* Next up — next training */}
          {nextTraining && (
            <Pressable style={styles.nextRow} onPress={() => router.push('/trainings')}>
              <View style={styles.nextIcon}>
                <IconSymbol name="calendar" size={18} color={colors.mint} />
              </View>
              <View style={styles.nextBody}>
                <Text style={styles.nextLabel}>{t('home.nextUp')}</Text>
                <Text style={styles.nextValue} numberOfLines={1}>
                  {nextTraining.day} {nextTraining.month} · {nextTraining.time} ·{' '}
                  {t(`trainings.${nextTraining.type.toLowerCase()}`)}
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={18} color={colors.textMuted} />
            </Pressable>
          )}

          {/* Menu — module tiles with photos, in a glass frame */}
          <View style={styles.menuBlock}>
            <Text style={styles.menuTitle}>{t('home.menu')}</Text>
            <View style={styles.menuFrame}>
              <BlurView intensity={16} tint={isDark ? 'dark' : 'light'} style={styles.frameInner}>
                <View style={styles.grid}>
                  {links.map((module) => (
                    <Pressable
                      key={module.label}
                      style={[
                        styles.cell,
                        { width: cellWidth, gap: cellGap, borderColor: `${module.color}88` },
                        !module.route && styles.soonCell,
                      ]}
                      onPress={() =>
                        module.route
                          ? router.push(module.route as never)
                          : alert(t('common.comingSoon', { label: t(`module.${module.label}`) }))
                      }>
                      <Image
                        source={{ uri: MODULE_IMAGES[module.label] }}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                        blurRadius={3}
                      />
                      <LinearGradient
                        pointerEvents="none"
                        style={StyleSheet.absoluteFill}
                        colors={[`${module.color}B3`, `${module.color}70`, `${module.color}C0`]}
                        locations={[0, 0.5, 1]}
                      />
                      <View style={styles.iconWrap}>
                        <IconSymbol name={module.icon} size={glyph} color="#000000" style={styles.shadowBack} />
                        <IconSymbol name={module.icon} size={glyph} color="#FFFFFF" />
                      </View>
                      <View style={styles.labelWrap}>
                        <Text style={[styles.cellLabelShadow, { fontSize: labelFont }]} numberOfLines={1}>
                          {t(`module.${module.label}`)}
                        </Text>
                        <Text style={[styles.cellLabel, { fontSize: labelFont }]} numberOfLines={1}>
                          {t(`module.${module.label}`)}
                        </Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </BlurView>
            </View>
          </View>
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
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  scroll: {
    flex: 1,
    gap: Spacing.xl,
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
  blobTop: {
    width: 220,
    height: 220,
    top: -60,
    right: -70,
    backgroundColor: 'rgba(176, 228, 204, 0.06)',
  },
  blobBottom: {
    width: 260,
    height: 260,
    bottom: -80,
    left: -90,
    backgroundColor: 'rgba(64, 138, 113, 0.06)',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logo: {
    width: 48,
    height: 48,
  },
  greetingWrap: {
    flex: 1,
    alignItems: 'center',
  },
  greeting: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.mint}1a`,
  },
  bellPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.94 }],
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

  // Hero
  heroPress: {
    borderRadius: Radius.xl,
  },
  hero: {
    borderRadius: Radius.xl,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    paddingRight: Spacing.md,
    minHeight: 150,
  },
  heroNumber: {
    position: 'absolute',
    right: -8,
    bottom: -40,
    fontFamily: Fonts.heading,
    fontSize: 150,
    letterSpacing: -8,
    color: 'rgba(255,255,255,0.10)',
  },
  heroMark: {
    position: 'absolute',
    right: -14,
    bottom: -6,
  },
  heroBody: {
    flex: 1,
    gap: 4,
  },
  heroEyebrow: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.7)',
  },
  heroName: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    letterSpacing: -0.6,
    color: '#FFFFFF',
  },
  heroChips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: Radius.pill,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  heroChipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: '#FFFFFF',
  },

  // Next up
  nextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  nextIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${colors.mint}1a`,
  },
  nextBody: {
    flex: 1,
    gap: 2,
  },
  nextLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  nextValue: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: colors.text,
  },

  // Menu
  menuBlock: {
    flex: 1,
  },
  menuTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: Spacing.md,
  },
  menuFrame: {
    flex: 1,
    borderRadius: Radius.xl,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 8,
  },
  frameInner: {
    flex: 1,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    padding: Spacing.md,
  },
  grid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'stretch',
    rowGap: Spacing.md,
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  soonCell: {
    opacity: 0.45,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  shadowBack: {
    position: 'absolute',
    transform: [{ translateY: 3 }],
  },
  labelWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellLabelShadow: {
    position: 'absolute',
    fontFamily: Fonts.bodySemiBold,
    color: '#000000',
    textTransform: 'lowercase',
    transform: [{ translateY: 2 }],
  },
  cellLabel: {
    fontFamily: Fonts.bodySemiBold,
    color: '#FFFFFF',
    textTransform: 'lowercase',
  },

  // Signed out
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
