import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import { listChildAttendance } from '@/lib/api/children';
import type { ApiChildAttendance } from '@/lib/api/types';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';
import { attendanceLabel, typeName } from '@/lib/trainings';

/**
 * Prezenca — the child's attendance, opened from the "Prezenca" card on the
 * child's page.
 *
 * Read-only for a parent: one table of the season's trainings with how the
 * child was marked at each.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',

  /* The card's pale blue wash and its blue rim. */
  blue2: '#F6FBFF',
  border: 'rgba(100,140,190,0.30)',
  rowLine: 'rgba(100,140,190,0.22)',
  headLine: 'rgba(30,40,35,0.10)',

  green: '#159447',
  red: '#E03131',

  /* The pager's squares. */
  blue: '#86BCFD',
};

/* How a training can be marked, each reading in its own colour. */
const TONE: Record<string, string> = {
  Prezent: C.green,
  Mungesë: C.red,
  '—': C.gray,
};

type Session = {
  id: number;
  type: string;
  date: string;
  status: string;
};

const pad2 = (n: number) => String(n).padStart(2, '0');

/** The training's day as `12/08/2026`; an unusable date renders as a dash. */
function dmy(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** One API attendance line, laid onto the table row. */
function toSession(a: ApiChildAttendance): Session {
  return {
    id: a.id,
    type: typeName(a.training?.type),
    date: dmy(a.training?.scheduled_at),
    status: attendanceLabel(a.status),
  };
}

/** A short run of page numbers ending at `last`, capped for width. */
function pageWindow(current: number, last: number, span = 4): number[] {
  const start = Math.max(1, Math.min(current, last - span + 1));
  const end = Math.min(last, start + span - 1);
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);
}

export default function ChildAttendanceScreen() {
  const router = useRouter();
  const { token, signOut } = useSession();

  const params = useLocalSearchParams<{ id?: string; name?: string }>();
  const childId = params.id ? Number(params.id) : null;
  const name = params.name ?? 'Fëmija';

  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    if (!token || !childId) return;
    const controller = new AbortController();

    listChildAttendance(token, childId, { page }, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setSessions(res.data.map(toSession));
        setLastPage(res.meta.last_page);
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
            : 'Nuk mund të ngarkohet prezenca.',
        );
      });

    return () => controller.abort();
  }, [token, childId, router, signOut, page]);

  const rows = sessions ?? [];
  const current = Math.min(page, Math.max(1, lastPage));

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
                  {`Prezenca e ${name}`}
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
            {/* ── Stërvitjet dhe prania ─────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.tblInner}>
                <View style={[styles.tr, styles.thRow]}>
                  <Text style={[styles.th, styles.colType]} numberOfLines={1}>
                    Stërvitja
                  </Text>
                  <Text style={[styles.th, styles.colDate]} numberOfLines={1}>
                    Data
                  </Text>
                  <Text style={[styles.th, styles.colStatus]} numberOfLines={1}>
                    Statusi
                  </Text>
                </View>

                {rows.map((s) => (
                  <View key={s.id} style={[styles.tr, styles.trBorder]}>
                    <Text
                      style={[styles.td, styles.colType, styles.tdStrong]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      {s.type}
                    </Text>
                    <Text style={[styles.td, styles.colDate]} numberOfLines={1}>
                      {s.date}
                    </Text>
                    <Text
                      style={[
                        styles.td,
                        styles.colStatus,
                        styles.tdStrong,
                        { color: TONE[s.status] ?? C.text },
                      ]}
                      numberOfLines={1}
                    >
                      {s.status}
                    </Text>
                  </View>
                ))}

                {rows.length === 0 ? (
                  <View style={styles.tr}>
                    <Text style={styles.empty} numberOfLines={2}>
                      {error ?? (sessions ? 'Nuk ka prezencë.' : '…')}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* ── Pager ─────────────────────────────────────────── */}
            {lastPage > 1 ? (
              <View style={styles.pager}>
                <Pressable
                  onPress={() => setPage(current - 1)}
                  disabled={current <= 1}
                  accessibilityRole="button"
                  accessibilityLabel="Faqja e mëparshme"
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.pagerArrow,
                    current <= 1 && styles.pagerDisabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialCommunityIcons name="chevron-left" size={I(22)} color={C.text} />
                </Pressable>

                {pageWindow(current, lastPage).map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => setPage(p)}
                    accessibilityRole="button"
                    accessibilityLabel={`Faqja ${p}`}
                    style={({ pressed }) => [
                      p === current ? styles.pageSqActive : styles.pageSq,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.pageSqText}>{p}</Text>
                  </Pressable>
                ))}

                <Pressable
                  onPress={() => setPage(current + 1)}
                  disabled={current >= lastPage}
                  accessibilityRole="button"
                  accessibilityLabel="Faqja tjetër"
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.pagerArrow,
                    current >= lastPage && styles.pagerDisabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialCommunityIcons name="chevron-right" size={I(22)} color={C.text} />
                </Pressable>
              </View>
            ) : null}
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

    scroll: {
      paddingBottom: 24,
    },

    /* ── Table ───────────────────────────────────────────────── */
    card: {
      marginTop: 14,
      backgroundColor: C.blue2,
      borderWidth: 2,
      borderColor: C.border,
      borderRadius: 7,
      overflow: 'hidden',
    },

    /* Keeps the rules clear of the card's rim. */
    tblInner: {
      paddingHorizontal: 10,
      paddingBottom: 8,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 2,
      minHeight: 42,
    },

    thRow: {
      paddingTop: 9,
      paddingBottom: 7,
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
    },

    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    th: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 9,
      lineHeight: 12,
      color: C.gray,
      textAlign: 'center',
    },

    td: {
      fontFamily: Fonts.body,
      fontSize: 9.5,
      lineHeight: 12,
      color: C.gray,
      textAlign: 'center',
    },

    tdStrong: {
      fontFamily: Fonts.bodyBold,
      color: C.text,
    },

    colType: {
      flex: 1.6,
    },

    colDate: {
      flex: 1,
    },

    colStatus: {
      flex: 1,
    },

    /* The load error / empty-list line, spanning the row. */
    empty: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 9.5,
      lineHeight: 13,
      color: C.gray,
      textAlign: 'left',
    },

    /* ── Pager ───────────────────────────────────────────────── */
    pager: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 6,
      marginTop: 12,
    },

    pagerArrow: {
      alignItems: 'center',
      justifyContent: 'center',
    },

    pagerDisabled: {
      opacity: 0.3,
    },

    pageSq: {
      width: 34,
      height: 34,
      borderRadius: 5,
      backgroundColor: C.blue,
      alignItems: 'center',
      justifyContent: 'center',
    },

    pageSqActive: {
      width: 34,
      height: 34,
      borderRadius: 5,
      backgroundColor: '#4E90D8',
      alignItems: 'center',
      justifyContent: 'center',
    },

    pageSqText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 14,
      color: '#F5F5F5',
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
