import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { FilterSelect, type FilterOption } from '@/components/filters/filter-select';
import {
  TrainingDraft,
  TrainingFormModal,
  type Booking,
} from '@/components/trainings/training-form';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import { createTraining, deleteTraining, listTrainings } from '@/lib/api/trainings';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';
import {
  draftToInput,
  fieldNames,
  toBooking,
  toTrainingRow,
  type TrainingRow,
} from '@/lib/trainings';
import type { ApiTraining } from '@/lib/api/types';

/**
 * Stërvitjet — the trainer's training list, opened from the "Stërvitjet" card
 * on the trainer home.
 *
 * The add button and the two filters sit above a squad-style table. Each row
 * ends in its actions: a settled session only offers "Shiko", an unregistered
 * one adds the orange "Regjistro" and the red "Fshi".
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',

  frame: '#000000',
  headLine: 'rgba(30,40,35,0.10)',
  rowLine: 'rgba(100,140,190,0.22)',

  card: '#F5F5F5',
  blueSoft: '#E3EEFB',

  green: '#159447',
  green20: 'rgba(21,148,71,0.20)',
  orange: '#E4A000',
  red: '#E03131',
  blue: '#0766D8',
};

/* ── Training list ─────────────────────────────────────────────────── */

/* The API's `type`/`status` codes, under the labels the rows already use. */
const TYPE_OPTIONS: FilterOption[] = [
  { label: 'Të gjitha llojet', value: '' },
  { label: 'Rregullt', value: 'regular' },
  { label: 'Taktike', value: 'tactical' },
  { label: 'Fizike', value: 'physical' },
  { label: 'Rikuperim', value: 'recovery' },
];

const STATUS_OPTIONS: FilterOption[] = [
  { label: 'Të gjitha statuset', value: '' },
  { label: 'Prezenca u regjistrua', value: 'finalized' },
  { label: 'Pret regjistrim', value: 'pending' },
];

/* The squad these sessions belong to — shown as the page subtitle. */
const TEAM = 'Ekipi i Parë';

const STATUS_TONE: Record<TrainingRow['status'], string> = {
  'Prezenca u regjistrua': C.green,
  'Pret regjistrim': C.orange,
};

/* Each kind of session carries its own colour down the Lloji column. */
const TYPE_TONE: Record<string, string> = {
  Taktike: C.blue,
  Rregullt: C.gray,
  Rikuperim: C.green,
  Fizike: C.orange,
};

const COLS: { key: keyof TrainingRow; label: string; width: number }[] = [
  { key: 'date', label: 'Data & Ora', width: 78 },
  { key: 'type', label: 'Lloji', width: 70 },
  { key: 'field', label: 'Fusha', width: 116 },
  { key: 'duration', label: 'Kohëzgjatja', width: 80 },
  { key: 'presence', label: 'Prezenca', width: 64 },
  { key: 'status', label: 'Statusi', width: 122 },
];

/* Wide enough for the three actions of an unregistered session. */
const ACTION_W = 168;

export default function TrainingListScreen() {
  const router = useRouter();
  const { token, signOut } = useSession();

  const [trainings, setTrainings] = useState<TrainingRow[]>([]);
  /* The raw rows behind the list — they tell the form which slots are taken. */
  const [rawTrainings, setRawTrainings] = useState<ApiTraining[]>([]);
  const [adding, setAdding] = useState(false);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const load = useCallback(
    (signal?: AbortSignal) =>
      listTrainings(
        token ?? '',
        { type: typeFilter || undefined, status: statusFilter || undefined },
        signal,
      ).then((res) => {
        if (signal?.aborted) return;
        setRawTrainings(res.data);
        setTrainings(res.data.map(toTrainingRow));
      }),
    [token, typeFilter, statusFilter],
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

  /** Surfaces a failed write, sending an expired token back to login. */
  const onWriteError = (e: unknown, fallback: string) => {
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
  };

  /* The new session is created server-side, then the list is refetched. */
  const add = (d: TrainingDraft) => {
    if (!token) return;
    createTraining(token, draftToInput(d))
      .then(() => {
        setAdding(false);
        load().catch(() => undefined);
      })
      .catch((e) => {
        setAdding(false);
        onWriteError(e, 'Stërvitja nuk mund të krijohet.');
      });
  };

  /* Deleting a session asks first — it takes its attendance sheet with it. */
  const confirmDelete = (t: TrainingRow) => {
    if (t.id == null || !token) return;
    const id = t.id;
    Alert.alert(
      'Fshi stërvitjen',
      `A jeni i sigurt që dëshironi ta fshini stërvitjen e ${t.date}?`,
      [
        { text: 'Anulo', style: 'cancel' },
        {
          text: 'Fshi',
          style: 'destructive',
          onPress: () =>
            deleteTraining(token, id)
              .then(() => load().catch(() => undefined))
              .catch((e) => onWriteError(e, 'Stërvitja nuk mund të fshihet.')),
        },
      ],
    );
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
                <Text
                  style={styles.title}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  Lista e lojtarëve
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {trainings[0]?.team ?? TEAM}
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
            {/* ── Add ──────────────────────────────────────────────── */}
            <Pressable
              onPress={() => setAdding(true)}
              accessibilityRole="button"
              accessibilityLabel="Shto stërvitje"
              style={({ pressed }) => [styles.addBtn, pressed && styles.pressed]}
            >
              <Text style={styles.addBtnText} numberOfLines={1}>
                + Shto stërvitje
              </Text>
            </Pressable>

            {/* ── Filters ──────────────────────────────────────────── */}
            <View style={styles.filterRow}>
              <FilterSelect
                label="Filtro sipas llojit"
                options={TYPE_OPTIONS}
                value={typeFilter}
                onChange={setTypeFilter}
                boxStyle={styles.filterBox}
                textStyle={styles.filterText}
              />
              <FilterSelect
                label="Filtro sipas statusit"
                options={STATUS_OPTIONS}
                value={statusFilter}
                onChange={setStatusFilter}
                boxStyle={styles.filterBox}
                textStyle={styles.filterText}
              />
            </View>

            {/* ── Training table ───────────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  Lista e stërvitjeve
                </Text>
                <Text style={styles.cardCount} numberOfLines={1}>
                  {trainings.length} stërvitje
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={styles.tblInner}
              >
                {/* One wrapper, so the header row and the rows below it stack
                    down the page instead of lining up across it. */}
                <View>
                  <View style={[styles.tr, styles.thRow]}>
                    {COLS.map((c) => (
                      <Text key={c.key} style={[styles.th, { width: c.width }]} numberOfLines={1}>
                        {c.label}
                      </Text>
                    ))}
                    {/* Keeps the header rule exactly as wide as the rows below. */}
                    <View style={{ width: ACTION_W }} />
                  </View>

                  {trainings.map((t, i) => (
                    <View
                      key={t.id != null ? String(t.id) : `${t.date}-${t.time}-${i}`}
                      style={[styles.tr, styles.trBorder]}
                    >
                      {COLS.map((c) => {
                        /* The date cell stacks the day over the kick-off time. */
                        if (c.key === 'date') {
                          return (
                            <View key={c.key} style={{ width: c.width }}>
                              <Text style={styles.td} numberOfLines={1}>
                                {t.date}
                              </Text>
                              <Text style={styles.td} numberOfLines={1}>
                                {t.time}
                              </Text>
                            </View>
                          );
                        }

                        /* The turnout reads as the count before the slash,
                           which is the number that matters. */
                        if (c.key === 'presence') {
                          const [attended, squad] = t.presence.split('/');

                          return (
                            <View key={c.key} style={[styles.presenceCell, { width: c.width }]}>
                              <Text style={[styles.td, styles.tdAttended]} numberOfLines={1}>
                                {attended}
                              </Text>
                              <Text style={styles.td} numberOfLines={1}>
                                /{squad}
                              </Text>
                            </View>
                          );
                        }

                        const isType = c.key === 'type';
                        const isStatus = c.key === 'status';

                        return (
                          <Text
                            key={c.key}
                            style={[
                              styles.td,
                              isType ? [styles.tdStrong, { color: TYPE_TONE[t.type] }] : null,
                              isStatus ? [styles.tdStrong, { color: STATUS_TONE[t.status] }] : null,
                              { width: c.width },
                            ]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.75}
                          >
                            {t[c.key]}
                          </Text>
                        );
                      })}

                      {/* A settled session only needs to be opened; an
                          unregistered one can be filled in or dropped. */}
                      <View style={[styles.actions, { width: ACTION_W }]}>
                        <Pressable
                          onPress={() =>
                            router.push({
                              pathname: '/stervitja',
                              params: {
                                id: t.id != null ? String(t.id) : '',
                                date: t.date,
                                time: t.time,
                                field: t.field,
                                type: t.type,
                                duration: t.duration,
                              },
                            })
                          }
                          accessibilityRole="button"
                          accessibilityLabel={`Shiko stërvitjen e ${t.date}`}
                          style={({ pressed }) => [styles.actView, pressed && styles.pressed]}
                        >
                          <Text style={styles.actViewText}>Shiko</Text>
                        </Pressable>

                        {t.status === 'Pret regjistrim' ? (
                          <>
                            <Pressable
                              onPress={() =>
                                router.push({
                                  pathname: '/regjistro-prezencen',
                                  params: {
                                    id: String(t.id),
                                    date: t.date,
                                    time: t.time,
                                    field: t.field,
                                    type: t.type,
                                    duration: t.duration,
                                  },
                                })
                              }
                              accessibilityRole="button"
                              accessibilityLabel={`Regjistro prezencën e ${t.date}`}
                              style={({ pressed }) => [
                                styles.actFill,
                                styles.actReg,
                                pressed && styles.pressed,
                              ]}
                            >
                              <Text style={styles.actFillText}>Regjistro</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => confirmDelete(t)}
                              accessibilityRole="button"
                              accessibilityLabel={`Fshi stërvitjen e ${t.date}`}
                              style={({ pressed }) => [
                                styles.actFill,
                                styles.actDel,
                                pressed && styles.pressed,
                              ]}
                            >
                              <Text style={styles.actFillText}>Fshi</Text>
                            </Pressable>
                          </>
                        ) : null}
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Overlay on the SafeAreaView so the blur covers the whole screen */}
      {adding ? (
        <TrainingFormModal
          title="Shto stërvitje të re"
          confirmLabel="Krijo"
          fields={fieldNames(rawTrainings)}
          bookings={rawTrainings
            .map(toBooking)
            .filter((b): b is Booking => b !== null)}
          onClose={() => setAdding(false)}
          onConfirm={add}
        />
      ) : null}
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

    /* ── Add ─────────────────────────────────────────────────── */
    /* Small and hugging its label, rather than spanning the page. */
    addBtn: {
      alignSelf: 'flex-start',
      height: 34,
      marginTop: 8,
      paddingHorizontal: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.green20,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    addBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      lineHeight: 16,
      color: C.text,
    },

    /* ── Filters ─────────────────────────────────────────────── */
    filterRow: {
      flexDirection: 'row',
      gap: 7,
      marginTop: 10,
    },

    /* Hugs its own label rather than splitting the row evenly. */
    filterBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      height: 34,
      paddingHorizontal: 10,
      backgroundColor: C.blueSoft,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    filterText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 11,
      lineHeight: 14,
      color: C.text,
    },

    /* ── Training table ──────────────────────────────────────── */
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

    /* Padding as well as the rule — two lines of date need the extra air. */
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

    /* The coloured columns — Lloji and Statusi. */
    tdStrong: {
      fontFamily: Fonts.bodySemiBold,
    },

    presenceCell: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    /* The squad members who turned up, ahead of the "/24". */
    tdAttended: {
      color: C.green,
    },

    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },

    /* Outlined, and sitting on the row itself. */
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

    /* Filled actions carry white text. */
    actFill: {
      height: 24,
      paddingHorizontal: 10,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 4,
    },

    actReg: {
      backgroundColor: C.orange,
    },

    actDel: {
      backgroundColor: C.red,
    },

    actFillText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: '#F5F5F5',
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
