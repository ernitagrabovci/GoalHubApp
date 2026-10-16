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
 * Video Strategjia — opened from the card of the same name on the trainer's
 * Akademia page. The uploaded clips, laid out as a thumbnail grid inside the
 * green-ruled tray the other menus use.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',

  /* The thin, see-through tray and its tab. */
  tray: '#4DBB7B',
  white: '#F5F5F5',

  /* The button rims, and the play glyph at the heart of each card. */
  frame: '#000000',
  green20: 'rgba(21,148,71,0.20)',
};

/**
 * Each clip wears its level's colour: the tone at 20% laid flat on the page
 * (so the card is opaque, not a wash showing the texture through), and the
 * same tone at full strength for its rim and for the level word itself.
 */
const TONES = {
  green: { bg: '#CCE6D6', solid: '#159447' },
  blue: { bg: '#E3EEFB', solid: '#86BCFD' },
  purple: { bg: '#EBE8FA', solid: '#B09AF9' },
};

type Tone = keyof typeof TONES;

/* The library's `level`, mapped onto its label and the card's colour. */
const LEVELS: Record<string, { label: string; tone: Tone }> = {
  beginner: { label: 'Fillestar', tone: 'green' },
  intermediate: { label: 'Mesëm', tone: 'blue' },
  advanced: { label: 'Avancuar', tone: 'purple' },
};

const levelInfo = (level: string | null) =>
  (level ? LEVELS[level] : undefined) ?? { label: level ?? '—', tone: 'blue' as Tone };

/** A short run of page numbers ending at `last`, capped for width. */
function pageWindow(current: number, last: number, span = 4): number[] {
  const start = Math.max(1, Math.min(current, last - span + 1));
  const end = Math.min(last, start + span - 1);
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);
}

export default function StrategicVideoScreen() {
  const router = useRouter();
  const { token, signOut } = useSession();

  const [videos, setVideos] = useState<ApiTrainingMaterial[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    listLibrary(token, { page }, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setVideos(res.data);
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
            : 'Nuk mund të ngarkohen videot.',
        );
      });

    return () => controller.abort();
  }, [token, router, signOut, page]);

  const rows = videos ?? [];
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
                  Video Strategjia
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Analiza video dhe skenare taktike
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
            {/* ── Ngarko video ──────────────────────────────────── */}
            <Pressable
              onPress={() => router.push('/ngarko-video-trajner' as never)}
              accessibilityRole="button"
              accessibilityLabel="Ngarko video"
              style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
            >
              <Text style={styles.addText} numberOfLines={1}>
                + Ngarko video
              </Text>
            </Pressable>

            <View style={styles.trayWrap}>
              {/* A thin see-through tray, ruled in green. */}
              <View style={styles.tray}>
                {rows.map((v) => {
                  const { label, tone } = levelInfo(v.level);
                  const skin = TONES[tone];
                  return (
                    <Pressable
                      key={v.id}
                      onPress={() =>
                        router.push({
                          pathname: '/detajet-video-trajner',
                          params: {
                            id: String(v.id),
                            title: v.title,
                            level: v.level ?? '',
                            category: v.category ?? '',
                            type: v.file_type ?? '',
                            trainer: v.trainer?.name ?? '',
                            shared: v.is_shared ? '1' : '0',
                            description: v.description ?? '',
                            date: v.created_at ?? '',
                          },
                        })
                      }
                      accessibilityRole="button"
                      accessibilityLabel={v.title}
                      style={({ pressed }) => [
                        styles.card,
                        { backgroundColor: skin.bg, borderColor: skin.solid },
                        pressed && styles.pressed,
                      ]}
                    >
                      {/* The play mark sits centred in the space above the text. */}
                      <View style={styles.playArea}>
                        <MaterialCommunityIcons name="play" size={I(36)} color={C.frame} />
                      </View>

                      <Text
                        style={styles.cardTitle}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.65}
                      >
                        {v.title}
                      </Text>

                      <View style={styles.meta}>
                        <Text style={[styles.metaLevel, { color: skin.solid }]} numberOfLines={1}>
                          {label}
                        </Text>
                        <Text style={styles.metaDot}> • </Text>
                        <Text style={styles.metaCategory} numberOfLines={1}>
                          {v.category ?? '—'}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}

                {rows.length === 0 ? (
                  <Text style={styles.empty} numberOfLines={2}>
                    {error ?? (videos ? 'Nuk ka video.' : '…')}
                  </Text>
                ) : null}
              </View>

              {/* The tray's tab label, riding on its top rim. */}
              <View style={styles.pillWrap} pointerEvents="none">
                <View style={styles.pill}>
                  <Text style={styles.pillText}>Videot e ngarkuara</Text>
                </View>
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

    /* ── Ngarko video ────────────────────────────────────────── */
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

    /* ── Tray ────────────────────────────────────────────────── */
    /* Room above the tray for the tab to sit on its rim. */
    trayWrap: {
      position: 'relative',
      marginTop: 54,
    },

    tray: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      borderWidth: 1,
      borderColor: C.tray,
      backgroundColor: 'transparent',
      borderRadius: 8,
      padding: 8,
      columnGap: 10,
      rowGap: 10,
    },

    /* ── Video cards ─────────────────────────────────────────── */
    /* Cut to the same block as the dashboard's menu cards. */
    card: {
      width: '48%',
      height: 100,
      paddingHorizontal: 8,
      paddingTop: 6,
      paddingBottom: 7,
      borderRadius: 9,
      borderWidth: 1,
    },

    /* Takes the slack, so the play mark stays centred above the text block. */
    playArea: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },

    cardTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.text,
    },

    meta: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },

    metaLevel: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 9.5,
      lineHeight: 12,
    },

    metaDot: {
      fontFamily: Fonts.body,
      fontSize: 9.5,
      lineHeight: 12,
      color: C.gray,
    },

    metaCategory: {
      fontFamily: Fonts.body,
      fontSize: 9.5,
      lineHeight: 12,
      color: C.gray,
    },

    /* The load error / empty-list line, spanning the tray. */
    empty: {
      flex: 1,
      paddingVertical: 12,
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 15,
      color: C.gray,
      textAlign: 'center',
    },

    /* ── Tray tab ────────────────────────────────────────────── */
    pillWrap: {
      position: 'absolute',
      top: -28,
      left: 0,
      right: 0,
      alignItems: 'center',
      zIndex: 10,
    },

    pill: {
      height: 28,
      paddingHorizontal: 14,
      backgroundColor: C.white,
      borderWidth: 1,
      borderColor: C.tray,
      borderTopLeftRadius: 7,
      borderTopRightRadius: 7,
      alignItems: 'center',
      justifyContent: 'center',
    },

    pillText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13,
      lineHeight: 16,
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
      backgroundColor: '#86BCFD',
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
