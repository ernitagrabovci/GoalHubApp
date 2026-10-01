import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * Shto material të ri — opened from "+ Ngarko video" on Video Strategjia.
 * The same three cards as Shto material, except the second picker asks for
 * Mosha rather than Kategoria: a clip is filed by age band, not by subject.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',

  frame: '#000000',
  headLine: 'rgba(30,40,35,0.10)',
  border: 'rgba(100,140,190,0.30)',

  /* blue1 = the deeper card body; blue2 = the pale title strip. */
  blue1: '#E3EEFB',
  blue2: '#F6FBFF',
  blue: '#2F80ED',

  green: '#159447',
  red: '#E03131',
};

const LEVELS = ['Fillestar', 'Mesëm', 'Avancuar'];
const MOSHA = ['8-10 vjeç', '11-13 vjeç', '14-16 vjeç', '17-19 vjeç'];
const TEAMS = ['Ekipi i Parë', 'U17', 'U15', 'U13'];

/** Who is entering this material, and when. */
const AUTHOR = 'Rexhep Hyseni';
const DATE = '25/09/2026';

export default function UploadVideoScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState(LEVELS[0]);
  const [age, setAge] = useState(MOSHA[0]);
  const [team, setTeam] = useState(TEAMS[0]);

  /* Which picker is unrolled, or null when all three are shut. */
  const [open, setOpen] = useState<string | null>(null);

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
                <Text style={styles.title} numberOfLines={1}>
                  Shto material të ri
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Ngarko ushtrime, video dhe materiale
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
            {/* ── Informacioni bazë ─────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.head}>
                <Text style={styles.headText} numberOfLines={1}>
                  Informacioni bazë
                </Text>
              </View>
              <View style={styles.headLine} />

              <View style={styles.body}>
                <Text style={styles.fieldLabel}>Titulli</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Shkruaj titullin e materialit..."
                  placeholderTextColor={C.gray}
                  accessibilityLabel="Titulli"
                  style={styles.input}
                />

                {/* The two pickers share a row, and lift together while one of
                    them hangs its options over the field below. */}
                <View
                  style={[
                    styles.twoRow,
                    (open === 'level' || open === 'age') && styles.rowOpen,
                  ]}
                >
                  <View style={styles.half}>
                    <Text style={styles.fieldLabel}>Niveli</Text>
                    <Select
                      value={level}
                      options={LEVELS}
                      open={open === 'level'}
                      setOpen={(v) => setOpen(v ? 'level' : null)}
                      onChange={setLevel}
                    />
                  </View>

                  <View style={styles.half}>
                    <Text style={styles.fieldLabel}>Mosha</Text>
                    <Select
                      value={age}
                      options={MOSHA}
                      open={open === 'age'}
                      setOpen={(v) => setOpen(v ? 'age' : null)}
                      onChange={setAge}
                    />
                  </View>
                </View>

                <Text style={[styles.fieldLabel, styles.labelGap]}>Përshkrimi</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Shkruaj një përshkrim të shkurtër..."
                  placeholderTextColor={C.gray}
                  multiline
                  textAlignVertical="top"
                  accessibilityLabel="Përshkrimi"
                  style={[styles.input, styles.textarea]}
                />
              </View>
            </View>

            {/* ── Publikimi ─────────────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.head}>
                <Text style={styles.headText} numberOfLines={1}>
                  Publikimi
                </Text>
              </View>
              <View style={styles.headLine} />

              <View style={[styles.body, open === 'team' && styles.rowOpen]}>
                <Text style={styles.fieldLabel}>Shpërndaje te ekipi</Text>
                <Select
                  value={team}
                  options={TEAMS}
                  open={open === 'team'}
                  setOpen={(v) => setOpen(v ? 'team' : null)}
                  onChange={setTeam}
                />

                <Text style={styles.note}>
                  Lojtarët e ekipit të zgjedhur marrin njoftimin.
                </Text>

                {/* The credit, stacked: who, then when. */}
                <View style={styles.stamp}>
                  <Text style={styles.stampLabel}>Shtuar nga</Text>
                  <Text style={styles.stampName} numberOfLines={1}>
                    {AUTHOR}
                  </Text>
                  <Text style={styles.stampDate}>{DATE}</Text>
                </View>
              </View>
            </View>

            {/* ── Skedari i materialit ──────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.head}>
                <Text style={styles.headText} numberOfLines={1}>
                  Skedari i materialit
                </Text>
              </View>
              <View style={styles.headLine} />

              <View style={styles.body}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Ngarko skedarin"
                  style={({ pressed }) => [styles.upload, pressed && styles.pressed]}
                >
                  <View style={styles.uploadCircle}>
                    <MaterialCommunityIcons name="image-plus" size={I(30)} color="#FFFFFF" />
                  </View>
                  <Text style={styles.uploadText}>Kliko për të ngarkuar</Text>
                </Pressable>
              </View>
            </View>

            {/* ── Anulo / Ruaj ──────────────────────────────────── */}
            <View style={styles.actions}>
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                accessibilityLabel="Anulo"
                style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
              >
                <Text style={styles.actionText} numberOfLines={1}>
                  Anulo
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ruaj"
                style={({ pressed }) => [styles.saveBtn, pressed && styles.pressed]}
              >
                <Text style={styles.actionText} numberOfLines={1}>
                  Ruaj
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* One picker                                                          */
/* ------------------------------------------------------------------ */

function Select({
  value,
  options,
  open,
  setOpen,
  onChange,
}: {
  value: string;
  options: string[];
  open: boolean;
  setOpen: (open: boolean) => void;
  onChange: (v: string) => void;
}) {
  return (
    <View style={[styles.selectWrap, open && styles.fieldOpen]}>
      <Pressable
        onPress={() => setOpen(!open)}
        accessibilityRole="button"
        accessibilityLabel={value}
        style={({ pressed }) => [styles.select, pressed && styles.pressed]}
      >
        <Text style={styles.selectText} numberOfLines={1}>
          {value}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={I(14)} color={C.text} />
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
                accessibilityLabel={o}
                style={[styles.opt, active && styles.optActive]}
              >
                <Text
                  style={[styles.optText, active && styles.optTextActive]}
                  numberOfLines={1}
                >
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

    /* ── Cards ───────────────────────────────────────────────── */
    /* Nothing may clip — a picker's options hang past the card's foot. */
    card: {
      marginTop: 14,
      backgroundColor: C.blue2,
      borderWidth: 2,
      borderColor: C.border,
      borderRadius: 7,
      overflow: 'visible',
    },

    head: {
      alignItems: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 11,
      backgroundColor: C.blue2,
      borderTopLeftRadius: 5,
      borderTopRightRadius: 5,
    },

    headText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 14,
      lineHeight: 18,
      color: C.text,
    },

    headLine: {
      height: 1,
      backgroundColor: C.headLine,
    },

    body: {
      backgroundColor: C.blue1,
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 14,
      borderBottomLeftRadius: 5,
      borderBottomRightRadius: 5,
    },

    /* ── Fields ──────────────────────────────────────────────── */
    fieldLabel: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.text,
      marginBottom: 5,
    },

    /* Labels that follow a control rather than opening a card. */
    labelGap: {
      marginTop: 14,
    },

    input: {
      height: 38,
      paddingHorizontal: 10,
      paddingVertical: 0,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
      fontFamily: Fonts.body,
      fontSize: 12,
      color: C.text,
    },

    textarea: {
      height: 92,
      paddingTop: 9,
      paddingBottom: 9,
    },

    /* ── Picker rows ─────────────────────────────────────────── */
    twoRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      marginTop: 14,
    },

    /* Lifted while a picker is unrolled, so its options fall over whatever
       sits below instead of under it. */
    rowOpen: {
      zIndex: 30,
      elevation: 30,
    },

    half: {
      flex: 1,
    },

    selectWrap: {
      position: 'relative',
    },

    fieldOpen: {
      zIndex: 30,
      elevation: 30,
    },

    select: {
      height: 38,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
      paddingHorizontal: 10,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    selectText: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 15,
      color: C.text,
    },

    /* Floats over the fields below, so opening it moves nothing. */
    opts: {
      position: 'absolute',
      top: 41,
      left: 0,
      right: 0,
      zIndex: 40,
      elevation: 12,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
      overflow: 'hidden',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
    },

    opt: {
      height: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },

    optActive: {
      backgroundColor: C.blue1,
    },

    optText: {
      fontFamily: Fonts.body,
      fontSize: 12,
      color: C.text,
    },

    optTextActive: {
      fontFamily: Fonts.bodyBold,
      color: C.blue,
    },

    /* ── Publikimi ───────────────────────────────────────────── */
    note: {
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 15,
      color: C.hint,
      marginTop: 10,
    },

    /* The credit block: a washed bar across the card, its lines centred. */
    stamp: {
      marginTop: 10,
      paddingHorizontal: 14,
      paddingVertical: 16,
      alignItems: 'center',
      backgroundColor: 'rgba(227,227,227,0.50)',
      borderWidth: 1,
      borderColor: C.gray,
      borderRadius: 4,
    },

    stampLabel: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      lineHeight: 16,
      color: C.text,
    },

    stampName: {
      textAlign: 'center',
      fontFamily: Fonts.bodyBold,
      fontSize: 17,
      lineHeight: 21,
      color: C.text,
      marginTop: 3,
    },

    stampDate: {
      textAlign: 'center',
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.text,
      marginTop: 3,
    },

    /* ── Skedari i materialit ────────────────────────────────── */
    upload: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 20,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    /* The white glyph sits on a solid green disc. */
    uploadCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.green,
    },

    uploadText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      color: C.text,
      marginTop: 8,
    },

    /* ── Anulo / Ruaj ────────────────────────────────────────── */
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
      marginTop: 14,
    },

    /* Solid fills, no rim — the label carries the weight instead. */
    cancelBtn: {
      height: 34,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.red,
      borderRadius: 4,
    },

    saveBtn: {
      height: 34,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.green,
      borderRadius: 4,
    },

    actionText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      color: '#FFFFFF',
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
