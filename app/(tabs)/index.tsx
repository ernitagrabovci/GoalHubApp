import { useRouter } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AdminHome } from '@/components/dashboard/admin-home';
import { HomeBackdrop } from '@/components/dashboard/home-backdrop';
import { FinancierHome } from '@/components/dashboard/financier-home';
import { ParentHome } from '@/components/dashboard/parent-home';
import { PlayerHome } from '@/components/dashboard/player-home';
import { TrainerHome } from '@/components/dashboard/trainer-home';
import { AppButton } from '@/components/ui/app-button';
import { Fonts, Spacing, type ThemeColors } from '@/constants/theme';
import { useLanguage } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { useThemedStyles } from '@/lib/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useSession();
  const { t } = useLanguage();
  const styles = useThemedStyles(createStyles);

  if (!user) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
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
          <AppButton
            label={t('home.goToSignIn')}
            icon="arrow.right"
            size="md"
            style={styles.signedOutButton}
            onPress={() => router.replace('/login')}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Every signed-in role gets its own dedicated light-only dashboard.
  const Dashboard =
    user.role === 'administrator' ? AdminHome
    : user.role === 'trainer' ? TrainerHome
    : user.role === 'player' ? PlayerHome
    : user.role === 'parent' ? ParentHome
    : FinancierHome;

  return (
    <View style={styles.home}>
      {/* The scene and the tab bar strip both paint this same flat colour. */}
      <View pointerEvents="none" style={styles.backdrop}>
        <HomeBackdrop />
      </View>
      <Dashboard />
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  home: {
    flex: 1,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
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
  },
});
