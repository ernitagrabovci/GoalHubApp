import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import { listChildFees } from '@/lib/api/children';
import type { ApiFee } from '@/lib/api/types';
import { STATUS_TONE, dmy, monthLabel, statusLabel, usd } from '@/lib/finance';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * Kuotat — the child's club fees, opened from the "Kuotat" card on the
 * child's page.
 *
 * Read-only for a parent: the season's invoices, when each is due, whether it
 * is settled and on what day it was paid. Five columns are wider than the
 * screen, so the table scrolls sideways.
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

  /* The pager's squares. */
  blue: '#86BCFD',
};

type Quota = {
  id: number;
  period: string;
  amount: string;
  due: string;
  status: string;
  /* A dash where nothing has been paid yet. */
  paid: string;
};

/** One API fee, laid onto the invoice row. */
function toQuota(f: ApiFee): Quota {
  return {
    id: f.id,
    period: monthLabel(f.month),
    amount: usd(f.final_amount),
    due: dmy(f.due_date),
    status: statusLabel(f.status),
    paid: dmy(f.paid_at),
  };
}

/** A short run of page numbers ending at `last`, capped for width. */
function pageWindow(current: number, last: number, span = 4): number[] {
  const start = Math.max(1, Math.min(current, last - span + 1));
  const end = Math.min(last, start + span - 1);
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);
}

const COLS: { key: keyof Quota; label: string; width: number; strong?: boolean }[] = [
  { key: 'period', label: 'Periudha', width: 100, strong: true },
  { key: 'amount', label: 'Shuma', width: 58 },
  { key: 'due', label: 'Afati', width: 76 },
  { key: 'status', label: 'Statusi', width: 70, strong: true },
  { key: 'paid', label: 'Data e pagesës', width: 96 },
];

export default function ChildFeesScreen() {
  const router = useRouter();
  const { token, signOut } = useSession();

  const params = useLocalSearchParams<{ id?: string; name?: string }>();
  const childId = params.id ? Number(params.id) : null;
  const name = params.name ?? 'Fëmija';

  const [fees, setFees] = useState<Quota[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    if (!token || !childId) return;
    const controller = new AbortController();

    listChildFees(token, childId, { page }, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setFees(res.data.map(toQuota));
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
            : 'Nuk mund të ngarkohen kuotat.',
        );
      });

    return () => controller.abort();
  }, [token, childId, router, signOut, page]);

  const rows = fees ?? [];
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
                  {`Kuotat e ${name}`}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Pagesa kryhet në zyrën e klubit
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
            {/* ── Kuotat e sezonit ──────────────────────────────── */}
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
                  </View>

                  {rows.map((q) => (
                    <View key={q.id} style={[styles.tr, styles.trBorder]}>
                      {COLS.map((c) => (
                        <Text
                          key={c.key}
                          style={[
                            styles.td,
                            c.strong && styles.tdStrong,
                            c.key === 'status' && { color: STATUS_TONE[q.status] ?? C.text },
                            { width: c.width },
                          ]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.7}
                        >
                          {q[c.key]}
                        </Text>
                      ))}
                    </View>
                  ))}

                  {rows.length === 0 ? (
                    <View style={styles.tr}>
                      <Text style={styles.empty} numberOfLines={2}>
                        {error ?? (fees ? 'Nuk ka kuota.' : '…')}
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

    /* ── Table ───────────────────────────────────────────────── */
    card: {
      marginTop: 14,
      backgroundColor: C.blue2,
      borderWidth: 2,
      borderColor: C.border,
      borderRadius: 7,
      overflow: 'hidden',
    },

    tblInner: {
      paddingHorizontal: 8,
      paddingBottom: 6,
    },

    /* Stretches the rows to the card's width, so the rules run the full width
       instead of stopping where the last column ends. */
    tblFill: {
      flexGrow: 1,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
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
