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
import { Fonts } from '@/constants/theme';
import * as auth from '@/lib/api/auth';
import { ApiError } from '@/lib/api/errors';
import { scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * Self-service signup. Creates an administrator account plus a 14-day-trial
 * club against the API, then signs in with the returned session. The backend
 * requires a lowercase email, so it is normalised before sending.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',

  frame: '#000000',
  white: '#F5F5F5',

  green: '#36AC6B',
  greenSoft: 'rgba(54,172,107,0.20)',
  danger: '#D64545',
};

const IMG_PLAYER = require('@/assets/dashboard/lojtaret.png');
const IMG_BALL = require('@/assets/dashboard/ndeshjet.png');

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) return 'Too many attempts. Please wait a minute and try again.';
    const first = error.fieldErrors ? Object.values(error.fieldErrors)[0]?.[0] : undefined;
    return first ?? error.message;
  }
  return 'Something went wrong. Please try again.';
}

export default function SignupScreen() {
  const router = useRouter();
  const { user, completeSignIn } = useSession();

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
      setError('Fill in your name, club name and email.');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Use at least 8 characters for your password.');
      return;
    }
    if (password !== confirm) {
      setError('The passwords do not match.');
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
                Create your club account
              </Text>
            </View>
          </View>

          <TextInput
            style={styles.field}
            placeholder="Full name"
            placeholderTextColor={C.gray}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            editable={!busy}
          />

          <TextInput
            style={styles.field}
            placeholder="Club name"
            placeholderTextColor={C.gray}
            value={clubName}
            onChangeText={setClubName}
            autoCapitalize="words"
            autoComplete="organization"
            editable={!busy}
          />

          <TextInput
            style={styles.field}
            placeholder="Email"
            placeholderTextColor={C.gray}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            editable={!busy}
          />

          <TextInput
            style={styles.field}
            placeholder="Password"
            placeholderTextColor={C.gray}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            textContentType="newPassword"
            editable={!busy}
          />

          <TextInput
            style={styles.field}
            placeholder="Confirm password"
            placeholderTextColor={C.gray}
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

          <Text style={styles.trial}>Your club starts on a 14-day free trial.</Text>

          <Pressable
            style={[styles.primary, busy && styles.primaryBusy]}
            onPress={submit}
            disabled={busy}
            accessibilityRole="button"
          >
            {busy ? (
              <ActivityIndicator color={C.green} />
            ) : (
              <Text style={styles.primaryText}>Create account</Text>
            )}
          </Pressable>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Pressable onPress={goToLogin} hitSlop={8} accessibilityRole="link">
              <Text style={styles.footerLink}>Log in</Text>
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

const styles = StyleSheet.create(
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
      color: C.text,
    },

    heroSubtitle: {
      marginTop: 2,
      fontFamily: Fonts.body,
      fontSize: 14,
      lineHeight: 18,
      color: C.gray,
    },

    /* ── Fields ──────────────────────────────────────────────── */
    field: {
      height: 46,
      marginTop: 10,
      paddingHorizontal: 14,
      paddingVertical: 0,
      backgroundColor: C.white,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 5,
      fontFamily: Fonts.body,
      fontSize: 13,
      color: C.text,
    },

    error: {
      marginTop: 10,
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      lineHeight: 16,
      color: C.danger,
    },

    trial: {
      marginTop: 10,
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 16,
      color: C.hint,
    },

    /* ── Submit ──────────────────────────────────────────────── */
    primary: {
      height: 48,
      marginTop: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.greenSoft,
      borderWidth: 1,
      borderColor: C.green,
      borderRadius: 5,
    },

    primaryBusy: {
      opacity: 0.7,
    },

    primaryText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 16,
      color: C.green,
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
      color: C.gray,
    },

    footerLink: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13,
      lineHeight: 18,
      color: C.green,
    },
  })
);
