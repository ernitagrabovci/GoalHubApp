import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import { deleteLibrary, listLibrary } from '@/lib/api/library';
import type { ApiTrainingMaterial } from '@/lib/api/types';
import { LEVEL_TO_API, levelLabel, typeLabel } from '@/lib/library';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * Libraria e trajnimeve — opened from "Libraria" on the trainer's Akademia
 * page. The shelf of coaching material: filter by level, narrow by category,
 * search, and edit or delete a row.
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

  /* blue1 = the wash behind the live filter and the pickers; blue2 = the card. */
  blue1: '#E3EEFB',
  blue2: '#F6FBFF',
  blue: '#2F80ED',
  blueBtn: '#86BCFD',

  green: '#159447',
  green20: 'rgba(21,148,71,0.20)',
  red: '#E03131',
};

/* The level chips under the add button. "Të gjitha" is the resting state. */
const LEVELS = ['Të gjitha', 'Fillestar', 'Mesëm', 'Avancuar'];

/* The dropdown's resting option, ahead of the API's distinct categories. */
const ALL_CATEGORIES = 'Të gjitha kategoritë';

type ColKey = 'name' | 'category' | 'level' | 'type' | 'coach' | 'date';

const COLS: { key: ColKey; label: string; width: number }[] = [
  { key: 'name', label: 'Materiali', width: 150 },
  { key: 'category', label: 'Kategoria', width: 96 },
  { key: 'level', label: 'Niveli', width: 78 },
  { key: 'type', label: 'Lloji', width: 78 },
  { key: 'coach', label: 'Trajneri', width: 110 },
  { key: 'date', label: 'Data', width: 86 },
];

/* The two row buttons plus the gap between them. */
const ACTION_W = 110;

const MONTHS = ['Jan', 'Shk', 'Mar', 'Pri', 'Maj', 'Qer', 'Kor', 'Gus', 'Sht', 'Tet', 'Nën', 'Dhj'];

const pad2 = (n: number) => String(n).padStart(2, '0');

/** A `created_at` timestamp as "12 Gus 2026"; null or unparseable renders "—". */
function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return `${pad2(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** A short run of page numbers ending at `last`, capped for width. */
function pageWindow(current: number, last: number, span = 4): number[] {
  const start = Math.max(1, Math.min(current, last - span + 1));
  const end = Math.min(last, start + span - 1);
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, i) => start + i);
}

export default function TrainerLibraryScreen() {
  const router = useRouter();
  const { token, signOut } = useSession();

  const [level, setLevel] = useState(LEVELS[0]);
  const [category, setCategory] = useState(ALL_CATEGORIES);
  const [catOpen, setCatOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [materials, setMaterials] = useState<ApiTrainingMaterial[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [lastPage, setLastPage] = useState(1);

  /* Debounced, so typing narrows the shelf without a request per keystroke. */
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(
    (signal?: AbortSignal) =>
      listLibrary(
        token ?? '',
        {
          page,
          level: LEVEL_TO_API[level],
          category: category === ALL_CATEGORIES ? undefined : category,
          search: search || undefined,
        },
        signal,
      ).then((res) => {
        if (signal?.aborted) return;
        setMaterials(res.data);
        setCategories(res.categories);
        setLastPage(res.meta.last_page);
      }),
    [token, page, level, category, search],
  );

  useEffect(() => {
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
  }, [token, router, signOut, load]);

  const current = Math.min(page, Math.max(1, lastPage));
  const categoryOptions = [ALL_CATEGORIES, ...categories];

  /* Deleting a material asks first, then reloads the current page. */
  const confirmDelete = (m: ApiTrainingMaterial) => {
    if (!token) return;
    Alert.alert('Fshij materialin', `A jeni i sigurt që dëshironi ta fshini "${m.title}"?`, [
      { text: 'Anulo', style: 'cancel' },
      {
        text: 'Fshij',
        style: 'destructive',
        onPress: () =>
          deleteLibrary(token, m.id)
            .then(() => load().catch(() => undefined))
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
            }),
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
                <MaterialCommunityIcons name="chevron-left" size={I(24)} color={C.text} />
              </Pressable>
              <View style={styles.headerText}>
                <Text style={styles.title} numberOfLines={1}>
                  Libraria e trajnimeve
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Ushtrime, video dhe materiale
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
              onPress={() => router.push('/shto-material-trajner' as never)}
              accessibilityRole="button"
              accessibilityLabel="Shto material"
              style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
            >
              <Text style={styles.addText} numberOfLines={1}>
                + Shto material
              </Text>
            </Pressable>

            {/* ── Filter ────────────────────────────────────────── */}
            {/* The icon heads the block; the chips below it share one row. */}
            <View style={styles.filterIconRow}>
              <MaterialCommunityIcons name="filter-variant" size={I(19)} color={C.text} />
            </View>

            <View style={styles.chipRow}>
              {LEVELS.map((l) => {
                const active = l === level;
                return (
                  <Pressable
                    key={l}
                    onPress={() => {
                      setLevel(l);
                      setPage(1);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Filtro: ${l}`}
                    style={({ pressed }) => [
                      styles.chip,
                      active && styles.chipActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.chipText} numberOfLines={1}>
                      {l}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* ── Category + search ─────────────────────────────── */}
            {/* Lifted while the list is unrolled, so the options fall over the
                table below instead of under it. */}
            <View style={[styles.pickRow, catOpen && styles.pickRowOpen]}>
              <View style={styles.catWrap}>
                <Pressable
                  onPress={() => setCatOpen(!catOpen)}
                  accessibilityRole="button"
                  accessibilityLabel="Kategoria"
                  style={({ pressed }) => [styles.catBox, pressed && styles.pressed]}
                >
                  <Text style={styles.catText} numberOfLines={1}>
                    {category}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={I(14)} color={C.text} />
                </Pressable>

                {catOpen ? (
                  <View style={styles.catOpts}>
                    {categoryOptions.map((c) => {
                      const active = c === category;
                      return (
                        <Pressable
                          key={c}
                          onPress={() => {
                            setCategory(c);
                            setCatOpen(false);
                            setPage(1);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={c}
                          style={[styles.catOpt, active && styles.catOptActive]}
                        >
                          <Text
                            style={[styles.catOptText, active && styles.catOptTextActive]}
                            numberOfLines={1}
                          >
                            {c}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}
              </View>

              <View style={styles.searchBar}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Kërko material..."
                  placeholderTextColor={C.gray}
                  accessibilityLabel="Kërko material"
                  value={searchInput}
                  onChangeText={setSearchInput}
                />
                <MaterialCommunityIcons name="magnify" size={I(17)} color={C.text} />
              </View>
            </View>

            {/* ── Materialet ────────────────────────────────────── */}
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

                  {materials.map((m) => (
                    <View key={m.id} style={[styles.tr, styles.trBorder]}>
                      <Text
                        style={[styles.td, styles.tdName, { width: 150 }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                      >
                        {m.title}
                      </Text>
                      <Text style={[styles.td, { width: 96 }]} numberOfLines={1}>
                        {m.category ?? '—'}
                      </Text>
                      <Text style={[styles.td, { width: 78 }]} numberOfLines={1}>
                        {levelLabel(m.level)}
                      </Text>
                      <Text style={[styles.td, { width: 78 }]} numberOfLines={1}>
                        {typeLabel(m.file_type)}
                      </Text>
                      <Text style={[styles.td, { width: 110 }]} numberOfLines={1}>
                        {m.trainer?.name ?? '—'}
                      </Text>
                      <Text style={[styles.td, { width: 86 }]} numberOfLines={1}>
                        {formatDate(m.created_at)}
                      </Text>

                      {/* Transparent, riding on the row itself. Only Edito is
                          rimmed; Fshij carries its warning in the label alone. */}
                      <View style={[styles.actions, { width: ACTION_W }]}>
                        <Pressable
                          onPress={() =>
                            router.push({
                              pathname: '/edito-material-trajner',
                              params: {
                                id: String(m.id),
                                name: m.title,
                                level: levelLabel(m.level),
                                category: m.category ?? '',
                                description: m.description ?? '',
                                sharedTeamId:
                                  m.shared_team_id != null ? String(m.shared_team_id) : '',
                              },
                            } as never)
                          }
                          accessibilityRole="button"
                          accessibilityLabel={`Edito ${m.title}`}
                          style={({ pressed }) => [styles.actEdit, pressed && styles.pressed]}
                        >
                          <Text style={styles.actEditText}>Edito</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => confirmDelete(m)}
                          accessibilityRole="button"
                          accessibilityLabel={`Fshij ${m.title}`}
                          style={({ pressed }) => [styles.actDel, pressed && styles.pressed]}
                        >
                          <Text style={styles.actDelText}>Fshij</Text>
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

    /* ── Filter ──────────────────────────────────────────────── */
    filterIconRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 12,
    },

    /* Four chips sharing the row edge to edge. */
    chipRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 5,
      marginTop: 8,
    },

    chip: {
      flex: 1,
      height: 34,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#F5F5F5',
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    /* The live filter takes the blue wash; the rest stay white. */
    chipActive: {
      backgroundColor: C.blue1,
    },

    chipText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11,
      color: C.text,
    },

    /* ── Category + search ───────────────────────────────────── */
    pickRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginTop: 12,
    },

    pickRowOpen: {
      zIndex: 30,
      elevation: 30,
    },

    catWrap: {
      width: 152,
    },

    catBox: {
      height: 34,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
      paddingHorizontal: 9,
      backgroundColor: C.blue1,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    catText: {
      flex: 1,
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11,
      lineHeight: 14,
      color: C.text,
    },

    /* Floats over the table so opening it moves nothing. */
    catOpts: {
      position: 'absolute',
      top: 37,
      left: 0,
      right: 0,
      zIndex: 40,
      elevation: 12,
      backgroundColor: '#F5F5F5',
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
      overflow: 'hidden',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
    },

    catOpt: {
      height: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },

    catOptActive: {
      backgroundColor: C.blue1,
    },

    catOptText: {
      fontFamily: Fonts.body,
      fontSize: 11,
      color: C.text,
    },

    catOptTextActive: {
      fontFamily: Fonts.bodyBold,
      color: C.blue,
    },

    /* The field wears the magnifier on its right edge. */
    searchBar: {
      flex: 1,
      height: 34,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 9,
      backgroundColor: '#F5F5F5',
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    searchInput: {
      flex: 1,
      paddingHorizontal: 0,
      paddingVertical: 0,
      fontFamily: Fonts.body,
      fontSize: 11,
      color: C.text,
    },

    /* ── Materialet table ────────────────────────────────────── */
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

    /* Transparent, so the row reads through them. */
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    actEdit: {
      height: 24,
      paddingHorizontal: 9,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.blue,
      borderRadius: 4,
    },

    actEditText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: C.blue,
    },

    actDel: {
      height: 24,
      paddingHorizontal: 9,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.red,
      borderRadius: 4,
    },

    actDelText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: C.red,
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
