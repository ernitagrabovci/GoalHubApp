import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { AnimatedPressable } from '@/components/ui/animated-pressable';
import { Brand, Elevation, Fonts, Radius, Semantic } from '@/constants/theme';
import * as auth from '@/lib/api/auth';
import { ApiError } from '@/lib/api/errors';
import { useLanguage } from '@/lib/i18n';
import { Easings, Motion, useReducedMotion } from '@/lib/motion';
import { scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';
import { useAppColors, usePaletteStyles, type AppColorsOf } from '@/lib/app-theme';

/**
 * Login. Credentials are exchanged for a Sanctum token against the API; a
 * signed-in session is restored on launch, so this screen redirects home when
 * one already exists. New administrators can create an account from here.
 */

const C_LIGHT = {
  page: '#F7F9F8',

  text: '#17251E',
  gray: '#52645A',
  hint: '#5F7268',

  surface: '#FFFFFF',
  border: '#DCE5DF',

  green: Brand[600],
  greenSoft: Brand[50],
  danger: Semantic.danger,
  dangerSoft: Semantic.dangerSoft,
};

const IMG_PLAYER = require('@/assets/dashboard/lojtaret.png');
const IMG_BALL = require('@/assets/dashboard/ndeshjet.png');
const IMG_TEAM = require('@/assets/dashboard/grupet.png');

function errorMessage(error: unknown, t: (key: string) => string): string {
  if (error instanceof ApiError) {
    if (error.status === 429) return t('login.errorTooMany');
    return error.message;
  }
  return t('login.errorGeneric');
}

export default function LoginScreen() {
  const C = useAppColors(C_LIGHT);
  const styles = usePaletteStyles(createStyles, C);
  const router = useRouter();
  const { t } = useLanguage();
  const { user, completeSignIn } = useSession();
  const reduced = useReducedMotion();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState<'email' | 'password' | null>(null);

  const [heroIn] = useState(() => new Animated.Value(0));
  const [formIn] = useState(() => new Animated.Value(0));

  // Already signed in (e.g. restored from storage) — skip the form.
  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  // Restrained entrance: hero, then form. Reduced motion snaps to the end.
  useEffect(() => {
    const duration = reduced ? 0 : Motion.complex;
    Animated.stagger(reduced ? 0 : 80, [
      Animated.timing(heroIn, {
        toValue: 1,
        duration,
        easing: Easings.enter,
        useNativeDriver: true,
      }),
      Animated.timing(formIn, {
        toValue: 1,
        duration,
        easing: Easings.enter,
        useNativeDriver: true,
      }),
    ]).start();
  }, [reduced, heroIn, formIn]);

  const submit = async () => {
    if (busy) return;
    const trimmed = email.trim();
    if (!trimmed || !password) {
      setError(t('login.errorRequired'));
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const result = await auth.login(trimmed, password);

      // A 2FA account gets a short-lived challenge instead of a token; the
      // session is only established once the code is verified.
      if ('two_factor_required' in result) {
        setBusy(false);
        router.push({
          pathname: '/two-factor',
          params: { challenge_token: result.challenge_token },
        });
        return;
      }

      await completeSignIn(result);
      router.replace('/');
    } catch (err) {
      setError(errorMessage(err, t));
      setBusy(false);
    }
  };

  const rise = (value: Animated.Value) => ({
    opacity: value,
    transform: [
      { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
    ],
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.body}>
            {/* Hero — the player is mirrored so he faces back into the page. */}
            <Animated.View style={[styles.hero, rise(heroIn)]}>
              <Image source={IMG_PLAYER} style={styles.heroPlayer} resizeMode="contain" />
              <Image source={IMG_BALL} style={styles.heroBall} resizeMode="contain" />

              <View style={styles.heroText}>
                <Text
                  style={styles.wordmark}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  GOALHUB
                </Text>
                <Text style={styles.heroSubtitle} numberOfLines={1}>
                  {t('login.subtitle')}
                </Text>
              </View>
            </Animated.View>

            {/* Fields */}
            <Animated.View style={rise(formIn)}>
              <Text style={styles.label}>{t('login.email')}</Text>
              <TextInput
                style={[styles.field, focused === 'email' && styles.fieldFocused]}
                placeholder={t('login.email')}
                placeholderTextColor={C.hintText}
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!busy}
                accessibilityLabel={t('login.email')}
              />

              <Text style={[styles.label, styles.labelSpaced]}>{t('login.password')}</Text>
              <TextInput
                style={[styles.field, focused === 'password' && styles.fieldFocused]}
                placeholder={t('login.password')}
                placeholderTextColor={C.hintText}
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!busy}
                onSubmitEditing={submit}
                accessibilityLabel={t('login.password')}
              />

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.error} accessibilityRole="alert" accessibilityLiveRegion="polite">
                    {error}
                  </Text>
                </View>
              ) : null}

              <AnimatedPressable
                style={styles.forgotRow}
                hitSlop={8}
                onPress={() => router.push('/forgot-password')}
                accessibilityRole="button"
              >
                <Text style={styles.forgot}>{t('login.forgot')}</Text>
              </AnimatedPressable>

              <AnimatedPressable
                style={[styles.primary, busy && styles.primaryBusy]}
                onPress={submit}
                disabled={busy}
                accessibilityRole="button"
                accessibilityLabel={t('login.submit')}
                accessibilityState={{ disabled: busy, busy }}
              >
                {busy ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryText}>{t('login.submit')}</Text>
                )}
              </AnimatedPressable>

              <View style={styles.signupRow}>
                <Text style={styles.signupText}>{t('login.noAccount')}</Text>
                <AnimatedPressable
                  onPress={() => router.push('/signup')}
                  hitSlop={8}
                  accessibilityRole="link"
                >
                  <Text style={styles.signupLink}>{t('login.signup')}</Text>
                </AnimatedPressable>
              </View>
            </Animated.View>

            {/* Everything the two modes share stays up here; the slack pushed
                below keeps the form high and the photo on the bottom edge. */}
            <View style={styles.spacer} />

            {/* The team photo closes the page. */}
            <View style={styles.teamWrap}>
              <Image source={IMG_TEAM} style={styles.team} resizeMode="contain" />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const createStyles = (C: AppColorsOf<typeof C_LIGHT>) => StyleSheet.create(
  scaled({
    safe: {
      flex: 1,
      backgroundColor: C.pageFill,
    },

    flex: {
      flex: 1,
    },

    scroll: {
      flexGrow: 1,
    },

    body: {
      flex: 1,
      paddingHorizontal: 27,
    },

    /* ── Hero ────────────────────────────────────────────────── */
    hero: {
      height: 240,
      minHeight: 200,
      flexShrink: 1,
    },

    heroPlayer: {
      position: 'absolute',
      top: -70,
      right: -100,
      width: 224,
      height: 198,
      transform: [{ scaleX: -1 }],
    },

    heroBall: {
      position: 'absolute',
      left: -8,
      top: 68,
      width: 80,
      height: 80,
    },

    heroText: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
    },

    wordmark: {
      fontFamily: Fonts.bodyBlack,
      fontSize: 36,
      lineHeight: 40,
      letterSpacing: -0.6,
      color: C.textText,
    },

    heroSubtitle: {
      marginTop: 2,
      fontFamily: Fonts.body,
      fontSize: 14,
      lineHeight: 18,
      color: C.grayText,
    },

    /* ── Fields ──────────────────────────────────────────────── */
    label: {
      marginTop: 10,
      marginBottom: 6,
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.2,
      color: C.grayText,
    },

    labelSpaced: {
      marginTop: 14,
    },

    field: {
      height: 50,
      paddingHorizontal: 14,
      paddingVertical: 0,
      backgroundColor: C.surfaceFill,
      borderWidth: 1,
      borderColor: C.borderBorder,
      borderRadius: Radius.md,
      fontFamily: Fonts.body,
      fontSize: 15,
      color: C.textText,
    },

    fieldFocused: {
      borderColor: C.greenBorder,
      shadowColor: C.green,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.18,
      shadowRadius: 6,
      elevation: 2,
    },

    errorBox: {
      marginTop: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: Radius.sm,
      backgroundColor: C.dangerSoftFill,
    },

    error: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      lineHeight: 16,
      color: C.dangerText,
    },

    forgotRow: {
      minHeight: 44,
      justifyContent: 'center',
      alignItems: 'flex-end',
    },

    forgot: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      lineHeight: 16,
      color: C.hintText,
    },

    /* ── Submit ──────────────────────────────────────────────── */
    primary: {
      height: 52,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.greenFill,
      borderWidth: 1,
      borderColor: C.greenBorder,
      borderRadius: Radius.md,
      ...Elevation.sm,
    },

    primaryBusy: {
      opacity: 0.7,
    },

    primaryText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 16,
      lineHeight: 22,
      color: '#FFFFFF',
    },

    /* ── Signup link ─────────────────────────────────────────── */
    signupRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 16,
    },

    signupText: {
      fontFamily: Fonts.body,
      fontSize: 13,
      lineHeight: 18,
      color: C.grayText,
    },

    signupLink: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13,
      lineHeight: 18,
      color: C.greenText,
    },

    /* ── Team photo ──────────────────────────────────────────── */
    spacer: {
      flex: 1,
      minHeight: 16,
    },

    /* Same size in both modes — the slack sits above it, so the photo's bottom
       edge always lands on the bottom of the screen. */
    teamWrap: {
      height: 370,
      marginTop: 10,
    },

    team: {
      flex: 1,
      width: '80%',
      alignSelf: 'center',
    },
  })
);
