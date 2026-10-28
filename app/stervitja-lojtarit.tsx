import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import { cancelAbsence, getMyTraining, reportAbsence } from '@/lib/api/trainings';
import type { ApiTraining } from '@/lib/api/types';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';
import { attendanceLabel, durationLabel, trainingDate, trainingTime, typeName } from '@/lib/trainings';

/**
 * Stërvitja — one session in full, opened from the "Shiko" button on a row of
 * the player's training list.
 *
 * The trainer's session page without the editing affordances: a player reads
 * the session, they don't change it. The session's facts as a two-by-two grid,
 * then the attendance card, where the player can report — or take back — an
 * absence before the session starts.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',

  frame: '#000000',
  headLine: 'rgba(30,40,35,0.10)',

  /* The table ground is the palest blue. */
  card: '#F6FBFF',

  blue: '#4E90D8',
  danger: '#B03A2E',
};

export default function PlayerTrainingScreen() {
  const router = useRouter();
  const { token, signOut } = useSession();

  const params = useLocalSearchParams<{
    id?: string;
    date?: string;
    time?: string;
    field?: string;
    type?: string;
    duration?: string;
    attendance?: string;
  }>();

  const trainingId = Number(params.id);

  /* The session's own facts come from the list row while the detail loads. */
  const [session, setSession] = useState<ApiTraining | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  /* Whether the session already started — an absence can't be filed by then. */
  const [past, setPast] = useState(false);

  /* Reporting an absence: the inline form and its request state. */
  const [reporting, setReporting] = useState(false);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !Number.isFinite(trainingId) || trainingId <= 0) return;
    const controller = new AbortController();

    getMyTraining(token, trainingId, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setSession(res.data);
        setPast(
          !!res.data.scheduled_at &&
            new Date(res.data.scheduled_at).getTime() < Date.now(),
        );
        setLoadError(null);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          signOut();
          router.replace('/login');
          return;
        }
        setLoadError(
          err instanceof ApiError && err.status === 0
            ? 'Nuk mund të lidhemi me serverin. Kontrollo lidhjen.'
            : 'Nuk mund të ngarkohet stërvitja.',
        );
      });

    return () => controller.abort();
  }, [token, trainingId, router, signOut]);

  const date = session ? trainingDate(session.scheduled_at) : params.date ?? '—';
  const time = session ? trainingTime(session.scheduled_at) : params.time ?? '—';
  const field = session ? session.field ?? '—' : params.field ?? '—';
  const type = session ? typeName(session.type) : params.type ?? '—';
  const duration = session ? durationLabel(session.duration_minutes) : params.duration ?? '—';

  const status = session?.my_attendance ?? params.attendance ?? null;
  const attendance = attendanceLabel(status);
  const absenceReason = session?.my_absence_reason ?? null;

  const reported = status === 'absent' && !!absenceReason;
  const canReport = !!session && !past && status !== 'present' && !reported;

  function handleActionError(err: unknown) {
    if (err instanceof ApiError && err.status === 401) {
      signOut();
      router.replace('/login');
      return;
    }
    if (err instanceof ApiError && err.status === 0) {
      setActionError('Nuk mund të lidhemi me serverin. Kontrollo lidhjen.');
      return;
    }
    setActionError(err instanceof ApiError ? err.message : 'Veprimi nuk u krye.');
  }

  async function submitReport() {
    if (!token || !session) return;

    const text = reason.trim();
    if (!text) {
      setActionError('Shkruani një arsye për mungesën.');
      return;
    }

    setSaving(true);
    setActionError(null);
    setNotice(null);

    try {
      const res = await reportAbsence(token, session.id, text);
      setSession(res.data);
      setReason('');
      setReporting(false);
      setNotice(res.message);
    } catch (err) {
      handleActionError(err);
    } finally {
      setSaving(false);
    }
  }

  async function submitCancel() {
    if (!token || !session) return;

    setSaving(true);
    setActionError(null);
    setNotice(null);

    try {
      const res = await cancelAbsence(token, session.id);
      setSession(res.data);
      setReporting(false);
      setReason('');
      setNotice(res.message);
    } catch (err) {
      handleActionError(err);
    } finally {
      setSaving(false);
    }
  }

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
                  Prezenca ime
                </Text>
              </View>

              <View style={styles.noteBody}>
                <Text style={styles.noteText}>
                  {attendance === '—' ? 'Pa finalizuar nga trajneri' : attendance}
                </Text>

                {absenceReason ? (
                  <Text style={styles.reasonText}>Arsyeja: {absenceReason}</Text>
                ) : null}

                {loadError ? <Text style={styles.errorText}>{loadError}</Text> : null}
                {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
                {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}

                {reported ? (
                  <Pressable
                    onPress={submitCancel}
                    disabled={saving}
                    accessibilityRole="button"
                    accessibilityLabel="Anulo lajmërimin e mungesës"
                    style={({ pressed }) => [
                      styles.ghostBtn,
                      saving && styles.btnDisabled,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.ghostBtnText}>
                      {saving ? 'Duke anuluar…' : 'Anulo mungesën'}
                    </Text>
                  </Pressable>
                ) : canReport && reporting ? (
                  <View style={styles.reportForm}>
                    <TextInput
                      value={reason}
                      onChangeText={setReason}
                      placeholder="Arsyeja e mungesës"
                      placeholderTextColor={C.gray}
                      style={styles.reasonInput}
                      maxLength={300}
                      multiline
                      editable={!saving}
                    />
                    <View style={styles.formActions}>
                      <Pressable
                        onPress={() => {
                          setReporting(false);
                          setReason('');
                          setActionError(null);
                        }}
                        disabled={saving}
                        accessibilityRole="button"
                        style={({ pressed }) => [
                          styles.ghostBtn,
                          styles.formBtn,
                          saving && styles.btnDisabled,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.ghostBtnText}>Anulo</Text>
                      </Pressable>
                      <Pressable
                        onPress={submitReport}
                        disabled={saving}
                        accessibilityRole="button"
                        style={({ pressed }) => [
                          styles.primaryBtn,
                          styles.formBtn,
                          saving && styles.btnDisabled,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.primaryBtnText}>
                          {saving ? 'Duke dërguar…' : 'Dërgo'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ) : canReport ? (
                  <Pressable
                    onPress={() => {
                      setReporting(true);
                      setNotice(null);
                      setActionError(null);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Raporto mungesë"
                    style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                  >
                    <Text style={styles.primaryBtnText}>Raporto mungesë</Text>
                  </Pressable>
                ) : null}
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
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 10,
      paddingTop: 10,
      paddingBottom: 9,
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
    },

    cardTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.text,
      textAlign: 'center',
    },

    /* ── Session details ─────────────────────────────────────── */
    tblInner: {
      paddingHorizontal: 10,
      paddingBottom: 10,
    },

    /* Two label/value cells on a row, shorter than the table's own rows. */
    detailRow: {
      gap: 10,
      paddingVertical: 5,
      minHeight: 0,
    },

    /* Label and value sit on one line, with the value held a little off the
       label so the pair reads as two columns rather than one phrase. */
    detailCell: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 12,
    },

    detailLabel: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.hint,
    },

    detailValue: {
      flexShrink: 1,
      fontFamily: Fonts.bodyBold,
      fontSize: 11.5,
      lineHeight: 16,
      color: C.text,
    },

    /* ── Attendance ──────────────────────────────────────────── */
    noteBody: {
      paddingHorizontal: 12,
      paddingVertical: 12,
      gap: 10,
    },

    noteText: {
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 15,
      color: C.hint,
      textAlign: 'center',
    },

    reasonText: {
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 15,
      color: C.text,
      textAlign: 'center',
    },

    errorText: {
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 15,
      color: C.danger,
      textAlign: 'center',
    },

    noticeText: {
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 15,
      color: C.blue,
      textAlign: 'center',
    },

    reportForm: {
      gap: 8,
    },

    reasonInput: {
      minHeight: 64,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.18)',
      borderRadius: 5,
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 16,
      color: C.text,
      textAlignVertical: 'top',
    },

    formActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
    },

    formBtn: {
      minWidth: 92,
    },

    primaryBtn: {
      alignSelf: 'center',
      minWidth: 160,
      height: 34,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.blue,
      borderRadius: 5,
    },

    primaryBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      color: '#FFFFFF',
    },

    ghostBtn: {
      alignSelf: 'center',
      minWidth: 160,
      height: 34,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 5,
    },

    ghostBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      color: C.text,
    },

    btnDisabled: {
      opacity: 0.5,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 44,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
