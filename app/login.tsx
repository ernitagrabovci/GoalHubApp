import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
 * Login. Credentials are exchanged for a Sanctum token against the API; a
 * signed-in session is restored on launch, so this screen redirects home when
 * one already exists. New administrators can create an account from here.
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
const IMG_TEAM = require('@/assets/dashboard/grupet.png');

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) return 'Too many attempts. Please wait a minute and try again.';
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}

export default function LoginScreen() {
  const router = useRouter();
  const { user, completeSignIn } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in (e.g. restored from storage) — skip the form.
  useEffect(() => {
    if (user) router.replace('/');
  }, [user, router]);

  const submit = async () => {
    if (busy) return;
    const trimmed = email.trim();
    if (!trimmed || !password) {
      setError('Enter your email and password.');
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
        <View style={styles.body}>
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
                Log in to your account
              </Text>
            </View>
          </View>

          {/* Fields */}
          <TextInput
            style={styles.field}
            placeholder="Email"
            placeholderTextColor={C.gray}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
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
            editable={!busy}
            onSubmitEditing={submit}
          />

          {error ? (
            <Text style={styles.error} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}

          <Pressable
            style={styles.forgotRow}
            hitSlop={8}
            onPress={() => router.push('/forgot-password')}
            accessibilityRole="button"
          >
            <Text style={styles.forgot}>Forgot your password</Text>
          </Pressable>

          <Pressable
            style={[styles.primary, busy && styles.primaryBusy]}
            onPress={submit}
            disabled={busy}
          >
            {busy ? (
              <ActivityIndicator color={C.green} />
            ) : (
              <Text style={styles.primaryText}>Log in</Text>
            )}
          </Pressable>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>{"Don't have an account? "}</Text>
            <Pressable
              onPress={() => router.push('/signup')}
              hitSlop={8}
              accessibilityRole="link"
            >
              <Text style={styles.signupLink}>Sign up</Text>
            </Pressable>
          </View>

          {/* Everything the two modes share stays up here; the slack pushed
              below keeps the form high and the photo on the bottom edge. */}
          <View style={styles.spacer} />

          {/* The team photo closes the page. */}
          <View style={styles.teamWrap}>
            <Image source={IMG_TEAM} style={styles.team} resizeMode="contain" />
          </View>
        </View>
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

    forgotRow: {
      marginTop: 8,
      alignItems: 'flex-end',
    },

    forgot: {
      fontFamily: Fonts.bodySemiBold,
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
      color: C.gray,
    },

    signupLink: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13,
      lineHeight: 18,
      color: C.green,
    },

    /* ── Team photo ──────────────────────────────────────────── */
    spacer: {
      flex: 1,
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
    },
  })
);
