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
import { Fonts } from '@/constants/theme';
import { activateSeason, createSeason, deleteSeason, getSeasons } from '@/lib/api/club';
import { ApiError } from '@/lib/api/errors';
import type { ApiSeason } from '@/lib/api/types';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * Cilësimet e sezonit — the third settings sub-page.
 *
 * Same light #FAFBFA canvas. A glassy green "active season" banner, a
 * "+ Sezoni i ri" button, then the blue "Të gjitha sezonat" table which
 * scrolls sideways (too many columns to fit the screen).
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',

  card: '#F6FBFF',
  border: 'rgba(100,140,190,0.30)',
  headLine: 'rgba(30,40,35,0.10)',
  rowLine: 'rgba(100,140,190,0.22)',
  thBg: '#E7F1F8',

  green: '#0E7A00',
  greenSoft: 'rgba(14,122,0,0.30)',

  newBtnBg: 'rgba(5,156,87,0.35)',
  newBtnBorder: '#000000',

  actGreen: '#059C57',
  red: '#E03131',
};

type Col = { key: string; label: string; width: number };

const COLS: Col[] = [
  { key: 'name', label: 'Emri', width: 110 },
  { key: 'start', label: 'Data e fillimit', width: 104 },
  { key: 'end', label: 'Data e mbarimit', width: 104 },
  { key: 'dur', label: 'Kohëzgjatja', width: 96 },
  { key: 'status', label: 'Statusi', width: 92 },
  { key: 'act', label: 'Veprimet', width: 150 },
];

/** `2025-07-01` → `01/07/2025` — season dates are plain days. */
function ddmmyyyy(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** Whole days between two ISO days. */
function durationDays(start: string | null | undefined, end: string | null | undefined): string {
  if (!start || !end) return '—';
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  if (Number.isNaN(a) || Number.isNaN(b)) return '—';
  return `${Math.round((b - a) / 86_400_000)} ditë`;
}

export default function SeasonSettingsScreen() {
  const router = useRouter();
  const { token, signOut } = useSession();
  // The rows area measures itself so the blank rows can fill it exactly —
  // the page itself never scrolls (only the columns do, sideways).
  const [tableH, setTableH] = useState(0);
  const [creating, setCreating] = useState(false);
  const [seasons, setSeasons] = useState<ApiSeason[]>([]);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(
    (signal?: AbortSignal) =>
      getSeasons(token ?? '', signal).then((res) => {
        if (signal?.aborted) return;
        setSeasons(res.data);
      }),
    [token],
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

  /** Runs a season action, refetching the list when it succeeds. */
  const runAction = (id: number, action: () => Promise<unknown>, fallback: string) => {
    if (busyId !== null) return;
    setBusyId(id);
    action()
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
  };

  const onActivate = (season: ApiSeason) => {
    if (season.id == null || season.is_active) return;
    runAction(season.id, () => activateSeason(token ?? '', season.id as number), '');
  };

  const onDelete = (season: ApiSeason) => {
    if (season.id == null || season.is_active) return;
    Alert.alert(
      'Fshi sezonin',
      `A jeni i sigurt që dëshironi ta fshini sezonin "${season.name}"?`,
      [
        { text: 'Anulo', style: 'cancel' },
        {
          text: 'Fshi',
          style: 'destructive',
          onPress: () =>
            runAction(season.id as number, () => deleteSeason(token ?? '', season.id as number), ''),
        },
      ],
    );
  };

  const active = seasons.find((s) => s.is_active) ?? null;

  const rowH = I(40);
  const emptyRows = Math.max(0, Math.floor(tableH / rowH) - 1 - seasons.length);

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
                <Text style={styles.title}>Cilësimet e sezonit</Text>
                <Text style={styles.subtitle}>Menaxhimi i sezoneve dhe viteve sportive</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={[styles.colPad, styles.bodyCol]}>
            {/* ── Active season banner (glassy green) ──────────── */}
            <View style={styles.banner}>
              <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
              <View pointerEvents="none" style={styles.bannerTint} />
              <View style={styles.bannerText}>
                <Text style={styles.bannerTitle} numberOfLines={1}>
                  Sezoni aktiv: {active?.name ?? '—'}
                </Text>
                <Text style={styles.bannerDates}>
                  {ddmmyyyy(active?.start_date)} — {ddmmyyyy(active?.end_date)}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Sezoni aktiv"
                style={({ pressed }) => [styles.activeBtn, pressed && styles.pressed]}
              >
                <Text style={styles.activeBtnText}>Aktiv</Text>
              </Pressable>
            </View>

            {/* ── New season ───────────────────────────────────── */}
            <Pressable
              onPress={() => setCreating(true)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.newBtn, pressed && styles.pressed]}
            >
              <Text style={styles.newBtnText}>+ Sezoni i ri</Text>
            </Pressable>

            {/* ── Të gjitha sezonat ────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Të gjitha sezonat</Text>
              </View>

              <View
                style={styles.tblWrap}
                onLayout={(e) => setTableH(e.nativeEvent.layout.height)}
              >
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tblInner}
                >
                  <View>
                    <View style={[styles.tr, styles.thRow]}>
                      {COLS.map((c) => (
                        <Text key={c.key} style={[styles.th, { width: c.width }]}>
                          {c.label}
                        </Text>
                      ))}
                    </View>

                    {/* One row per season */}
                    {seasons.map((s, i) => (
                      <View key={s.id ?? i} style={[styles.tr, styles.trBorder]}>
                        {COLS.map((c) => (
                          <View key={c.key} style={[styles.tdCell, { width: c.width }]}>
                            {c.key === 'name' ? (
                              <Text style={styles.td} numberOfLines={1}>
                                {s.name}
                              </Text>
                            ) : null}
                            {c.key === 'start' ? (
                              <Text style={styles.td}>{ddmmyyyy(s.start_date)}</Text>
                            ) : null}
                            {c.key === 'end' ? (
                              <Text style={styles.td}>{ddmmyyyy(s.end_date)}</Text>
                            ) : null}
                            {c.key === 'dur' ? (
                              <Text style={styles.td}>
                                {durationDays(s.start_date, s.end_date)}
                              </Text>
                            ) : null}
                            {c.key === 'status' ? (
                              <Text style={styles.td}>
                                {s.is_active ? 'Aktiv' : 'Mbyllur'}
                              </Text>
                            ) : null}
                            {c.key === 'act' ? (
                              <View style={styles.actCell}>
                                <Pressable
                                  onPress={() => onActivate(s)}
                                  disabled={s.is_active || busyId !== null}
                                  accessibilityRole="button"
                                  accessibilityLabel={`Aktivizo sezonin ${s.name}`}
                                  style={({ pressed }) => [
                                    styles.actBtn,
                                    (s.is_active || busyId !== null) && styles.actOff,
                                    pressed && styles.pressed,
                                  ]}
                                >
                                  <Text style={styles.actBtnText}>Aktivizo</Text>
                                </Pressable>
                                <Pressable
                                  onPress={() => onDelete(s)}
                                  disabled={s.is_active || busyId !== null}
                                  accessibilityRole="button"
                                  accessibilityLabel={`Fshi sezonin ${s.name}`}
                                  style={({ pressed }) => [
                                    styles.delBtn,
                                    (s.is_active || busyId !== null) && styles.actOff,
                                    pressed && styles.pressed,
                                  ]}
                                >
                                  <Text style={styles.delBtnText}>Fshi</Text>
                                </Pressable>
                              </View>
                            ) : null}
                          </View>
                        ))}
                      </View>
                    ))}

                    {/* Empty rows — fill the card to the bottom */}
                    {Array.from({ length: emptyRows }).map((_, i) => (
                      <View key={i} style={[styles.tr, styles.trBorder]} />
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Overlay on the SafeAreaView so the blur covers the whole screen */}
      {creating ? (
        <NewSeasonModal
          token={token}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            load().catch(() => setCreating(false));
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* "Sezoni i ri" popup                                                 */
/* ------------------------------------------------------------------ */

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

function NewSeasonModal({
  token,
  onClose,
  onCreated,
}: {
  token: string | null;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = () => {
    if (!token || saving) return;

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Shkruaj emrin e sezonit.');
      return;
    }
    if (!ISO_DAY.test(start.trim()) || !ISO_DAY.test(end.trim())) {
      setError('Datat duhet të jenë në formatin VVVV-MM-DD.');
      return;
    }
    if (end.trim() <= start.trim()) {
      setError('Data e mbarimit duhet të jetë pas datës së fillimit.');
      return;
    }

    setSaving(true);
    setError(null);

    createSeason(token, {
      name: trimmedName,
      start_date: start.trim(),
      end_date: end.trim(),
    })
      .then(() => onCreated())
      .catch((e) => {
        setSaving(false);
        if (e instanceof ApiError && e.status === 422 && e.fieldErrors) {
          setError(Object.values(e.fieldErrors)[0]?.[0] ?? 'Të dhënat nuk janë të vlefshme.');
        } else if (e instanceof ApiError && e.status === 0) {
          setError('Nuk mund të lidhemi me serverin. Kontrollo lidhjen.');
        } else {
          setError('Sezoni nuk mund të krijohet.');
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
          <Text style={styles.nsTitle}>Sezoni i ri</Text>
        </View>
        <View style={styles.nsDivider} />

        <View style={styles.nsBody}>
          <View>
            <Text style={styles.nsLabel}>Emri i sezonit:</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              autoCorrect={false}
              allowFontScaling={false}
              placeholder="2025/2026"
              placeholderTextColor={C.gray}
              style={styles.nsInput}
            />
          </View>

          <View style={styles.nsRow}>
            <View style={styles.nsCol}>
              <Text style={styles.nsLabel}>Data e fillimit:</Text>
              <TextInput
                value={start}
                onChangeText={setStart}
                autoCorrect={false}
                allowFontScaling={false}
                placeholder="VVVV-MM-DD"
                placeholderTextColor={C.gray}
                style={styles.nsInput}
              />
            </View>
            <View style={styles.nsCol}>
              <Text style={styles.nsLabel}>Data e mbarimit:</Text>
              <TextInput
                value={end}
                onChangeText={setEnd}
                autoCorrect={false}
                allowFontScaling={false}
                placeholder="VVVV-MM-DD"
                placeholderTextColor={C.gray}
                style={styles.nsInput}
              />
            </View>
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
            <Text style={styles.nsBtnText}>{saving ? 'Duke krijuar…' : 'Krijo sezonin'}</Text>
          </Pressable>
        </View>
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

    /* Page body — fills the screen, so the page never scrolls vertically. */
    body: {
      flex: 1,
      minHeight: 0,
    },

    bodyCol: {
      flex: 1,
      minHeight: 0,
    },

    /* Active season banner */
    banner: {
      marginTop: 20,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: C.green,
      borderRadius: 6,
      paddingHorizontal: 13,
      paddingVertical: 11,
      overflow: 'hidden',
    },

    bannerTint: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: C.greenSoft,
    },

    bannerText: {
      flex: 1,
      marginRight: 10,
    },

    bannerTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 14.5,
      lineHeight: 18,
      color: C.green,
    },

    bannerDates: {
      fontFamily: Fonts.body,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.green,
      marginTop: 2,
    },

    activeBtn: {
      backgroundColor: C.green,
      borderRadius: 4,
      paddingHorizontal: 15,
      paddingVertical: 8,
    },

    activeBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12.5,
      color: '#F5F5F5',
    },

    /* + Sezoni i ri */
    newBtn: {
      marginTop: 12,
      alignSelf: 'flex-start',
      height: 38,
      paddingHorizontal: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.newBtnBg,
      borderWidth: 1,
      borderColor: C.newBtnBorder,
      borderRadius: 4,
    },

    newBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13,
      color: '#000000',
    },

    /* Të gjitha sezonat table */
    card: {
      flex: 1,
      minHeight: 0,
      marginTop: 14,
      backgroundColor: C.card,
      borderWidth: 2,
      borderColor: C.border,
      borderRadius: 7,
      overflow: 'hidden',
    },

    cardHead: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
    },

    cardHeadText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 16,
      lineHeight: 20,
      color: C.text,
    },

    /* Rows area — measured so the blank rows can fill it exactly. */
    tblWrap: {
      flex: 1,
      minHeight: 0,
    },

    tblInner: {
      flexGrow: 1,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 40,
    },

    thRow: {
      backgroundColor: C.thBg,
    },

    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    th: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      lineHeight: 14,
      color: C.gray,
      textAlign: 'center',
    },

    tdCell: {
      alignItems: 'center',
      justifyContent: 'center',
    },

    td: {
      fontFamily: Fonts.body,
      fontSize: 11.5,
      lineHeight: 14,
      color: C.text,
      textAlign: 'center',
    },

    actCell: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },

    actBtn: {
      height: 24,
      paddingHorizontal: 9,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.actGreen,
      borderRadius: 3,
    },

    actBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: C.actGreen,
    },

    /* A disabled row action — the active season, or one mid-request. */
    actOff: {
      opacity: 0.35,
    },

    delBtn: {
      height: 24,
      paddingHorizontal: 9,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.red,
      borderRadius: 3,
    },

    delBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: C.red,
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
      /* Centering happens in the space above this padding, so the popup
         sits a little above the vertical middle. */
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

    /* ── "Sezoni i ri" popup ─────────────────────────────────── */
    nsCard: {
      width: '86%',
      maxWidth: 340,
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
      backgroundColor: C.greenSoft,
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
  }),
);
