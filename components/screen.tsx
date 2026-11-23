import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedPressable } from '@/components/ui/animated-pressable';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import {
  Elevation,
  Fonts,
  Radius,
  Spacing,
  TypeScale,
  type ThemeColors,
} from '@/constants/theme';
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
          <AnimatedPressable
            style={styles.backRow}
            onPress={() => router.back()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}>
            <View style={styles.backIcon}>
              <IconSymbol name="chevron-left" size={20} color={colors.mint} />
            </View>
            <Text style={styles.backText}>{t('common.back')}</Text>
          </AnimatedPressable>
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
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.head}>
      <View style={[styles.headIcon, { backgroundColor: `${accent}22` }]}>
        <IconSymbol name={icon} size={26} color={accent} />
      </View>
      <View style={styles.headBody}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
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
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 36,
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
    lineHeight: 26,
    letterSpacing: -0.6,
    color: colors.mint,
    textTransform: 'lowercase',
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing.sm,
    minHeight: 44,
    paddingRight: Spacing.sm,
  },
  backIcon: {
    width: 30,
    height: 30,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandTint,
  },
  backText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.mint,
    textTransform: 'lowercase',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    padding: Spacing.lg,
    ...Elevation.sm,
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
    ...TypeScale.h2,
    color: colors.mint,
    textTransform: 'lowercase',
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  sectionLabel: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -0.2,
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
    lineHeight: 30,
    letterSpacing: -0.5,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
});
