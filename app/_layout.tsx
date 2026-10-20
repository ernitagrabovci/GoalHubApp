import { NavigationBar } from 'expo-navigation-bar';
import { Stack, ThemeProvider as NavThemeProvider } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import {
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_900Black,
} from '@expo-google-fonts/outfit';

import { AppBackground } from '@/components/app-background';
import { darkNavigationTheme, lightNavigationTheme } from '@/constants/theme';
import { LanguageProvider } from '@/lib/i18n';
import { SessionProvider, useSession } from '@/lib/session';
import { ThemeProvider, useTheme } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
  initialRouteName: 'intro',
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_900Black,
  });

  if (!loaded && !error) {
    return null;
  }

  return (
    <ThemeProvider>
      <RootContent />
    </ThemeProvider>
  );
}

function RootContent() {
  const { isDark } = useTheme();
  return (
    <NavThemeProvider value={isDark ? darkNavigationTheme : lightNavigationTheme}>
      <LanguageProvider>
        <SessionProvider>
          <RootNavigator />
        </SessionProvider>
      </LanguageProvider>
    </NavThemeProvider>
  );
}

function RootNavigator() {
  const { isDark } = useTheme();
  const { user, status } = useSession();

  // Keep the splash up until the stored token has been checked, so neither the
  // login screen nor the tabs flash before we know which one the user belongs on.
  useEffect(() => {
    if (status !== 'loading') {
      SplashScreen.hideAsync();
    }
  }, [status]);

  if (status === 'loading') {
    return null;
  }

  // Pill-role dashboards are light-only (#FAFBFA). Paint the native screen
  // behind the tabs the same tone so no native background (gray on iOS,
  // different on Android) shows through at the screen edges.
  const pillLight = user ? PILL_ROLES.includes(user.role) : false;

  return (
    <>
      <AppBackground />
      <SystemBars pillLight={pillLight} />
      {/* Every screen paints its own background transparent so the app
          wallpaper shows through; the scenes must be transparent too. */}
      <Stack screenOptions={{ contentStyle: { backgroundColor: 'transparent' } }}>
        <Stack.Screen name="intro" options={{ headerShown: false }} />
        <Stack.Screen
          name="login"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="forgot-password"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="two-factor"
          options={{ headerShown: false }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="conversation" options={{ headerShown: false }} />
        <Stack.Screen
          name="settings"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="club-profile"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="competitions"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="sezoni"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="fushat"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="account-settings"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="club-settings"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="season-settings"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="notification-settings"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="security-settings"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="subscription-settings"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="privacy-policy"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="terms-conditions"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="cookies-policy"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="teams"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ekipa"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="transferimet"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="players"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="register-player"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="player-statistics"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="edit-player"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="coach-ratings"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="player-profile"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ndeshjet"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ndeshjet-trajner"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ndeshja"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ndeshja-trajner"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ndeshja-luajtur"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="cakto-formacion"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="fut-rezultatin"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ndeshja-luajtur-trajner"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="akademia-trajner"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="libraria-trajner"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="shto-material-trajner"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="edito-material-trajner"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="video-strategjike-trajner"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ngarko-video-trajner"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="detajet-video-trajner"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="planet-sesioneve-trajner"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ushtrimet-trajner"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="profili-lojtarit"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="stervitjet-lojtarit"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="stervitja-lojtarit"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ndeshjet-lojtarit"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ndeshja-luajtur-lojtarit"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="akademia-lojtarit"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="njoftimet-lojtarit"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="femiu"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="profili-femiut"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="prezenca-femiut"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="vleresimet-femiut"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="kuotat-femiut"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="stervitjet-femiut"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ndeshjet-femiut"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="njoftimet-prindit"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="kuotat-financierit"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="detajet-pageses-financierit"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="regjistro-pagesen-financierit"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="raportet-financiare"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="njoftimet-financierit"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="kartela-mjeksore"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="detajet-lendimit"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="pagesa-lojtari"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="detajet-pageses"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="raporti-pagesave"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="njoftimet"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="njoftimet-trajner"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="mesazhet"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="mesazhet-trajner"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="biseda"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="raportet"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="raporti-ndeshjeve"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="perdoruesit"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="aktiviteti"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="lista-lojtareve"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="lojtari"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="vleresimet-lojtareve"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="stervitja"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="stervitjet"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="regjistro-prezencen"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="mjeku"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="vlereso-lojtarin"
          options={{
            headerShown: false,
            // The rating squares are dragged left to right; the stack's
            // swipe-back would steal that gesture and pop the screen instead.
            gestureEnabled: false,
          }}
        />
      </Stack>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </>
  );
}

const PILL_ROLES = ['administrator', 'trainer', 'player', 'parent', 'financier'];

/**
 * Keeps Android's system navigation bar tinted to match the active screens.
 * Pill-role dashboards are light-only (#FAFBFA), so they force a light bar
 * (dark icons); everything else follows the theme. No-op on iOS/web.
 */
function SystemBars({ pillLight }: { pillLight: boolean }) {
  const { isDark } = useTheme();

  // Android paints the strip behind its transparent system bars with the root
  // view color. Screens are transparent so the wallpaper shows through, which
  // makes this color visible behind it — it has to be the near-white page tone
  // every screen is designed against, not the theme background.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    SystemUI.setBackgroundColorAsync('#FAFBFA').catch(() => {});
  }, []);

  return <NavigationBar style={pillLight || !isDark ? 'light' : 'dark'} />;
}
