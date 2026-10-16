import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import {
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
import { ApiError } from '@/lib/api/errors';
import { createLibrary } from '@/lib/api/library';
import { listTeams } from '@/lib/api/teams';
import type { ApiTeam } from '@/lib/api/types';
import { type PickedFile } from '@/lib/api/upload';
import { LEVELS, levelCode } from '@/lib/library';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

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

/* A clip is filed by age band, which the API stores as the free-text category. */
const MOSHA = ['8-10 vjeç', '11-13 vjeç', '14-16 vjeç', '17-19 vjeç'];

/* The select's resting option — material that is not shared with a team. */
const NO_TEAM = 'Pa ndarje';

/* The stamp's date line — today, in the same shape the training screens use. */
const now = new Date();
const TODAY = `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

export default function UploadVideoScreen() {
  const router = useRouter();
  const { token, user, signOut } = useSession();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState(LEVELS[0]);
  const [age, setAge] = useState(MOSHA[0]);
  const [team, setTeam] = useState(NO_TEAM);

  const [teams, setTeams] = useState<ApiTeam[]>([]);
  const [file, setFile] = useState<PickedFile | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* Which picker is unrolled, or null when all three are shut. */
  const [open, setOpen] = useState<string | null>(null);

  /* The club's teams, so the material can be shared with a real one. */
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    listTeams(token, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setTeams(res.data);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) {
          signOut();
          router.replace('/login');
        }
      });

    return () => controller.abort();
  }, [token, router, signOut]);

  const teamOptions = [NO_TEAM, ...teams.map((t) => t.name)];

  /* A clip is picked from the media library; only mp4 renders as `Video`. */
  const pickVideo = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsMultipleSelection: false,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    setFile({
      uri: asset.uri,
      name: asset.fileName ?? 'video.mp4',
      mimeType: asset.mimeType ?? 'video/mp4',
    });
  };

  const save = () => {
    if (!token || saving) return;

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Shkruaj titullin e materialit.');
      return;
    }

    const sharedTeamId = teams.find((t) => t.name === team)?.id ?? null;

    setSaving(true);
    setError(null);

    createLibrary(
      token,
      {
        title: trimmedTitle,
        level: levelCode(level),
        category: age || null,
        description: description.trim() || null,
        shared_team_id: sharedTeamId,
      },
      file,
    )
      .then(() => router.back())
      .catch((e) => {
        setSaving(false);
        if (e instanceof ApiError && e.status === 401) {
          signOut();
          router.replace('/login');
          return;
        }
        if (e instanceof ApiError && e.status === 422 && e.fieldErrors) {
          setError(Object.values(e.fieldErrors)[0]?.[0] ?? 'Të dhënat nuk janë të vlefshme.');
        } else if (e instanceof ApiError && e.status === 0) {
          setError('Nuk mund të lidhemi me serverin. Kontrollo lidhjen.');
        } else {
          setError('Materiali nuk mund të ruhet.');
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
                  options={teamOptions}
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
                    {user?.name ?? '—'}
                  </Text>
                  <Text style={styles.stampDate}>{TODAY}</Text>
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
                  onPress={pickVideo}
                  accessibilityRole="button"
                  accessibilityLabel="Ngarko skedarin"
                  style={({ pressed }) => [styles.upload, pressed && styles.pressed]}
                >
                  <View style={styles.uploadCircle}>
                    <MaterialCommunityIcons name="video-plus" size={I(30)} color="#F5F5F5" />
                  </View>
                  <Text style={styles.uploadText} numberOfLines={1}>
                    {file ? file.name ?? 'Video u zgjodh' : 'Kliko për të ngarkuar'}
                  </Text>
                  <Text style={styles.uploadHint}>Vetëm MP4</Text>
                </Pressable>
              </View>
            </View>

            {/* ── Anulo / Ruaj ──────────────────────────────────── */}
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
                style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}
              >
                <Text style={styles.actionText} numberOfLines={1}>
                  Anulo
                </Text>
              </Pressable>
              <Pressable
                onPress={save}
                disabled={saving}
                accessibilityRole="button"
                accessibilityLabel="Ruaj"
                style={({ pressed }) => [
                  styles.saveBtn,
                  saving && styles.saveBtnOff,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.actionText} numberOfLines={1}>
                  {saving ? 'Duke ruajtur…' : 'Ruaj'}
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

    uploadHint: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      color: C.gray,
      marginTop: 2,
    },

    /* ── Error ───────────────────────────────────────────────── */
    errorText: {
      fontFamily: Fonts.body,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.red,
      marginTop: 12,
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

    saveBtnOff: {
      opacity: 0.6,
    },

    actionText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      color: '#F5F5F5',
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
