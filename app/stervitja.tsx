import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import {
  TrainingDraft,
  TrainingFormModal,
  formatDate,
  parseWhen,
} from '@/components/trainings/training-form';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * Stërvitja — one session in full, opened from the "Shiko" button on a row of
 * the training list.
 *
 * The edit button sits under the header, then the session's own facts as a
 * two-by-two grid, then the attendance table for that session.
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

  /* The table ground is the palest blue; the edit button one step deeper. */
  card: '#F6FBFF',
  blueSoft: '#E3EEFB',

  green: '#159447',
  red: '#E03131',
};

/* ── Attendance ────────────────────────────────────────────────────── */

type Attendance = 'Prezent' | 'Mungon';

type Player = {
  name: string;
  nr: string;
  pos: string;
  status: Attendance;
};

const ATTENDANCE_TONE: Record<Attendance, string> = {
  Prezent: C.green,
  Mungon: C.red,
};

/* The last column is sized so "Prezent" and "Mungon" set at full size. */
const COLS: { key: keyof Player; label: string; width: number }[] = [
  { key: 'name', label: 'Lojtari', width: 108 },
  { key: 'nr', label: 'Nr.', width: 30 },
  { key: 'pos', label: 'Pozita', width: 76 },
  { key: 'status', label: 'Statusi', width: 98 },
];

const PLAYERS: Player[] = [
  { name: 'Bekim Rexhepi', nr: '1', pos: 'Portier', status: 'Prezent' },
  { name: 'Dardan Krasniqi', nr: '2', pos: 'Mbrojtës', status: 'Prezent' },
  { name: 'Endrit Hoxha', nr: '4', pos: 'Mesfushor', status: 'Mungon' },
  { name: 'Genc Morina', nr: '6', pos: 'Mesfushor', status: 'Prezent' },
  { name: 'Ardit Llapashtica', nr: '9', pos: 'Sulmues', status: 'Prezent' },
  { name: 'Hamdi Shala', nr: '11', pos: 'Sulmues', status: 'Mungon' },
];

export default function TrainingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const params = useLocalSearchParams<{
    date?: string;
    time?: string;
    field?: string;
    type?: string;
    duration?: string;
  }>();

  /* The session's own facts start from the list row they were opened on, and
     move with the edit popup afterwards. */
  const [date, setDate] = useState(params.date ?? '18 Aug 2026');
  const [time, setTime] = useState(params.time ?? '17:00');
  const [field, setField] = useState(params.field ?? 'Salla e Brendshme');
  const [type, setType] = useState(params.type ?? 'Taktike');
  const [duration, setDuration] = useState(params.duration ?? '90 min');

  const [editing, setEditing] = useState(false);

  const save = (d: TrainingDraft) => {
    setType(d.type);
    setDate(formatDate(d));
    setTime(`${d.hour}:${d.minute}`);
    setField(d.field);
    setDuration(`${d.duration} min`);
    setEditing(false);
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
                  {`Stërvitja - ${date}`}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {`${time} • ${field} • ${type}`}
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
            {/* ── Edit the session ─────────────────────────────────── */}
            <Pressable
              onPress={() => setEditing(true)}
              accessibilityRole="button"
              accessibilityLabel="Edito stërvitjen"
              style={({ pressed }) => [styles.editBtn, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons name="pencil" size={I(14)} color={C.text} />
              <Text style={styles.editBtnText} numberOfLines={1}>
                Edito stërvitjen
              </Text>
            </Pressable>

            {/* ── Session details ──────────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  Detajet e stërvitjes
                </Text>
              </View>

              <View style={styles.tblInner}>
                <View style={[styles.tr, styles.detailRow]}>
                  <View style={styles.detailCell}>
                    <Text style={styles.detailLabel} numberOfLines={1}>
                      Lloji
                    </Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {type}
                    </Text>
                  </View>
                  <View style={styles.detailCell}>
                    <Text style={styles.detailLabel} numberOfLines={1}>
                      Data
                    </Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {`${date}, ${time}`}
                    </Text>
                  </View>
                </View>

                <View style={[styles.tr, styles.detailRow]}>
                  <View style={styles.detailCell}>
                    <Text style={styles.detailLabel} numberOfLines={1}>
                      Kohëzgjatja
                    </Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {duration}
                    </Text>
                  </View>
                  <View style={styles.detailCell}>
                    <Text style={styles.detailLabel} numberOfLines={1}>
                      Fusha
                    </Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {field}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ── Attendance ───────────────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  Prezenca në stërvitje
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Edito prezencën"
                  style={({ pressed }) => [styles.editSmall, pressed && styles.pressed]}
                >
                  <MaterialCommunityIcons name="pencil" size={I(12)} color={C.text} />
                  <Text style={styles.editSmallText}>Edito</Text>
                </Pressable>
              </View>

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

                  {PLAYERS.map((p) => (
                    <View key={p.nr} style={[styles.tr, styles.trBorder]}>
                      {COLS.map((c) => {
                        const isStatus = c.key === 'status';

                        return (
                          <Text
                            key={c.key}
                            style={[
                              styles.td,
                              c.key === 'name' ? styles.tdName : null,
                              isStatus
                                ? [styles.tdStrong, { color: ATTENDANCE_TONE[p.status] }]
                                : null,
                              { width: c.width },
                            ]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.75}
                          >
                            {p[c.key]}
                          </Text>
                        );
                      })}
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Overlay on the SafeAreaView so the blur covers the whole screen */}
      {editing ? (
        <TrainingFormModal
          title="Edito stërvitjen"
          confirmLabel="Ruaj"
          initial={{
            type,
            duration: duration.replace(/\D/g, ''),
            field,
            ...parseWhen(date, time),
          }}
          onClose={() => setEditing(false)}
          onConfirm={save}
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

    /* ── Edit the session ────────────────────────────────────── */
    editBtn: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 32,
      marginTop: 8,
      paddingHorizontal: 12,
      backgroundColor: C.blueSoft,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    /* The whole phrase reads as a link, icon included. */
    editBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.text,
      textDecorationLine: 'underline',
    },

    /* ── Cards ───────────────────────────────────────────────── */
    card: {
      marginTop: 14,
      backgroundColor: C.card,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 5,
      overflow: 'hidden',
    },

    /* The title is ruled off from the rows below it, like the other tables. */
    cardHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      paddingHorizontal: 10,
      paddingTop: 10,
      paddingBottom: 9,
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
    },

    cardTitle: {
      flexShrink: 1,
      fontFamily: Fonts.bodyBold,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.text,
    },

    /* ── Session details ─────────────────────────────────────── */
    /* Two label/value cells on a row, on the same rules as the tables. */
    detailRow: {
      alignItems: 'flex-start',
      gap: 10,
      paddingVertical: 8,
    },

    detailCell: {
      flex: 1,
    },

    detailLabel: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.hint,
    },

    detailValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 11.5,
      lineHeight: 16,
      color: C.text,
      marginTop: 2,
    },

    /* ── Attendance ──────────────────────────────────────────── */
    editSmall: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      height: 24,
      paddingHorizontal: 9,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    editSmallText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: C.text,
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

    tdStrong: {
      fontFamily: Fonts.bodySemiBold,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
