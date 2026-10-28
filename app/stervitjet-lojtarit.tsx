import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import { listMyTrainings } from '@/lib/api/trainings';
import type { ApiTraining } from '@/lib/api/types';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';
import { attendanceLabel, durationLabel, trainingDate, trainingTime, typeName } from '@/lib/trainings';

/**
 * Stërvitjet — opened from "Stërvitjet" on the player's dashboard. The squad's
 * training schedule: what, when and where, and whether the player turned up.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',

  frame: '#000000',
  headLine: 'rgba(30,40,35,0.10)',
  rowLine: 'rgba(100,140,190,0.22)',

  /* blue2 = the table card's wash. */
  blue2: '#F6FBFF',
  blueBtn: '#86BCFD',
};

type ColKey = 'type' | 'when' | 'where' | 'attendance';

const COLS: { key: ColKey; label: string; width: number }[] = [
  { key: 'type', label: 'Lloji', width: 124 },
  { key: 'when', label: 'Data & Ora', width: 128 },
  { key: 'where', label: 'Lokacioni', width: 116 },
  { key: 'attendance', label: 'Prezenca', width: 82 },
];

/* The single row button, plus the gap before it. */
const ACTION_W = 56;

type Session = {
  id: number;
  type: string;
  when: string;
  where: string;
  attendance: string;
  /** The raw status, carried to the detail page so it can name the state. */
  status: string;
  duration: string;
};

/** One API training, laid onto the schedule row. `my_attendance` is the
 *  caller's own status, present only on this player-scoped list. */
function toSession(t: ApiTraining): Session {
  return {
    id: t.id,
    type: typeName(t.type),
    when: `${trainingDate(t.scheduled_at)} • ${trainingTime(t.scheduled_at)}`,
    where: t.field ?? '—',
    attendance: attendanceLabel(t.my_attendance),
    status: t.my_attendance ?? 'unconfirmed',
    duration: durationLabel(t.duration_minutes),
  };
}

/** A short run of page numbers ending at `last`, capped for width. */
function pageWindow(current: number, last: number, span = 4): number[] {
  const start = Math.max(1, Math.min(current, last - span + 1));
  const end = Math.min(last, start + span - 1);
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);
}

export default function PlayerTrainingsScreen() {
  const router = useRouter();
  const { token, signOut } = useSession();

  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const firstFocus = useRef(true);

  /* Re-read the list when the detail page is dismissed, so a just-reported
     absence shows up without a manual refresh. */
  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      setReloadKey((k) => k + 1);
    }, []),
  );

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    listMyTrainings(token, { page }, controller.signal)
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
            : 'Nuk mund të ngarkohen stërvitjet.',
        );
      });

    return () => controller.abort();
  }, [token, router, signOut, page, reloadKey]);

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
                <Text style={styles.title} numberOfLines={1}>
                  Stërvitjet
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Orari i stërvitjeve të ekipit tuaj
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
            {/* ── Stërvitjet ────────────────────────────────────── */}
            <View style={styles.card}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={[styles.tblInner, styles.tblFill]}
              >
                {/* One wrapper that takes the card's full width, so the header
                    rule and every row rule reach the far edge. */}
                <View style={styles.tblFill}>
                  <View style={[styles.tr, styles.thRow]}>
                    {COLS.map((c) => (
                      <Text key={c.key} style={[styles.th, { width: c.width }]} numberOfLines={1}>
                        {c.label}
                      </Text>
                    ))}
                    {/* Keeps the header rule exactly as wide as the rows below. */}
                    <View style={{ width: ACTION_W }} />
                  </View>

                  {rows.map((s) => (
                    <View key={s.id} style={[styles.tr, styles.trBorder]}>
                      <Text
                        style={[styles.td, styles.tdType, { width: 124 }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                      >
                        {s.type}
                      </Text>
                      <Text style={[styles.td, { width: 128 }]} numberOfLines={1}>
                        {s.when}
                      </Text>
                      <Text style={[styles.td, { width: 116 }]} numberOfLines={1}>
                        {s.where}
                      </Text>
                      <Text style={[styles.td, { width: 82 }]} numberOfLines={1}>
                        {s.attendance}
                      </Text>

                      {/* Transparent, riding on the row itself. */}
                      <View style={[styles.actions, { width: ACTION_W }]}>
                        <Pressable
                          onPress={() => {
                            const [date, time] = s.when.split(' • ');
                            router.push({
                              pathname: '/stervitja-lojtarit',
                              params: {
                                id: String(s.id),
                                date,
                                time,
                                field: s.where,
                                type: s.type,
                                duration: s.duration,
                                attendance: s.status,
                              },
                            });
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Shiko ${s.type}`}
                          style={({ pressed }) => [styles.actView, pressed && styles.pressed]}
                        >
                          <Text style={styles.actViewText}>Shiko</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}

                  {rows.length === 0 ? (
                    <View style={styles.tr}>
                      <Text style={styles.empty} numberOfLines={2}>
                        {error ?? (sessions ? 'Nuk ka stërvitje.' : '…')}
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

    /* ── Stërvitjet table ────────────────────────────────────── */
    card: {
      marginTop: 14,
      backgroundColor: C.blue2,
      borderWidth: 2,
      borderColor: C.rowLine,
      borderRadius: 7,
      overflow: 'hidden',
    },

    tblInner: {
      paddingHorizontal: 10,
      paddingBottom: 10,
    },

    /* Stretches the rows to the card's width, so the rules run the full width
       instead of stopping where the last column ends. */
    tblFill: {
      flexGrow: 1,
    },

    thRow: {
      paddingTop: 10,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 2,
      minHeight: 44,
    },

    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
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

    tdType: {
      fontFamily: Fonts.bodySemiBold,
    },

    /* The load error / empty-list line, spanning the row. */
    empty: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 15,
      color: C.gray,
    },

    /* Transparent, so the row reads through it. */
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    actView: {
      height: 24,
      paddingHorizontal: 10,
      alignItems: 'center',
      justifyContent: 'center',
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
