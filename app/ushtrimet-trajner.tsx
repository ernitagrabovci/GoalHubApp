import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
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
import { MONTHS } from '@/components/trainings/training-form';
import { Fonts } from '@/constants/theme';
import { createDrill, deleteDrill, getDrill, listDrills } from '@/lib/api/drills';
import { ApiError } from '@/lib/api/errors';
import type { ApiDrill, DrillInput } from '@/lib/api/types';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * Ushtrime — opened from "Ushtrime" on the trainer's Akademia page. The
 * drills, two to a row: each card reads top to bottom — title, what it is,
 * how long and what it works on, how many reps and when it was added — then
 * the two ways into it.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',

  frame: '#000000',
  headLine: 'rgba(30,40,35,0.10)',

  /* The title strip sits pale; the body below it takes the deeper wash. */
  blue1: '#E3EEFB',
  blue2: '#F6FBFF',
  blue: '#2F80ED',

  green: '#159447',
  green20: 'rgba(21,148,71,0.20)',
  red: '#E03131',
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
  const router = useRouter();
  const { token, signOut } = useSession();

  const [drills, setDrills] = useState<ApiDrill[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [busyId, setBusyId] = useState<number | null>(null);

  const [creating, setCreating] = useState(false);
  const [opened, setOpened] = useState<ApiDrill | null>(null);

  const load = useCallback(
    (signal?: AbortSignal) =>
      listDrills(token ?? '', { page }, signal).then((res) => {
        if (signal?.aborted) return;
        setDrills(res.data);
        setLastPage(res.meta.last_page);
      }),
    [token, page],
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

  /** Loads the full drill (its board schema) before showing the detail popup. */
  const open = (d: ApiDrill) => {
    if (!token || busyId !== null) return;
    setBusyId(d.id);
    getDrill(token, d.id)
      .then((res) => setOpened(res.data))
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
                <MaterialCommunityIcons name="chevron-left" size={I(24)} color={C.text} />
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
              onPress={() => setCreating(true)}
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
                          color={C.text}
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
                        <MaterialCommunityIcons name="reload" size={I(12)} color={C.text} />
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

      {/* Overlays on the SafeAreaView so the blur covers the whole screen */}
      {creating ? (
        <NewDrillModal
          token={token}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            load().catch(() => setCreating(false));
          }}
        />
      ) : null}

      {opened ? <DrillDetailModal drill={opened} onClose={() => setOpened(null)} /> : null}
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* "Stërvitje e re" popup                                              */
/* ------------------------------------------------------------------ */

function NewDrillModal({
  token,
  onClose,
  onCreated,
}: {
  token: string | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [minutes, setMinutes] = useState('');
  const [reps, setReps] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    if (!token || saving) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Shkruaj titullin e ushtrimit.');
      return;
    }

    const input: DrillInput = {
      title: trimmedTitle,
      description: description.trim() || null,
      category: category.trim() || null,
      duration_minutes: minutes.trim() ? Number(minutes.trim()) : null,
      repetitions: reps.trim() ? Number(reps.trim()) : null,
    };

    setSaving(true);
    setError(null);

    createDrill(token, input)
      .then(() => onCreated())
      .catch((e) => {
        setSaving(false);
        if (e instanceof ApiError && e.status === 422 && e.fieldErrors) {
          setError(Object.values(e.fieldErrors)[0]?.[0] ?? 'Të dhënat nuk janë të vlefshme.');
        } else if (e instanceof ApiError && e.status === 0) {
          setError('Nuk mund të lidhemi me serverin. Kontrollo lidhjen.');
        } else {
          setError('Ushtrimi nuk mund të krijohet.');
        }
      });
  };

  return (
    <View style={styles.ovWrap}>
      <BlurView style={styles.ovFill} intensity={45} tint="dark" />
      <Pressable
        style={[styles.ovFill, styles.ovDim]}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Mbylle dritaren"
      />

      <View style={styles.nsCard}>
        <View style={styles.nsHeader}>
          <Text style={styles.nsTitle}>Stërvitje e re</Text>
        </View>
        <View style={styles.nsDivider} />

        <View style={styles.nsBody}>
          <View>
            <Text style={styles.nsLabel}>Titulli:</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              autoCorrect={false}
              allowFontScaling={false}
              placeholder="Rondo 5v2"
              placeholderTextColor={C.gray}
              style={styles.nsInput}
            />
          </View>

          <View style={styles.nsRow}>
            <View style={styles.nsCol}>
              <Text style={styles.nsLabel}>Kategoria:</Text>
              <TextInput
                value={category}
                onChangeText={setCategory}
                autoCorrect={false}
                allowFontScaling={false}
                placeholder="Pasim"
                placeholderTextColor={C.gray}
                style={styles.nsInput}
              />
            </View>
            <View style={styles.nsCol}>
              <Text style={styles.nsLabel}>Kohëzgjatja (min):</Text>
              <TextInput
                value={minutes}
                onChangeText={setMinutes}
                keyboardType="number-pad"
                allowFontScaling={false}
                placeholder="15"
                placeholderTextColor={C.gray}
                style={styles.nsInput}
              />
            </View>
            <View style={styles.nsCol}>
              <Text style={styles.nsLabel}>Përsëritje:</Text>
              <TextInput
                value={reps}
                onChangeText={setReps}
                keyboardType="number-pad"
                allowFontScaling={false}
                placeholder="4"
                placeholderTextColor={C.gray}
                style={styles.nsInput}
              />
            </View>
          </View>

          <View>
            <Text style={styles.nsLabel}>Përshkrimi:</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              autoCorrect={false}
              allowFontScaling={false}
              multiline
              placeholder="Shkruaj një përshkrim të shkurtër..."
              placeholderTextColor={C.gray}
              style={[styles.nsInput, styles.nsTextarea]}
            />
          </View>

          {error ? (
            <Text style={styles.nsError} numberOfLines={3}>
              {error}
            </Text>
          ) : null}
        </View>

        <View style={styles.nsActions}>
          <Pressable
            onPress={onClose}
            disabled={saving}
            accessibilityRole="button"
            style={({ pressed }) => [styles.nsCancel, pressed && styles.pressed]}
          >
            <Text style={styles.nsBtnText}>Anulo</Text>
          </Pressable>
          <Pressable
            onPress={save}
            disabled={saving}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.nsSave,
              saving && styles.nsSaveOff,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.nsBtnText}>{saving ? 'Duke krijuar…' : 'Krijo ushtrimin'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* "Hap" popup — the drill in full                                     */
/* ------------------------------------------------------------------ */

function DrillDetailModal({ drill, onClose }: { drill: ApiDrill; onClose: () => void }) {
  return (
    <View style={styles.ovWrap}>
      <BlurView style={styles.ovFill} intensity={45} tint="dark" />
      <Pressable
        style={[styles.ovFill, styles.ovDim]}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Mbylle dritaren"
      />

      <View style={styles.dtCard}>
        <View style={styles.dtHeader}>
          <Text style={styles.dtTitle} numberOfLines={2}>
            {drill.title}
          </Text>
        </View>
        <View style={styles.dtDivider} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.dtBody}
        >
          <DetailRow label="Kategoria" value={drill.category ?? '—'} />
          <DetailRow
            label="Kohëzgjatja"
            value={drill.duration_minutes != null ? `${drill.duration_minutes} min` : '—'}
          />
          <DetailRow
            label="Përsëritje"
            value={drill.repetitions != null ? `x${drill.repetitions}` : '—'}
          />
          <DetailRow label="Shtuar" value={drillDate(drill.created_at)} />

          <Text style={styles.dtLabel}>Përshkrimi</Text>
          <Text style={styles.dtParagraph}>
            {drill.description || 'Pa përshkrim.'}
          </Text>
        </ScrollView>

        <View style={styles.nsActions}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={({ pressed }) => [styles.nsSave, pressed && styles.pressed]}
          >
            <Text style={styles.nsBtnText}>Mbyll</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dtRow}>
      <Text style={styles.dtRowLabel} numberOfLines={1}>
        {label}
      </Text>
      <Text style={styles.dtRowValue} numberOfLines={1}>
        {value}
      </Text>
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

    /* ── Stërvitje e re ──────────────────────────────────────── */
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
      borderColor: C.frame,
      borderRadius: 7,
      overflow: 'hidden',
    },

    cardHead: {
      paddingHorizontal: 10,
      paddingTop: 9,
      paddingBottom: 8,
      backgroundColor: C.blue2,
    },

    cardTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 13,
      lineHeight: 17,
      color: C.text,
    },

    headLine: {
      height: 1,
      backgroundColor: C.headLine,
    },

    cardBody: {
      paddingHorizontal: 10,
      paddingTop: 8,
      paddingBottom: 9,
      backgroundColor: C.blue1,
    },

    summary: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 14,
      color: C.text,
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
      color: C.text,
    },

    metaRight: {
      flexShrink: 1,
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.hint,
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
      height: 24,
      paddingHorizontal: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.blue,
      borderRadius: 4,
    },

    actHapText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: C.blue,
    },

    actDel: {
      height: 24,
      paddingHorizontal: 10,
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

    /* ── Overlay (full-screen blur + dim + centered popup) ───── */
    ovWrap: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 20,
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: 150,
    },

    ovFill: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },

    ovDim: {
      backgroundColor: 'rgba(0,0,0,0.42)',
    },

    /* ── Popups ──────────────────────────────────────────────── */
    nsCard: {
      width: '88%',
      maxWidth: 360,
      backgroundColor: '#F5F5F5',
      borderWidth: 1,
      borderColor: C.green,
      borderRadius: 6,
      overflow: 'hidden',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 8,
    },

    nsHeader: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
    },

    nsTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 17,
      lineHeight: 21,
      color: C.text,
    },

    nsDivider: {
      height: 1,
      backgroundColor: C.green20,
    },

    nsBody: {
      paddingHorizontal: 14,
      paddingTop: 14,
      paddingBottom: 2,
      gap: 12,
    },

    nsRow: {
      flexDirection: 'row',
      gap: 10,
    },

    nsCol: {
      flex: 1,
    },

    nsLabel: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 15,
      color: C.gray,
      marginBottom: 5,
    },

    nsInput: {
      height: 32,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
      paddingHorizontal: 9,
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 15,
      color: C.text,
    },

    nsTextarea: {
      height: 64,
      paddingTop: 7,
      paddingBottom: 7,
    },

    nsActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
      padding: 14,
      paddingTop: 12,
    },

    nsCancel: {
      height: 32,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.red,
      borderRadius: 4,
    },

    nsSave: {
      height: 32,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.green,
      borderRadius: 4,
    },

    nsSaveOff: {
      opacity: 0.6,
    },

    nsError: {
      fontFamily: Fonts.body,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.red,
    },

    nsBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12.5,
      color: '#F5F5F5',
    },

    /* ── "Hap" popup ─────────────────────────────────────────── */
    dtCard: {
      width: '88%',
      maxWidth: 360,
      maxHeight: '70%',
      backgroundColor: '#F5F5F5',
      borderWidth: 1,
      borderColor: C.blue,
      borderRadius: 6,
      overflow: 'hidden',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 8,
    },

    dtHeader: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 14,
      paddingVertical: 12,
    },

    dtTitle: {
      textAlign: 'center',
      fontFamily: Fonts.bodyBold,
      fontSize: 17,
      lineHeight: 21,
      color: C.text,
    },

    dtDivider: {
      height: 1,
      backgroundColor: C.headLine,
    },

    dtBody: {
      paddingHorizontal: 14,
      paddingTop: 12,
      paddingBottom: 2,
    },

    dtRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
    },

    dtRowLabel: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 15,
      color: C.hint,
    },

    dtRowValue: {
      flexShrink: 1,
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      lineHeight: 15,
      color: C.text,
    },

    dtLabel: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      lineHeight: 15,
      color: C.text,
      marginTop: 12,
      marginBottom: 4,
    },

    dtParagraph: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 17,
      color: C.text,
      paddingBottom: 4,
    },
  }),
);
