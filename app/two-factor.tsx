import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import { challengeTwoFactor } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/errors';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * Second step of login for accounts with an authenticator app. The password
 * step leaves a short-lived challenge token in the route params; only a valid
 * TOTP (or recovery) code exchanges it for a real session.
 */

const C = {
  text: '#111111',
  gray: '#8A8A8A',
  frame: '#000000',
  white: '#F5F5F5',
  green: '#36AC6B',
  greenTint: '#D7EEE1',
  danger: '#D64545',
};

const IMG_PLAYER = require('@/assets/dashboard/lojtaret.png');
const IMG_BALL = require('@/assets/dashboard/ndeshjet.png');
const IMG_TEAM = require('@/assets/dashboard/grupet.png');

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) return 'Shumë tentativa. Provo përsëri pas një minute.';
    if (error.status === 0) return 'Nuk mund të lidhemi me serverin. Kontrollo lidhjen.';
    return error.message;
  }
  return 'Diçka shkoi keq. Provo përsëri.';
}

export default function TwoFactorScreen() {
  const router = useRouter();
  const { completeSignIn } = useSession();
  const params = useLocalSearchParams<{ challenge_token?: string }>();
  const challengeToken =
    typeof params.challenge_token === 'string' ? params.challenge_token : '';

  const [code, setCode] = useState('');
  const [recovery, setRecovery] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (busy) return;

    const trimmed = code.trim();
    if (!challengeToken) {
      setError('Sesioni i verifikimit ka skaduar. Kthehu dhe hyr përsëri.');
      return;
    }
    if (!trimmed) {
      setError(recovery ? 'Shkruaj një kod rikuperimi.' : 'Shkruaj kodin 6-shifror.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const result = await challengeTwoFactor(challengeToken, trimmed);
      await completeSignIn(result);
      router.replace('/');
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  const toggleMode = () => {
    setRecovery((value) => !value);
    setCode('');
    setError(null);
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

          <View style={styles.card}>
            <Text
              style={styles.wordmark}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
            >
              GOALHUB
            </Text>
            <Text style={styles.title}>Verifikimi me dy faktorë</Text>

            <Text style={styles.ask}>
              {recovery ? 'Shkruaj një kod rikuperimi' : 'Shkruaj kodin nga aplikacioni'}
            </Text>
            <Text style={styles.help}>
              {recovery
                ? 'Çdo kod rikuperimi përdoret vetëm një herë.'
                : 'Hap aplikacionin e autentikimit dhe shkruaj kodin 6-shifror.'}
            </Text>

            <TextInput
              style={[styles.field, recovery && styles.fieldRecovery]}
              placeholder={recovery ? 'XXXXX-XXXXX' : '000000'}
              placeholderTextColor={C.gray}
              value={code}
              onChangeText={(value) =>
                setCode(recovery ? value : value.replace(/[^0-9]/g, ''))
              }
              keyboardType={recovery ? 'default' : 'number-pad'}
              autoCapitalize={recovery ? 'characters' : 'none'}
              autoCorrect={false}
              maxLength={recovery ? 20 : 6}
              editable={!busy}
              textContentType="oneTimeCode"
              onSubmitEditing={submit}
              accessibilityLabel={recovery ? 'Kodi i rikuperimit' : 'Kodi 6-shifror'}
            />

            {error ? (
              <Text style={styles.error} accessibilityRole="alert">
                {error}
              </Text>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.primary,
                (pressed || busy) && styles.pressed,
              ]}
              onPress={submit}
              disabled={busy}
              accessibilityRole="button"
            >
              {busy ? (
                <ActivityIndicator color={C.white} />
              ) : (
                <Text style={styles.primaryText}>Verifiko</Text>
              )}
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.switchRow, pressed && styles.pressed]}
              onPress={toggleMode}
              hitSlop={8}
              accessibilityRole="button"
            >
              <Text style={styles.switchText}>
                {recovery ? 'Përdor kodin e aplikacionit' : 'Përdor një kod rikuperimi'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.teamWrap}>
            <Image source={IMG_TEAM} style={styles.team} resizeMode="contain" />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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

    hero: {
      height: 120,
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
      top: 48,
      width: 80,
      height: 80,
    },

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

    title: {
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

    field: {
      height: 44,
      marginTop: 14,
      paddingHorizontal: 14,
      paddingVertical: 0,
      textAlign: 'center',
      letterSpacing: 3,
      fontFamily: Fonts.bodySemiBold,
      fontSize: 18,
      color: C.text,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 5,
    },

    fieldRecovery: {
      letterSpacing: 1,
      fontSize: 15,
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
      height: 42,
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

    switchRow: {
      marginTop: 12,
      alignItems: 'center',
    },

    switchText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      lineHeight: 16,
      color: C.text,
      textDecorationLine: 'underline',
    },

    teamWrap: {
      height: 260,
      flexGrow: 1,
      flexShrink: 1,
      maxHeight: 340,
      marginTop: 8,
    },

    team: {
      flex: 1,
      width: '80%',
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
