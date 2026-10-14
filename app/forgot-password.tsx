import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
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
import { forgotPassword } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/errors';
import { I, scaled } from '@/lib/responsive';

/**
 * Forgot password — asks the API to mail a reset link. The backend always
 * returns the same message (whether or not the email exists), which we surface
 * verbatim so the screen can't be used to enumerate accounts.
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
  /* The card's 20% green, flattened to an opaque tone. */
  greenTint: '#D7EEE1',
  danger: '#D64545',
};

const IMG_PLAYER = require('@/assets/dashboard/lojtaret.png');
const IMG_BALL = require('@/assets/dashboard/ndeshjet.png');
const IMG_TEAM = require('@/assets/dashboard/grupet.png');

export default function ForgotPasswordScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  const submit = async () => {
    if (busy) return;
    const trimmed = email.trim();
    if (!trimmed) {
      setError('Shkruaj email adresën tënde.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const res = await forgotPassword(trimmed);
      setSent(res.message);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError('Shumë kërkesa. Provo përsëri pas një minute.');
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Diçka shkoi keq. Provo përsëri.');
      }
    } finally {
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
          <View style={styles.hero}>
            <Image source={IMG_PLAYER} style={styles.heroPlayer} resizeMode="contain" />
            <Image source={IMG_BALL} style={styles.heroBall} resizeMode="contain" />
          </View>

          {/* Back */}
          <Pressable
            style={({ pressed }) => [styles.backRow, pressed && styles.pressed]}
            hitSlop={10}
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Kthehu"
          >
            <MaterialCommunityIcons name="chevron-left" size={I(26)} color={C.text} />
            <Text style={styles.backText}>Kthehu</Text>
          </Pressable>

          {/* Reset card */}
          <View style={styles.card}>
            <Text
              style={styles.wordmark}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              GOALHUB
            </Text>
            <Text style={styles.resetTitle} numberOfLines={1}>
              Rivendos fjalëkalimin
            </Text>

            {sent ? (
              <>
                <Text style={styles.ask}>Kontrollo emailin</Text>
                <Text style={styles.help}>{sent}</Text>

                <Pressable
                  style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
                  onPress={() => router.back()}
                >
                  <Text style={styles.primaryText}>Kthehu te hyrja</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.ask}>Harrove fjalëkalimin?</Text>
                <Text style={styles.help}>
                  Shkruaj email adresën tënde dhe ne do të dërgojmë një link për rivendosje.
                </Text>

                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.field}
                  placeholder="email@goalhub.com"
                  placeholderTextColor={C.gray}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
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
                  style={({ pressed }) => [styles.primary, (pressed || busy) && styles.pressed]}
                  onPress={submit}
                  disabled={busy}
                >
                  {busy ? (
                    <ActivityIndicator color={C.white} />
                  ) : (
                    <Text style={styles.primaryText}>Send link</Text>
                  )}
                </Pressable>
              </>
            )}
          </View>

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

    /* ── Photos — same placement as the login page ───────────── */
    hero: {
      height: 170,
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

    /* ── Back ────────────────────────────────────────────────── */
    backRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
      marginLeft: -6,
      alignSelf: 'flex-start',
    },

    backText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 18,
      lineHeight: 22,
      color: C.text,
    },

    /* ── Reset card ──────────────────────────────────────────── */
    card: {
      marginTop: 14,
      paddingHorizontal: 16,
      paddingVertical: 16,
      backgroundColor: C.greenTint,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 7,
    },

    wordmark: {
      textAlign: 'center',
      fontFamily: Fonts.bodyBlack,
      fontSize: 34,
      lineHeight: 38,
      letterSpacing: -0.6,
      color: C.text,
    },

    resetTitle: {
      marginTop: 2,
      textAlign: 'center',
      fontFamily: Fonts.bodyBold,
      fontSize: 20,
      lineHeight: 25,
      letterSpacing: -0.3,
      color: C.text,
    },

    ask: {
      marginTop: 16,
      textAlign: 'center',
      fontFamily: Fonts.bodyBold,
      fontSize: 13.5,
      lineHeight: 18,
      color: C.text,
    },

    help: {
      marginTop: 4,
      textAlign: 'center',
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 17,
      color: C.text,
    },

    label: {
      marginTop: 14,
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      lineHeight: 16,
      color: C.text,
    },

    field: {
      height: 38,
      marginTop: 6,
      paddingHorizontal: 14,
      paddingVertical: 0,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 5,
      fontFamily: Fonts.body,
      fontSize: 13,
      color: C.text,
    },

    error: {
      marginTop: 8,
      textAlign: 'center',
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      lineHeight: 16,
      color: C.danger,
    },

    primary: {
      height: 40,
      marginTop: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.green,
      borderRadius: 5,
    },

    primaryText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 15,
      color: C.white,
    },

    /* ── Team photo ──────────────────────────────────────────── */
    teamWrap: {
      height: 300,
      flexGrow: 1,
      flexShrink: 1,
      maxHeight: 380,
      marginTop: 10,
    },

    team: {
      flex: 1,
      width: '80%',
    },

    pressed: {
      opacity: 0.5,
    },
  })
);
