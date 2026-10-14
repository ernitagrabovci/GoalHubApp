import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import { activityReport } from '@/lib/api/reports';
import type { ActivityReport } from '@/lib/api/types';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * Aktiviteti — opened from "Vazhdo" on the Aktiviteti card over on the users
 * list. Two logs of what the club's accounts have been doing.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',

  cardBg: '#E3EEFB',
  headBg: '#F6FBFF',
  frame: '#000000',
  headLine: 'rgba(30,40,35,0.10)',
  rowLine: 'rgba(100,140,190,0.22)',

  green: '#159447',
  orange: '#E4A000',
  blue: '#2F80ED',
};

/* ── The two logs ──────────────────────────────────────────────────── */

type Entry = {
  name: string;
  role: string;
  action: string;
  time: string;
  /** Tint of the dot that leads each row — the account's role. */
  tone: string;
};

/** Backend role keys → the Albanian names the log spells out. */
const ROLE_NAMES: Record<string, string> = {
  administrator: 'Administrator',
  trainer: 'Trajner',
  assistant_trainer: 'Trajner Asistent',
  technical_staff: 'Staf Teknik',
  player: 'Lojtar',
  parent: 'Prind',
  financier: 'Financier',
};

/** Dot tint per role, so a line's colour reads as "who" before the label does. */
const ROLE_TONES: Record<string, string> = {
  administrator: C.green,
  trainer: C.green,
  assistant_trainer: C.green,
  technical_staff: C.blue,
  player: C.orange,
  parent: C.blue,
  financier: C.blue,
};

function roleName(role: string): string {
  return ROLE_NAMES[role] ?? role;
}

function roleTone(role: string): string {
  return ROLE_TONES[role] ?? C.gray;
}

/**
 * `2026-10-14T09:00:00Z` → "3 orë më parë". Wrapped at module scope so the
 * render-purity rule doesn't flag the `Date.now` inside a component body.
 */
function relativeTime(iso: string | null): string {
  if (!iso) return '—';
  const at = new Date(iso).getTime();
  if (Number.isNaN(at)) return '—';

  const minutes = Math.floor((Date.now() - at) / 60_000);
  if (minutes < 1) return 'Tani';
  if (minutes < 60) return `${minutes} min më parë`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} orë më parë`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Dje';
  if (days < 7) return `${days} ditë më parë`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} javë më parë`;

  return `${Math.floor(days / 30)} muaj më parë`;
}

/** One log line: tinted dot, who and what, then when. */
function ActivityRow({ entry }: { entry: Entry }) {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: entry.tone }]} />

      <View style={styles.rowText}>
        <Text style={styles.rowName} numberOfLines={1}>
          {entry.name}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {entry.role} · {entry.action}
        </Text>
      </View>

      <Text style={styles.rowTime} numberOfLines={1}>
        {entry.time}
      </Text>
    </View>
  );
}

export default function ActivityScreen() {
  const router = useRouter();
  const { token, signOut } = useSession();

  const [data, setData] = useState<ActivityReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    activityReport(token, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setData(res);
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
            : 'Nuk mund të ngarkohet aktiviteti.',
        );
      });
    return () => controller.abort();
  }, [token, signOut, router]);

  const logins: Entry[] = (data?.recent_logins ?? []).map((l) => ({
    name: l.name,
    role: roleName(l.role),
    action: 'Hyrje në sistem',
    time: relativeTime(l.last_login_at),
    tone: roleTone(l.role),
  }));

  const roles = Object.entries(data?.by_role ?? {})
    .map(([role, count]) => ({ role, label: roleName(role), tone: roleTone(role), count }))
    .sort((a, b) => b.count - a.count);

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
                <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                  Aktiviteti
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Historiku i hyrjeve dhe veprimeve të përdoruesve
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
            {/* ── Recent logins ─────────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.head}>
                <Text style={styles.headText} numberOfLines={1}>
                  Hyrjet e fundit
                </Text>
              </View>
              <View style={styles.headLine} />

              {error ? (
                <View style={styles.stateRow}>
                  <Text style={styles.stateText}>{error}</Text>
                </View>
              ) : data === null ? (
                <View style={styles.stateRow}>
                  <ActivityIndicator color={C.blue} />
                </View>
              ) : logins.length === 0 ? (
                <View style={styles.stateRow}>
                  <Text style={styles.stateText}>Nuk ka hyrje të fundit.</Text>
                </View>
              ) : (
                logins.map((e, index) => (
                  <View key={`${e.name}-${index}`} style={index > 0 ? styles.rowBorder : null}>
                    <ActivityRow entry={e} />
                  </View>
                ))
              )}
            </View>

            {/* ── Accounts by role ──────────────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.head}>
                <Text style={styles.headText} numberOfLines={1}>
                  Përdoruesit sipas rolit
                </Text>
              </View>
              <View style={styles.headLine} />

              {data === null ? (
                <View style={styles.stateRow}>
                  <ActivityIndicator color={C.blue} />
                </View>
              ) : roles.length === 0 ? (
                <View style={styles.stateRow}>
                  <Text style={styles.stateText}>Nuk ka të dhëna përdoruesish.</Text>
                </View>
              ) : (
                roles.map((r, index) => (
                  <View key={r.role} style={index > 0 ? styles.rowBorder : null}>
                    <View style={styles.row}>
                      <View style={[styles.dot, { backgroundColor: r.tone }]} />
                      <View style={styles.rowText}>
                        <Text style={styles.rowName} numberOfLines={1}>
                          {r.label}
                        </Text>
                        <Text style={styles.rowMeta} numberOfLines={1}>
                          {r.count} llogari
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}

              <Pressable
                onPress={() => router.push('/perdoruesit')}
                accessibilityRole="button"
                accessibilityLabel="Shiko të gjithë përdoruesit"
                style={({ pressed }) => [styles.footer, pressed && styles.pressed]}
              >
                <Text style={styles.footerText}>Shiko të gjithë përdoruesit</Text>
                <MaterialCommunityIcons name="arrow-right" size={I(16)} color={C.text} />
              </Pressable>
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

    /* ── Cards ───────────────────────────────────────────────── */
    card: {
      marginTop: 6,
      backgroundColor: C.cardBg,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 7,
      overflow: 'hidden',
    },

    cardGap: {
      marginTop: 16,
    },

    head: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 11,
      backgroundColor: C.headBg,
    },

    headText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 15,
      lineHeight: 19,
      color: C.text,
    },

    headLine: {
      height: 1,
      backgroundColor: C.headLine,
    },

    /* ── Log rows ────────────────────────────────────────────── */
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: 54,
      paddingHorizontal: 12,
    },

    rowBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    /* Centred against the two text lines by the row's own alignment. */
    dot: {
      width: 9,
      height: 9,
      borderRadius: 5,
    },

    rowText: {
      flex: 1,
    },

    rowName: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.text,
    },

    rowMeta: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 14,
      color: C.hint,
      marginTop: 1,
    },

    /* ── Loading / empty / error ─────────────────────────────── */
    stateRow: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 18,
    },

    stateText: {
      fontFamily: Fonts.body,
      fontSize: 12.5,
      color: C.hint,
      textAlign: 'center',
    },

    rowTime: {
      minWidth: 76,
      textAlign: 'right',
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 14,
      color: C.gray,
    },

    /* ── Footer link ─────────────────────────────────────────── */
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      minHeight: 48,
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    footerText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12.5,
      color: C.text,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
