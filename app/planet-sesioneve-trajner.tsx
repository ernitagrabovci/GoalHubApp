import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import { listLibrary } from '@/lib/api/library';
import type { ApiTrainingMaterial } from '@/lib/api/types';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * Planet e sesioneve — opened from "Planet e sesioneve" on the trainer's
 * Akademia page. Ready-made and personal training plans, listed flat: a title
 * and its facts, each row ending in a way into the plan itself.
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

  green20: 'rgba(21,148,71,0.20)',
};

/* The library's `level`, under the label the Niveli column shows. */
const LEVEL_LABEL: Record<string, string> = {
  beginner: 'Fillestar',
  intermediate: 'Mesëm',
  advanced: 'Avancuar',
};

/* The library's `file_type`, under the label the Lloji column shows. */
const TYPE_LABEL: Record<string, string> = { mp4: 'Video', gif: 'Video', pdf: 'PDF' };

const levelLabel = (value: string | null) => (value ? LEVEL_LABEL[value] ?? value : '—');

const typeLabel = (value: string | null) => (value ? TYPE_LABEL[value] ?? value.toUpperCase() : '—');

/** A short run of page numbers ending at `last`, capped for width. */
function pageWindow(current: number, last: number, span = 4): number[] {
  const start = Math.max(1, Math.min(current, last - span + 1));
  const end = Math.min(last, start + span - 1);
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);
}

type ColKey = 'name' | 'level' | 'category' | 'coach' | 'type';

const COLS: { key: ColKey; label: string; width: number }[] = [
  { key: 'name', label: 'Titulli', width: 150 },
  { key: 'level', label: 'Niveli', width: 78 },
  { key: 'category', label: 'Kategoria', width: 96 },
  { key: 'coach', label: 'Trajneri', width: 110 },
  { key: 'type', label: 'Lloji', width: 78 },
];

/* The single row button, plus the gap before it. */
const ACTION_W = 56;

export default function SessionPlansScreen() {
  const router = useRouter();
  const { token, signOut } = useSession();

  const [plans, setPlans] = useState<ApiTrainingMaterial[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    listLibrary(token, { page }, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setPlans(res.data);
        setLastPage(res.meta.last_page);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) {
          signOut();
          router.replace('/login');
        }
      });

    return () => controller.abort();
  }, [token, router, signOut, page]);

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
                  Planet e sesioneve
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Plane stërvitore të gatshme dhe personale
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
            {/* ── Shto material ─────────────────────────────────── */}
            <Pressable
              onPress={() => router.push('/ngarko-video-trajner' as never)}
              accessibilityRole="button"
              accessibilityLabel="Shto material"
              style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
            >
              <Text style={styles.addText} numberOfLines={1}>
                + Shto material
              </Text>
            </Pressable>

            {/* ── Planet ────────────────────────────────────────── */}
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

                  {plans.map((p) => (
                    <View key={p.id} style={[styles.tr, styles.trBorder]}>
                      <Text
                        style={[styles.td, styles.tdName, { width: 150 }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                      >
                        {p.title}
                      </Text>
                      <Text style={[styles.td, { width: 78 }]} numberOfLines={1}>
                        {levelLabel(p.level)}
                      </Text>
                      <Text style={[styles.td, { width: 96 }]} numberOfLines={1}>
                        {p.category ?? '—'}
                      </Text>
                      <Text style={[styles.td, { width: 110 }]} numberOfLines={1}>
                        {p.trainer?.name ?? '—'}
                      </Text>
                      <Text style={[styles.td, { width: 78 }]} numberOfLines={1}>
                        {typeLabel(p.file_type)}
                      </Text>

                      {/* Transparent, riding on the row itself. */}
                      <View style={[styles.actions, { width: ACTION_W }]}>
                        <Pressable
                          onPress={() =>
                            router.push({
                              pathname: '/detajet-video-trajner',
                              params: {
                                id: String(p.id),
                                title: p.title,
                                level: p.level ?? '',
                                category: p.category ?? '',
                                type: p.file_type ?? '',
                                trainer: p.trainer?.name ?? '',
                                shared: p.is_shared ? '1' : '0',
                                description: p.description ?? '',
                                date: p.created_at ?? '',
                              },
                            })
                          }
                          accessibilityRole="button"
                          accessibilityLabel={`Shiko ${p.title}`}
                          style={({ pressed }) => [styles.actView, pressed && styles.pressed]}
                        >
                          <Text style={styles.actViewText}>Shiko</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
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

    /* ── Shto material ───────────────────────────────────────── */
    /* Hugs its own label, pinned to the left rather than spanning the page. */
    addBtn: {
      alignSelf: 'flex-start',
      minHeight: 34,
      marginTop: 12,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      backgroundColor: C.green20,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    addText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12,
      color: C.text,
    },

    /* ── Planet table ────────────────────────────────────────── */
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

    tdName: {
      fontFamily: Fonts.bodySemiBold,
    },

    /* Transparent, so the row reads through it. */
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    actView: {
      height: 24,
      paddingHorizontal: 9,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    actViewText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: C.frame,
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
