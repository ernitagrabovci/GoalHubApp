import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { scaled } from '@/lib/responsive';
import { DEMO_USERS, ROLE_ORDER, useSession } from '@/lib/session';

/**
 * Login / sign-up.
 *
 * There is no backend: the demo signs you in by matching what you typed against
 * the demo accounts, so the address decides the role — admin@goalhub.com opens
 * the administrator, ardit@goalhub.com the player, and so on. An unrecognised
 * address falls back to the administrator.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',

  frame: '#000000',
  white: '#FFFFFF',

  green: '#36AC6B',
  greenSoft: 'rgba(54,172,107,0.20)',
};

const IMG_PLAYER = require('@/assets/dashboard/lojtaret.png');
const IMG_BALL = require('@/assets/dashboard/ndeshjet.png');
const IMG_TEAM = require('@/assets/dashboard/grupet.png');

type Mode = 'signin' | 'signup';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useSession();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const submit = () => {
    const typed = email.trim().toLowerCase();
    const role = ROLE_ORDER.find((r) => DEMO_USERS[r].email === typed);
    signIn(role ?? 'administrator');
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="dark" />

      {/* Faint vertical canvas texture — decorative only */}
      <View pointerEvents="none" style={styles.lines}>
        {Array.from({ length: lineCount }).map((_, index) => (
          <View key={index} style={[styles.line, { left: index * 9 }]} />
        ))}
      </View>

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

          {/* Sign in / create account switch */}
          <View style={styles.segment}>
            <Pressable
              style={[styles.segTab, mode === 'signin' && styles.segTabActive]}
              onPress={() => setMode('signin')}
            >
              <Text style={[styles.segText, mode === 'signin' && styles.segTextActive]}>
                Log in
              </Text>
            </Pressable>
            <Pressable
              style={[styles.segTab, mode === 'signup' && styles.segTabActive]}
              onPress={() => setMode('signup')}
            >
              <Text style={[styles.segText, mode === 'signup' && styles.segTextActive]}>
                Create an account
              </Text>
            </Pressable>
          </View>

          {/* Fields */}
          {mode === 'signup' && (
            <TextInput
              style={styles.field}
              placeholder="Emri i plotë"
              placeholderTextColor={C.gray}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          )}

          <TextInput
            style={styles.field}
            placeholder="Email"
            placeholderTextColor={C.gray}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
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
          />

          {mode === 'signup' && (
            <TextInput
              style={styles.field}
              placeholder="Confirm your password"
              placeholderTextColor={C.gray}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}

          {mode === 'signin' && (
            <Pressable
              style={styles.forgotRow}
              hitSlop={8}
              onPress={() => router.push('/forgot-password')}
              accessibilityRole="button"
            >
              <Text style={styles.forgot}>Forgot your password</Text>
            </Pressable>
          )}

          <Pressable style={styles.primary} onPress={submit}>
            <Text style={styles.primaryText}>
              {mode === 'signin' ? 'Log in' : 'Create an account'}
            </Text>
          </Pressable>

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
      backgroundColor: C.page,
    },

    lines: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 0,
    },

    line: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 1,
      backgroundColor: C.line,
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

    /* ── Sign in / create account switch ─────────────────────── */
    segment: {
      flexDirection: 'row',
      gap: 3,
      marginTop: 16,
      padding: 3,
      backgroundColor: C.white,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 6,
    },

    segTab: {
      flex: 1,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 4,
    },

    segTabActive: {
      backgroundColor: C.green,
    },

    segText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13,
      color: C.text,
    },

    segTextActive: {
      color: C.white,
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

    primaryText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 16,
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
