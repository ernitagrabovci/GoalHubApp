import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { listCompetitions } from '@/lib/api/competitions';
import { ApiError } from '@/lib/api/errors';
import { createMatch, updateMatch } from '@/lib/api/matches';
import type { ApiMatch, ApiTeam } from '@/lib/api/types';
import { I, scaled } from '@/lib/responsive';

/**
 * The "Shto ndeshje" and "Edito ndeshje" popups, shared between the ndeshjet
 * list and the ndeshja detail screen. Both write straight to the API and call
 * back once saved, so the caller only has to refresh.
 */

const C = {
  hint: '#6E6E6E',
};

/* Popup palette — the same shell as the other admin popups. */
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
  white: '#F5F5F5',
  err: '#C90000',
};

const VENUES = ['Shtëpi', 'Musafir'];
/* The API only accepts these on update — "played" is set by saving a result. */
const STATUS = ['E ardhshme', 'Anuluar'];

type ModalBaseProps = {
  token: string;
  teams: ApiTeam[];
  clubName: string;
  onClose: () => void;
  onSaved: () => void;
  onExpired: () => void;
};

const pad2 = (n: number) => String(n).padStart(2, '0');

/** `2026-08-18T16:00:00Z` → `18/08/2026 16:00`, for the editable text field. */
function toStamp(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(
    d.getHours(),
  )}:${pad2(d.getMinutes())}`;
}

/** `18/08/2026 16:00` → `2026-08-18T16:00:00`, or `null` when unparsable. */
function fromStamp(value: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const [, dd, mm, yyyy, hh, mi] = m;
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:00`;
}

/** Maps any write failure to the popup's inline message. */
function writeErrorText(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 0) return 'Nuk mund të lidhemi me serverin. Kontrollo lidhjen.';
    if (err.status === 422) return 'Të dhënat nuk janë të vlefshme. Kontrollo fushat.';
    if (err.status === 403) return 'Nuk keni leje për këtë veprim.';
    if (err.status === 404) return 'Ndeshja nuk u gjet.';
  }
  return 'Veprimi nuk mund të kryhet.';
}

/** Competition names for the popups — `GET /competitions` is admin-only. */
function useCompetitionNames(
  token: string,
  onExpired: () => void,
): { names: string[]; failed: boolean } {
  const [names, setNames] = useState<string[]>([]);
  const [failed, setFailed] = useState(false);
  const expired = useRef(onExpired);
  useEffect(() => {
    expired.current = onExpired;
  }, [onExpired]);

  useEffect(() => {
    const ctl = new AbortController();
    listCompetitions(token, ctl.signal)
      .then((res) => setNames(res.data.map((c) => c.name)))
      .catch((e) => {
        if (ctl.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) {
          expired.current();
          return;
        }
        setFailed(true);
      });
    return () => ctl.abort();
  }, [token]);

  return { names, failed };
}

/* ── "Shto ndeshje" ───────────────────────────────────────────────── */

export function AddMatchModal({ token, teams, clubName, onClose, onSaved, onExpired }: ModalBaseProps) {
  const { width, height } = useWindowDimensions();
  const cardW = Math.min(width - 24, 360);
  const maxBody = Math.max(280, height - 187);

  const { names: comps, failed: compsFailed } = useCompetitionNames(token, onExpired);

  const [teamId, setTeamId] = useState<number | null>(teams[0]?.id ?? null);
  const [venue, setVenue] = useState(VENUES[0]);
  const [rival, setRival] = useState('');
  const [comp, setComp] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [hour, setHour] = useState('');
  const [minute, setMinute] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  /* The first known competition stands in until one is picked. */
  const selectedComp = comp || comps[0] || '';

  const atHome = venue !== 'Musafir';
  const fixtureName = atHome ? `${clubName} - ${rival.trim()}` : `${rival.trim()} - ${clubName}`;

  const submit = () => {
    if (busy) return;
    setErr(null);

    if (teamId === null || !rival.trim() || !day || !month || !year || !hour || !minute) {
      setErr('Plotëso të gjitha fushat e kërkuara.');
      return;
    }

    setBusy(true);
    createMatch(token, {
      team_id: teamId,
      opponent: rival.trim(),
      competition: selectedComp || null,
      venue: atHome ? 'home' : 'away',
      scheduled_at: `${year}-${pad2(Number(month))}-${pad2(Number(day))}T${pad2(
        Number(hour),
      )}:${pad2(Number(minute))}:00`,
      notes: note.trim() || null,
    })
      .then(() => onSaved())
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) {
          onExpired();
          return;
        }
        setBusy(false);
        setErr(writeErrorText(e));
      });
  };

  return (
    <Overlay onDismiss={onClose}>
      <View style={[styles.card, { width: cardW }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Shto ndeshje</Text>
        </View>
        <View style={styles.divider} />

        <ScrollView
          style={{ maxHeight: maxBody }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          {err ? <Text style={styles.err}>{err}</Text> : null}

          <Text style={styles.label}>Ekipi:</Text>
          <NMSelect
            value={teams.find((t) => t.id === teamId)?.name ?? '—'}
            options={teams.map((t) => t.name)}
            onChange={(name) => setTeamId(teams.find((t) => t.name === name)?.id ?? null)}
          />

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Vendosja</Text>
              <NMSelect value={venue} options={VENUES} onChange={setVenue} />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Kundershtari</Text>
              <TextInput
                value={rival}
                onChangeText={setRival}
                allowFontScaling={false}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.preview}>
            <Text style={styles.previewText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
              {fixtureName}
            </Text>
          </View>

          <Text style={[styles.label, styles.gap]}>Gara/Kompeticion</Text>
          <NMSelect value={selectedComp || '—'} options={comps} onChange={setComp} />
          {comps.length === 0 ? (
            <Text style={styles.hint}>
              {compsFailed ? 'Kompeticionet nuk u ngarkuan.' : 'Nuk ka kompeticione të regjistruara.'}
            </Text>
          ) : null}

          <Text style={[styles.label, styles.gap]}>Data & Ora:</Text>
          <View style={styles.clockRow}>
            <DateBox value={day} onChangeText={setDay} placeholder="DD" width={styles.dateBox.width} />
            <Text style={styles.sep}>/</Text>
            <DateBox value={month} onChangeText={setMonth} placeholder="MM" width={styles.dateBox.width} />
            <Text style={styles.sep}>/</Text>
            <DateBox value={year} onChangeText={setYear} placeholder="YYYY" width={styles.yearBox.width} maxLength={4} />
            <Text style={styles.dash}>----</Text>
            <DateBox value={hour} onChangeText={setHour} placeholder="HH" width={styles.timeBox.width} />
            <Text style={styles.sep}>:</Text>
            <DateBox value={minute} onChangeText={setMinute} placeholder="MM" width={styles.timeBox.width} />
          </View>

          <Text style={[styles.label, styles.gap]}>Shenime :</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            multiline
            allowFontScaling={false}
            style={styles.textarea}
            textAlignVertical="top"
          />

          <Actions busy={busy} onClose={onClose} onSubmit={submit} />
        </ScrollView>
      </View>
    </Overlay>
  );
}

/* ── "Edito ndeshje" ──────────────────────────────────────────────── */

export function EditMatchModal({
  match,
  token,
  teams,
  clubName,
  onClose,
  onSaved,
  onExpired,
}: ModalBaseProps & { match: ApiMatch }) {
  const { width, height } = useWindowDimensions();
  const cardW = Math.min(width - 24, 360);
  const maxBody = Math.max(280, height - 187);

  const atHome = (match.venue ?? 'home') !== 'away';
  const kickoff = toStamp(match.scheduled_at);

  const { names: comps, failed: compsFailed } = useCompetitionNames(token, onExpired);

  const [teamId, setTeamId] = useState<number | null>(match.team?.id ?? teams[0]?.id ?? null);
  const [venue, setVenue] = useState(atHome ? VENUES[0] : VENUES[1]);
  const [rival, setRival] = useState(match.opponent ?? '');
  const [comp, setComp] = useState(match.competition ?? '');
  const [when, setWhen] = useState(kickoff);
  const [transport, setTransport] = useState(toStamp(match.transport_at) || kickoff);
  const [status, setStatus] = useState(match.status === 'cancelled' ? STATUS[1] : STATUS[0]);
  const [note, setNote] = useState(match.notes ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const selectedComp = comp || comps[0] || '';

  /* Keep a match's existing competition selectable even if it was deactivated. */
  const compOptions =
    selectedComp && !comps.includes(selectedComp) ? [selectedComp, ...comps] : comps;

  const home = venue !== 'Musafir';
  const fixtureName = home ? `${clubName} - ${rival.trim()}` : `${rival.trim()} - ${clubName}`;

  const submit = () => {
    if (busy) return;
    setErr(null);

    if (teamId === null || !rival.trim()) {
      setErr('Plotëso të gjitha fushat e kërkuara.');
      return;
    }

    const scheduledAt = fromStamp(when);
    if (!scheduledAt) {
      setErr('Data & ora duhet të jenë në formatin DD/MM/YYYY HH:MM.');
      return;
    }

    setBusy(true);
    updateMatch(token, match.id, {
      team_id: teamId,
      opponent: rival.trim(),
      competition: selectedComp || null,
      venue: home ? 'home' : 'away',
      scheduled_at: scheduledAt,
      transport_at: fromStamp(transport),
      status: status === 'Anuluar' ? 'cancelled' : 'upcoming',
      notes: note.trim() || null,
    })
      .then(() => onSaved())
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) {
          onExpired();
          return;
        }
        setBusy(false);
        setErr(writeErrorText(e));
      });
  };

  return (
    <Overlay onDismiss={onClose}>
      <View style={[styles.card, { width: cardW }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Edito ndeshje</Text>
        </View>
        <View style={styles.divider} />

        <ScrollView
          style={{ maxHeight: maxBody }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          {err ? <Text style={styles.err}>{err}</Text> : null}

          <Text style={styles.label}>Ekipi:</Text>
          <NMSelect
            value={teams.find((t) => t.id === teamId)?.name ?? '—'}
            options={teams.map((t) => t.name)}
            onChange={(name) => setTeamId(teams.find((t) => t.name === name)?.id ?? null)}
          />

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Vendosja</Text>
              <NMSelect value={venue} options={VENUES} onChange={setVenue} />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Kundershtari</Text>
              <TextInput
                value={rival}
                onChangeText={setRival}
                allowFontScaling={false}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.preview}>
            <Text style={styles.previewText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
              {fixtureName}
            </Text>
          </View>

          <Text style={[styles.label, styles.gap]}>Gara/Kompeticion:</Text>
          <NMSelect value={selectedComp || '—'} options={compOptions} onChange={setComp} />
          {compOptions.length === 0 ? (
            <Text style={styles.hint}>
              {compsFailed ? 'Kompeticionet nuk u ngarkuan.' : 'Nuk ka kompeticione të regjistruara.'}
            </Text>
          ) : null}

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Data & Ora:</Text>
              <TextInput
                value={when}
                onChangeText={setWhen}
                allowFontScaling={false}
                style={styles.input}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Transporti (nisja)</Text>
              <TextInput
                value={transport}
                onChangeText={setTransport}
                allowFontScaling={false}
                style={[styles.input, styles.hintInput]}
              />
            </View>
          </View>

          <Text style={[styles.label, styles.gap]}>Statusi:</Text>
          <NMSelect value={status} options={STATUS} onChange={setStatus} />

          <Text style={[styles.label, styles.gap]}>Shenime :</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            multiline
            allowFontScaling={false}
            style={styles.textarea}
            textAlignVertical="top"
          />

          <Actions busy={busy} onClose={onClose} onSubmit={submit} />
        </ScrollView>
      </View>
    </Overlay>
  );
}

/* ── Shared pieces ────────────────────────────────────────────────── */

/** The dimmed, blurred backdrop the popups ride on. */
function Overlay({ children, onDismiss }: { children: React.ReactNode; onDismiss: () => void }) {
  return (
    <View style={styles.ovWrap}>
      <BlurView style={styles.ovFill} intensity={45} tint="dark" />
      <Pressable
        style={[styles.ovFill, styles.ovDim]}
        onPress={onDismiss}
        accessibilityRole="button"
        accessibilityLabel="Mbylle dritaren"
      />
      {children}
    </View>
  );
}

/** A number-pad box for one part of the date or time. */
function DateBox({
  value,
  onChangeText,
  placeholder,
  width,
  maxLength = 2,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  width?: number;
  maxLength?: number;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={MO.ph}
      maxLength={maxLength}
      keyboardType="number-pad"
      allowFontScaling={false}
      style={[styles.dateBox, width ? { width } : null]}
    />
  );
}

function Actions({
  busy,
  onClose,
  onSubmit,
}: {
  busy: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <View style={styles.actions}>
      <Pressable
        onPress={onClose}
        disabled={busy}
        accessibilityRole="button"
        style={({ pressed }) => [styles.btn, styles.btnCancel, pressed && styles.pressed]}
      >
        <Text style={styles.btnText}>Anulo</Text>
      </Pressable>
      <Pressable
        onPress={onSubmit}
        disabled={busy}
        accessibilityRole="button"
        style={({ pressed }) => [styles.btn, styles.btnSave, busy && styles.btnOff, pressed && styles.pressed]}
      >
        {busy ? (
          <ActivityIndicator size="small" color={MO.white} />
        ) : (
          <Text style={styles.btnText}>Ruaj</Text>
        )}
      </Pressable>
    </View>
  );
}

/** Compact select with an in-flow options list. */
function NMSelect({
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
      backgroundColor: '#F5F5F5',
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

    header: {
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },

    title: {
      fontFamily: Fonts.bodyBold,
      fontSize: 20,
      lineHeight: 24,
      color: MO.title,
    },

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

    hint: {
      fontFamily: Fonts.body,
      fontSize: 9,
      color: C.hint,
      marginTop: 4,
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

    input: {
      height: 31,
      backgroundColor: MO.inputBg,
      borderWidth: 1,
      borderColor: MO.inputBorder,
      borderRadius: 1,
      paddingHorizontal: 8,
      paddingVertical: 0,
      fontSize: 11.5,
      fontFamily: Fonts.body,
      color: MO.text,
    },

    /* The transport field opens on the kick-off values, greyed as a suggestion. */
    hintInput: {
      color: C.hint,
    },

    row: {
      marginTop: 15,
      flexDirection: 'row',
      gap: 8,
    },

    col: {
      flex: 1,
    },

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
      backgroundColor: '#F5F5F5',
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

    /* Live preview of the fixture name. */
    preview: {
      marginTop: 15,
      height: 34,
      justifyContent: 'center',
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 3,
      backgroundColor: 'rgba(26,157,0,0.2)',
    },

    previewText: {
      textAlign: 'center',
      fontFamily: Fonts.bodyBold,
      fontSize: 12,
      color: '#000000',
    },

    clockRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    dateBox: {
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

    yearBox: {
      width: 50,
    },

    timeBox: {
      width: 30,
    },

    sep: {
      fontFamily: Fonts.body,
      fontSize: 11,
      color: MO.sub,
    },

    /* Short separator that keeps the time next to the date. */
    dash: {
      width: 24,
      textAlign: 'center',
      fontFamily: Fonts.body,
      fontSize: 11,
      color: '#BBBBBB',
    },

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

    btnSave: {
      width: 74,
      backgroundColor: MO.create,
    },

    btnOff: {
      opacity: 0.6,
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
