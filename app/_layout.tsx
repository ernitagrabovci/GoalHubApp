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
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_900Black,
} from '@expo-google-fonts/inter';
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';

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
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_900Black,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

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
  const { isDark, colors } = useTheme();
  const { user } = useSession();
  // Pill-role dashboards are light-only (#FAFBFA). Paint the native screen
  // behind the tabs the same tone so no native background (gray on iOS,
  // different on Android) shows through at the screen edges.
  const pillLight = user ? PILL_ROLES.includes(user.role) : false;

  return (
    <>
      <SystemBars pillLight={pillLight} />
      <Stack>
        <Stack.Screen name="intro" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
            contentStyle: { backgroundColor: pillLight ? '#FAFBFA' : colors.background },
          }}
        />
        <Stack.Screen name="conversation" options={{ headerShown: false }} />
        <Stack.Screen
          name="settings"
          options={{ headerShown: false, contentStyle: { backgroundColor: '#FAFBFA' } }}
        />
        <Stack.Screen
          name="club-profile"
          options={{ headerShown: false, contentStyle: { backgroundColor: '#FAFBFA' } }}
        />
        <Stack.Screen
          name="competitions"
          options={{ headerShown: false, contentStyle: { backgroundColor: '#FAFBFA' } }}
        />
        <Stack.Screen
          name="sezoni"
          options={{ headerShown: false, contentStyle: { backgroundColor: '#FAFBFA' } }}
        />
        <Stack.Screen
          name="fushat"
          options={{ headerShown: false, contentStyle: { backgroundColor: '#FAFBFA' } }}
        />
        <Stack.Screen
          name="account-settings"
          options={{ headerShown: false, contentStyle: { backgroundColor: '#FAFBFA' } }}
        />
        <Stack.Screen
          name="club-settings"
          options={{ headerShown: false, contentStyle: { backgroundColor: '#FAFBFA' } }}
        />
        <Stack.Screen
          name="season-settings"
          options={{ headerShown: false, contentStyle: { backgroundColor: '#FAFBFA' } }}
        />
        <Stack.Screen
          name="notification-settings"
          options={{ headerShown: false, contentStyle: { backgroundColor: '#FAFBFA' } }}
        />
        <Stack.Screen
          name="security-settings"
          options={{ headerShown: false, contentStyle: { backgroundColor: '#FAFBFA' } }}
        />
        <Stack.Screen
          name="subscription-settings"
          options={{ headerShown: false, contentStyle: { backgroundColor: '#FAFBFA' } }}
        />
        <Stack.Screen
          name="privacy-policy"
          options={{ headerShown: false, contentStyle: { backgroundColor: '#FAFBFA' } }}
        />
        <Stack.Screen
          name="terms-conditions"
          options={{ headerShown: false, contentStyle: { backgroundColor: '#FAFBFA' } }}
        />
        <Stack.Screen
          name="cookies-policy"
          options={{ headerShown: false, contentStyle: { backgroundColor: '#FAFBFA' } }}
        />
        <Stack.Screen
          name="teams"
          options={{ headerShown: false, contentStyle: { backgroundColor: '#FAFBFA' } }}
        />
        <Stack.Screen
          name="ekipa"
          options={{ headerShown: false, contentStyle: { backgroundColor: '#FAFBFA' } }}
        />
        <Stack.Screen
          name="transferimet"
          options={{ headerShown: false, contentStyle: { backgroundColor: '#FAFBFA' } }}
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
  const { isDark, colors } = useTheme();

  // Android paints the strip behind its transparent system bars with the root
  // view color. Keep it identical to the page so there is no gray seam — pill
  // dashboards are light-only (#FAFBFA); everything else follows the theme.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    SystemUI.setBackgroundColorAsync(pillLight ? '#FAFBFA' : colors.background).catch(() => {});
  }, [pillLight, colors.background]);

  return <NavigationBar style={pillLight || !isDark ? 'light' : 'dark'} />;
}
