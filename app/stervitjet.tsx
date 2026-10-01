import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { TrainingDraft, TrainingFormModal, formatDate } from '@/components/trainings/training-form';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

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

  card: '#FFFFFF',
  blueSoft: '#E3EEFB',

  green: '#159447',
  green20: 'rgba(21,148,71,0.20)',
  orange: '#E4A000',
  red: '#E03131',
  blue: '#0766D8',
};

/* ── Training list ─────────────────────────────────────────────────── */

const FILTERS = ['Të gjitha llojet', 'Të gjitha statuset'];

/* The squad these sessions belong to — shown as the page subtitle. */
const TEAM = 'Ekipi i Parë';

/* The squad size a brand new session is measured against. */
const SQUAD = '24';

type Status = 'Prezenca u regjistrua' | 'Pret regjistrim';

type Training = {
  date: string;
  time: string;
  type: string;
  field: string;
  duration: string;
  presence: string;
  status: Status;
};

const STATUS_TONE: Record<Status, string> = {
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

const COLS: { key: keyof Training; label: string; width: number }[] = [
  { key: 'date', label: 'Data & Ora', width: 78 },
  { key: 'type', label: 'Lloji', width: 70 },
  { key: 'field', label: 'Fusha', width: 116 },
  { key: 'duration', label: 'Kohëzgjatja', width: 80 },
  { key: 'presence', label: 'Prezenca', width: 64 },
  { key: 'status', label: 'Statusi', width: 122 },
];

/* Wide enough for the three actions of an unregistered session. */
const ACTION_W = 168;

const TRAININGS: Training[] = [
  {
    date: '18 Aug 2026',
    time: '17:00',
    type: 'Taktike',
    field: 'Salla e Brendshme',
    duration: '90 min',
    presence: '0 /24',
    status: 'Prezenca u regjistrua',
  },
  {
    date: '17 Aug 2026',
    time: '17:00',
    type: 'Rregullt',
    field: 'Salla e Brendshme',
    duration: '90 min',
    presence: '0 /24',
    status: 'Pret regjistrim',
  },
  {
    date: '15 Aug 2026',
    time: '09:30',
    type: 'Fizike',
    field: 'Fusha 1',
    duration: '75 min',
    presence: '24 /24',
    status: 'Prezenca u regjistrua',
  },
  {
    date: '14 Aug 2026',
    time: '17:00',
    type: 'Rregullt',
    field: 'Fusha 2',
    duration: '90 min',
    presence: '21 /24',
    status: 'Prezenca u regjistrua',
  },
  {
    date: '12 Aug 2026',
    time: '10:00',
    type: 'Taktike',
    field: 'Salla e Brendshme',
    duration: '60 min',
    presence: '0 /24',
    status: 'Pret regjistrim',
  },
  {
    date: '11 Aug 2026',
    time: '11:00',
    type: 'Rikuperim',
    field: 'Salla e Brendshme',
    duration: '45 min',
    presence: '12 /24',
    status: 'Prezenca u regjistrua',
  },
  {
    date: '10 Aug 2026',
    time: '17:00',
    type: 'Rregullt',
    field: 'Fusha 1',
    duration: '90 min',
    presence: '23 /24',
    status: 'Prezenca u regjistrua',
  },
  {
    date: '8 Aug 2026',
    time: '09:30',
    type: 'Fizike',
    field: 'Fusha 2',
    duration: '75 min',
    presence: '19 /24',
    status: 'Prezenca u regjistrua',
  },
  {
    date: '5 Aug 2026',
    time: '17:00',
    type: 'Rregullt',
    field: 'Salla e Brendshme',
    duration: '90 min',
    presence: '0 /24',
    status: 'Pret regjistrim',
  },
];

export default function TrainingListScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const [trainings, setTrainings] = useState<Training[]>(TRAININGS);
  const [adding, setAdding] = useState(false);

  /* A brand new session starts unregistered, with nobody marked yet. */
  const add = (d: TrainingDraft) => {
    setTrainings((prev) => [
      {
        date: formatDate(d),
        time: `${d.hour}:${d.minute}`,
        type: d.type,
        field: d.field,
        duration: `${d.duration} min`,
        presence: `0 /${SQUAD}`,
        status: 'Pret regjistrim',
      },
      ...prev,
    ]);
    setAdding(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.canvas}>
        {/* Faint vertical canvas texture — decorative only */}
        <View pointerEvents="none" style={styles.lines}>
          {Array.from({ length: lineCount }).map((_, index) => (
            <View key={index} style={[styles.line, { left: index * 9 }]} />
          ))}
        </View>

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
                  {TEAM}
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
              {FILTERS.map((f) => (
                <Pressable
                  key={f}
                  accessibilityRole="button"
                  accessibilityLabel={`Filtro: ${f}`}
                  style={({ pressed }) => [styles.filterBox, pressed && styles.pressed]}
                >
                  <Text style={styles.filterText} numberOfLines={1}>
                    {f}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={I(13)} color={C.text} />
                </Pressable>
              ))}
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
                    <View key={`${t.date}-${t.time}-${i}`} style={[styles.tr, styles.trBorder]}>
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
      backgroundColor: C.page,
    },

    canvas: {
      flex: 1,
      backgroundColor: C.page,
    },

    lines: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 0,
    },

    line: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 1,
      backgroundColor: C.line,
    },

    colPad: {
      alignSelf: 'center',
      width: '100%',
      paddingHorizontal: 27,
    },

    /* Pinned header */
    header: {
      backgroundColor: C.page,
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
      color: '#FFFFFF',
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
