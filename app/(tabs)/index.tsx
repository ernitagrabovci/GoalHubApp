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
import { useLanguage } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { useTheme, useThemedStyles } from '@/lib/theme';

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

  // Every signed-in role gets its own dedicated light-only dashboard.
  switch (user.role) {
    case 'administrator':
      return <AdminHome />;
    case 'trainer':
      return <TrainerHome />;
    case 'player':
      return <PlayerHome />;
    case 'parent':
      return <ParentHome />;
    case 'financier':
      return <FinancierHome />;
  }
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'transparent',
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
