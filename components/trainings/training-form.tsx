import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * Training form popup — the one sheet behind "Shto stërvitje" on the trainings
 * list and "Edito stërvitjen" on a session's own page.
 *
 * Lloji and Kohëzgjatja sit on one row, Data and Ora on the next. Under Fusha
 * the sheet only promises a picker once the date, the time and the duration are
 * all filled in — before that it asks for them, and after that it names each
 * pitch as free or taken for that slot.
 */

/* Popup palette — same shell as the modals on the other pages. */
const MO = {
  border: '#159B63',
  divider: '#55B88B',
  title: '#080808',
  text: '#111111',
  sub: '#666666',
  inputBorder: '#777777',
  inputBg: '#FAFCFC',
  ph: '#A8A8A8',
  cancel: '#ED5050',
  create: '#16A51D',
  white: '#FFFFFF',
  err: '#C90000',
};

const TYPES = ['Taktike', 'Rregullt', 'Fizike', 'Rikuperim'];
const DURATIONS = ['45', '60', '75', '90', '105', '120'];
const FIELDS = ['Salla e Brendshme', 'Fusha 1', 'Fusha 2', 'Fusha 3'];

type Booking = { day: string; mon: string; start: string; minutes: number };

/* What is already booked on each pitch. An entered slot that overlaps any of
   these reads as taken. */
const BOOKINGS: Record<string, Booking[]> = {
  'Salla e Brendshme': [
    { day: '18', mon: '08', start: '16:00', minutes: 90 },
    { day: '17', mon: '08', start: '17:00', minutes: 90 },
    { day: '12', mon: '08', start: '10:00', minutes: 90 },
  ],
  'Fusha 1': [{ day: '18', mon: '08', start: '09:00', minutes: 120 }],
  'Fusha 2': [{ day: '15', mon: '08', start: '09:00', minutes: 90 }],
  'Fusha 3': [],
};

const toMinutes = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

/** True when the pitch already holds something that overlaps this slot. */
function isBusy(field: string, day: string, mon: string, start: string, minutes: number) {
  const from = toMinutes(start);
  return (BOOKINGS[field] ?? []).some((b) => {
    if (b.day !== day || b.mon !== mon) return false;
    const bookedFrom = toMinutes(b.start);
    return bookedFrom < from + minutes && from < bookedFrom + b.minutes;
  });
}

/** The month names the app writes into a session's date, in order. */
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** The list's own date, e.g. "18 Aug 2026". */
export function formatDate({ day, month, year }: { day: string; month: string; year: string }) {
  return `${day} ${MONTHS[Number(month) - 1] ?? month} ${year}`;
}

/** Reads "18 Aug 2026" and "17:00" back into the form's own parts. */
export function parseWhen(date: string, time: string) {
  const [day, mon, year] = date.split(' ');
  const [hour, minute] = time.split(':');
  const month = MONTHS.indexOf(mon) + 1;

  return {
    day: day ?? '',
    month: month > 0 ? String(month).padStart(2, '0') : '',
    year: year ?? '',
    hour: hour ?? '',
    minute: minute ?? '',
  };
}

export type TrainingDraft = {
  type: string;
  duration: string;
  day: string;
  month: string;
  year: string;
  hour: string;
  minute: string;
  field: string;
  note: string;
};

export function TrainingFormModal({
  title,
  confirmLabel,
  initial,
  onClose,
  onConfirm,
}: {
  title: string;
  confirmLabel: string;
  initial?: Partial<TrainingDraft>;
  onClose: () => void;
  onConfirm: (draft: TrainingDraft) => void;
}) {
  const { width, height } = useWindowDimensions();
  const cardW = Math.min(width - 24, 360);
  const maxBody = Math.max(280, height - 187);

  const [type, setType] = useState(initial?.type ?? TYPES[0]);
  const [duration, setDuration] = useState(initial?.duration ?? '90');
  const [day, setDay] = useState(initial?.day ?? '');
  const [month, setMonth] = useState(initial?.month ?? '');
  const [year, setYear] = useState(initial?.year ?? '');
  const [hour, setHour] = useState(initial?.hour ?? '');
  const [minute, setMinute] = useState(initial?.minute ?? '');
  const [field, setField] = useState(initial?.field ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [err, setErr] = useState(false);

  const minutes = Number(duration);

  /* The pitches can only be judged once the slot itself is known. */
  const hasSlot =
    day.length === 2 && month.length === 2 && hour.length === 2 && minute.length === 2;

  /* A pitch picked earlier can be taken by a later change to the slot, so the
     choice only counts while it still reads as free. */
  const chosen =
    hasSlot &&
    FIELDS.some(
      (f) => f === field && !isBusy(f, day, month, `${hour}:${minute}`, minutes),
    )
      ? field
      : '';

  const submit = () => {
    if (!chosen || !day || !month || !year || !hour || !minute) {
      setErr(true);
      return;
    }
    onConfirm({ type, duration, day, month, year, hour, minute, field: chosen, note });
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

      <View style={[styles.card, { width: cardW }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
            {title}
          </Text>
        </View>
        <View style={styles.divider} />

        <ScrollView
          style={{ maxHeight: maxBody }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          {err ? <Text style={styles.err}>Plotëso të gjitha fushat e kërkuara.</Text> : null}

          {/* ── Lloji / Kohëzgjatja ─────────────────────────────── */}
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Lloji:</Text>
              <Select value={type} options={TYPES} onChange={setType} />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Kohëzgjatja (min):</Text>
              <Select value={duration} options={DURATIONS} onChange={setDuration} />
            </View>
          </View>

          {/* ── Data / Ora ──────────────────────────────────────── */}
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Data:</Text>
              <View style={styles.boxRow}>
                <TextInput
                  value={day}
                  onChangeText={setDay}
                  placeholder="DD"
                  placeholderTextColor={MO.ph}
                  maxLength={2}
                  keyboardType="number-pad"
                  allowFontScaling={false}
                  style={styles.box}
                />
                <Text style={styles.sep}>/</Text>
                <TextInput
                  value={month}
                  onChangeText={setMonth}
                  placeholder="MM"
                  placeholderTextColor={MO.ph}
                  maxLength={2}
                  keyboardType="number-pad"
                  allowFontScaling={false}
                  style={styles.box}
                />
                <Text style={styles.sep}>/</Text>
                <TextInput
                  value={year}
                  onChangeText={setYear}
                  placeholder="YYYY"
                  placeholderTextColor={MO.ph}
                  maxLength={4}
                  keyboardType="number-pad"
                  allowFontScaling={false}
                  style={styles.boxYear}
                />
              </View>
            </View>

            <View style={styles.col}>
              <Text style={styles.label}>Ora:</Text>
              <View style={styles.boxRow}>
                <TextInput
                  value={hour}
                  onChangeText={setHour}
                  placeholder="HH"
                  placeholderTextColor={MO.ph}
                  maxLength={2}
                  keyboardType="number-pad"
                  allowFontScaling={false}
                  style={styles.box}
                />
                <Text style={styles.sep}>:</Text>
                <TextInput
                  value={minute}
                  onChangeText={setMinute}
                  placeholder="MM"
                  placeholderTextColor={MO.ph}
                  maxLength={2}
                  keyboardType="number-pad"
                  allowFontScaling={false}
                  style={styles.box}
                />
              </View>
            </View>
          </View>

          {/* ── Fusha ───────────────────────────────────────────── */}
          <Text style={[styles.label, styles.gap]}>Fusha:</Text>
          {hasSlot ? (
            <View>
              {FIELDS.map((f) => {
                const busy = isBusy(f, day, month, `${hour}:${minute}`, minutes);
                const active = f === chosen;

                return (
                  <Pressable
                    key={f}
                    disabled={busy}
                    onPress={() => setField(f)}
                    accessibilityRole="button"
                    accessibilityLabel={`${f} — ${busy ? 'e zënë' : 'e lirë'}`}
                    style={({ pressed }) => [
                      styles.fieldRow,
                      active && styles.fieldRowActive,
                      busy && styles.fieldRowBusy,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.fieldName} numberOfLines={1}>
                      {f}
                    </Text>
                    <Text
                      style={[
                        styles.fieldState,
                        { color: busy ? MO.err : MO.create },
                      ]}
                      numberOfLines={1}
                    >
                      {busy ? 'E zënë' : 'E lirë'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Text style={styles.fieldHint}>
              Zgjedh datën, orën dhe kohëzgjatjen për të parë disponibilitetin.
            </Text>
          )}

          {/* ── Shënime ─────────────────────────────────────────── */}
          <Text style={[styles.label, styles.gap]}>Shënime:</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            multiline
            allowFontScaling={false}
            style={styles.textarea}
            textAlignVertical="top"
          />

          {/* ── Actions ─────────────────────────────────────────── */}
          <View style={styles.actions}>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Anulo"
              style={({ pressed }) => [styles.btn, styles.btnCancel, pressed && styles.pressed]}
            >
              <Text style={styles.btnText}>Anulo</Text>
            </Pressable>
            <Pressable
              onPress={submit}
              accessibilityRole="button"
              accessibilityLabel={confirmLabel}
              style={({ pressed }) => [styles.btn, styles.btnConfirm, pressed && styles.pressed]}
            >
              <Text style={styles.btnText}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

/* Compact select with an in-flow options list */
function Select({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={`Zgjedh ${value}`}
        style={({ pressed }) => [styles.sel, pressed && styles.pressed]}
      >
        <Text style={styles.selText} numberOfLines={1}>
          {value}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={I(11)} color="#777777" />
      </Pressable>
      {open ? (
        <View style={styles.opts}>
          {options.map((o) => {
            const active = o === value;
            return (
              <Pressable
                key={o}
                onPress={() => {
                  onChange(o);
                  setOpen(false);
                }}
                accessibilityRole="button"
                style={[styles.opt, active && styles.optActive]}
              >
                <Text style={[styles.optText, active && styles.optTextActive]} numberOfLines={1}>
                  {o}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Styles                                                              */
/* ------------------------------------------------------------------ */

const styles = StyleSheet.create(
  scaled({
    ovWrap: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 20,
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

    card: {
      marginTop: 100,
      alignSelf: 'center',
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: MO.border,
      borderRadius: 5,
      overflow: 'hidden',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.15,
      shadowRadius: 20,
      elevation: 8,
    },

    cardHeader: {
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
    },

    cardTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 20,
      lineHeight: 24,
      color: MO.title,
    },

    /* The title is ruled off from the fields below it. */
    divider: {
      height: 1,
      backgroundColor: MO.divider,
    },

    content: {
      paddingHorizontal: 15,
      paddingTop: 9,
      paddingBottom: 15,
    },

    err: {
      fontFamily: Fonts.body,
      fontSize: 9,
      color: MO.err,
      marginBottom: 8,
    },

    label: {
      fontFamily: Fonts.body,
      fontSize: 9.5,
      lineHeight: 12,
      color: MO.sub,
      marginBottom: 4,
    },

    gap: {
      marginTop: 16,
    },

    row: {
      marginTop: 15,
      flexDirection: 'row',
      gap: 8,
    },

    col: {
      flex: 1,
    },

    /* ── Selects ─────────────────────────────────────────────── */
    sel: {
      height: 31,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: MO.inputBg,
      borderWidth: 1,
      borderColor: MO.inputBorder,
      borderRadius: 1,
      paddingHorizontal: 8,
    },

    selText: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 11.5,
      color: MO.text,
      marginRight: 3,
    },

    opts: {
      marginTop: 2,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: MO.inputBorder,
      borderRadius: 1,
      overflow: 'hidden',
    },

    opt: {
      height: 25,
      justifyContent: 'center',
      paddingHorizontal: 8,
    },

    optActive: {
      backgroundColor: 'rgba(22,165,29,0.10)',
    },

    optText: {
      fontFamily: Fonts.body,
      fontSize: 10,
      color: MO.text,
    },

    optTextActive: {
      fontFamily: Fonts.bodyBold,
      color: MO.create,
    },

    /* ── Date and time boxes ─────────────────────────────────── */
    boxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },

    box: {
      width: 30,
      height: 30,
      backgroundColor: MO.inputBg,
      borderWidth: 1,
      borderColor: MO.inputBorder,
      borderRadius: 4,
      paddingHorizontal: 0,
      paddingVertical: 0,
      textAlign: 'center',
      fontSize: 11,
      fontFamily: Fonts.body,
      color: MO.text,
    },

    boxYear: {
      width: 50,
      height: 30,
      backgroundColor: MO.inputBg,
      borderWidth: 1,
      borderColor: MO.inputBorder,
      borderRadius: 4,
      paddingHorizontal: 0,
      paddingVertical: 0,
      textAlign: 'center',
      fontSize: 11,
      fontFamily: Fonts.body,
      color: MO.text,
    },

    sep: {
      fontFamily: Fonts.body,
      fontSize: 11,
      color: MO.sub,
    },

    /* ── Fusha ───────────────────────────────────────────────── */
    fieldHint: {
      fontFamily: Fonts.body,
      fontSize: 9.5,
      lineHeight: 13,
      color: MO.sub,
      paddingVertical: 2,
    },

    fieldRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 30,
      paddingHorizontal: 8,
      marginBottom: 4,
      backgroundColor: MO.inputBg,
      borderWidth: 1,
      borderColor: MO.inputBorder,
      borderRadius: 1,
    },

    fieldRowActive: {
      borderColor: MO.create,
      backgroundColor: 'rgba(22,165,29,0.10)',
    },

    fieldRowBusy: {
      opacity: 0.55,
    },

    fieldName: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 11,
      color: MO.text,
      marginRight: 6,
    },

    fieldState: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 9.5,
    },

    /* ── Note ────────────────────────────────────────────────── */
    textarea: {
      height: 76,
      backgroundColor: MO.inputBg,
      borderWidth: 1,
      borderColor: MO.inputBorder,
      borderRadius: 1,
      paddingHorizontal: 8,
      paddingVertical: 7,
      fontSize: 11.5,
      fontFamily: Fonts.body,
      color: MO.text,
    },

    /* ── Actions ─────────────────────────────────────────────── */
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 9,
      marginTop: 12,
    },

    btn: {
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 2,
    },

    btnCancel: {
      width: 74,
      backgroundColor: MO.cancel,
    },

    btnConfirm: {
      width: 74,
      backgroundColor: MO.create,
    },

    btnText: {
      fontFamily: Fonts.bodyMedium,
      fontSize: 10.5,
      color: MO.white,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
