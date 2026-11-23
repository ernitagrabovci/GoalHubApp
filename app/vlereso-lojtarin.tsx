import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import {
  PanResponder,
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
import { ratePlayer } from '@/lib/api/players';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';
import { useAppColors, usePaletteStyles, type AppColorsOf } from '@/lib/app-theme';

/**
 * Vlerëso lojtarin — the trainer's grading form, opened from the "Vlerëso"
 * button on a ratings card.
 *
 * One row per category: the name and its score on a line, the rail with its
 * sliding square under them, and the two ends of the scale below that. Then the
 * date, the comment, and the cancel/create pair.
 */

const C_LIGHT = {
  page: '#F7F9F8',
  line: 'rgba(0,0,0,0.025)',

  text: '#17251E',
  gray: '#52645A',
  hint: '#6E6E6E',
  hintSoft: '#E2E2E2',

  frame: '#DCE5DF',
  white: '#FFFFFF',
  blueSoft: '#E3EEFB',

  /* Fields sit on the blue card, so they are hollow rather than filled. */
  inputBg: 'transparent',
  inputBorder: '#777777',
  ph: '#A8A8A8',

  green: '#2E7D5B',
  cancel: '#B91C1C',
  create: '#2E7D5B',
};

/* ── The graded categories ─────────────────────────────────────────── */

const CATEGORIES = ['Teknika', 'Fiziku', 'Taktikat', 'Stabilitet', 'Punë ekipore'];

const MIN = 1;
const MAX = 10;

/** Every row opens on the middle of the scale. */
const START = 5;

/* Rail geometry — the square straddles the line, so the wrapper is taller than
   the line and the square is offset up by half the difference. */
const THUMB = 14;
const THUMB_HALF = THUMB / 2;
const RAIL_H = 4;
const RAIL_WRAP = 22;

/**
 * One graded category. The square is dragged by hand through a PanResponder
 * rather than a slider library, so the rail measures itself and the gesture is
 * turned into tenths of a point.
 */
function RatingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const C = useAppColors(C_LIGHT);
  const styles = usePaletteStyles(createStyles, C);
  const widthRef = useRef(0);
  const startRef = useRef(value);
  const valueRef = useRef(value);
  const changeRef = useRef(onChange);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    changeRef.current = onChange;
  }, [onChange]);

  /* eslint-disable react-hooks/refs -- PanResponder handlers read refs at gesture
     time; created once so closures cannot be stale, and React Compiler cannot
     analyze the ref access without flagging the render-phase creation. */
  const [pan] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        startRef.current = valueRef.current;
      },
      onPanResponderMove: (_e, g) => {
        const width = widthRef.current;
        if (!width) return;
        const next = startRef.current + (g.dx / width) * (MAX - MIN);
        const clamped = Math.min(MAX, Math.max(MIN, next));
        changeRef.current(Math.round(clamped));
      },
    }),
  );
  /* eslint-enable react-hooks/refs */

  /* Where the square sits — inset by half its width so it stays centred on the
     value instead of hanging off it. */
  const pct = ((value - MIN) / (MAX - MIN)) * 100;

  return (
    <View style={styles.slider}>
      <View style={styles.sliderTop}>
        <Text style={styles.sliderLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.sliderValue}>{value.toFixed(1)}</Text>
      </View>

      <View
        {...pan.panHandlers}
        onLayout={(e) => {
          widthRef.current = e.nativeEvent.layout.width;
        }}
        style={styles.railWrap}
      >
        {/* The graded part of the scale, filling from the left to the square. */}
        <View style={styles.rail}>
          <View style={[styles.railFill, { width: `${pct}%` }]} />
        </View>
        <View style={[styles.thumb, { left: `${pct}%` }]} />
      </View>

      <View style={styles.scaleRow}>
        <Text style={styles.scaleText}>1.0</Text>
        <Text style={styles.scaleText}>10.0</Text>
      </View>
    </View>
  );
}

export default function RatePlayerScreen() {
  const C = useAppColors(C_LIGHT);
  const styles = usePaletteStyles(createStyles, C);
  const router = useRouter();
  const { token, signOut } = useSession();

  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    team?: string;
    nr?: string;
  }>();
  const name = params.name ?? '—';

  const [scores, setScores] = useState<number[]>(() => CATEGORIES.map(() => START));
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setScore = (index: number, value: number) =>
    setScores((prev) => prev.map((score, i) => (i === index ? value : score)));

  /** The rating date from the DD/MM/YYYY boxes, or today when they are not a
      usable date. */
  const ratedAt = (): string => {
    const d = Number(day);
    const m = Number(month);
    const y = Number(year);
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 1000 && y <= 9999) {
      return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    return new Date().toISOString().slice(0, 10);
  };

  const save = () => {
    if (!token || saving) return;
    const id = Number(params.id);
    if (!id || Number.isNaN(id)) {
      setError('Mungon lojtari.');
      return;
    }
    setSaving(true);
    setError(null);

    ratePlayer(token, id, {
      technique: scores[0],
      physical: scores[1],
      tactics: scores[2],
      consistency: scores[3],
      teamwork: scores[4],
      comment: comment.trim() || null,
      rated_at: ratedAt(),
    })
      .then(() => router.back())
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          signOut();
          router.replace('/login');
          return;
        }
        setSaving(false);
        if (err instanceof ApiError && err.status === 0) {
          setError('Nuk mund të lidhemi me serverin. Kontrollo lidhjen.');
        } else if (err instanceof ApiError && err.status === 422) {
          setError('Të dhënat nuk janë të vlefshme. Kontrollo fushat.');
        } else {
          setError('Vlerësimi nuk mund të ruhet.');
        }
      });
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
                <Text
                  style={styles.title}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  {`Vlerëso: ${name}`}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.colPad}>
            {/* One card for the whole form — the graded rows, the date, the
                comment and the actions all ride on the same blue pane, and the
                frame closes below the buttons. */}
            <View style={styles.card}>
              {/* ── The graded rows ────────────────────────────────── */}
              {CATEGORIES.map((category, i) => (
                <RatingRow
                  key={category}
                  label={category}
                  value={scores[i]}
                  onChange={(value) => setScore(i, value)}
                />
              ))}

              {/* ── Date ───────────────────────────────────────────── */}
              <Text style={styles.formLabel}>Data e vlerësimit</Text>
              <View style={styles.dateRow}>
                <TextInput
                  value={day}
                  onChangeText={setDay}
                  placeholder="DD"
                  placeholderTextColor={C.phText}
                  maxLength={2}
                  keyboardType="number-pad"
                  allowFontScaling={false}
                  style={styles.dateBox}
                />
                <Text style={styles.dateSep}>/</Text>
                <TextInput
                  value={month}
                  onChangeText={setMonth}
                  placeholder="MM"
                  placeholderTextColor={C.phText}
                  maxLength={2}
                  keyboardType="number-pad"
                  allowFontScaling={false}
                  style={styles.dateBox}
                />
                <Text style={styles.dateSep}>/</Text>
                <TextInput
                  value={year}
                  onChangeText={setYear}
                  placeholder="YYYY"
                  placeholderTextColor={C.phText}
                  maxLength={4}
                  keyboardType="number-pad"
                  allowFontScaling={false}
                  style={styles.yearBox}
                />
              </View>

              {/* ── Comment ────────────────────────────────────────── */}
              <Text style={[styles.formLabel, styles.formGap]}>Koment</Text>
              <TextInput
                value={comment}
                onChangeText={setComment}
                multiline
                allowFontScaling={false}
                style={styles.textarea}
                textAlignVertical="top"
              />

              {/* ── Actions ────────────────────────────────────────── */}
              {error ? (
                <Text style={styles.errorText} numberOfLines={2}>
                  {error}
                </Text>
              ) : null}

              <View style={styles.actions}>
                <Pressable
                  onPress={() => router.back()}
                  accessibilityRole="button"
                  accessibilityLabel="Anulo"
                  style={({ pressed }) => [
                    styles.btn,
                    styles.btnCancel,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.btnText}>Anulo</Text>
                </Pressable>
                <Pressable
                  onPress={save}
                  disabled={saving}
                  accessibilityRole="button"
                  accessibilityLabel="Ruaj vlerësimin"
                  style={({ pressed }) => [
                    styles.btn,
                    styles.btnCreate,
                    saving && styles.btnOff,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.btnText}>Ruaj vlerësimin</Text>
                </Pressable>
              </View>
            </View>
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

    scroll: {
      paddingBottom: 24,
    },

    /* ── Graded rows ─────────────────────────────────────────── */
    card: {
      backgroundColor: C.blueSoftFill,
      borderWidth: 1,
      borderColor: C.frameBorder,
      borderRadius: 5,
      paddingHorizontal: 12,
      paddingTop: 4,
      paddingBottom: 12,
    },

    slider: {
      marginTop: 12,
    },

    sliderTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },

    sliderLabel: {
      flexShrink: 1,
      fontFamily: Fonts.bodyBold,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.textText,
    },

    sliderValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 13,
      lineHeight: 17,
      color: C.textText,
    },

    /* Tall enough to be a comfortable grab target around the thin rail. */
    railWrap: {
      height: RAIL_WRAP,
      justifyContent: 'center',
      marginTop: 2,
    },

    rail: {
      height: RAIL_H,
      borderRadius: RAIL_H / 2,
      backgroundColor: C.hintSoftFill,
    },

    /* Rides inside the rail, so it stops where the square does. */
    railFill: {
      height: RAIL_H,
      borderRadius: RAIL_H / 2,
      backgroundColor: C.greenFill,
    },

    /* The white square that sets the score. */
    thumb: {
      position: 'absolute',
      top: (RAIL_WRAP - THUMB) / 2,
      width: THUMB,
      height: THUMB,
      marginLeft: -THUMB_HALF,
      backgroundColor: C.whiteFill,
      borderWidth: 1,
      borderColor: C.frameBorder,
      borderRadius: 2,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },

    scaleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 1,
    },

    scaleText: {
      fontFamily: Fonts.body,
      fontSize: 9,
      lineHeight: 12,
      color: C.grayText,
    },

    /* ── Form fields ─────────────────────────────────────────── */
    formLabel: {
      marginTop: 16,
      marginBottom: 5,
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.hintText,
    },

    formGap: {
      marginTop: 18,
    },

    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },

    dateBox: {
      width: 36,
      height: 44,
      backgroundColor: C.inputBgFill,
      borderWidth: 1,
      borderColor: C.inputBorderBorder,
      borderRadius: 8,
      paddingHorizontal: 0,
      paddingVertical: 0,
      textAlign: 'center',
      fontSize: 13,
      fontFamily: Fonts.body,
      color: C.textText,
    },

    yearBox: {
      width: 60,
      height: 44,
      backgroundColor: C.inputBgFill,
      borderWidth: 1,
      borderColor: C.inputBorderBorder,
      borderRadius: 8,
      paddingHorizontal: 0,
      paddingVertical: 0,
      textAlign: 'center',
      fontSize: 13,
      fontFamily: Fonts.body,
      color: C.textText,
    },

    dateSep: {
      fontFamily: Fonts.body,
      fontSize: 11,
      color: C.grayText,
    },

    textarea: {
      height: 76,
      backgroundColor: C.inputBgFill,
      borderWidth: 1,
      borderColor: C.inputBorderBorder,
      borderRadius: 4,
      paddingHorizontal: 8,
      paddingVertical: 7,
      fontSize: 11.5,
      fontFamily: Fonts.body,
      color: C.textText,
    },

    /* ── Actions ─────────────────────────────────────────────── */
    errorText: {
      marginTop: 14,
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 15,
      color: C.cancelText,
    },

    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 9,
      marginTop: 16,
    },

    btn: {
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 10,
      paddingHorizontal: 18,
    },

    btnCancel: {
      backgroundColor: C.cancelFill,
    },

    btnCreate: {
      backgroundColor: C.createFill,
    },

    btnOff: {
      opacity: 0.5,
    },

    btnText: {
      fontFamily: Fonts.bodyMedium,
      fontSize: 13,
      lineHeight: 18,
      color: C.whiteText,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
