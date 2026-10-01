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
 * Injury form popup — the one sheet behind "Regjistro lëndim" on the doctor's
 * page and "Edito" on a single injury.
 *
 * The squad, the kind of injury and the injury's dates come first, then the
 * description and the treatment as free text.
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

const PLAYERS = [
  'Bekim Rexhepi',
  'Dardan Krasniqi',
  'Endrit Hoxha',
  'Genc Morina',
  'Ardit Llapashtica',
  'Hamdi Shala',
  'Driton Demiri',
  'Enver Mustafa',
  'Narti Cerkini',
];

const TYPES = ['Muskulor', 'Kyç', 'Gisht', 'Shputë', 'Shpatullë', 'Kofshë', 'Kokë', 'Gripi', 'Tjetër'];
const DURING = ['Ndeshje', 'Stërvitje', 'Tjetër'];
const STATUSES = ['I lënduar', 'Në rehabilitim', 'I shëruar'];

type DateParts = { day: string; month: string; year: string };

const EMPTY_DATE: DateParts = { day: '', month: '', year: '' };

/** "18/08/2026" back into its three boxes; anything else opens empty. */
export function parseDate(value: string): DateParts {
  const [day, month, year] = value.split('/');
  if (!day || !month || !year) return EMPTY_DATE;
  return { day, month, year };
}

/** The three boxes back into "18/08/2026". */
export function formatDate({ day, month, year }: DateParts): string {
  return `${day}/${month}/${year}`;
}

const isFilled = (d: DateParts) => d.day.length === 2 && d.month.length === 2 && d.year.length === 4;

export type InjuryDraft = {
  player: string;
  type: string;
  during: string;
  status: string;
  date: string;
  returnDate: string;
  serviceDate: string;
  desc: string;
  treatment: string;
};

export function InjuryFormModal({
  title,
  confirmLabel,
  initial,
  onClose,
  onConfirm,
}: {
  title: string;
  confirmLabel: string;
  initial?: Partial<InjuryDraft>;
  onClose: () => void;
  onConfirm: (draft: InjuryDraft) => void;
}) {
  const { width, height } = useWindowDimensions();
  const cardW = Math.min(width - 24, 360);
  const maxBody = Math.max(280, height - 187);

  const [player, setPlayer] = useState(initial?.player ?? PLAYERS[0]);
  const [type, setType] = useState(initial?.type ?? TYPES[0]);
  const [during, setDuring] = useState(initial?.during ?? DURING[1]);
  const [status, setStatus] = useState(initial?.status ?? STATUSES[0]);
  const [date, setDate] = useState<DateParts>(() => parseDate(initial?.date ?? ''));
  const [returnDate, setReturnDate] = useState<DateParts>(() =>
    parseDate(initial?.returnDate ?? ''),
  );
  const [desc, setDesc] = useState(initial?.desc ?? '');
  const [treatment, setTreatment] = useState(initial?.treatment ?? '');
  const [err, setErr] = useState(false);

  const submit = () => {
    if (!player || !type || !isFilled(date) || !isFilled(returnDate)) {
      setErr(true);
      return;
    }
    onConfirm({
      player,
      type,
      during,
      status,
      date: formatDate(date),
      returnDate: formatDate(returnDate),
      /* Not asked for here, so a new injury carries the injury's own date. */
      serviceDate: initial?.serviceDate || formatDate(date),
      desc,
      treatment,
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
          {err ? <Text style={styles.err}>Plotëso lojtarin, llojin dhe datat.</Text> : null}

          {/* ── Lojtari / Lloji ─────────────────────────────────── */}
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Lojtari:</Text>
              <Select value={player} options={PLAYERS} onChange={setPlayer} />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Lloji i lëndimit:</Text>
              <Select value={type} options={TYPES} onChange={setType} />
            </View>
          </View>

          {/* ── Ndodhi gjatë / Statusi ──────────────────────────── */}
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Ndodhi gjatë:</Text>
              <Select value={during} options={DURING} onChange={setDuring} />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Statusi:</Text>
              <Select value={status} options={STATUSES} onChange={setStatus} />
            </View>
          </View>

          {/* ── Dates ───────────────────────────────────────────── */}
          <View style={styles.row}>
            <View style={styles.col}>
              <DateBox label="Data e lëndimit:" value={date} onChange={setDate} />
            </View>
            <View style={styles.col}>
              <DateBox label="Kthimi i pritshëm:" value={returnDate} onChange={setReturnDate} />
            </View>
          </View>

          {/* ── Free text ───────────────────────────────────────── */}
          <Text style={[styles.label, styles.gap]}>Përshkrimi:</Text>
          <TextInput
            value={desc}
            onChangeText={setDesc}
            multiline
            allowFontScaling={false}
            style={styles.textarea}
            textAlignVertical="top"
          />

          <Text style={[styles.label, styles.gap]}>Trajtimi:</Text>
          <TextInput
            value={treatment}
            onChangeText={setTreatment}
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

/* Three boxes on one line, so every date on the sheet reads the same way */
function DateBox({
  label,
  value,
  onChange,
}: {
  label: string;
  value: DateParts;
  onChange: (next: DateParts) => void;
}) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.boxRow}>
        <TextInput
          value={value.day}
          onChangeText={(day) => onChange({ ...value, day })}
          placeholder="DD"
          placeholderTextColor={MO.ph}
          maxLength={2}
          keyboardType="number-pad"
          allowFontScaling={false}
          style={styles.box}
        />
        <Text style={styles.sep}>/</Text>
        <TextInput
          value={value.month}
          onChangeText={(month) => onChange({ ...value, month })}
          placeholder="MM"
          placeholderTextColor={MO.ph}
          maxLength={2}
          keyboardType="number-pad"
          allowFontScaling={false}
          style={styles.box}
        />
        <Text style={styles.sep}>/</Text>
        <TextInput
          value={value.year}
          onChangeText={(year) => onChange({ ...value, year })}
          placeholder="YYYY"
          placeholderTextColor={MO.ph}
          maxLength={4}
          keyboardType="number-pad"
          allowFontScaling={false}
          style={styles.boxYear}
        />
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

    /* ── Date boxes ──────────────────────────────────────────── */
    boxRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },

    box: {
      width: 27,
      height: 30,
      backgroundColor: MO.inputBg,
      borderWidth: 1,
      borderColor: MO.inputBorder,
      borderRadius: 4,
      paddingHorizontal: 0,
      paddingVertical: 0,
      textAlign: 'center',
      fontSize: 10.5,
      fontFamily: Fonts.body,
      color: MO.text,
    },

    boxYear: {
      width: 42,
      height: 30,
      backgroundColor: MO.inputBg,
      borderWidth: 1,
      borderColor: MO.inputBorder,
      borderRadius: 4,
      paddingHorizontal: 0,
      paddingVertical: 0,
      textAlign: 'center',
      fontSize: 10.5,
      fontFamily: Fonts.body,
      color: MO.text,
    },

    sep: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      color: MO.sub,
    },

    /* ── Free text ───────────────────────────────────────────── */
    textarea: {
      height: 66,
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
