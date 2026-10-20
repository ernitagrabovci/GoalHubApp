import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import { updatePlayerHealth } from '@/lib/api/players';
import type { ApiPlayer } from '@/lib/api/types';
import { I, scaled } from '@/lib/responsive';

/**
 * The health-status picker behind the player's status pill. Calls
 * `PATCH /players/{id}/health` with the chosen enum value and hands the
 * updated player back so the calling page can redraw its pill.
 */

const OPTIONS = [
  { value: 'active', label: 'Aktiv', tone: '#159447' },
  { value: 'injured', label: 'I lënduar', tone: '#E03131' },
  { value: 'rehabilitation', label: 'Rehab', tone: '#E4A000' },
  { value: 'suspended', label: 'I pezulluar', tone: '#9E1B1B' },
] as const;

const C = {
  text: '#111111',
  gray: '#8A8A8A',
  frame: '#000000',
  red: '#E03131',
};

export function HealthStatusModal({
  visible,
  token,
  playerId,
  current,
  onClose,
  onUpdated,
  onUnauthorized,
}: {
  visible: boolean;
  token: string | null;
  playerId: number;
  current: string;
  onClose: () => void;
  onUpdated: (player: ApiPlayer) => void;
  onUnauthorized: () => void;
}) {
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setSaving(null);
      setError(null);
    }
  }, [visible]);

  const choose = (status: string) => {
    if (!token || saving) return;
    if (status === current) {
      onClose();
      return;
    }

    setSaving(status);
    setError(null);

    updatePlayerHealth(token, playerId, status)
      .then((res) => {
        onUpdated(res.data);
        onClose();
      })
      .catch((e) => {
        setSaving(null);
        if (e instanceof ApiError && e.status === 401) {
          onUnauthorized();
        } else if (e instanceof ApiError && e.status === 403) {
          setError('Nuk keni leje për të ndryshuar statusin.');
        } else if (e instanceof ApiError && e.status === 404) {
          setError('Lojtari nuk u gjet.');
        } else if (e instanceof ApiError && e.status === 0) {
          setError('Nuk mund të lidhemi me serverin. Kontrollo lidhjen.');
        } else {
          setError('Statusi nuk mund të përditësohet.');
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
            <Text style={styles.title}>Statusi shëndetësor</Text>
          </View>
          <View style={styles.divider} />

          <View style={styles.body}>
            {OPTIONS.map((option) => {
              const active = option.value === current;
              const busy = saving === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => choose(option.value)}
                  disabled={saving != null}
                  accessibilityRole="button"
                  accessibilityLabel={option.label}
                  style={({ pressed }) => [styles.option, pressed && styles.pressed]}
                >
                  <View style={[styles.dot, { backgroundColor: option.tone }]} />
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>
                    {option.label}
                  </Text>
                  {busy ? (
                    <Text style={styles.saving}>Duke ruajtur…</Text>
                  ) : active ? (
                    <MaterialCommunityIcons name="check" size={I(17)} color={C.text} />
                  ) : null}
                </Pressable>
              );
            })}

            {error ? (
              <Text style={styles.error} numberOfLines={3}>
                {error}
              </Text>
            ) : null}
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              disabled={saving != null}
              accessibilityRole="button"
              style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}
            >
              <Text style={styles.cancelText}>Anulo</Text>
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
      borderColor: C.frame,
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
      backgroundColor: 'rgba(0,0,0,0.15)',
    },

    body: {
      paddingHorizontal: 14,
      paddingTop: 6,
      paddingBottom: 2,
    },

    option: {
      minHeight: 44,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(0,0,0,0.08)',
    },

    dot: {
      width: 10,
      height: 10,
      borderRadius: 999,
    },

    optionText: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 14,
      lineHeight: 18,
      color: C.text,
    },

    optionTextActive: {
      fontFamily: Fonts.bodyBold,
    },

    saving: {
      fontFamily: Fonts.body,
      fontSize: 11,
      color: C.gray,
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

    pressed: {
      opacity: 0.5,
    },
  }),
);
