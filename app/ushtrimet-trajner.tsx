import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { MONTHS } from '@/components/trainings/training-form';
import { Fonts } from '@/constants/theme';
import { deleteDrill, listDrills } from '@/lib/api/drills';
import { ApiError } from '@/lib/api/errors';
import type { ApiDrill } from '@/lib/api/types';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';
import { useAppColors, usePaletteStyles, type AppColorsOf } from '@/lib/app-theme';

/**
 * Ushtrime — opened from "Ushtrime" on the trainer's Akademia page. The
 * drills, two to a row: each card reads top to bottom — title, what it is,
 * how long and what it works on, how many reps and when it was added — then
 * the two ways into it.
 */

const C_LIGHT = {
  page: '#F7F9F8',
  line: 'rgba(0,0,0,0.025)',

  text: '#17251E',
  gray: '#52645A',
  hint: '#6E6E6E',

  frame: '#DCE5DF',
  headLine: 'rgba(30,40,35,0.10)',

  /* The title strip sits pale; the body below it takes the deeper wash. */
  blue1: '#E3EEFB',
  blue2: '#F7F9F8',
  blue: '#2F80ED',

  green: '#2E7D5B',
  green20: 'rgba(21,148,71,0.20)',
  red: '#B91C1C',
};

/** `2026-08-12T…` → `12 Aug 2026`. */
function drillDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** A short run of page numbers ending at `last`, capped for width. */
function pageWindow(current: number, last: number, span = 4): number[] {
  const start = Math.max(1, Math.min(current, last - span + 1));
  const end = Math.min(last, start + span - 1);
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);
}

export default function TrainerDrillsScreen() {
  const C = useAppColors(C_LIGHT);
  const styles = usePaletteStyles(createStyles, C);
  const router = useRouter();
  const { token, signOut } = useSession();

  const [drills, setDrills] = useState<ApiDrill[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(
    (signal?: AbortSignal) =>
      listDrills(token ?? '', { page }, signal).then((res) => {
        if (signal?.aborted) return;
        setDrills(res.data);
        setLastPage(res.meta.last_page);
      }),
    [token, page],
  );

  /* Refresh on focus so a drill saved on the board shows up on the way back. */
  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      const controller = new AbortController();

      load(controller.signal).catch((e) => {
        if (controller.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) {
          signOut();
          router.replace('/login');
        }
      });

      return () => controller.abort();
    }, [token, router, signOut, load]),
  );

  const current = Math.min(page, Math.max(1, lastPage));

  const open = (d: ApiDrill) => {
    if (busyId !== null) return;
    router.push({ pathname: '/taktik-bord-trajner', params: { id: String(d.id) } });
  };

  const confirmDelete = (d: ApiDrill) => {
    if (!token || busyId !== null) return;
    Alert.alert('Fshij ushtrimin', `A jeni i sigurt që dëshironi ta fshini "${d.title}"?`, [
      { text: 'Anulo', style: 'cancel' },
      {
        text: 'Fshi',
        style: 'destructive',
        onPress: () => {
          setBusyId(d.id);
          deleteDrill(token, d.id)
            .then(() => load())
            .catch((e) => {
              if (e instanceof ApiError && e.status === 401) {
                signOut();
                router.replace('/login');
                return;
              }
              Alert.alert(
                'Veprimi dështoi',
                e instanceof ApiError && e.status !== 0 && e.message
                  ? e.message
                  : 'Nuk mund të lidhemi me serverin. Kontrollo lidhjen.',
              );
            })
            .finally(() => setBusyId(null));
        },
      },
    ]);
  };

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
                <MaterialCommunityIcons name="chevron-left" size={I(24)} color={C.textText} />
              </Pressable>
              <View style={styles.headerText}>
                <Text style={styles.title} numberOfLines={1}>
                  Ushtrime
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Krijo dhe menaxho ushtrime stërvitore
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
            {/* ── Stërvitje e re ─────────────────────────────────── */}
            <Pressable
              onPress={() => router.push('/taktik-bord-trajner')}
              accessibilityRole="button"
              accessibilityLabel="Stërvitje e re"
              style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
            >
              <Text style={styles.addText} numberOfLines={1}>
                + Stërvitje e re
              </Text>
            </Pressable>

            {/* ── Ushtrimet ─────────────────────────────────────── */}
            <View style={styles.grid}>
              {drills.map((d) => (
                <View key={d.id} style={styles.card}>
                  <View style={styles.cardHead}>
                    <Text
                      style={styles.cardTitle}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                    >
                      {d.title}
                    </Text>
                  </View>
                  <View style={styles.headLine} />

                  <View style={styles.cardBody}>
                    <Text style={styles.summary} numberOfLines={1}>
                      {d.description || 'Ushtrim stërvitor për ekip'}
                    </Text>

                    {/* Left of every pair reads black; the right reads quiet. */}
                    <View style={styles.metaRow}>
                      <View style={styles.metaLeft}>
                        <MaterialCommunityIcons
                          name="clock-outline"
                          size={I(12)}
                          color={C.textText}
                        />
                        <Text style={styles.metaLeftText} numberOfLines={1}>
                          {d.duration_minutes != null ? `${d.duration_minutes} min` : '—'}
                        </Text>
                      </View>
                      <Text style={styles.metaRight} numberOfLines={1}>
                        {d.category ?? '—'}
                      </Text>
                    </View>

                    <View style={[styles.metaRow, styles.metaRowGap]}>
                      <View style={styles.metaLeft}>
                        <MaterialCommunityIcons name="reload" size={I(12)} color={C.textText} />
                        <Text style={styles.metaLeftText} numberOfLines={1}>
                          {d.repetitions != null ? `x${d.repetitions}` : '—'}
                        </Text>
                      </View>
                      <Text style={styles.metaRight} numberOfLines={1}>
                        {drillDate(d.created_at)}
                      </Text>
                    </View>

                    {/* Both buttons ride the card's right edge. */}
                    <View style={styles.actions}>
                      <Pressable
                        onPress={() => open(d)}
                        disabled={busyId !== null}
                        accessibilityRole="button"
                        accessibilityLabel={`Hap ${d.title}`}
                        hitSlop={{ top: 7, bottom: 7, left: 4, right: 4 }}
                        style={({ pressed }) => [
                          styles.actHap,
                          busyId !== null && styles.actOff,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.actHapText}>Hap</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => confirmDelete(d)}
                        disabled={busyId !== null}
                        accessibilityRole="button"
                        accessibilityLabel={`Fshi ${d.title}`}
                        hitSlop={{ top: 7, bottom: 7, left: 4, right: 4 }}
                        style={({ pressed }) => [
                          styles.actDel,
                          busyId !== null && styles.actOff,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.actDelText}>Fshi</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
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
                  <MaterialCommunityIcons name="chevron-left" size={I(22)} color={C.textText} />
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
                  <MaterialCommunityIcons name="chevron-right" size={I(22)} color={C.textText} />
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

const createStyles = (C: AppColorsOf<typeof C_LIGHT>) => StyleSheet.create(
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
      color: C.textText,
    },

    subtitle: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 16,
      color: C.grayText,
      marginTop: 1,
    },

    scroll: {
      paddingBottom: 24,
    },

    /* ── Stërvitje e re ──────────────────────────────────────── */
    /* Hugs its own label, pinned to the left rather than spanning the page. */
    addBtn: {
      alignSelf: 'flex-start',
      minHeight: 34,
      marginTop: 12,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      backgroundColor: C.green20Fill,
      borderWidth: 1,
      borderColor: C.frameBorder,
      borderRadius: 4,
    },

    addText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12,
      color: C.textText,
    },

    /* ── Ushtrimet grid ──────────────────────────────────────── */
    /* Two to a row, wrapping as deep as the list runs. */
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 14,
      columnGap: 10,
      rowGap: 10,
    },

    /* Hairline black frame; the head's wash runs into the body's. */
    card: {
      width: '48%',
      borderWidth: 1,
      borderColor: C.frameBorder,
      borderRadius: 7,
      overflow: 'hidden',
    },

    cardHead: {
      paddingHorizontal: 10,
      paddingTop: 9,
      paddingBottom: 8,
      backgroundColor: C.blue2Fill,
    },

    cardTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 13,
      lineHeight: 17,
      color: C.textText,
    },

    headLine: {
      height: 1,
      backgroundColor: C.headLineFill,
    },

    cardBody: {
      paddingHorizontal: 10,
      paddingTop: 8,
      paddingBottom: 9,
      backgroundColor: C.blue1Fill,
    },

    summary: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 14,
      color: C.textText,
    },

    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
    },

    metaRowGap: {
      marginTop: 5,
    },

    metaLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    metaLeftText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.textText,
    },

    metaRight: {
      flexShrink: 1,
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.hintText,
    },

    /* Both buttons ride the card's right edge, clear of the meta above. */
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 6,
      marginTop: 8,
    },

    actHap: {
      height: 30,
      paddingHorizontal: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.blueBorder,
      borderRadius: 6,
    },

    actHapText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.blueText,
    },

    actDel: {
      height: 30,
      paddingHorizontal: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.redBorder,
      borderRadius: 6,
    },

    actDelText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.redText,
    },

    /* A disabled card action — one mid-request. */
    actOff: {
      opacity: 0.35,
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
      width: 44,
      height: 44,
      borderRadius: 10,
      backgroundColor: C.blueFill,
      alignItems: 'center',
      justifyContent: 'center',
    },

    pageSqActive: {
      width: 44,
      height: 44,
      borderRadius: 10,
      backgroundColor: '#4E90D8',
      alignItems: 'center',
      justifyContent: 'center',
    },

    pageSqText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 14,
      color: '#FFFFFF',
    },

    pressed: {
      opacity: 0.5,
    },

  }),
);
