import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useLanguage } from '@/lib/i18n';
import { ALL_MODULES, modulesForRole } from '@/lib/modules';
import { useSession } from '@/lib/session';
import { useTheme, useThemedStyles } from '@/lib/theme';

export default function ModulesScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { user } = useSession();
  const { t } = useLanguage();
  const modules = user ? modulesForRole(user.role) : ALL_MODULES;
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
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
        </View>

        <View style={styles.hero}>
          <ThemedText type="label">{t('explore.kicker')}</ThemedText>
          <Text style={styles.heroTitle}>{t('explore.title')}</Text>
          <Text style={styles.heroSub}>
            {t('explore.subtitle')}
          </Text>
        </View>

        {/* Module grid */}
        <View style={styles.grid}>
          {modules.map((module) => (
            <Pressable
              key={module.label}
              style={styles.cell}
              onPress={() =>
                module.route
                  ? router.push(module.route as never)
                  : alert(t('common.comingSoon', { label: t(`module.${module.label}`) }))
              }>
              <View style={[styles.cellIcon, { backgroundColor: `${module.color}1F` }]}>
                <IconSymbol name={module.icon} size={24} color={module.color} />
              </View>
              <Text style={styles.cellLabel}>{t(`module.${module.label}`)}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
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
    width: 32,
    height: 32,
  },
  brandText: {
    fontFamily: Fonts.heading,
    fontSize: 22,
    letterSpacing: -0.5,
    color: colors.mint,
    textTransform: 'lowercase',
  },
  hero: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  heroTitle: {
    fontFamily: Fonts.heading,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -1,
    color: colors.mint,
    textTransform: 'lowercase',
  },
  heroSub: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    maxWidth: 320,
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
  },
  cellIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: colors.text,
    textTransform: 'lowercase',
  },
});
