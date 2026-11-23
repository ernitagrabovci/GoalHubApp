import { BlurView } from 'expo-blur';
import { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts, Semantic } from '@/constants/theme';
import { useAppColors, usePaletteStyles, type AppColorsOf } from '@/lib/app-theme';
import { deleteAccount } from '@/lib/api/account';
import { ApiError } from '@/lib/api/errors';
import { scaled } from '@/lib/responsive';

/**
 * The "Fshij të gjitha të dhënat" confirmation, shared by the account and
 * security settings pages. It asks for the current password — the API's
 * `DELETE /profile` requires it — then calls back once the account is gone.
 */

const C_LIGHT = {
  text: '#17251E',
  gray: '#52645A',
  frame: '#DCE5DF',
  red: Semantic.danger,
  white: '#FFFFFF',
};

export function DeleteAccountModal({
  token,
  onClose,
  onDeleted,
}: {
  token: string | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const C = useAppColors(C_LIGHT);
  const styles = usePaletteStyles(createStyles, C);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = () => {
    if (!token || saving) return;
    if (!password) {
      setError('Shkruaj fjalëkalimin.');
      return;
    }

    setSaving(true);
    setError(null);

    deleteAccount(token, password)
      .then(() => onDeleted())
      .catch((e) => {
        setSaving(false);
        if (e instanceof ApiError && e.status === 422) {
          setError('Fjalëkalimi është i gabuar.');
        } else if (e instanceof ApiError && e.status === 0) {
          setError('Nuk mund të lidhemi me serverin. Kontrollo lidhjen.');
        } else {
          setError('Llogaria nuk mund të fshihet.');
        }
      });
  };

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.ovWrap}>
        <BlurView style={styles.ovFill} intensity={45} tint="dark" />
        <Pressable
          style={[styles.ovFill, styles.ovDim]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Mbylle dritaren"
        />

        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Fshij të gjitha të dhënat</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.body}>
            <Text style={styles.warning}>
              Ky veprim është i pakthyeshëm. Llogaria dhe të dhënat tuaja do të fshihen
              përgjithmonë.
            </Text>
            <Text style={styles.label}>Fjalëkalimi:</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              allowFontScaling={false}
              placeholder="••••••••"
              placeholderTextColor={C.grayText}
              accessibilityLabel="Fjalëkalimi"
              style={styles.input}
            />

            {error ? (
              <Text style={styles.error} numberOfLines={3}>
                {error}
              </Text>
            ) : null}
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Anulo"
              accessibilityState={{ disabled: saving }}
              style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
            >
              <Text style={styles.cancelText}>Anulo</Text>
            </Pressable>
            <Pressable
              onPress={confirm}
              disabled={saving}
              accessibilityRole="button"
              accessibilityLabel="Fshij përgjithmonë"
              accessibilityState={{ disabled: saving, busy: saving }}
              style={({ pressed }) => [
                styles.danger,
                saving && styles.off,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.dangerText}>
                {saving ? 'Duke fshirë…' : 'Fshij përgjithmonë'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (C: AppColorsOf<typeof C_LIGHT>) => StyleSheet.create(
  scaled({
    ovWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: 120,
    },

    ovFill: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },

    ovDim: {
      backgroundColor: 'rgba(0,0,0,0.42)',
    },

    card: {
      width: '86%',
      maxWidth: 340,
      backgroundColor: C.whiteFill,
      borderWidth: 1,
      borderColor: C.redBorder,
      borderRadius: 6,
      overflow: 'hidden',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 8,
    },

    header: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
    },

    title: {
      fontFamily: Fonts.bodyBold,
      fontSize: 17,
      lineHeight: 21,
      color: C.textText,
    },

    divider: {
      height: 1,
      backgroundColor: 'rgba(224,49,49,0.30)',
    },

    body: {
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 2,
    },

    warning: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 17,
      color: C.textText,
      marginBottom: 12,
    },

    label: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 16,
      color: C.grayText,
      marginBottom: 6,
    },

    input: {
      height: 44,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: C.frameBorder,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 0,
      fontSize: 14,
      fontFamily: Fonts.body,
      color: C.textText,
    },

    error: {
      fontFamily: Fonts.body,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.redText,
      marginTop: 10,
    },

    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
      padding: 14,
      paddingTop: 12,
    },

    cancel: {
      height: 44,
      paddingHorizontal: 18,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.frameBorder,
      borderRadius: 10,
    },

    cancelText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13,
      color: C.textText,
    },

    danger: {
      height: 44,
      paddingHorizontal: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.redFill,
      borderRadius: 10,
    },

    dangerText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13,
      color: C.whiteText,
    },

    off: {
      opacity: 0.6,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
