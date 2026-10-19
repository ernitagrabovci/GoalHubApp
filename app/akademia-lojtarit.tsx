import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import { myLibrary } from '@/lib/api/library';
import type { ApiTrainingMaterial } from '@/lib/api/types';
import { levelLabel } from '@/lib/library';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * Akademia — the player's own view, opened from the "Akademia" card on the
 * player home.
 *
 * A player only reads what the trainer has shared, so the page is whatever
 * arrives there: nothing yet, which the card says outright.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',

  /* The card's pale wash and its blue rim. */
  blue2: '#F6FBFF',
  border: 'rgba(100,140,190,0.30)',
};

const MONTHS = [
  'Jan',
  'Shk',
  'Mar',
  'Pri',
  'Maj',
  'Qer',
  'Kor',
  'Gus',
  'Sht',
  'Tet',
  'Nën',
  'Dhj',
];

const pad2 = (n: number) => String(n).padStart(2, '0');

/** A `created_at` timestamp as "12 Gus 2026"; null or unparseable renders "—". */
function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${pad2(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function PlayerAcademyScreen() {
  const router = useRouter();
  const { token, signOut } = useSession();

  const [materials, setMaterials] = useState<ApiTrainingMaterial[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    myLibrary(token, { page }, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setMaterials(res.data);
        setLastPage(res.meta.last_page);
        setError(null);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) {
          signOut();
          router.replace('/login');
          return;
        }
        setMaterials([]);
        setError(
          e instanceof ApiError && e.status === 0
            ? 'Nuk mund të lidhemi me serverin. Kontrollo lidhjen.'
            : 'Nuk mund të ngarkohen materialet.',
        );
      });

    return () => controller.abort();
  }, [token, router, signOut, page]);

  const rows = materials ?? [];
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
                  Akademia e Trajnimeve
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Materiale dhe ushtrime të ndara nga trajneri
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
            {error ? (
              <View style={styles.card}>
                <Text style={styles.emptyText}>{error}</Text>
              </View>
            ) : materials === null ? (
              <View style={styles.card}>
                <Text style={styles.emptyText}>Duke u ngarkuar…</Text>
              </View>
            ) : rows.length === 0 ? (
              /* ── Nothing shared yet ──────────────────────────── */
              <View style={styles.card}>
                <Text style={styles.emptyTitle} numberOfLines={2}>
                  Nuk ka materiale të disponueshme
                </Text>
                <Text style={styles.emptyText}>Trajneri nuk ka ndarë asnjë material ende.</Text>
              </View>
            ) : (
              rows.map((m) => <MaterialCard key={m.id} material={m} />)
            )}

            {lastPage > 1 ? (
              <View style={styles.pager}>
                <Pressable
                  onPress={() => setPage(current - 1)}
                  disabled={current <= 1}
                  accessibilityRole="button"
                  accessibilityLabel="Faqja e mëparshme"
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.pagerBtn,
                    current <= 1 && styles.pagerDisabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialCommunityIcons name="chevron-left" size={I(18)} color={C.text} />
                </Pressable>
                <Text style={styles.pagerText}>
                  {current} / {lastPage}
                </Text>
                <Pressable
                  onPress={() => setPage(current + 1)}
                  disabled={current >= lastPage}
                  accessibilityRole="button"
                  accessibilityLabel="Faqja tjetër"
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.pagerBtn,
                    current >= lastPage && styles.pagerDisabled,
                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialCommunityIcons name="chevron-right" size={I(18)} color={C.text} />
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
/* Material card                                                       */
/* ------------------------------------------------------------------ */

function MaterialCard({ material }: { material: ApiTrainingMaterial }) {
  return (
    <View style={styles.material}>
      <Text style={styles.materialTitle} numberOfLines={2}>
        {material.title}
      </Text>

      <View style={styles.badgeRow}>
        {material.category ? <Text style={styles.badge}>{material.category}</Text> : null}
        <Text style={styles.badge}>{levelLabel(material.level)}</Text>
      </View>

      {material.description ? (
        <Text style={styles.materialDesc} numberOfLines={3}>
          {material.description}
        </Text>
      ) : null}

      <View style={styles.materialFoot}>
        <Text style={styles.materialFootText} numberOfLines={1}>
          {material.trainer?.name ?? '—'}
        </Text>
        <Text style={styles.materialFootText}>{formatDate(material.created_at)}</Text>
      </View>
    </View>
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

    /* ── Empty state ─────────────────────────────────────────── */
    card: {
      marginTop: 14,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingVertical: 34,
      backgroundColor: C.blue2,
      borderWidth: 2,
      borderColor: C.border,
      borderRadius: 7,
    },

    emptyTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 13.5,
      lineHeight: 18,
      color: C.text,
      textAlign: 'center',
    },

    emptyText: {
      fontFamily: Fonts.body,
      fontSize: 11.5,
      lineHeight: 16,
      color: C.gray,
      textAlign: 'center',
      marginTop: 5,
    },

    /* ── Material cards ──────────────────────────────────────── */
    material: {
      marginTop: 10,
      backgroundColor: C.blue2,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 7,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },

    materialTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 14,
      lineHeight: 18,
      color: C.text,
    },

    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 6,
    },

    badge: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10,
      lineHeight: 13,
      color: '#0F3D2E',
      backgroundColor: '#DCEEE8',
      borderRadius: 3,
      paddingHorizontal: 7,
      paddingVertical: 2,
      overflow: 'hidden',
    },

    materialDesc: {
      fontFamily: Fonts.body,
      fontSize: 11.5,
      lineHeight: 16,
      color: C.gray,
      marginTop: 8,
    },

    materialFoot: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: C.border,
    },

    materialFootText: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 14,
      color: C.gray,
      flexShrink: 1,
    },

    /* ── Pager ───────────────────────────────────────────────── */
    pager: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      marginTop: 14,
    },

    pagerBtn: {
      width: 30,
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 4,
      backgroundColor: C.blue2,
    },

    pagerDisabled: {
      opacity: 0.35,
    },

    pagerText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      color: C.gray,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
