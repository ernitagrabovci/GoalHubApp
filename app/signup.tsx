import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Brand, Fonts, Semantic } from '@/constants/theme';
import * as auth from '@/lib/api/auth';
import { ApiError } from '@/lib/api/errors';
import { useLanguage } from '@/lib/i18n';
import { scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';
import { useAppColors, usePaletteStyles, type AppColorsOf } from '@/lib/app-theme';

/**
 * Self-service signup. Creates an administrator account plus a 14-day-trial
 * club against the API, then signs in with the returned session. The backend
 * requires a lowercase email, so it is normalised before sending.
 */

const C_LIGHT = {
  page: '#F7F9F8',
  line: 'rgba(23,37,30,0.03)',

  text: '#17251E',
  gray: '#52645A',
  hint: '#5F7268',

  frame: '#DCE5DF',
  white: '#FFFFFF',

  green: Brand[600],
  danger: Semantic.danger,
};

const IMG_PLAYER = require('@/assets/dashboard/lojtaret.png');
const IMG_BALL = require('@/assets/dashboard/ndeshjet.png');

export default function SignupScreen() {
  const C = useAppColors(C_LIGHT);
  const styles = usePaletteStyles(createStyles, C);
  const router = useRouter();
  const { t } = useLanguage();
  const { user, completeSignIn } = useSession();

  const errorMessage = (error: unknown): string => {
    if (error instanceof ApiError) {
      if (error.status === 429) return t('signup.errTooMany');
      const first = error.fieldErrors ? Object.values(error.fieldErrors)[0]?.[0] : undefined;
      return first ?? error.message;
    }
    return t('signup.errGeneric');
  };

  const [name, setName] = useState('');
  const [clubName, setClubName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in (e.g. restored from storage) — skip the form.
  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  const goToLogin = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/login');
  };

  const submit = async () => {
    if (busy) return;

    const trimmedName = name.trim();
    const trimmedClub = clubName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedClub || !trimmedEmail) {
      setError(t('signup.errRequired'));
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setError(t('signup.errEmail'));
      return;
    }
    if (password.length < 8) {
      setError(t('signup.errPassword'));
      return;
    }
    if (password !== confirm) {
      setError(t('signup.errMismatch'));
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const result = await auth.signup({
        name: trimmedName,
        email: trimmedEmail,
        password,
        clubName: trimmedClub,
      });
      await completeSignIn(result);
      router.replace('/');
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero — the player is mirrored so he faces back into the page. */}
          <View style={styles.hero}>
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
                {t('signup.subtitle')}
              </Text>
            </View>
          </View>

          <Text style={styles.label}>{t('signup.name')}</Text>
          <TextInput
            style={styles.field}
            placeholder={t('signup.name')}
            accessibilityLabel={t('signup.name')}
            placeholderTextColor={C.grayText}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            editable={!busy}
          />

          <Text style={styles.label}>{t('signup.clubName')}</Text>
          <TextInput
            style={styles.field}
            placeholder={t('signup.clubName')}
            accessibilityLabel={t('signup.clubName')}
            placeholderTextColor={C.grayText}
            value={clubName}
            onChangeText={setClubName}
            autoCapitalize="words"
            autoComplete="organization"
            editable={!busy}
          />

          <Text style={styles.label}>{t('signup.email')}</Text>
          <TextInput
            style={styles.field}
            placeholder={t('signup.email')}
            accessibilityLabel={t('signup.email')}
            placeholderTextColor={C.grayText}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            editable={!busy}
          />

          <Text style={styles.label}>{t('signup.password')}</Text>
          <TextInput
            style={styles.field}
            placeholder={t('signup.password')}
            accessibilityLabel={t('signup.password')}
            placeholderTextColor={C.grayText}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            textContentType="newPassword"
            editable={!busy}
          />

          <Text style={styles.label}>{t('signup.confirm')}</Text>
          <TextInput
            style={styles.field}
            placeholder={t('signup.confirm')}
            accessibilityLabel={t('signup.confirm')}
            placeholderTextColor={C.grayText}
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            textContentType="newPassword"
            editable={!busy}
            onSubmitEditing={submit}
          />

          {error ? (
            <Text style={styles.error} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}

          <Text style={styles.trial}>{t('signup.trial')}</Text>

          <Pressable
            style={[styles.primary, busy && styles.primaryBusy]}
            onPress={submit}
            disabled={busy}
            accessibilityRole="button"
            accessibilityLabel={t('signup.submit')}
            accessibilityState={{ disabled: busy, busy }}
          >
            {busy ? (
              <ActivityIndicator color={C.whiteText} />
            ) : (
              <Text style={styles.primaryText}>{t('signup.submit')}</Text>
            )}
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t('signup.haveAccount')}</Text>
            <Pressable onPress={goToLogin} hitSlop={8} accessibilityRole="link">
              <Text style={styles.footerLink}>{t('signup.login')}</Text>
            </Pressable>
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
    },

    flex: {
      flex: 1,
    },

    body: {
      flexGrow: 1,
      paddingHorizontal: 27,
      paddingBottom: 28,
    },

    /* ── Hero ────────────────────────────────────────────────── */
    hero: {
      height: 190,
      minHeight: 160,
    },

    heroPlayer: {
      position: 'absolute',
      top: -64,
      right: -92,
      width: 212,
      height: 188,
      transform: [{ scaleX: -1 }],
    },

    heroBall: {
      position: 'absolute',
      left: -8,
      top: 48,
      width: 68,
      height: 68,
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
      marginTop: 12,
      marginBottom: 6,
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      lineHeight: 16,
      letterSpacing: 0.2,
      color: C.grayText,
    },

    field: {
      height: 50,
      paddingHorizontal: 14,
      paddingVertical: 0,
      backgroundColor: C.whiteFill,
      borderWidth: 1,
      borderColor: C.frameBorder,
      borderRadius: 12,
      fontFamily: Fonts.body,
      fontSize: 15,
      color: C.textText,
    },

    error: {
      marginTop: 10,
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      lineHeight: 16,
      color: C.dangerText,
    },

    trial: {
      marginTop: 10,
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 16,
      color: C.hintText,
    },

    /* ── Submit ──────────────────────────────────────────────── */
    primary: {
      height: 52,
      marginTop: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.greenFill,
      borderWidth: 1,
      borderColor: C.greenBorder,
      borderRadius: 12,
    },

    primaryBusy: {
      opacity: 0.7,
    },

    primaryText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 16,
      color: '#FFFFFF',
    },

    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 18,
    },

    footerText: {
      fontFamily: Fonts.body,
      fontSize: 13,
      lineHeight: 18,
      color: C.grayText,
    },

    footerLink: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13,
      lineHeight: 18,
      color: C.greenText,
    },
  })
);
