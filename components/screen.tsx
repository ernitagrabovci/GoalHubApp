import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Fonts, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useLanguage } from '@/lib/i18n';
import { useTheme, useThemedStyles } from '@/lib/theme';

/** The goalhub brand row shown at the top of every screen. */
export function BrandHeader() {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.header}>
      <View style={styles.brand}>
        <Image
          source={require('@/assets/images/goalhub-logo.png')}
          style={styles.brandLogo}
          resizeMode="contain"
        />
        <Text style={styles.brandText}>goalhub</Text>
      </View>
    </View>
  );
}

/** Section heading used across detail screens. */
export function SectionLabel({ children }: { children: ReactNode }) {
  const styles = useThemedStyles(createStyles);
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

/**
 * Full-page scaffold: safe area, status bar, brand header, scrollable content.
 * Set `back` to show a back button that pops the screen.
 */
export function Screen({ children, back }: { children: ReactNode; back?: boolean }) {
  const router = useRouter();
  const { t } = useLanguage();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {back ? (
          <Pressable style={styles.backRow} onPress={() => router.back()} hitSlop={8}>
            <IconSymbol name="chevron-left" size={22} color={colors.mint} />
            <Text style={styles.backText}>{t('common.back')}</Text>
          </Pressable>
        ) : (
          <BrandHeader />
        )}
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Icon + title + subtitle header for a screen. */
export function DetailHead({
  icon,
  accent,
  title,
  subtitle,
}: {
  icon: IconSymbolName;
  accent: string;
  title: string;
  subtitle: string;
}) {
  const { isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <BlurView intensity={14} tint={isDark ? 'dark' : 'light'} style={styles.head}>
      <View style={[styles.headIcon, { backgroundColor: `${accent}22` }]}>
        <IconSymbol name={icon} size={26} color={accent} />
      </View>
      <View style={styles.headBody}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </BlurView>
  );
}

export function StatCell({ value, label, color }: { value: string; label: string; color?: string }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const accent = color ?? colors.mint;
  return (
    <View style={styles.statCell}>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  brandLogo: {
    width: 28,
    height: 28,
  },
  brandText: {
    fontFamily: Fonts.heading,
    fontSize: 20,
    letterSpacing: -0.5,
    color: colors.mint,
    textTransform: 'lowercase',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingVertical: Spacing.xs,
  },
  backText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: colors.mint,
    textTransform: 'lowercase',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    padding: Spacing.lg,
  },
  headIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headBody: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 26,
    letterSpacing: -0.5,
    color: colors.mint,
    textTransform: 'lowercase',
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  sectionLabel: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 16,
    color: colors.mint,
    textTransform: 'lowercase',
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  statCell: {
    flex: 1,
    gap: 2,
  },
  statValue: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
});
