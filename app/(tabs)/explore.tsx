import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/screen';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useLanguage } from '@/lib/i18n';
import { ALL_MODULES, modulesForRole } from '@/lib/modules';
import { useSession } from '@/lib/session';
import { useThemedStyles } from '@/lib/theme';

export default function ModulesScreen() {
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const { user } = useSession();
  const { t } = useLanguage();
  const modules = user ? modulesForRole(user.role) : ALL_MODULES;
  return (
    <Screen>
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
            onPress={() => {
              // Every module behind these tiles needs a session; send a
              // signed-out visitor to sign in instead of into a dead route.
              if (!user) {
                router.replace('/login');
                return;
              }
              if (module.route) {
                router.push(module.route as never);
              } else {
                alert(t('common.comingSoon', { label: t(`module.${module.label}`) }));
              }
            }}>
            <View style={[styles.cellIcon, { backgroundColor: `${module.color}1F` }]}>
              <IconSymbol name={module.icon} size={24} color={module.color} />
            </View>
            <Text style={styles.cellLabel}>{t(`module.${module.label}`)}</Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
