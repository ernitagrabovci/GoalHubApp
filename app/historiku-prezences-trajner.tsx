import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import { attendanceHistory } from '@/lib/api/trainings';
import type { ApiTraining } from '@/lib/api/types';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';
import { durationLabel, trainingDate, trainingTime, typeName } from '@/lib/trainings';

/**
 * Historiku i prezencës — the trainer's finalized sessions, newest first.
 *
 * Each row carries the turnout the history screen answers at a glance (how
 * many attended, how many were out) and opens the session's sheet so a mistake
 * can be corrected without re-finalizing.
 */

const C = {
  page: '#FAFBFA',

  text: '#111111',
  gray: '#8A8A8A',

  frame: '#000000',
  headLine: 'rgba(30,40,35,0.10)',
  rowLine: 'rgba(100,140,190,0.22)',

  card: '#F5F5F5',
  blueSoft: '#E3EEFB',
  blueBtn: '#86BCFD',

  green: '#159447',
  red: '#E03131',
};

type HistoryRow = {
  id: number;
  date: string;
  time: string;
  type: string;
  field: string;
  duration: string;
  present: number;
  absent: number;
};

function toHistoryRow(t: ApiTraining): HistoryRow {
  return {
    id: t.id,
    date: trainingDate(t.scheduled_at),
    time: trainingTime(t.scheduled_at),
    type: typeName(t.type),
    field: t.field ?? '—',
    duration: durationLabel(t.duration_minutes),
    present: t.present_count ?? 0,
    absent: t.absent_count ?? 0,
  };
}

/** A short run of page numbers ending at `last`, capped for width. */
function pageWindow(current: number, last: number, span = 4): number[] {
  const start = Math.max(1, Math.min(current, last - span + 1));
  const end = Math.min(last, start + span - 1);
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);
}

const COLS: { key: keyof HistoryRow; label: string; width: number }[] = [
  { key: 'date', label: 'Data & Ora', width: 88 },
  { key: 'type', label: 'Lloji', width: 74 },
  { key: 'field', label: 'Fusha', width: 110 },
  { key: 'duration', label: 'Kohëzgjatja', width: 82 },
  { key: 'present', label: 'Prezent', width: 62 },
  { key: 'absent', label: 'Mungesa', width: 64 },
];

const ACTION_W = 56;

export default function TrainerAttendanceHistoryScreen() {
  const router = useRouter();
  const { token, signOut } = useSession();

  const [rows, setRows] = useState<HistoryRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    attendanceHistory(token, { page }, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setRows(res.data.map(toHistoryRow));
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
            : 'Nuk mund të ngarkohet historiku.',
        );
      });

    return () => controller.abort();
  }, [token, router, signOut, page]);

  const list = rows ?? [];
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
                <Text style={styles.title} numberOfLines={1}>
                  Historiku i prezencës
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Sesionet e përfunduara të ekipit tuaj
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
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  Historia e sesioneve
                </Text>
                <Text style={styles.cardCount} numberOfLines={1}>
                  {list.length} sesione
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={styles.tblInner}
              >
                <View>
                  <View style={[styles.tr, styles.thRow]}>
                    {COLS.map((c) => (
                      <Text key={c.key} style={[styles.th, { width: c.width }]} numberOfLines={1}>
                        {c.label}
                      </Text>
                    ))}
                    <View style={{ width: ACTION_W }} />
                  </View>

                  {list.map((r) => (
                    <View key={r.id} style={[styles.tr, styles.trBorder]}>
                      {COLS.map((c) => {
                        /* The date cell stacks the day over the kick-off time. */
                        if (c.key === 'date') {
                          return (
                            <View key={c.key} style={{ width: c.width }}>
                              <Text style={styles.td} numberOfLines={1}>
                                {r.date}
                              </Text>
                              <Text style={styles.td} numberOfLines={1}>
                                {r.time}
                              </Text>
                            </View>
                          );
                        }

                        const tone =
                          c.key === 'present'
                            ? C.green
                            : c.key === 'absent'
                              ? C.red
                              : undefined;

                        return (
                          <Text
                            key={c.key}
                            style={[
                              styles.td,
                              c.key === 'type' && styles.tdStrong,
                              tone ? [styles.tdStrong, { color: tone }] : null,
                              { width: c.width },
                            ]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.75}
                          >
                            {r[c.key]}
                          </Text>
                        );
                      })}

                      <View style={[styles.actions, { width: ACTION_W }]}>
                        <Pressable
                          onPress={() =>
                            router.push({
                              pathname: '/regjistro-prezencen',
                              params: {
                                id: String(r.id),
                                date: r.date,
                                time: r.time,
                                field: r.field,
                                type: r.type,
                                duration: r.duration,
                                finalized: '1',
                              },
                            })
                          }
                          accessibilityRole="button"
                          accessibilityLabel={`Hap prezencën e ${r.date}`}
                          style={({ pressed }) => [styles.actView, pressed && styles.pressed]}
                        >
                          <Text style={styles.actViewText}>Hap</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}

                  {list.length === 0 ? (
                    <View style={styles.tr}>
                      <Text style={styles.empty} numberOfLines={2}>
                        {error ?? (rows ? 'Nuk ka sesione të përfunduara.' : '…')}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </ScrollView>
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

    /* ── History table ───────────────────────────────────────── */
    card: {
      marginTop: 14,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 5,
      overflow: 'hidden',
    },

    cardHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      paddingHorizontal: 10,
      paddingTop: 10,
      paddingBottom: 9,
    },

    cardTitle: {
      flexShrink: 1,
      fontFamily: Fonts.bodyBold,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.text,
    },

    cardCount: {
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 15,
      color: C.gray,
    },

    tblInner: {
      paddingHorizontal: 10,
      paddingBottom: 10,
    },

    thRow: {
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 44,
    },

    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
      paddingVertical: 10,
    },

    th: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.gray,
    },

    td: {
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 14,
      color: C.text,
    },

    tdStrong: {
      fontFamily: Fonts.bodySemiBold,
    },

    empty: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 15,
      color: C.gray,
    },

    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },

    actView: {
      height: 24,
      paddingHorizontal: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.blueSoft,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    actViewText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: C.text,
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
      backgroundColor: C.blueBtn,
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
