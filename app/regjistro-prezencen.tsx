import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { TrainingFormModal, parseWhen, type TrainingDraft } from '@/components/trainings/training-form';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import {
  deleteTraining,
  getTraining,
  saveAttendance,
  updateTraining,
} from '@/lib/api/trainings';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';
import {
  draftToInput,
  durationLabel,
  trainingDate,
  trainingTime,
  typeName,
} from '@/lib/trainings';

/**
 * Regjistro prezencën — the trainer marks who turned up, opened from the
 * "Regjistro" button on a row of the training list.
 *
 * The session's own facts sit above the attendance sheet. The header row
 * carries the two "everyone" shortcuts in the same columns as each player's
 * pair of marks, and the sheet ends with the running tally and the save button.
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

/* ── Attendance sheet ──────────────────────────────────────────────── */

type Mark = 'prezent' | 'mungon';

/** One row of the sheet, drawn from the training's own attendance lines. */
type Roster = {
  playerId: number;
  name: string;
  reason: string | null;
};

/** The backend's three states, as the sheet's two marks plus "unmarked". */
function statusToMark(status: string): Mark | null {
  if (status === 'present') return 'prezent';
  if (status === 'absent') return 'mungon';
  return null;
}

/* The two mark columns are as wide as the "everyone" buttons that head them,
   so a player's pair sits directly under the shortcuts. */
const W = {
  name: 100,
  nr: 28,
  pos: 68,
  prezent: 82,
  mungon: 80,
};

export default function RegisterAttendanceScreen() {
  const router = useRouter();
  const { token, signOut } = useSession();

  const params = useLocalSearchParams<{
    id?: string;
    date?: string;
    time?: string;
    field?: string;
    type?: string;
    duration?: string;
  }>();

  const trainingId = params.id != null ? Number(params.id) : NaN;
  const validId = Number.isFinite(trainingId);

  /* The session's own facts, seeded from the list row and refreshed on load. */
  const [date, setDate] = useState(params.date ?? '18 Aug 2026');
  const [time, setTime] = useState(params.time ?? '17:00');
  const [field, setField] = useState(params.field ?? 'Salla e Brendshme');
  const [type, setType] = useState(params.type ?? 'Taktike');
  const [duration, setDuration] = useState(params.duration ?? '90 min');

  const [roster, setRoster] = useState<Roster[]>([]);
  const [marks, setMarks] = useState<(Mark | null)[]>([]);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(
    params.id != null && !Number.isFinite(trainingId) ? 'Mungon stërvitja.' : null,
  );

  /* Load the training's real attendance sheet. */
  useEffect(() => {
    if (!token || !validId) return;
    const controller = new AbortController();

    getTraining(token, trainingId, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        const t = res.data;

        setDate(trainingDate(t.scheduled_at));
        setTime(trainingTime(t.scheduled_at));
        setField(t.field ?? '—');
        setType(typeName(t.type));
        setDuration(durationLabel(t.duration_minutes));

        const rows = t.attendances ?? [];
        setRoster(
          rows.map((a) => ({
            playerId: a.player_id,
            name: a.player_name ?? '—',
            reason: a.reason,
          })),
        );
        setMarks(rows.map((a) => statusToMark(a.status)));
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          signOut();
          router.replace('/login');
          return;
        }
        setError('Nuk mund të ngarkohet lista e lojtarëve.');
      });

    return () => controller.abort();
  }, [token, trainingId, validId, signOut, router]);

  /** Re-reads the session after a write. */
  const reload = () =>
    getTraining(token ?? '', trainingId)
      .then((res) => {
        const t = res.data;
        setDate(trainingDate(t.scheduled_at));
        setTime(trainingTime(t.scheduled_at));
        setField(t.field ?? '—');
        setType(typeName(t.type));
        setDuration(durationLabel(t.duration_minutes));
      })
      .catch(() => undefined);

  const onWriteError = (err: unknown, fallback: string) => {
    if (err instanceof ApiError && err.status === 401) {
      signOut();
      router.replace('/login');
      return;
    }
    Alert.alert(
      'Veprimi dështoi',
      err instanceof ApiError && err.status !== 0 && err.message
        ? err.message
        : 'Nuk mund të lidhemi me serverin. Kontrollo lidhjen.',
    );
  };

  /* Save the edited session, then re-read it so the header matches. */
  const saveEdit = (d: TrainingDraft) => {
    if (!token || !validId) return;
    updateTraining(token, trainingId, draftToInput(d))
      .then(() => {
        setEditing(false);
        reload();
      })
      .catch((err) => {
        setEditing(false);
        onWriteError(err, 'Stërvitja nuk mund të përditësohet.');
      });
  };

  /* Deleting the session takes its attendance sheet with it. */
  const confirmDelete = () => {
    if (!token || !validId) return;
    Alert.alert('Fshi stërvitjen', `A jeni i sigurt që dëshironi ta fshini stërvitjen e ${date}?`, [
      { text: 'Anulo', style: 'cancel' },
      {
        text: 'Fshi',
        style: 'destructive',
        onPress: () =>
          deleteTraining(token, trainingId)
            .then(() => router.back())
            .catch((err) => onWriteError(err, 'Stërvitja nuk mund të fshihet.')),
      },
    ]);
  };

  const present = marks.filter((m) => m === 'prezent').length;
  const absent = marks.filter((m) => m === 'mungon').length;

  const setAll = (mark: Mark) => setMarks(roster.map(() => mark));

  /* Tapping the mark a player already carries takes it back off. */
  const toggle = (index: number, mark: Mark) =>
    setMarks((prev) => prev.map((m, i) => (i === index ? (m === mark ? null : mark) : m)));

  const save = () => {
    if (!token || saving) return;
    if (!validId) {
      setError('Mungon stërvitja.');
      return;
    }

    setSaving(true);
    setError(null);

    const attendance: Record<
      number,
      { status: 'present' | 'absent' | 'unconfirmed'; reason?: string | null }
    > = {};
    roster.forEach((r, i) => {
      const m = marks[i];
      attendance[r.playerId] = {
        status: m === 'prezent' ? 'present' : m === 'mungon' ? 'absent' : 'unconfirmed',
        reason: r.reason,
      };
    });

    saveAttendance(token, trainingId, attendance)
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
          setError('Nuk mund të regjistrohet prezenca.');
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
            {/* ── Edit / delete the session ────────────────────────── */}
            <View style={styles.actionsRow}>
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

              <Pressable
                onPress={confirmDelete}
                accessibilityRole="button"
                accessibilityLabel="Fshi stërvitjen"
                style={({ pressed }) => [styles.delBtn, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={I(14)} color={C.text} />
                <Text style={styles.delBtnText} numberOfLines={1}>
                  Fshi
                </Text>
              </Pressable>
            </View>

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

            {/* ── Attendance sheet ─────────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  Prezenca në stërvitje
                </Text>
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
                  <View style={[styles.tr, styles.headRow]}>
                    <Text style={[styles.th, { width: W.name }]} numberOfLines={1}>
                      Lojtari
                    </Text>
                    <Text style={[styles.th, { width: W.nr }]} numberOfLines={1}>
                      Nr.
                    </Text>
                    <Text style={[styles.th, { width: W.pos }]} numberOfLines={1}>
                      Pozita
                    </Text>

                    <View style={{ width: W.prezent }}>
                      <Pressable
                        onPress={() => setAll('prezent')}
                        accessibilityRole="button"
                        accessibilityLabel="Shëno të gjithë prezent"
                        style={({ pressed }) => [
                          styles.allBtn,
                          styles.allPresent,
                          styles.allBtnHead,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.allText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                          Të gjithë prezent
                        </Text>
                      </Pressable>
                    </View>

                    <View style={{ width: W.mungon }}>
                      <Pressable
                        onPress={() => setAll('mungon')}
                        accessibilityRole="button"
                        accessibilityLabel="Shëno të gjithë mungesë"
                        style={({ pressed }) => [
                          styles.allBtn,
                          styles.allAbsent,
                          styles.allBtnHead,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.allText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                          Të gjithë mungesë
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  {roster.map((p, i) => (
                    <View key={p.playerId} style={[styles.tr, styles.trBorder]}>
                      <Text
                        style={[styles.td, styles.tdName, { width: W.name }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                      >
                        {p.name}
                      </Text>
                      <Text style={[styles.td, { width: W.nr }]} numberOfLines={1}>
                        —
                      </Text>
                      <Text
                        style={[styles.td, { width: W.pos }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                      >
                        —
                      </Text>

                      <View style={{ width: W.prezent }}>
                        <Pressable
                          onPress={() => toggle(i, 'prezent')}
                          accessibilityRole="button"
                          accessibilityLabel={`${p.name} prezent`}
                          style={({ pressed }) => [
                            styles.markBtn,
                            marks[i] === 'prezent' ? styles.markOn : styles.markOff,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Text
                            style={[
                              styles.markText,
                              marks[i] === 'prezent' && styles.markTextOn,
                            ]}
                            numberOfLines={1}
                          >
                            Prezent
                          </Text>
                        </Pressable>
                      </View>

                      <View style={{ width: W.mungon }}>
                        <Pressable
                          onPress={() => toggle(i, 'mungon')}
                          accessibilityRole="button"
                          accessibilityLabel={`${p.name} mungesë`}
                          style={({ pressed }) => [
                            styles.markBtn,
                            marks[i] === 'mungon' ? styles.markOn : styles.markOff,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Text
                            style={[styles.markText, marks[i] === 'mungon' && styles.markTextOn]}
                            numberOfLines={1}
                          >
                            Munges
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* ── Tally and save — under the table, on the page ────── */}
            {error ? (
              <Text style={styles.errorText} numberOfLines={2}>
                {error}
              </Text>
            ) : null}

            <View style={styles.footRow}>
              <Text style={styles.footText} numberOfLines={1}>
                {`${present} prezent • ${absent} mungesë`}
              </Text>
              <Pressable
                onPress={save}
                disabled={saving || !validId}
                accessibilityRole="button"
                accessibilityLabel="Ruaj prezencën"
                style={({ pressed }) => [
                  styles.saveBtn,
                  (saving || !validId) && styles.saveBtnOff,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.saveBtnText} numberOfLines={1}>
                  Ruaj prezencën
                </Text>
              </Pressable>
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
          onConfirm={saveEdit}
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

    /* ── Edit / delete ───────────────────────────────────────── */
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
    },

    editBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 32,
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

    delBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 32,
      paddingHorizontal: 12,
      backgroundColor: C.red,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    delBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.text,
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

    /* ── Attendance sheet ────────────────────────────────────── */
    tblInner: {
      paddingHorizontal: 10,
      paddingBottom: 10,
    },

    /* Stretches the rows to the card's width, so the rules run the full width
       instead of stopping where the last column ends. */
    tblFill: {
      flexGrow: 1,
    },

    headRow: {
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

    /* ── Mark buttons ────────────────────────────────────────── */
    /* The header's shortcuts and every player's pair share one shape, so the
       two columns line up straight down the sheet. */
    allBtn: {
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
      borderWidth: 1,
      borderRadius: 4,
    },

    allBtnHead: {
      backgroundColor: 'transparent',
    },

    allPresent: {
      borderColor: C.green,
    },

    allAbsent: {
      borderColor: C.red,
    },

    /* The row of shortcuts is a heading, so its text stays quiet. */
    allText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 9.5,
      color: C.hint,
    },

    markBtn: {
      height: 24,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 6,
      borderWidth: 1,
      borderRadius: 4,
    },

    /* The rows carry no colour of their own — a mark reads from its weight,
       not its hue. The coloured pair only heads the sheet. */
    markOff: {
      backgroundColor: 'transparent',
      borderColor: C.frame,
    },

    markOn: {
      backgroundColor: C.frame,
      borderColor: C.frame,
    },

    /* The row marks read as a choice, so they carry the full text colour; only
       the heading's two shortcuts stay quiet. */
    markText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10,
      color: C.text,
    },

    markTextOn: {
      color: '#F5F5F5',
    },

    /* ── Tally and save ──────────────────────────────────────── */
    errorText: {
      marginTop: 10,
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 15,
      color: C.red,
    },

    /* Sits under the table's frame, on the page itself. */
    footRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      marginTop: 12,
    },

    footText: {
      fontFamily: Fonts.body,
      fontSize: 10,
      lineHeight: 13,
      color: C.hint,
    },

    saveBtn: {
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      backgroundColor: C.green,
      borderRadius: 4,
    },

    saveBtnOff: {
      opacity: 0.5,
    },

    saveBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: '#F5F5F5',
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
