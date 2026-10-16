import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import { listNotifications } from '@/lib/api/notifications';
import type { ApiNotification, Paginated } from '@/lib/api/types';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * Njoftimet — the parent's own inbox, opened from the bell in the parent home
 * header.
 *
 * Every notice the club sent about the parent's children, newest first: the
 * headline in bold, who sent it and what happened underneath, and the moment
 * it arrived down the right edge.
 *
 * Mirrors the player's page (njoftimet-lojtarit); keep the two in step.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',

  frame: '#000000',
  headLine: 'rgba(30,40,35,0.10)',
  rowLine: 'rgba(100,140,190,0.22)',

  card: '#F6FBFF',

  green: '#159447',
  blue: '#0766D8',
};

/* Who a notice can come from — the backend `source` field, in its own colour. */
const SOURCE_LABEL: Record<string, string> = {
  admin: 'Admin',
  trainer: 'Trajneri',
  platform: 'Platformë',
};

const SENDER_TONE: Record<string, string> = {
  Admin: C.blue,
  Trajneri: C.green,
  Platformë: C.text,
  Sistemi: C.text,
};

function sourceLabel(source: string | null): string {
  return source ? (SOURCE_LABEL[source] ?? source) : 'Sistemi';
}

/** `2026-08-06T04:51:00+00:00` → `06/08/2026 04:51`. */
function stamp(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()} ${hh}:${mi}`;
}

export default function ParentNotificationsScreen() {
  const router = useRouter();
  const { token, signOut } = useSession();

  const [list, setList] = useState<Paginated<ApiNotification> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    listNotifications(token, {}, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setList(res);
        setError(null);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          signOut();
          router.replace('/login');
          return;
        }
        setError(
          err instanceof ApiError && err.status === 0
            ? 'Nuk mund të lidhemi me serverin. Kontrollo lidhjen.'
            : 'Nuk mund të ngarkohen njoftimet.',
        );
      });

    return () => controller.abort();
  }, [token, router, signOut]);

  const items = list?.data ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.canvas}>
        {/* Pinned header */}
        <View style={styles.header}>
          <View style={styles.colPad}>
            <View style={styles.headerRow}>
              <Pressable
                onPress={() => router.back()}
                hitSlop={12}
                accessibilityRole="button"
                accessibilityLabel="Kthehu prapa"
                style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons name="chevron-left" size={I(24)} color={C.text} />
              </Pressable>
              <View style={styles.headerText}>
                <Text
                  style={styles.title}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  Njoftimet
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Të gjitha njoftimet e marra
                </Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.colPad}>
            {/* ── Received notices ────────────────────────────────── */}
            <View style={styles.card}>
              {items.length === 0 ? (
                <View style={styles.tr}>
                  <View style={styles.body}>
                    <Text style={styles.nMeta} numberOfLines={2}>
                      {error ?? (list ? 'Nuk ka njoftime.' : '…')}
                    </Text>
                  </View>
                </View>
              ) : (
                items.map((n, i) => {
                  const sender = sourceLabel(n.source);
                  return (
                    <View key={n.id} style={[styles.tr, i > 0 && styles.trBorder]}>
                      {/* Every row is flagged the same way, read or not. */}
                      <View style={styles.dot} />

                      <View style={styles.body}>
                        <Text style={styles.nTitle} numberOfLines={2}>
                          {n.title}
                        </Text>
                        <Text style={styles.nMeta} numberOfLines={2}>
                          <Text style={{ color: SENDER_TONE[sender] ?? C.text }}>{sender}</Text>
                          {n.body ? ` · ${n.body}` : ''}
                        </Text>
                      </View>

                      <Text style={styles.nStamp} numberOfLines={2}>
                        {stamp(n.created_at)}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        </ScrollView>
      </View>
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

    canvas: {
      flex: 1,
    },

    colPad: {
      alignSelf: 'center',
      width: '100%',
      paddingHorizontal: 27,
    },

    /* Pinned header */
    header: {
      backgroundColor: 'transparent',
      paddingTop: 2,
      paddingBottom: 12,
    },

    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    backBtn: {
      height: 34,
      justifyContent: 'center',
      marginLeft: -8,
      paddingRight: 10,
    },

    headerText: {
      flex: 1,
      justifyContent: 'center',
    },

    title: {
      fontFamily: Fonts.bodyBold,
      fontSize: 20,
      lineHeight: 24,
      letterSpacing: -0.3,
      color: C.text,
    },

    subtitle: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 16,
      color: C.gray,
      marginTop: 1,
    },

    scroll: {
      paddingBottom: 24,
    },

    /* ── Notices ─────────────────────────────────────────────── */
    card: {
      marginTop: 20,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 5,
      overflow: 'hidden',
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      minHeight: 58,
      paddingHorizontal: 10,
      paddingVertical: 15,
    },

    /* Every row but the first is ruled off from the one above it. */
    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      marginTop: 5,
      backgroundColor: C.frame,
    },

    body: {
      flex: 1,
    },

    nTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.text,
    },

    nMeta: {
      fontFamily: Fonts.body,
      fontSize: 10,
      lineHeight: 13,
      color: C.hint,
      marginTop: 2,
    },

    /* Sits down the right edge, level with the headline. */
    nStamp: {
      width: 82,
      marginTop: 1,
      textAlign: 'right',
      fontFamily: Fonts.body,
      fontSize: 9.5,
      lineHeight: 12,
      color: C.gray,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
