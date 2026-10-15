import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import {
  createPlayer,
  createPosition,
  listPositions,
  updatePlayer,
  type PlayerWriteInput,
} from '@/lib/api/players';
import { listTeams } from '@/lib/api/teams';
import type { ApiPlayer, ApiPosition, ApiTeam } from '@/lib/api/types';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * Shared player form — used by "Regjistro lojtar të ri" and by the edit page
 * for an existing player. Personal data card (with a photo upload zone) on
 * top, sports data card below it, then the Anulo / Konfirmo actions.
 *
 * `avatarInitials` renders the profile circle in front of the header title.
 * In create mode it POSTs a new player; in edit mode (with `player`) it PATCHes
 * the one it was given.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  card: '#F6FBFF',
  border: 'rgba(100,140,190,0.30)',
  headLine: 'rgba(30,40,35,0.10)',

  input: '#F5F5F5',
  inputBorder: '#000000',
  hint: '#C9C9C9',

  text: '#111111',
  gray: '#8A8A8A',

  green: '#159447',
  greenSoft: '#DDF6E7',
  red: '#ED5050',
};

/** The selector's resting text while nothing is picked yet. */
const PLACEHOLDER = '—';

export function PlayerForm({
  title,
  subtitle,
  avatarInitials,
  player,
  mode = 'create',
}: {
  title: string;
  subtitle: string;
  avatarInitials?: string;
  player?: ApiPlayer;
  mode?: 'create' | 'edit';
}) {
  const router = useRouter();
  const { token, signOut } = useSession();

  const [plan, setPlan] = useState<'nxenes' | 'kontraktual'>('nxenes');
  const [cycle, setCycle] = useState<'fillimit' | 'muajit'>('fillimit');

  /* Personal data */
  const [name, setName] = useState(player?.name ?? '');
  const [email, setEmail] = useState(player?.email ?? '');
  const [dateOfBirth, setDateOfBirth] = useState(player?.date_of_birth ?? '');
  const [nationality, setNationality] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');

  /* Sports data */
  const [jerseyNumber, setJerseyNumber] = useState(
    player?.jersey_number != null ? String(player.jersey_number) : '',
  );
  const [positionName, setPositionName] = useState<string | null>(player?.position ?? null);
  const [teamId, setTeamId] = useState<number | null>(player?.team?.id ?? null);
  const [contractStart, setContractStart] = useState<DateParts>(parseDateParts(player?.contract_start));
  const [contractEnd, setContractEnd] = useState<DateParts>(parseDateParts(player?.contract_end));
  const [ffkLicense, setFfkLicense] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('30');
  const [paymentDeadlineDays, setPaymentDeadlineDays] = useState('10');

  /* Reference data for the selectors */
  const [teams, setTeams] = useState<ApiTeam[]>([]);
  const [positions, setPositions] = useState<ApiPosition[]>([]);

  /* Inline "e re" position entry */
  const [newPosOpen, setNewPosOpen] = useState(false);
  const [newPosName, setNewPosName] = useState('');
  const [savingPos, setSavingPos] = useState(false);

  /* Save state */
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountLabel = plan === 'nxenes' ? 'Kuota mujore (euro)' : 'Paga mujore (euro)';

  /* Teams + positions load once per session. */
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();

    listTeams(token, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setTeams(res.data);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          signOut();
          router.replace('/login');
        }
      });

    listPositions(token, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setPositions(res.data);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError && err.status === 401) {
          signOut();
          router.replace('/login');
        }
      });

    return () => controller.abort();
  }, [token, signOut, router]);

  const submitNewPosition = () => {
    const trimmed = newPosName.trim();
    if (!token || !trimmed || savingPos) return;

    setSavingPos(true);
    createPosition(token, trimmed)
      .then((res) => {
        setPositions((prev) => [...prev, res.data]);
        setPositionName(res.data.name);
        setNewPosName('');
        setNewPosOpen(false);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          signOut();
          router.replace('/login');
          return;
        }
        if (err instanceof ApiError && err.status === 0) {
          setError('Nuk mund të lidhemi me serverin. Kontrollo lidhjen.');
        } else {
          setError('Pozicioni nuk mund të ruhet.');
        }
      })
      .finally(() => setSavingPos(false));
  };

  const save = () => {
    if (!token || saving) return;

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    if (!trimmedName || !trimmedEmail) {
      setError('Plotëso emrin dhe email-in.');
      return;
    }
    if (teamId == null) {
      setError('Zgjidh ekipin.');
      return;
    }
    if (!positionName) {
      setError('Zgjidh pozicionin.');
      return;
    }
    if (mode === 'create') {
      if (password.length < 8) {
        setError('Fjalëkalimi duhet të ketë të paktën 8 karaktere.');
        return;
      }
      if (password !== passwordConfirmation) {
        setError('Fjalëkalimet nuk përputhen.');
        return;
      }
    }

    const jerseyValue = jerseyNumber.trim();
    const jersey = jerseyValue ? Number(jerseyValue) : null;

    const input: PlayerWriteInput = {
      name: trimmedName,
      email: trimmedEmail,
      team_id: teamId,
      position: positionName,
      jersey_number: jersey != null && Number.isFinite(jersey) ? jersey : null,
      date_of_birth: dateOfBirth.trim() || null,
      nationality: nationality.trim() || null,
      contract_start:
        mode === 'create' ? composeDate(contractStart) ?? today() : composeDate(contractStart),
      contract_end: composeDate(contractEnd),
      ffk_license: ffkLicense.trim() || null,
      health_status: mode === 'edit' && player ? player.health_status : 'active',
      contract_type: plan === 'nxenes' ? 'anetare' : 'kontraktual',
      monthly_amount: toNumber(monthlyAmount, 0),
      payment_deadline_days: toNumber(paymentDeadlineDays, 10),
      billing_cycle: cycle === 'fillimit' ? 'anniversary' : 'calendar_month',
    };
    if (mode === 'create') {
      input.password = password;
      input.password_confirmation = passwordConfirmation;
    }

    setSaving(true);
    setError(null);

    const action =
      mode === 'edit' && player
        ? updatePlayer(token, player.id, input)
        : createPlayer(token, input);

    action
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
          setError('Lojtari nuk mund të ruhet.');
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
              {avatarInitials ? (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{avatarInitials}</Text>
                </View>
              ) : null}
              <View style={styles.headerText}>
                <Text style={styles.title} numberOfLines={1}>
                  {title}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {subtitle}
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
            {/* ── Të dhënat personale ───────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Të dhënat personale</Text>
              </View>

              {/* Photo upload — divided from the fields by its bottom line */}
              <View style={styles.photoZone}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Ngarko foton"
                  style={({ pressed }) => [styles.photoBtn, pressed && styles.pressed]}
                >
                  <View style={styles.photoCircle}>
                    <MaterialCommunityIcons
                      name="cloud-upload-outline"
                      size={I(22)}
                      color="#F5F5F5"
                    />
                  </View>
                </Pressable>
                <Text style={styles.photoHint}>Ngarko foton</Text>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.row}>
                  <View style={styles.col}>
                    <Text style={styles.label}>Emri i plotë:</Text>
                    <TextInput
                      style={styles.input}
                      placeholderTextColor={C.gray}
                      value={name}
                      onChangeText={setName}
                      autoCapitalize="words"
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>Email:</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="email-address"
                      placeholderTextColor={C.gray}
                      value={email}
                      onChangeText={setEmail}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>

                <View style={[styles.row, mode !== 'create' && styles.rowLast]}>
                  <View style={styles.col}>
                    <Text style={styles.label}>Data e lindjes:</Text>
                    <TextInput
                      style={styles.input}
                      placeholderTextColor={C.gray}
                      placeholder="YYYY-MM-DD"
                      value={dateOfBirth}
                      onChangeText={setDateOfBirth}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>Nacionaliteti:</Text>
                    <TextInput
                      style={styles.input}
                      placeholderTextColor={C.gray}
                      value={nationality}
                      onChangeText={setNationality}
                    />
                  </View>
                </View>

                {mode === 'create' ? (
                  <View style={[styles.row, styles.rowLast]}>
                    <View style={styles.col}>
                      <Text style={styles.label}>Fjalëkalimi:</Text>
                      <TextInput
                        style={styles.input}
                        secureTextEntry
                        placeholderTextColor={C.gray}
                        value={password}
                        onChangeText={setPassword}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                    <View style={styles.col}>
                      <Text style={styles.label}>Konfirmo:</Text>
                      <TextInput
                        style={styles.input}
                        secureTextEntry
                        placeholderTextColor={C.gray}
                        value={passwordConfirmation}
                        onChangeText={setPasswordConfirmation}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                    </View>
                  </View>
                ) : null}
              </View>
            </View>

            {/* ── Të dhënat sportive ────────────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Të dhënat sportive</Text>
              </View>

              <View style={styles.cardBody}>
                {/* Nr. i fanellës + Pozicioni + "e re" */}
                <View style={[styles.row, styles.rowPos]}>
                  <View style={styles.nrCol}>
                    <Text style={styles.label}>Nr. i fanellës:</Text>
                    <TextInput
                      style={[styles.input, styles.nrInput]}
                      keyboardType="number-pad"
                      placeholderTextColor={C.gray}
                      value={jerseyNumber}
                      onChangeText={setJerseyNumber}
                    />
                  </View>

                  <View style={styles.col}>
                    <Text style={styles.label}>Pozicioni:</Text>
                    <Select
                      value={positionName}
                      placeholder={PLACEHOLDER}
                      options={positions.map((p) => ({ label: p.name, value: p.name }))}
                      onSelect={setPositionName}
                      accessibilityLabel="Zgjidh pozicionin"
                    />
                  </View>

                  <Pressable
                    onPress={() => setNewPosOpen((v) => !v)}
                    accessibilityRole="button"
                    accessibilityLabel="Shto pozicion të re"
                    style={({ pressed }) => [styles.newPosBtn, pressed && styles.pressed]}
                  >
                    <MaterialCommunityIcons name="plus" size={I(13)} color={C.text} />
                    <Text style={styles.newPosText}>e re</Text>
                  </Pressable>
                </View>

                {newPosOpen ? (
                  <View style={styles.newPosRow}>
                    <TextInput
                      style={[styles.input, styles.newPosInput]}
                      value={newPosName}
                      onChangeText={setNewPosName}
                      placeholder="Emri i pozicionit të re"
                      placeholderTextColor={C.gray}
                      autoFocus
                    />
                    <Pressable
                      onPress={submitNewPosition}
                      disabled={savingPos}
                      accessibilityRole="button"
                      accessibilityLabel="Ruaj pozicionin e re"
                      style={({ pressed }) => [
                        styles.newPosBtn,
                        savingPos && styles.btnConfirmOff,
                        pressed && styles.pressed,
                      ]}
                    >
                      <MaterialCommunityIcons name="check" size={I(13)} color={C.text} />
                      <Text style={styles.newPosText}>Ruaj</Text>
                    </Pressable>
                  </View>
                ) : null}

                {/* Ekipi */}
                <View style={[styles.row, styles.rowTeam]}>
                  <View style={styles.col}>
                    <Text style={styles.label}>Ekipi:</Text>
                    <Select
                      value={teams.find((t) => t.id === teamId)?.name ?? null}
                      placeholder={PLACEHOLDER}
                      options={teams.map((t) => ({ label: t.name, value: t.id }))}
                      onSelect={setTeamId}
                      accessibilityLabel="Zgjidh ekipin"
                    />
                  </View>
                </View>

                {/* Contract window */}
                <View style={styles.dateCols}>
                  <View style={styles.dateCol}>
                    <Text style={styles.label}>Fillimi i kontratës:</Text>
                    <DateGroup value={contractStart} onChange={setContractStart} />
                  </View>
                  <View style={[styles.dateCol, styles.dateColRight]}>
                    <Text style={[styles.label, styles.labelRight]}>Mbarimi i kontratës:</Text>
                    <DateGroup value={contractEnd} onChange={setContractEnd} />
                  </View>
                </View>

                {/* Licensa */}
                <View style={[styles.row, styles.rowTight]}>
                  <View style={styles.col}>
                    <Text style={styles.label}>Licensa FFK:</Text>
                    <TextInput
                      style={styles.input}
                      placeholderTextColor={C.gray}
                      value={ffkLicense}
                      onChangeText={setFfkLicense}
                    />
                  </View>
                </View>

                {/* Membership type */}
                <View style={styles.row}>
                  <Pressable
                    onPress={() => setPlan('nxenes')}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: plan === 'nxenes' }}
                    accessibilityLabel="Nxënës/Anëtar"
                    style={({ pressed }) => [styles.optCard, pressed && styles.pressed]}
                  >
                    <View style={[styles.circle, plan === 'nxenes' && styles.circleOn]} />
                    <View style={styles.optText}>
                      <Text style={styles.optTitle}>Nxënës/Anëtar</Text>
                      <Text style={styles.optSub}>Paguan kuotë mujore</Text>
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={() => setPlan('kontraktual')}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: plan === 'kontraktual' }}
                    accessibilityLabel="Kontraktual"
                    style={({ pressed }) => [styles.optCard, pressed && styles.pressed]}
                  >
                    <View style={[styles.circle, plan === 'kontraktual' && styles.circleOn]} />
                    <View style={styles.optText}>
                      <Text style={styles.optTitle}>Kontraktual</Text>
                      <Text style={styles.optSub}>Paguan kuotë mujore</Text>
                    </View>
                  </Pressable>
                </View>

                {/* Amount + deadline */}
                <View style={styles.row}>
                  <View style={styles.col}>
                    <Text style={styles.label}>{amountLabel}</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      placeholderTextColor={C.gray}
                      value={monthlyAmount}
                      onChangeText={setMonthlyAmount}
                    />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>Afati i pagesës (ditë)</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="number-pad"
                      placeholderTextColor={C.gray}
                      value={paymentDeadlineDays}
                      onChangeText={setPaymentDeadlineDays}
                    />
                  </View>
                </View>

                {/* Billing cycle */}
                <Text style={[styles.label, styles.cycleLabel]}>Cikli i faturimit</Text>

                <View style={styles.cycleRow}>
                  <Pressable
                    onPress={() => setCycle('fillimit')}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: cycle === 'fillimit' }}
                    accessibilityLabel="Data e fillimit"
                    style={({ pressed }) => [styles.cycleCard, pressed && styles.pressed]}
                  >
                    <View style={[styles.circle, cycle === 'fillimit' && styles.circleOn]} />
                    <View style={styles.optText}>
                      <Text style={styles.cycleTitle}>Data e fillimit</Text>
                      <Text style={styles.cycleSub}>13 Feb → 13 Mar, 13 Mar → 13 Apr</Text>
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={() => setCycle('muajit')}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: cycle === 'muajit' }}
                    accessibilityLabel="Fillimi i muajit"
                    style={({ pressed }) => [styles.cycleCard, pressed && styles.pressed]}
                  >
                    <View style={[styles.circle, cycle === 'muajit' && styles.circleOn]} />
                    <View style={styles.optText}>
                      <Text style={styles.cycleTitle}>Fillimi i muajit</Text>
                      <Text style={styles.cycleSub}>13 → 28 Feb, 1 → 31 Mar</Text>
                    </View>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* ── Actions ───────────────────────────────────────── */}
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.actions}>
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                style={({ pressed }) => [styles.btn, styles.btnCancel, pressed && styles.pressed]}
              >
                <Text style={styles.btnText}>Anulo</Text>
              </Pressable>
              <Pressable
                onPress={save}
                disabled={saving}
                accessibilityRole="button"
                accessibilityState={{ disabled: saving }}
                style={({ pressed }) => [
                  styles.btn,
                  styles.btnConfirm,
                  saving && styles.btnConfirmOff,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.btnText}>Konfirmo</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

/* ------------------------------------------------------------------ */
/* Selectors                                                           */
/* ------------------------------------------------------------------ */

/**
 * A `styles.sel` control that unrolls its options directly under itself —
 * same floating-list behaviour as the score box on "Fut rezultatin".
 */
function Select<T extends string | number>({
  value,
  placeholder,
  options,
  onSelect,
  accessibilityLabel,
}: {
  value: string | null;
  placeholder: string;
  options: { label: string; value: T }[];
  onSelect: (value: T) => void;
  accessibilityLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.selWrap}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [styles.sel, pressed && styles.pressed]}
      >
        <Text style={styles.selText} numberOfLines={1}>
          {value ?? placeholder}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={I(15)} color={C.gray} />
      </Pressable>

      {open ? (
        <View style={styles.selOpts}>
          {options.map((o) => {
            const active = o.label === value;
            return (
              <Pressable
                key={String(o.value)}
                onPress={() => {
                  onSelect(o.value);
                  setOpen(false);
                }}
                accessibilityRole="button"
                accessibilityLabel={o.label}
                style={[styles.selOpt, active && styles.selOptActive]}
              >
                <Text
                  style={[styles.selOptText, active && styles.selOptTextActive]}
                  numberOfLines={1}
                >
                  {o.label}
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
/* Contract dates                                                      */
/* ------------------------------------------------------------------ */

type DateParts = { d: string; m: string; y: string };

/** Splits a `YYYY-MM-DD` wire value into the three DD / MM / YYYY boxes. */
function parseDateParts(value?: string | null): DateParts {
  if (!value) return { d: '', m: '', y: '' };
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return { d: '', m: '', y: '' };
  return { d: match[3], m: match[2], y: match[1] };
}

/** Composes the three boxes back to `YYYY-MM-DD`, or null while incomplete. */
function composeDate({ d, m, y }: DateParts): string | null {
  if (!d || !m || !y || y.length !== 4) return null;
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

/** Today as `YYYY-MM-DD`, the default contract start on registration. */
function today(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Parses a numeric field, falling back when it is blank or not a number. */
function toNumber(value: string, fallback: number): number {
  const trimmed = value.trim();
  if (!trimmed) return fallback;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : fallback;
}

/** DD / MM / YYYY entry group used for both contract dates. */
function DateGroup({ value, onChange }: { value: DateParts; onChange: (next: DateParts) => void }) {
  return (
    <View style={styles.dateGroup}>
      <TextInput
        style={[styles.input, styles.dateSq]}
        placeholder="DD"
        placeholderTextColor={C.hint}
        keyboardType="number-pad"
        maxLength={2}
        value={value.d}
        onChangeText={(text) => onChange({ ...value, d: text })}
      />
      <Text style={styles.dateSlash}>/</Text>
      <TextInput
        style={[styles.input, styles.dateSq]}
        placeholder="MM"
        placeholderTextColor={C.hint}
        keyboardType="number-pad"
        maxLength={2}
        value={value.m}
        onChangeText={(text) => onChange({ ...value, m: text })}
      />
      <TextInput
        style={[styles.input, styles.dateYear]}
        placeholder="YYYY"
        placeholderTextColor={C.hint}
        keyboardType="number-pad"
        maxLength={4}
        value={value.y}
        onChangeText={(text) => onChange({ ...value, y: text })}
      />
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

    /* Profile circle in front of the title — the player's initials. */
    avatar: {
      width: 38,
      height: 38,
      borderRadius: 19,
      marginRight: 10,
      backgroundColor: C.red,
      alignItems: 'center',
      justifyContent: 'center',
    },

    avatarText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 13,
      letterSpacing: 0.2,
      color: '#F5F5F5',
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
      backgroundColor: C.card,
      borderWidth: 2,
      borderColor: C.border,
      borderRadius: 7,
      overflow: 'hidden',
    },

    cardGap: {
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

    cardBody: {
      paddingHorizontal: 15,
      paddingTop: 12,
      paddingBottom: 14,
    },

    /* ── Photo upload ────────────────────────────────────────── */
    photoZone: {
      height: 118,
      alignItems: 'center',
      justifyContent: 'center',
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
    },

    photoBtn: {
      alignItems: 'center',
    },

    photoCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: C.green,
      alignItems: 'center',
      justifyContent: 'center',
    },

    photoHint: {
      fontFamily: Fonts.body,
      fontSize: 12,
      color: C.text,
      marginTop: 8,
    },

    /* ── Fields ──────────────────────────────────────────────── */
    row: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 10,
      marginBottom: 10,
    },

    rowLast: {
      marginBottom: 0,
    },

    rowTight: {
      marginTop: 14,
    },

    /* Raised while their selectors can open, so an option list falls over the
       rows below instead of under them. */
    rowPos: {
      zIndex: 30,
    },

    rowTeam: {
      zIndex: 20,
    },

    col: {
      flex: 1,
    },

    nrCol: {
      width: 62,
    },

    label: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 15,
      color: C.text,
      marginBottom: 7,
    },

    input: {
      height: 30,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: C.inputBorder,
      borderRadius: 4,
      paddingHorizontal: 9,
      paddingVertical: 0,
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 16,
      color: C.text,
    },

    nrInput: {
      textAlign: 'center',
    },

    /* ── Contract dates ──────────────────────────────────────── */
    dateCols: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 8,
    },

    dateCol: {
      flex: 1,
    },

    dateColRight: {
      alignItems: 'flex-end',
    },

    labelRight: {
      alignSelf: 'stretch',
      textAlign: 'right',
    },

    dateGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    dateSq: {
      width: 36,
      textAlign: 'center',
      paddingHorizontal: 0,
    },

    dateYear: {
      width: 62,
      textAlign: 'center',
      paddingHorizontal: 0,
    },

    dateSlash: {
      fontFamily: Fonts.body,
      fontSize: 12,
      color: C.text,
    },

    /* ── Selects ─────────────────────────────────────────────── */
    sel: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
      height: 30,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: C.inputBorder,
      borderRadius: 4,
      paddingHorizontal: 9,
    },

    selText: {
      flexShrink: 1,
      fontFamily: Fonts.body,
      fontSize: 12,
      color: C.text,
    },

    /* Holds the control while its option list floats beneath it. */
    selWrap: {
      position: 'relative',
      zIndex: 40,
    },

    selOpts: {
      position: 'absolute',
      top: 32,
      left: 0,
      right: 0,
      zIndex: 40,
      elevation: 12,
      backgroundColor: '#F5F5F5',
      borderWidth: 1,
      borderColor: C.inputBorder,
      borderRadius: 4,
      overflow: 'hidden',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
    },

    selOpt: {
      minHeight: 28,
      justifyContent: 'center',
      paddingHorizontal: 9,
    },

    selOptActive: {
      backgroundColor: 'rgba(21,148,71,0.10)',
    },

    selOptText: {
      fontFamily: Fonts.body,
      fontSize: 11,
      color: C.text,
    },

    selOptTextActive: {
      fontFamily: Fonts.bodySemiBold,
    },

    newPosBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      height: 30,
      paddingHorizontal: 10,
      backgroundColor: C.greenSoft,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
    },

    newPosText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      color: C.text,
    },

    /* The inline "e re" entry that opens beneath the sports row. */
    newPosRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10,
    },

    newPosInput: {
      flex: 1,
    },

    /* ── Radio circles ───────────────────────────────────────── */
    circle: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 1.5,
      borderColor: '#000000',
      backgroundColor: 'transparent',
    },

    circleOn: {
      borderColor: C.green,
      backgroundColor: C.green,
    },

    /* ── Membership type ─────────────────────────────────────── */
    optCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 9,
      paddingVertical: 10,
      backgroundColor: C.input,
      borderWidth: 1,
      borderColor: C.border,
      borderRadius: 5,
    },

    optText: {
      flexShrink: 1,
    },

    optTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.text,
    },

    optSub: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.text,
      marginTop: 1,
    },

    /* ── Billing cycle ───────────────────────────────────────── */
    cycleLabel: {
      marginTop: 4,
      marginBottom: 6,
    },

    cycleRow: {
      flexDirection: 'row',
      gap: 8,
    },

    cycleCard: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 9,
      paddingVertical: 9,
      backgroundColor: C.input,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 5,
    },

    cycleTitle: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12.5,
      lineHeight: 16,
      color: C.text,
    },

    cycleSub: {
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 14,
      color: C.text,
      marginTop: 1,
    },

    /* ── Actions ─────────────────────────────────────────────── */
    errorText: {
      marginTop: 12,
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 15,
      color: C.red,
    },

    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 9,
      marginTop: 16,
    },

    btn: {
      height: 44,
      borderRadius: 3,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 22,
    },

    btnCancel: {
      backgroundColor: C.red,
    },

    btnConfirm: {
      backgroundColor: C.green,
    },

    btnConfirmOff: {
      opacity: 0.5,
    },

    btnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13.5,
      color: '#F5F5F5',
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
