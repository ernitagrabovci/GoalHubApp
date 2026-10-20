import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import { deletePlayer } from '@/lib/api/players';
import { scaled } from '@/lib/responsive';

/**
 * The "Fshi lojtarin" confirmation on the administrator's player page. The API
 * deletes the player's user account, so the caller navigates away on success.
 */

const C = {
  text: '#111111',
  gray: '#8A8A8A',
  frame: '#000000',
  red: '#E03131',
};

export function DeletePlayerModal({
  visible,
  token,
  playerId,
  playerName,
  onClose,
  onDeleted,
  onUnauthorized,
}: {
  visible: boolean;
  token: string | null;
  playerId: number;
  playerName: string;
  onClose: () => void;
  onDeleted: () => void;
  onUnauthorized: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setSaving(false);
      setError(null);
    }
  }, [visible]);

  const confirm = () => {
    if (!token || saving) return;

    setSaving(true);
    setError(null);

    deletePlayer(token, playerId)
      .then(() => onDeleted())
      .catch((e) => {
        setSaving(false);
        if (e instanceof ApiError && e.status === 401) {
          onUnauthorized();
        } else if (e instanceof ApiError && e.status === 403) {
          setError('Nuk keni leje për të fshirë këtë lojtar.');
        } else if (e instanceof ApiError && e.status === 404) {
          setError('Lojtari nuk u gjet.');
        } else if (e instanceof ApiError && e.status === 0) {
          setError('Nuk mund të lidhemi me serverin. Kontrollo lidhjen.');
        } else {
          setError('Lojtari nuk mund të fshihet.');
        }
      });
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
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
            <Text style={styles.title}>Fshi lojtarin</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.body}>
            <Text style={styles.warning}>
              {playerName} dhe llogaria e tij do të fshihen përgjithmonë. Ky veprim nuk
              mund të kthehet.
            </Text>

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
              style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
            >
              <Text style={styles.cancelText}>Anulo</Text>
            </Pressable>
            <Pressable
              onPress={confirm}
              disabled={saving}
              accessibilityRole="button"
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

const styles = StyleSheet.create(
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
      backgroundColor: '#F5F5F5',
      borderWidth: 1,
      borderColor: C.red,
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
      color: C.text,
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
      fontSize: 11.5,
      lineHeight: 16,
      color: C.text,
    },

    error: {
      fontFamily: Fonts.body,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.red,
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
      height: 32,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    cancelText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12.5,
      color: C.text,
    },

    danger: {
      height: 32,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.red,
      borderRadius: 4,
    },

    dangerText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12.5,
      color: '#F5F5F5',
    },

    off: {
      opacity: 0.6,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
