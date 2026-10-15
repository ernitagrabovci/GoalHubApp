import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import { listPlayers, transferPlayer } from '@/lib/api/players';
import { listTeams } from '@/lib/api/teams';
import type { ApiPlayer, ApiTeam } from '@/lib/api/types';
import { positionLabel } from '@/lib/player-position';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * Transferimet — opened from the "Transferimet" card on "Lista e ekipeve".
 *
 * Same light #FAFBFA canvas. A blue "Transferim i shpejtë" form card up top,
 * then the "Lojtarët sipas ekipit" table, whose rows fill the page down
 * to the outlined footer button — the page itself never scrolls.
 *
 * The player and team pickers are backed by `GET /players` and `GET /teams`;
 * "Transfero" moves the chosen player with `POST /players/{player}/transfer`.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',

  card: '#F6FBFF',
  border: 'rgba(100,140,190,0.30)',
  rowLine: 'rgba(100,140,190,0.22)',
  headLine: 'rgba(30,40,35,0.10)',

  green: '#159447',
  red: '#E03131',

  ghost: '#9E9E9E',
  ghostLine: '#D6D6D6',
};

type Col = { key: string; label: string; width: number };

const COLS: Col[] = [
  { key: 'name', label: 'Emri', width: 54 },
  { key: 'team', label: 'Ekipi aktual', width: 80 },
  { key: 'pos', label: 'Pozicioni', width: 62 },
  { key: 'nr', label: 'Nr.', width: 22 },
];

/** Normalises any thrown value into a short Albanian message. */
function errorText(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return 'Nuk mund të lidhemi me serverin. Kontrollo lidhjen.';
    return error.message;
  }
  return 'Diçka shkoi keq. Provo përsëri.';
}

export default function TransferimetScreen() {
  const router = useRouter();
  const { token, signOut } = useSession();

  const [players, setPlayers] = useState<ApiPlayer[]>([]);
  const [teams, setTeams] = useState<ApiTeam[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [playerId, setPlayerId] = useState<number | null>(null);
  const [teamId, setTeamId] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [openPick, setOpenPick] = useState<'player' | 'team' | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedPlayer = players.find((p) => p.id === playerId) ?? null;
  const selectedTeam = teams.find((t) => t.id === teamId) ?? null;

  // Players + teams drive the whole screen — fetched together, refetched after
  // a transfer so the rows pick up the player's new team.
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    Promise.allSettled([
      listPlayers(token, { page: 1 }, controller.signal),
      listTeams(token, controller.signal),
    ]).then(([playersRes, teamsRes]) => {
      if (controller.signal.aborted) return;

      // An abort is indistinguishable from a timeout (both status 0), so we
      // guard on our own signal above rather than the error type. A 401 still
      // ends the session.
      for (const res of [playersRes, teamsRes]) {
        if (res.status === 'rejected' && res.reason instanceof ApiError && res.reason.status === 401) {
          signOut();
          router.replace('/login');
          return;
        }
      }

      if (playersRes.status === 'fulfilled') setPlayers(playersRes.value.data);
      if (teamsRes.status === 'fulfilled') setTeams(teamsRes.value.data);

      const failure =
        playersRes.status === 'rejected' ? errorText(playersRes.reason) : null;
      setLoadError(failure);
      setLoaded(true);
    });

    return () => controller.abort();
  }, [token, reloadKey, signOut, router]);

  const pickPlayer = (player: ApiPlayer) => {
    setPlayerId(player.id);
    setOpenPick(null);
    setError(null);
    setSuccess(null);
  };

  const submit = () => {
    if (!token || saving) return;

    const player = players.find((p) => p.id === playerId) ?? null;
    if (!player) {
      setError('Zgjidh lojtarin.');
      setSuccess(null);
      return;
    }
    if (teamId == null) {
      setError('Zgjidh ekipin e ri.');
      setSuccess(null);
      return;
    }
    if (player.team?.id === teamId) {
      setError('Lojtari është tashmë në këtë ekip.');
      setSuccess(null);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    transferPlayer(token, player.id, teamId)
      .then(() => {
        setSaving(false);
        setSuccess('Lojtari u transferua me sukses.');
        setPlayerId(null);
        setTeamId(null);
        setReason('');
        setReloadKey((k) => k + 1);
      })
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
          setError('Nuk mund të transferohet lojtari.');
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
                  Transferimet e lojtarëve
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Lëviz lojtarë ndërmjet ekipeve
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={[styles.colPad, styles.bodyCol]}>
            {/* ── Transferim i shpejtë ───────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Transferim i shpejtë</Text>
              </View>

              <View style={styles.form}>
                <View style={[styles.formRow, (openPick === 'player' || openPick === 'team') && styles.formRowTop]}>
                  <View style={styles.formCol}>
                    <Text style={styles.label}>Lojtari:</Text>
                    <Pressable
                      onPress={() => setOpenPick((cur) => (cur === 'player' ? null : 'player'))}
                      accessibilityRole="button"
                      accessibilityLabel="Zgjidh lojtarin"
                      style={({ pressed }) => [styles.input, styles.pickRow, pressed && styles.pressed]}
                    >
                      <Text
                        style={[styles.pickText, !selectedPlayer && styles.pickPlaceholder]}
                        numberOfLines={1}
                      >
                        {selectedPlayer ? selectedPlayer.name ?? '—' : 'Zgjidh lojtarin'}
                      </Text>
                      <MaterialCommunityIcons
                        name={openPick === 'player' ? 'chevron-up' : 'chevron-down'}
                        size={I(13)}
                        color={C.gray}
                      />
                    </Pressable>
                    {openPick === 'player' ? (
                      <View style={styles.opts}>
                        <ScrollView style={styles.optScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                          {players.map((p) => {
                            const active = p.id === playerId;
                            return (
                              <Pressable
                                key={p.id}
                                onPress={() => pickPlayer(p)}
                                accessibilityRole="button"
                                accessibilityLabel={p.name ?? 'Lojtar'}
                                style={[styles.opt, active && styles.optActive]}
                              >
                                <Text
                                  style={[styles.optText, active && styles.optTextActive]}
                                  numberOfLines={1}
                                >
                                  {p.name ?? '—'}
                                </Text>
                              </Pressable>
                            );
                          })}
                          {players.length === 0 ? <Text style={styles.optEmpty}>Asnjë lojtar.</Text> : null}
                        </ScrollView>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.formCol}>
                    <Text style={styles.label}>Ekipi i ri:</Text>
                    <Pressable
                      onPress={() => setOpenPick((cur) => (cur === 'team' ? null : 'team'))}
                      accessibilityRole="button"
                      accessibilityLabel="Zgjidh ekipin e ri"
                      style={({ pressed }) => [styles.input, styles.pickRow, pressed && styles.pressed]}
                    >
                      <Text
                        style={[styles.pickText, !selectedTeam && styles.pickPlaceholder]}
                        numberOfLines={1}
                      >
                        {selectedTeam ? selectedTeam.name : 'Zgjidh ekipin'}
                      </Text>
                      <MaterialCommunityIcons
                        name={openPick === 'team' ? 'chevron-up' : 'chevron-down'}
                        size={I(13)}
                        color={C.gray}
                      />
                    </Pressable>
                    {openPick === 'team' ? (
                      <View style={styles.opts}>
                        <ScrollView style={styles.optScroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                          {teams.map((t) => {
                            const active = t.id === teamId;
                            return (
                              <Pressable
                                key={t.id}
                                onPress={() => {
                                  setTeamId(t.id);
                                  setOpenPick(null);
                                  setError(null);
                                  setSuccess(null);
                                }}
                                accessibilityRole="button"
                                accessibilityLabel={t.name}
                                style={[styles.opt, active && styles.optActive]}
                              >
                                <Text
                                  style={[styles.optText, active && styles.optTextActive]}
                                  numberOfLines={1}
                                >
                                  {t.name}
                                </Text>
                              </Pressable>
                            );
                          })}
                          {teams.length === 0 ? <Text style={styles.optEmpty}>Asnjë ekip.</Text> : null}
                        </ScrollView>
                      </View>
                    ) : null}
                  </View>
                </View>

                <View style={[styles.formRow, styles.formRowEnd]}>
                  <View style={styles.formCol}>
                    <Text style={styles.label}>Arsye:</Text>
                    <TextInput
                      style={styles.input}
                      placeholderTextColor={C.gray}
                      value={reason}
                      onChangeText={setReason}
                    />
                  </View>
                  <View style={[styles.formCol, styles.formColEnd]}>
                    <Pressable
                      onPress={submit}
                      disabled={saving}
                      accessibilityRole="button"
                      accessibilityLabel="Transfero lojtarin"
                      style={({ pressed }) => [
                        styles.goBtn,
                        saving && styles.goBtnOff,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text style={styles.goBtnText}>Transfero</Text>
                    </Pressable>
                  </View>
                </View>

                {error ? (
                  <Text style={styles.errorText} numberOfLines={2}>
                    {error}
                  </Text>
                ) : null}
                {success ? (
                  <Text style={styles.successText} numberOfLines={2}>
                    {success}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* ── Lojtarët sipas ekipit ─────────────────────────── */}
            <View style={[styles.card, styles.tableCard]}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Lojtarët sipas ekipit</Text>
              </View>

              <View style={styles.tblWrap}>
                <View style={styles.tr}>
                  {COLS.map((c, i) => (
                    <Text
                      key={c.key}
                      style={[
                        styles.th,
                        i === 0 && styles.thFirst,
                        i === COLS.length - 1 && styles.thLast,
                        { width: c.width },
                      ]}
                    >
                      {c.label}
                    </Text>
                  ))}
                  <View style={styles.rowSpacer} />
                </View>

                <ScrollView
                  style={styles.tblScroll}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={false}
                >
                  {players.map((p) => {
                    const active = p.id === playerId;
                    const nr = p.jersey_number != null ? String(p.jersey_number) : '—';
                    return (
                      <Pressable
                        key={p.id}
                        onPress={() => pickPlayer(p)}
                        accessibilityRole="button"
                        accessibilityLabel={`Zgjidh ${p.name ?? 'lojtarin'}`}
                        style={({ pressed }) => [
                          styles.tr,
                          styles.trBorder,
                          active && styles.trActive,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text
                          style={[styles.td, { width: COLS[0].width, textAlign: 'left' }]}
                          numberOfLines={1}
                        >
                          {p.name ?? '—'}
                        </Text>
                        <Text style={[styles.td, { width: COLS[1].width }]} numberOfLines={1}>
                          {p.team?.name ?? '—'}
                        </Text>
                        <Text style={[styles.td, { width: COLS[2].width }]} numberOfLines={1}>
                          {positionLabel(p.position)}
                        </Text>
                        <Text style={[styles.td, { width: COLS[3].width, textAlign: 'right' }]}>
                          {nr}
                        </Text>
                        <View style={styles.rowSpacer} />
                        <Pressable
                          onPress={() => pickPlayer(p)}
                          accessibilityRole="button"
                          accessibilityLabel="Zgjidh lojtarin për transferim"
                          style={({ pressed }) => [styles.rowBtn, pressed && styles.pressed]}
                        >
                          <Text style={styles.rowBtnText}>Transfero</Text>
                        </Pressable>
                      </Pressable>
                    );
                  })}

                  {!loaded ? (
                    <View style={styles.stateRow}>
                      <ActivityIndicator color={C.gray} />
                    </View>
                  ) : loadError ? (
                    <View style={styles.stateRow}>
                      <Text style={styles.stateText}>{loadError}</Text>
                      <Pressable
                        onPress={() => setReloadKey((k) => k + 1)}
                        accessibilityRole="button"
                        accessibilityLabel="Provo përsëri"
                        style={({ pressed }) => [styles.retryBtn, pressed && styles.pressed]}
                      >
                        <Text style={styles.retryText}>Provo përsëri</Text>
                      </Pressable>
                    </View>
                  ) : players.length === 0 ? (
                    <View style={styles.stateRow}>
                      <Text style={styles.stateText}>Asnjë lojtar nuk u gjet.</Text>
                    </View>
                  ) : null}
                </ScrollView>
              </View>
            </View>
          </View>
        </View>
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

    /* Page body — fills the screen, so the page never scrolls vertically. */
    body: {
      flex: 1,
      minHeight: 0,
    },

    bodyCol: {
      flex: 1,
      minHeight: 0,
    },

    /* ── Shared table card ───────────────────────────────────── */
    card: {
      backgroundColor: C.card,
      borderWidth: 2,
      borderColor: C.border,
      borderRadius: 7,
      overflow: 'hidden',
    },

    tableCard: {
      flex: 1,
      minHeight: 0,
      marginTop: 14,
    },

    cardHead: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
    },

    cardHeadText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 16,
      lineHeight: 20,
      color: C.text,
    },

    /* ── Transferim i shpejtë form ───────────────────────────── */
    form: {
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 14,
    },

    formRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 12,
    },

    /* With a picker open the columns grow downward, so keep their tops level. */
    formRowTop: {
      alignItems: 'flex-start',
    },

    /* Lets the "Transfero" button sit level with the Arsye input. */
    formRowEnd: {
      alignItems: 'flex-end',
      marginBottom: 0,
    },

    formCol: {
      flex: 1,
    },

    /* Keeps the "Arsye" input as wide as the "Lojtari" one. */
    formColEnd: {
      alignItems: 'flex-end',
    },

    label: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 15,
      color: C.gray,
      marginBottom: 5,
    },

    input: {
      height: 32,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
      paddingHorizontal: 9,
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 15,
      color: C.text,
    },

    /* The picker triggers reuse the input frame but lay out text + chevron. */
    pickRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 4,
    },

    pickText: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 15,
      color: C.text,
    },

    pickPlaceholder: {
      color: C.gray,
    },

    /* The options open directly under the field. */
    opts: {
      marginTop: 3,
      backgroundColor: '#F5F5F5',
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
      overflow: 'hidden',
    },

    optScroll: {
      maxHeight: 140,
    },

    opt: {
      minHeight: 30,
      justifyContent: 'center',
      paddingHorizontal: 9,
    },

    optActive: {
      backgroundColor: 'rgba(22,165,29,0.10)',
    },

    optText: {
      fontFamily: Fonts.body,
      fontSize: 11.5,
      color: C.text,
    },

    optTextActive: {
      fontFamily: Fonts.bodySemiBold,
    },

    optEmpty: {
      fontFamily: Fonts.body,
      fontSize: 11.5,
      color: C.gray,
      paddingHorizontal: 9,
      paddingVertical: 8,
    },

    goBtn: {
      height: 32,
      paddingHorizontal: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.green,
      borderRadius: 4,
    },

    goBtnOff: {
      opacity: 0.5,
    },

    goBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12.5,
      color: '#F5F5F5',
    },

    errorText: {
      marginTop: 12,
      fontFamily: Fonts.body,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.red,
    },

    successText: {
      marginTop: 12,
      fontFamily: Fonts.body,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.green,
    },

    /* ── Lojtarët sipas ekipit table ─────────────────────────── */
    tblWrap: {
      flex: 1,
      minHeight: 0,
      paddingHorizontal: 8,
    },

    /* The measured rows area scrolls once the squad outgrows the card. */
    tblScroll: {
      flex: 1,
      minHeight: 0,
    },

    tr: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      minHeight: 36,
    },

    /* Pushes each row's action to the right end, clear of the columns. */
    rowSpacer: {
      flex: 1,
    },

    trBorder: {
      borderTopWidth: 1,
      borderTopColor: C.rowLine,
    },

    /* The row picked for transfer reads as selected. */
    trActive: {
      backgroundColor: 'rgba(134,188,253,0.18)',
    },

    th: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      lineHeight: 14,
      color: C.gray,
      textAlign: 'center',
    },

    td: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 16,
      color: C.text,
      textAlign: 'center',
    },

    /* "Emri" sits at the start of the row, a little off the table's edge. */
    thFirst: {
      textAlign: 'left',
    },

    /* "Nr." is pushed to the far right of the row. */
    thLast: {
      textAlign: 'right',
    },

    /* ── Per-row outlined action ─────────────────────────────── */
    rowBtn: {
      height: 24,
      paddingHorizontal: 8,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.ghostLine,
      borderRadius: 4,
    },

    rowBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: C.ghost,
    },

    /* ── Loading / empty / error ─────────────────────────────── */
    stateRow: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 18,
    },

    stateText: {
      fontFamily: Fonts.body,
      fontSize: 12.5,
      color: C.gray,
      textAlign: 'center',
    },

    retryBtn: {
      height: 30,
      paddingHorizontal: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.ghostLine,
      borderRadius: 4,
    },

    retryText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      color: C.text,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
