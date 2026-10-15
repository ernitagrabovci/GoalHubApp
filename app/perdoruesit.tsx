import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { FilterSelect, type FilterOption } from '@/components/filters/filter-select';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import { listTeams } from '@/lib/api/teams';
import type { ApiMember, ApiTeam, Paginated } from '@/lib/api/types';
import {
  changeUserRole,
  createUser,
  deleteUser,
  listUsers,
  toggleUser,
  updateUser,
} from '@/lib/api/users';
import type { UserRole } from '@/lib/api/users';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * Lista e përdoruesve — opened from "Përdoruesit" in the admin pill bar.
 *
 * Seven headline squares over the account controls, the user table with its
 * pager, the role-swap panel and the activity card.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',

  cardBg: '#E3EEFB',
  headBg: '#F6FBFF',
  frame: '#000000',
  headLine: 'rgba(30,40,35,0.10)',
  rowLine: 'rgba(100,140,190,0.22)',

  blueSoft: '#E3EEFB',
  blueBtn: '#86BCFD',
  blue: '#2F80ED',
  green: '#159447',
  orange: '#E4A000',
  red: '#E03131',
};

const IMG = {
  training: require('@/assets/dashboard/stervitje.png'),
};

/* Popup palette — same shell as the modals on the other admin pages. */
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

/* ── Headline squares ──────────────────────────────────────────────── */

/**
 * The squares sit on a near-white page, so a white frost on its own reads as
 * nothing. Shading the pane instead — a very light grey at the top edge
 * sweeping down to white — is what gives the surface its glassy shape.
 */
const SQ_GLOSS = [
  'rgba(180,188,201,0.30)',
  'rgba(216,222,231,0.15)',
  'rgba(245,245,245,0.80)',
] as const;

/** Thin specular rim on the top edge — reads as the thickness of the pane. */
const SQ_SHEEN = ['rgba(245,245,245,0.55)', 'rgba(245,245,245,0.00)'] as const;

type Square = { label: string; value: string; hint: string; tone: string; tall?: boolean };

/**
 * The grid's 2-3-2 rhythm, spelled out row by row. Cells carry a fixed width
 * rather than flexing, so the short rows stay ragged instead of stretching to
 * fill the slot they leave open.
 */
const SQUARE_ROWS: Square[][] = [
  [
    { label: 'Të gjithë userat', value: '144', hint: 'aktiv', tone: C.text, tall: true },
    {
      label: 'Userat e deaktivizuar',
      value: '0',
      hint: 'akses i ndaluar',
      tone: C.red,
      tall: true,
    },
  ],
  [
    { label: 'Administratori', value: '1', hint: 'akses i plotë', tone: C.green },
    { label: 'Trajnerë', value: '5', hint: 'ekip + stërvitje', tone: C.green },
    { label: 'Lojtarë', value: '85', hint: 'të regjistruar', tone: C.orange },
  ],
  [
    { label: 'Prindër', value: '42', hint: 'kujdestarë', tone: C.blue },
    { label: 'Financier', value: '1', hint: 'financat', tone: C.blue },
  ],
];

/* ── Users ─────────────────────────────────────────────────────────── */

type User = {
  name: string;
  email: string;
  role: string;
  team: string;
  status: 'Aktiv' | 'Joaktiv';
  last: string;
};

/**
 * The `GET /users` row carries the club-member shape (`ApiMember` in
 * types.ts — its `ApiUser` is the signed-in auth user). Aliased here to keep
 * the row vocabulary of this screen.
 */
type ApiUser = ApiMember;

/** Backend role slug → the Albanian label the "Roli" column shows. */
const ROLE_LABEL_BY_SLUG: Record<string, string> = {
  administrator: 'Administrator',
  trainer: 'Trajner',
  assistant_trainer: 'Trajner',
  technical_staff: 'Trajner',
  player: 'Lojtar',
  parent: 'Prind',
  financier: 'Financier',
};

function roleLabel(row: ApiUser): string {
  return ROLE_LABEL_BY_SLUG[row.role] ?? row.role_label ?? row.role;
}

/** The Albanian label the pickers show → the backend role slug they submit. */
const ROLE_SLUG_BY_LABEL: Record<string, UserRole> = {
  Administrator: 'administrator',
  Trajner: 'trainer',
  Lojtar: 'player',
  Prind: 'parent',
  Financier: 'financier',
};

/** The edit popup's standing option for "no team". */
const NO_TEAM = 'Pa ekip';

/** The write calls' inline error, mapped from the HTTP failure. */
function writeErrorText(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 0) return 'Nuk mund të lidhemi me serverin. Kontrollo lidhjen.';
    if (err.status === 422) return 'Të dhënat nuk janë të vlefshme. Kontrollo fushat.';
    if (err.status === 403) return 'Nuk keni leje për këtë veprim.';
    if (err.status === 404) return 'Përdoruesi nuk u gjet.';
  }
  return 'Diçka shkoi keq. Provo përsëri.';
}

const MONTHS_SHORT = [
  'Jan', 'Shk', 'Mar', 'Pri', 'Maj', 'Qer', 'Kor', 'Gsh', 'Sht', 'Tet', 'Nën', 'Dhj',
];

/** `last_login_at` → `Sot, 09:12` / `Dje, 19:05` / `12 Sht, 20:31`; null → `—`. */
function formatLast(iso: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === now.toDateString()) return `Sot, ${hh}:${mm}`;
  if (date.toDateString() === yesterday.toDateString()) return `Dje, ${hh}:${mm}`;
  const day = String(date.getDate()).padStart(2, '0');
  return `${day} ${MONTHS_SHORT[date.getMonth()]}, ${hh}:${mm}`;
}

/** A fetched member row mapped onto the table's own `User` shape. */
function toUser(row: ApiUser): User {
  return {
    name: row.name,
    email: row.email ?? '—',
    role: roleLabel(row),
    team: row.team?.name ?? '—',
    status: row.is_active ? 'Aktiv' : 'Joaktiv',
    last: formatLast(row.last_login_at),
  };
}

/** A short run of page numbers centred on `current`. */
function pageWindow(current: number, last: number, span = 5): number[] {
  if (last <= span) return Array.from({ length: last }, (_, i) => i + 1);
  let start = Math.max(1, current - Math.floor(span / 2));
  const end = Math.min(last, start + span - 1);
  start = Math.max(1, end - span + 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/** The table runs past the right edge, so every column carries its own width. */
const USER_COLS = [
  { key: 'name', label: 'Emri', width: 118 },
  { key: 'email', label: 'Email', width: 168 },
  { key: 'role', label: 'Roli', width: 96 },
  { key: 'team', label: 'Ekipi', width: 88 },
  { key: 'status', label: 'Statusi', width: 74 },
  { key: 'last', label: 'Hyrja e fundit', width: 104 },
] as const;

/** Wide enough for the three row buttons side by side. */
const ACTION_W = 182;

const STATUS_TONE: Record<User['status'], string> = {
  Aktiv: C.green,
  Joaktiv: C.red,
};

const ROLES = ['Administrator', 'Trajner', 'Lojtar', 'Prind', 'Financier'];

/** Creating a player goes through the player form (squad record + first fee),
    so the create picker offers only the staff roles. */
const CREATE_ROLES = ROLES.filter((r) => r !== 'Lojtar');

const TEAMS = ['Ekipi i Parë', 'U21', 'U19', 'U17', 'U15', 'U13'];

const STATUSES: User['status'][] = ['Aktiv', 'Joaktiv'];

/** A square of the summary grid — the tall top pair, then the short plates. */
function SummarySquare({ square, tall }: { square: Square; tall?: boolean }) {
  return (
    <View style={[styles.sqShadow, tall ? styles.sqTall : styles.sqShort]}>
      <View style={styles.sq}>
        {/* Frost the canvas grid, then lay a gloss sweep over it. */}
        <BlurView pointerEvents="none" intensity={50} tint="light" style={StyleSheet.absoluteFill} />
        <LinearGradient
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          colors={SQ_GLOSS}
          locations={[0, 0.55, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <LinearGradient
          pointerEvents="none"
          style={styles.sheen}
          colors={SQ_SHEEN}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

        <View style={styles.sqBody}>
          <Text style={[styles.sqLabel, tall ? null : styles.sqLabelShort]} numberOfLines={2}>
            {square.label}
          </Text>
          <Text
            style={[styles.sqValue, tall ? null : styles.sqValueShort, { color: square.tone }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.5}
          >
            {square.value}
          </Text>
          <Text
            style={[styles.sqHint, tall ? null : styles.sqHintShort, { color: square.tone }]}
            numberOfLines={2}
          >
            {square.hint}
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* "Krijo llogari të re" popup                                         */
/* ------------------------------------------------------------------ */

/** Dropdown inside the popups — the in-page picker's shell on a white card. */
function PopupSelect({
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
        style={({ pressed }) => [styles.pmSel, pressed && styles.pressed]}
      >
        <Text style={styles.pmSelText} numberOfLines={1}>
          {value}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={I(11)} color="#777777" />
      </Pressable>
      {open ? (
        <View style={styles.pmOpts}>
          {options.map((o) => {
            const active = o === value;
            return (
              <Pressable
                key={o}
                onPress={() => {
                  onChange(o);
                  setOpen(false);
                }}
                style={[styles.pmOpt, active && styles.pmOptActive]}
              >
                <Text style={[styles.pmOptText, active && styles.pmOptTextActive]} numberOfLines={1}>
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

function CreateUserModal({
  token,
  onClose,
  onSaved,
  onExpired,
}: {
  token: string | null;
  onClose: () => void;
  onSaved: () => void;
  onExpired: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const cardW = Math.min(width - 24, 360);
  const maxBody = Math.max(280, height - 187);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState(ROLES[0]);
  const [title, setTitle] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = () => {
    if (!token || busy) return;

    const name = fullName.trim();
    const mail = email.trim();
    if (!name || !mail) {
      setErr('Emri dhe email adresa janë të detyrueshme.');
      return;
    }
    if (password.length < 8) {
      setErr('Fjalëkalimi duhet të ketë të paktën 8 karaktere.');
      return;
    }
    if (password !== confirm) {
      setErr('Fjalëkalimet nuk përputhen.');
      return;
    }

    setBusy(true);
    setErr(null);

    createUser(token, {
      name,
      email: mail,
      password,
      password_confirmation: confirm,
      role: ROLE_SLUG_BY_LABEL[role] ?? 'trainer',
      role_label: title.trim() || null,
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
    <View style={[styles.pmCard, { width: cardW }]}>
      <View style={styles.pmHeader}>
        <Text style={styles.pmTitle} numberOfLines={1}>
          Krijo llogari të re
        </Text>
        <Text style={styles.pmSub} numberOfLines={1}>
          Shto një përdorues të ri në platformë
        </Text>
      </View>
      <View style={styles.pmDivider} />

      <ScrollView
        style={{ maxHeight: maxBody }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.pmContent}
      >
        {err ? <Text style={styles.pmErr}>{err}</Text> : null}

        <View style={styles.pmRow}>
          <View style={styles.pmCol}>
            <Text style={styles.pmLabel}>Emri i plotë:</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              allowFontScaling={false}
              style={styles.pmInput}
            />
          </View>
          <View style={styles.pmCol}>
            <Text style={[styles.pmLabel, styles.pmLabelRight]}>Email adresa:</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              allowFontScaling={false}
              style={styles.pmInput}
            />
          </View>
        </View>

        <View style={[styles.pmRow, styles.pmGap]}>
          <View style={styles.pmCol}>
            <Text style={styles.pmLabel}>Fjalëkalimi:</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              allowFontScaling={false}
              style={styles.pmInput}
            />
          </View>
          <View style={styles.pmCol}>
            <Text style={styles.pmLabel}>Konfirmo fjalëkalimin:</Text>
            <TextInput
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              allowFontScaling={false}
              style={styles.pmInput}
            />
          </View>
        </View>

        <Text style={[styles.pmLabel, styles.pmGap]}>Roli:</Text>
        <PopupSelect value={role} options={CREATE_ROLES} onChange={setRole} />

        <Text style={[styles.pmLabel, styles.pmGap]}>Titulli i personalizuar (opsional):</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          allowFontScaling={false}
          style={styles.pmInput}
        />

        <View style={styles.pmActions}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={({ pressed }) => [styles.pmBtn, styles.pmBtnCancel, pressed && styles.pressed]}
          >
            <Text style={styles.pmBtnText}>Anulo</Text>
          </Pressable>
          <Pressable
            onPress={submit}
            disabled={busy}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.pmBtn,
              styles.pmBtnCreate,
              busy && styles.pmBtnOff,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.pmBtnText}>Krijo</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* "Edito përdoruesin" popup                                           */
/* ------------------------------------------------------------------ */

function EditUserModal({
  member,
  teams,
  token,
  onClose,
  onSaved,
  onExpired,
}: {
  member: ApiUser;
  teams: ApiTeam[];
  token: string | null;
  onClose: () => void;
  onSaved: () => void;
  onExpired: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const cardW = Math.min(width - 24, 360);
  const maxBody = Math.max(280, height - 187);

  /* Real teams when they load, the standing list otherwise. */
  const teamOptions = [NO_TEAM, ...(teams.length ? teams.map((t) => t.name) : TEAMS)];

  const [fullName, setFullName] = useState(member.name);
  const [email, setEmail] = useState(member.email ?? '');
  const [role, setRole] = useState(roleLabel(member));
  const [team, setTeam] = useState(member.team?.name ?? NO_TEAM);
  const [status, setStatus] = useState<User['status']>(member.is_active ? 'Aktiv' : 'Joaktiv');
  const [title, setTitle] = useState(member.role_label ?? '');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = () => {
    if (!token || busy) return;

    const name = fullName.trim();
    const mail = email.trim();
    if (!name || !mail) {
      setErr('Emri dhe email adresa janë të detyrueshme.');
      return;
    }

    /* Leave the stored slug alone when the label never moved, so the collapsed
       "Trajner" label can't demote an assistant/technical-staff account. */
    const roleSlug: UserRole =
      role === roleLabel(member)
        ? (member.role as UserRole)
        : ROLE_SLUG_BY_LABEL[role] ?? (member.role as UserRole);

    const teamId = team === NO_TEAM ? null : teams.find((t) => t.name === team)?.id ?? null;

    /* The write endpoints can't set `is_active`, so a moved status rides the toggle. */
    const statusChanged = (status === 'Aktiv') !== member.is_active;

    setBusy(true);
    setErr(null);

    updateUser(token, member.id, {
      name,
      email: mail,
      role: roleSlug,
      role_label: title.trim() || null,
      team_id: teamId,
    })
      .then(async () => {
        if (statusChanged) await toggleUser(token, member.id);
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
    <View style={[styles.pmCard, { width: cardW }]}>
      <View style={styles.pmHeader}>
        <Text style={styles.pmTitle} numberOfLines={1}>
          Edito përdoruesin
        </Text>
        <Text style={styles.pmSub} numberOfLines={1}>
          Përditëso të dhënat e llogarisë
        </Text>
      </View>
      <View style={styles.pmDivider} />

      <ScrollView
        style={{ maxHeight: maxBody }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.pmContent}
      >
        {err ? <Text style={styles.pmErr}>{err}</Text> : null}

        <View style={styles.pmRow}>
          <View style={styles.pmCol}>
            <Text style={styles.pmLabel}>Emri i plotë:</Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              allowFontScaling={false}
              style={styles.pmInput}
            />
          </View>
          <View style={styles.pmCol}>
            <Text style={[styles.pmLabel, styles.pmLabelRight]}>Email adresa:</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              allowFontScaling={false}
              style={styles.pmInput}
            />
          </View>
        </View>

        <View style={[styles.pmRow, styles.pmGap]}>
          <View style={styles.pmCol}>
            <Text style={styles.pmLabel}>Roli:</Text>
            <PopupSelect value={role} options={ROLES} onChange={setRole} />
          </View>
          <View style={styles.pmCol}>
            <Text style={styles.pmLabel}>Ekipi:</Text>
            <PopupSelect value={team} options={teamOptions} onChange={setTeam} />
          </View>
        </View>

        <Text style={[styles.pmLabel, styles.pmGap]}>Statusi:</Text>
        <PopupSelect
          value={status}
          options={STATUSES}
          onChange={(v) => setStatus(v as User['status'])}
        />

        <Text style={[styles.pmLabel, styles.pmGap]}>Titulli i personalizuar (opsional):</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          allowFontScaling={false}
          style={styles.pmInput}
        />

        <View style={styles.pmActions}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={({ pressed }) => [styles.pmBtn, styles.pmBtnCancel, pressed && styles.pressed]}
          >
            <Text style={styles.pmBtnText}>Anulo</Text>
          </Pressable>
          <Pressable
            onPress={submit}
            disabled={busy}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.pmBtn,
              styles.pmBtnCreate,
              busy && styles.pmBtnOff,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.pmBtnText}>Ruaj</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Toggle / delete confirmation popup                                  */
/* ------------------------------------------------------------------ */

function ConfirmUserModal({
  member,
  action,
  token,
  onClose,
  onDone,
  onExpired,
}: {
  member: ApiUser;
  action: 'toggle' | 'delete';
  token: string | null;
  onClose: () => void;
  onDone: () => void;
  onExpired: () => void;
}) {
  const { width } = useWindowDimensions();
  const cardW = Math.min(width - 24, 360);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const deleting = action === 'delete';
  const activating = !member.is_active;

  const title = deleting
    ? 'Fshi llogarinë'
    : activating
      ? 'Aktivizo përdoruesin'
      : 'Çaktivizo përdoruesin';
  const sub = deleting
    ? 'Ky veprim është i pakthyeshëm'
    : activating
      ? 'Llogaria rifiton aksesin'
      : 'Llogaria humb aksesin menjëherë';
  const prompt = deleting
    ? 'A jeni i sigurt që dëshironi të fshini këtë përdorues?'
    : activating
      ? 'A jeni i sigurt që dëshironi të aktivizoni këtë përdorues?'
      : 'A jeni i sigurt që dëshironi të çaktivizoni këtë përdorues?';
  const confirmLabel = deleting ? 'Fshi' : activating ? 'Aktivizo' : 'Çaktivizo';
  const note = deleting
    ? 'Llogaria dhe të dhënat e saj fshihen përgjithmonë. Veprimi regjistrohet në log.'
    : activating
      ? 'Përdoruesi do të mund të hyjë sërish në platformë. Veprimi regjistrohet në log.'
      : 'Përdoruesi nuk do të mund të hyjë në platformë derisa llogaria të riaktivizohet. Veprimi regjistrohet në log.';

  const run = () => {
    if (!token || busy) return;
    setBusy(true);
    setErr(null);

    const call: Promise<unknown> =
      action === 'delete' ? deleteUser(token, member.id) : toggleUser(token, member.id);

    call
      .then(() => onDone())
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
    <View style={[styles.pmCard, { width: cardW }]}>
      <View style={styles.pmHeader}>
        <Text style={styles.pmTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.pmSub} numberOfLines={1}>
          {sub}
        </Text>
      </View>
      <View style={styles.pmDivider} />

      <View style={styles.pmContent}>
        <Text style={styles.pmPrompt}>{prompt}</Text>

        {/* Tinted red so the consequence reads before the buttons do. */}
        <View style={styles.pmPreview}>
          <Text style={styles.pmPreviewText} numberOfLines={1}>
            {member.name}
          </Text>
        </View>
        <Text style={styles.pmMeta} numberOfLines={1}>
          {member.email ?? '—'} · {roleLabel(member)}
        </Text>

        <View style={styles.pmNote}>
          <Text style={styles.pmNoteText}>{note}</Text>
        </View>

        {err ? <Text style={styles.pmErr}>{err}</Text> : null}

        <View style={styles.pmActions}>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={({ pressed }) => [styles.pmBtn, styles.pmBtnCancel, pressed && styles.pressed]}
          >
            <Text style={styles.pmBtnText}>Anulo</Text>
          </Pressable>
          <Pressable
            onPress={run}
            disabled={busy}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.pmBtn,
              styles.pmBtnCreate,
              busy && styles.pmBtnOff,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.pmBtnText}>{confirmLabel}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function UsersListScreen() {
  const router = useRouter();
  const { user, token, signOut } = useSession();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ApiUser | null>(null);
  const [confirm, setConfirm] = useState<{ member: ApiUser; action: 'toggle' | 'delete' } | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [rows, setRows] = useState<ApiUser[]>([]);
  const [teams, setTeams] = useState<ApiTeam[]>([]);
  const [meta, setMeta] = useState<Paginated<ApiUser>['meta'] | null>(null);
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);

  /* The three dropdowns and the search box drive the server-side query. */
  const [roleFilter, setRoleFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  /** What the user is typing; `search` is what was submitted. */
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  /* Role swap controls. */
  const [openPicker, setOpenPicker] = useState<'user' | 'role' | null>(null);
  const [roleUserId, setRoleUserId] = useState<number | null>(null);
  /** `null` keeps the picker on the selected member's current role. */
  const [roleNewLabel, setRoleNewLabel] = useState<string | null>(null);
  const [roleBusy, setRoleBusy] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  const refresh = useCallback(() => setReload((r) => r + 1), []);

  const handleExpired = useCallback(() => {
    signOut();
    router.replace('/login');
  }, [signOut, router]);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    listUsers(
      token,
      {
        page,
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        team_id: teamFilter ? Number(teamFilter) : undefined,
      },
      controller.signal,
    )
      .then((res) => {
        if (controller.signal.aborted) return;
        setRows(res.data);
        setMeta(res.meta);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) {
          signOut();
          router.replace('/login');
        }
      });
    return () => controller.abort();
  }, [token, page, reload, router, signOut, search, roleFilter, statusFilter, teamFilter]);

  /* The edit popup's team picker reads from the club's real teams. */
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    listTeams(token, controller.signal)
      .then((res) => {
        if (!controller.signal.aborted) setTeams(res.data);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [token]);

  /* Derived, not synced in an effect: the picker follows a row that still
     exists (falling back to the first), and its label tracks that member's
     current role until the user picks a different one. */
  const roleMember = rows.find((r) => r.id === roleUserId) ?? rows[0] ?? null;
  const roleLabelShown = roleNewLabel ?? (roleMember ? roleLabel(roleMember) : ROLES[2]);

  const saveRole = () => {
    if (roleBusy) return;
    setRoleError(null);

    if (!token || !roleMember) {
      setRoleError('Zgjidh një përdorues.');
      return;
    }
    if (roleMember.id === user?.id) {
      setRoleError('Nuk mund të ndryshoni rolin tuaj.');
      return;
    }

    const nextRole: UserRole =
      roleLabelShown === roleLabel(roleMember)
        ? (roleMember.role as UserRole)
        : ROLE_SLUG_BY_LABEL[roleLabelShown] ?? 'player';

    setRoleBusy(true);
    changeUserRole(token, roleMember.id, nextRole)
      .then(() => {
        setRoleBusy(false);
        refresh();
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) {
          handleExpired();
          return;
        }
        setRoleBusy(false);
        setRoleError(writeErrorText(e));
      });
  };

  /* Deleting your own account is blocked before the popup even opens. */
  const requestDelete = (member: ApiUser) => {
    if (member.id === user?.id) {
      setActionError('Nuk mund të fshini llogarinë tuaj.');
      return;
    }
    setActionError(null);
    setConfirm({ member, action: 'delete' });
  };

  const current = meta?.current_page ?? 1;
  const lastPage = meta?.last_page ?? 1;
  const pages = pageWindow(current, lastPage);

  /* Filter options — the first entry of each is the neutral "all" choice. */
  const roleOptions: FilterOption[] = [
    { label: 'Të gjitha rolet', value: '' },
    ...ROLES.map((r) => ({ label: r, value: ROLE_SLUG_BY_LABEL[r] })),
  ];

  const teamOptions: FilterOption[] = [
    { label: 'Të gjitha ekipet', value: '' },
    ...teams.map((t) => ({ label: t.name, value: String(t.id) })),
  ];

  const statusOptions: FilterOption[] = [
    { label: 'Të gjitha statuset', value: '' },
    { label: 'Aktiv', value: 'active' },
    { label: 'Joaktiv', value: 'inactive' },
  ];

  /* A new filter resets to the first page; the pager tracks the filtered set. */
  const submitSearch = () => {
    setSearch(searchInput.trim());
    setPage(1);
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
                <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                  Lista e përdoruesve
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  144 përdorues gjithsej në platformë
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
            {/* ── Summary grid: 2-3-2, ragged ends left open ───────────── */}
            <View style={styles.sqGrid}>
              {SQUARE_ROWS.map((row) => (
                <View key={row[0].label} style={styles.sqRow}>
                  {row.map((s) => (
                    <SummarySquare key={s.label} square={s} tall={s.tall} />
                  ))}
                </View>
              ))}
            </View>

            {/* ── Krijo llogari ─────────────────────────────────── */}
            <Pressable
              onPress={() => setCreating(true)}
              accessibilityRole="button"
              accessibilityLabel="Krijo llogari"
              style={({ pressed }) => [styles.newUser, pressed && styles.pressed]}
            >
              <View style={styles.newUserPlus}>
                <MaterialCommunityIcons name="plus" size={I(15)} color="#F5F5F5" />
              </View>
              <Text style={styles.newUserText}>Krijo llogari</Text>
            </Pressable>

            {/* ── Filters ───────────────────────────────────────── */}
            <View style={styles.filterRow}>
              <FilterSelect
                label="Filtro sipas rolit"
                options={roleOptions}
                value={roleFilter}
                onChange={(v) => {
                  setRoleFilter(v);
                  setPage(1);
                }}
                boxStyle={styles.filterBox}
                textStyle={styles.filterText}
              />
              <FilterSelect
                label="Filtro sipas ekipit"
                options={teamOptions}
                value={teamFilter}
                onChange={(v) => {
                  setTeamFilter(v);
                  setPage(1);
                }}
                boxStyle={styles.filterBox}
                textStyle={styles.filterText}
              />
              <FilterSelect
                label="Filtro sipas statusit"
                options={statusOptions}
                value={statusFilter}
                onChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
                boxStyle={styles.filterBox}
                textStyle={styles.filterText}
              />
            </View>

            {/* ── Search ────────────────────────────────────────── */}
            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                value={searchInput}
                onChangeText={setSearchInput}
                onSubmitEditing={submitSearch}
                returnKeyType="search"
                placeholder="Kërko me emër lojtarin..."
                placeholderTextColor={C.gray}
                accessibilityLabel="Kërko përdorues"
              />
              <Pressable
                onPress={submitSearch}
                accessibilityRole="button"
                accessibilityLabel="Kërko"
                style={({ pressed }) => [styles.searchBtn, pressed && styles.pressed]}
              >
                <Text style={styles.searchBtnText}>Kërko</Text>
              </Pressable>
            </View>

            {actionError ? (
              <Text style={styles.screenErr} numberOfLines={2}>
                {actionError}
              </Text>
            ) : null}

            {/* ── Users table ───────────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.head}>
                <Text style={styles.headText} numberOfLines={1}>
                  Të gjithë përdoruesit
                </Text>
              </View>
              <View style={styles.headLine} />

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                bounces={false}
                contentContainerStyle={styles.tblInner}
              >
                {/* One wrapper, so the header row and the rows below it stack
                    down the page instead of lining up across it. */}
                <View>
                  <View style={[styles.tr, styles.thRow]}>
                    {USER_COLS.map((c) => (
                      <Text key={c.key} style={[styles.th, { width: c.width }]} numberOfLines={1}>
                        {c.label}
                      </Text>
                    ))}
                    {/* Keeps the header rule exactly as wide as the rows below. */}
                    <View style={{ width: ACTION_W }} />
                  </View>

                  {rows.map((u) => {
                    const row = toUser(u);
                    return (
                      <View key={u.id} style={[styles.tr, styles.trBorder]}>
                        <Text
                          style={[styles.td, styles.tdName, { width: 118 }]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.75}
                        >
                          {row.name}
                        </Text>
                        <Text style={[styles.td, { width: 168 }]} numberOfLines={1}>
                          {row.email}
                        </Text>
                        <Text style={[styles.td, { width: 96 }]} numberOfLines={1}>
                          {row.role}
                        </Text>
                        <Text style={[styles.td, { width: 88 }]} numberOfLines={1}>
                          {row.team}
                        </Text>
                        <Text
                          style={[
                            styles.td,
                            styles.tdStatus,
                            { width: 74, color: STATUS_TONE[row.status] },
                          ]}
                          numberOfLines={1}
                        >
                          {row.status}
                        </Text>
                        <Text style={[styles.td, { width: 104 }]} numberOfLines={1}>
                          {row.last}
                        </Text>

                        {/* Transparent, outlined, and sitting on the row itself. */}
                        <View style={[styles.actions, { width: ACTION_W }]}>
                          <Pressable
                            onPress={() => setEditing(u)}
                            accessibilityRole="button"
                            accessibilityLabel={`Edito ${row.name}`}
                            style={({ pressed }) => [styles.actEdit, pressed && styles.pressed]}
                          >
                            <Text style={styles.actEditText}>Edito</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => setConfirm({ member: u, action: 'toggle' })}
                            accessibilityRole="button"
                            accessibilityLabel={`${u.is_active ? 'Çaktivizo' : 'Aktivizo'} ${row.name}`}
                            style={({ pressed }) => [
                              u.is_active ? styles.actOff : styles.actOn,
                              pressed && styles.pressed,
                            ]}
                          >
                            <Text style={u.is_active ? styles.actOffText : styles.actOnText}>
                              {u.is_active ? 'Çaktivizo' : 'Aktivizo'}
                            </Text>
                          </Pressable>
                          <Pressable
                            onPress={() => requestDelete(u)}
                            accessibilityRole="button"
                            accessibilityLabel={`Fshi ${row.name}`}
                            style={({ pressed }) => [styles.actOff, pressed && styles.pressed]}
                          >
                            <Text style={styles.actOffText}>Fshi</Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {/* ── Pager ─────────────────────────────────────────── */}
            <View style={styles.pager}>
              <Pressable
                onPress={() => setPage((p) => Math.max(1, p - 1))}
                accessibilityRole="button"
                accessibilityLabel="Faqja e mëparshme"
                hitSlop={8}
                style={({ pressed }) => [styles.pagerArrow, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons name="chevron-left" size={I(22)} color={C.text} />
              </Pressable>

              {pages.map((p) => (
                <Pressable
                  key={p}
                  onPress={() => setPage(p)}
                  accessibilityRole="button"
                  accessibilityLabel={`Faqja ${p}`}
                  style={({ pressed }) => [styles.pageSq, pressed && styles.pressed]}
                >
                  <Text style={styles.pageSqText}>{p}</Text>
                </Pressable>
              ))}

              <Pressable
                onPress={() => setPage((p) => Math.min(lastPage, p + 1))}
                accessibilityRole="button"
                accessibilityLabel="Faqja tjetër"
                hitSlop={8}
                style={({ pressed }) => [styles.pagerArrow, pressed && styles.pressed]}
              >
                <MaterialCommunityIcons name="chevron-right" size={I(22)} color={C.text} />
              </Pressable>
            </View>

            {/* ── Role swap ─────────────────────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.head}>
                <Text style={styles.headText} numberOfLines={1}>
                  Ndrysho rolin e një përdoruesi
                </Text>
              </View>
              <View style={styles.headLine} />

              <View style={styles.body}>
                <View style={styles.pickRow}>
                  <Text style={styles.pickLabel}>Zgjidh përdoruesin:</Text>
                  <Text style={[styles.pickLabel, styles.pickLabelRight]}>Roli i ri:</Text>
                </View>

                <View style={styles.pickRow}>
                  <Pressable
                    onPress={() => setOpenPicker((v) => (v === 'user' ? null : 'user'))}
                    accessibilityRole="button"
                    accessibilityLabel="Zgjidh përdoruesin"
                    style={({ pressed }) => [styles.picker, pressed && styles.pressed]}
                  >
                    <Text style={styles.pickerText} numberOfLines={1}>
                      {roleMember?.name ?? '—'}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={I(13)} color={C.text} />
                  </Pressable>

                  <Pressable
                    onPress={() => setOpenPicker((v) => (v === 'role' ? null : 'role'))}
                    accessibilityRole="button"
                    accessibilityLabel="Roli i ri"
                    style={({ pressed }) => [styles.picker, pressed && styles.pressed]}
                  >
                    <Text style={styles.pickerText} numberOfLines={1}>
                      {roleLabelShown}
                    </Text>
                    <MaterialCommunityIcons name="chevron-down" size={I(13)} color={C.text} />
                  </Pressable>
                </View>

                {openPicker === 'user' ? (
                  <View style={styles.pmOpts}>
                    {rows.map((u) => {
                      const active = u.id === roleMember?.id;
                      return (
                        <Pressable
                          key={u.id}
                          onPress={() => {
                            setRoleUserId(u.id);
                            setRoleNewLabel(null);
                            setOpenPicker(null);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={u.name}
                          style={[styles.pmOpt, active && styles.pmOptActive]}
                        >
                          <Text
                            style={[styles.pmOptText, active && styles.pmOptTextActive]}
                            numberOfLines={1}
                          >
                            {u.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}

                {openPicker === 'role' ? (
                  <View style={styles.pmOpts}>
                    {ROLES.map((r) => {
                      const active = r === roleLabelShown;
                      return (
                        <Pressable
                          key={r}
                          onPress={() => {
                            setRoleNewLabel(r);
                            setOpenPicker(null);
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={r}
                          style={[styles.pmOpt, active && styles.pmOptActive]}
                        >
                          <Text
                            style={[styles.pmOptText, active && styles.pmOptTextActive]}
                            numberOfLines={1}
                          >
                            {r}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}

                {/* The one warm note on the page — deliberate, and easy to miss. */}
                <View style={styles.roleNote}>
                  <Text style={styles.roleNoteText}>
                    Ndryshimi i rolit ndikon direkt në çfarë sheh ky përdorues. Veprimi regjistrohet
                    në log.
                  </Text>
                </View>

                {roleError ? (
                  <Text style={styles.roleErr} numberOfLines={2}>
                    {roleError}
                  </Text>
                ) : null}

                <View style={styles.roleActions}>
                  <Pressable
                    onPress={saveRole}
                    disabled={roleBusy}
                    accessibilityRole="button"
                    accessibilityLabel="Ruaj ndryshimin e rolit"
                    style={({ pressed }) => [
                      styles.roleSave,
                      roleBusy && styles.pmBtnOff,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={styles.roleSaveText}>Ruaj ndryshimin e rolit</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* ── Aktiviteti ────────────────────────────────────── */}
            <Pressable
              onPress={() => router.push('/aktiviteti')}
              accessibilityRole="button"
              accessibilityLabel="Aktiviteti"
              style={({ pressed }) => [styles.aktiviteti, pressed && styles.pressed]}
            >
              <Image source={IMG.training} style={styles.aktImgLeft} resizeMode="contain" />
              <Image source={IMG.training} style={styles.aktImgRight} resizeMode="contain" />

              <Text style={styles.aktTitle} numberOfLines={1}>
                Aktiviteti
              </Text>

              <View style={styles.aktBtnWrap}>
                <View style={styles.aktBtn}>
                  <Text style={styles.aktBtnText}>Vazhdo</Text>
                </View>
              </View>
            </Pressable>
          </View>
        </ScrollView>
      </View>

      {/* Overlay on the SafeAreaView so the blur covers the whole screen */}
      {creating ? (
        <View style={styles.ovWrap}>
          <BlurView style={styles.ovFill} intensity={45} tint="dark" />
          <Pressable
            style={[styles.ovFill, styles.ovDim]}
            onPress={() => setCreating(false)}
            accessibilityRole="button"
            accessibilityLabel="Mbylle dritaren"
          />
          <CreateUserModal
            token={token}
            onClose={() => setCreating(false)}
            onSaved={() => {
              setCreating(false);
              refresh();
            }}
            onExpired={handleExpired}
          />
        </View>
      ) : null}

      {editing ? (
        <View style={styles.ovWrap}>
          <BlurView style={styles.ovFill} intensity={45} tint="dark" />
          <Pressable
            style={[styles.ovFill, styles.ovDim]}
            onPress={() => setEditing(null)}
            accessibilityRole="button"
            accessibilityLabel="Mbylle dritaren"
          />
          <EditUserModal
            member={editing}
            teams={teams}
            token={token}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              refresh();
            }}
            onExpired={handleExpired}
          />
        </View>
      ) : null}

      {confirm ? (
        <View style={styles.ovWrap}>
          <BlurView style={styles.ovFill} intensity={45} tint="dark" />
          <Pressable
            style={[styles.ovFill, styles.ovDim]}
            onPress={() => setConfirm(null)}
            accessibilityRole="button"
            accessibilityLabel="Mbylle dritaren"
          />
          <ConfirmUserModal
            member={confirm.member}
            action={confirm.action}
            token={token}
            onClose={() => setConfirm(null)}
            onDone={() => {
              setConfirm(null);
              refresh();
            }}
            onExpired={handleExpired}
          />
        </View>
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

    /* ── Summary grid ────────────────────────────────────────── */
    sqGrid: {
      marginTop: 6,
      gap: 8,
    },

    sqRow: {
      flexDirection: 'row',
      gap: 8,
    },

    /* Shadow lives on the wrapper: `overflow: hidden` on the pane itself would
       clip it away on iOS. */
    sqShadow: {
      width: '31.5%',
      borderRadius: 8,
      /* Translucent so the frosted pane inside has a backdrop to blur. */
      backgroundColor: 'rgba(245,245,245,0.5)',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 5,
      elevation: 1,
    },

    /* The headline pair stands taller; the rest are wide plates. */
    sqTall: {
      height: 112,
    },

    sqShort: {
      height: 90,
    },

    sq: {
      flex: 1,
      borderWidth: 1,
      borderColor: '#E4A000',
      borderRadius: 8,
      overflow: 'hidden',
    },

    /* Content rides above the frost and gloss overlays. */
    sqBody: {
      flex: 1,
      padding: 9,
    },

    sheen: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '14%',
    },

    /* Fixed two-line block so the values sit on the same line. */
    sqLabel: {
      minHeight: 30,
      fontFamily: Fonts.bodyBold,
      fontSize: 12,
      lineHeight: 15,
      color: C.gray,
    },

    sqLabelShort: {
      minHeight: 26,
      fontSize: 11,
      lineHeight: 13,
    },

    sqValue: {
      fontFamily: Fonts.bodyBold,
      fontSize: 26,
      lineHeight: 32,
      letterSpacing: -0.5,
      marginTop: 4,
    },

    sqValueShort: {
      fontSize: 22,
      lineHeight: 26,
      marginTop: 3,
    },

    sqHint: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 13,
      marginTop: 4,
    },

    sqHintShort: {
      fontSize: 9.5,
      lineHeight: 12,
      marginTop: 2,
    },

    /* ── + Krijo llogari ─────────────────────────────────────── */
    newUser: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 14,
      height: 36,
      paddingLeft: 5,
      paddingRight: 14,
      backgroundColor: C.blueSoft,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    newUserPlus: {
      width: 25,
      height: 25,
      borderRadius: 13,
      backgroundColor: C.blueBtn,
      alignItems: 'center',
      justifyContent: 'center',
    },

    newUserText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12.5,
      color: C.text,
    },

    /* ── Filters ─────────────────────────────────────────────── */
    filterRow: {
      flexDirection: 'row',
      gap: 7,
      marginTop: 14,
    },

    /* Hugs its own label rather than splitting the row three ways. */
    filterBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      height: 32,
      paddingHorizontal: 8,
      backgroundColor: C.blueSoft,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    filterText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 11,
      lineHeight: 14,
      color: C.text,
    },

    /* ── Search ──────────────────────────────────────────────── */
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 12,
    },

    searchInput: {
      flex: 1,
      height: 38,
      paddingHorizontal: 10,
      backgroundColor: '#F5F5F5',
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
      fontFamily: Fonts.body,
      fontSize: 12,
      color: C.text,
    },

    /* Same fill as the filters above, so the controls read as one set. */
    searchBtn: {
      height: 38,
      paddingHorizontal: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.blueSoft,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    searchBtnText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12.5,
      color: C.text,
    },

    /* Inline failure of a row action, sitting just above the table. */
    screenErr: {
      marginTop: 10,
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 15,
      color: C.red,
    },

    /* ── Cards ───────────────────────────────────────────────── */
    card: {
      marginTop: 14,
      backgroundColor: C.cardBg,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 7,
      overflow: 'hidden',
    },

    cardGap: {
      marginTop: 16,
    },

    head: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 11,
      backgroundColor: C.headBg,
    },

    headText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 15,
      lineHeight: 19,
      color: C.text,
    },

    headLine: {
      height: 1,
      backgroundColor: C.headLine,
    },

    /* ── Users table ─────────────────────────────────────────── */
    tblInner: {
      paddingHorizontal: 10,
      paddingBottom: 10,
    },

    thRow: {
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

    tdStatus: {
      fontFamily: Fonts.bodySemiBold,
    },

    /* Transparent, so the row reads through them. */
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    actEdit: {
      height: 24,
      paddingHorizontal: 9,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    actEditText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: C.text,
    },

    actOff: {
      height: 24,
      paddingHorizontal: 9,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.red,
      borderRadius: 4,
    },

    actOffText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: C.red,
    },

    /* The green twin of "Çaktivizo", for an account that is switched off. */
    actOn: {
      height: 24,
      paddingHorizontal: 9,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: C.green,
      borderRadius: 4,
    },

    actOnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: C.green,
    },

    /* ── Pager ───────────────────────────────────────────────── */
    pager: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: 6,
      marginTop: 12,
    },

    pagerArrow: {
      alignItems: 'center',
      justifyContent: 'center',
    },

    pageSq: {
      width: 34,
      height: 34,
      borderRadius: 5,
      backgroundColor: C.blueBtn,
      alignItems: 'center',
      justifyContent: 'center',
    },

    pageSqText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 14,
      color: '#F5F5F5',
    },

    /* ── Role swap ───────────────────────────────────────────── */
    body: {
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 14,
    },

    pickRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 8,
    },

    pickLabel: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.hint,
    },

    pickLabelRight: {
      textAlign: 'right',
    },

    /* Transparent fields, so the card's own fill shows through. */
    picker: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 4,
      height: 32,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 4,
    },

    pickerText: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 11.5,
      color: C.text,
    },

    /* FFDF50 at a fifth — a warm hint nobody mistakes for an error. */
    roleNote: {
      marginTop: 14,
      paddingHorizontal: 10,
      paddingVertical: 9,
      backgroundColor: 'rgba(255,223,80,0.20)',
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 5,
    },

    roleNoteText: {
      textAlign: 'center',
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 15,
      color: C.hint,
    },

    /* Inline failure of the role swap, above its save button. */
    roleErr: {
      marginTop: 12,
      textAlign: 'center',
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 15,
      color: C.red,
    },

    roleActions: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 14,
    },

    roleSave: {
      height: 32,
      paddingHorizontal: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.green,
      borderRadius: 5,
    },

    roleSaveText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 12,
      color: '#F5F5F5',
    },

    /* ── Aktiviteti ──────────────────────────────────────────── */
    aktiviteti: {
      marginTop: 16,
      height: 92,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: 'rgba(47,128,237,0.30)',
      backgroundColor: C.blueSoft,
      overflow: 'hidden',
    },

    aktTitle: {
      position: 'absolute',
      top: 8,
      left: 0,
      right: 0,
      textAlign: 'center',
      fontFamily: Fonts.bodyBold,
      fontSize: 22,
      lineHeight: 26,
      color: C.text,
      zIndex: 3,
    },

    /* Mirrored pair, both clear of the centred button. */
    aktImgLeft: {
      position: 'absolute',
      width: 104,
      height: 84,
      left: -10,
      bottom: -10,
      zIndex: 1,
    },

    aktImgRight: {
      position: 'absolute',
      width: 104,
      height: 84,
      right: -10,
      bottom: -10,
      zIndex: 1,
    },

    aktBtnWrap: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 9,
      alignItems: 'center',
      zIndex: 5,
    },

    aktBtn: {
      backgroundColor: C.blue,
      borderRadius: 6,
      paddingHorizontal: 18,
      paddingVertical: 7,
    },

    aktBtnText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 12.5,
      color: '#F5F5F5',
    },

    /* ── Popup overlay ───────────────────────────────────────── */
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

    /* ── "Krijo llogari të re" popup ─────────────────────────── */
    pmCard: {
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

    pmHeader: {
      paddingTop: 11,
      paddingBottom: 10,
      paddingHorizontal: 15,
      alignItems: 'center',
      justifyContent: 'center',
    },

    pmTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 20,
      lineHeight: 24,
      color: MO.title,
    },

    pmSub: {
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 15,
      color: MO.sub,
      marginTop: 2,
    },

    pmDivider: {
      height: 1,
      backgroundColor: MO.divider,
    },

    pmContent: {
      paddingHorizontal: 15,
      paddingTop: 9,
      paddingBottom: 15,
    },

    pmErr: {
      fontFamily: Fonts.body,
      fontSize: 9,
      lineHeight: 12,
      color: MO.err,
      marginBottom: 8,
    },

    pmLabel: {
      fontFamily: Fonts.body,
      fontSize: 9.5,
      lineHeight: 12,
      color: MO.sub,
      marginBottom: 4,
    },

    pmLabelRight: {
      textAlign: 'right',
    },

    pmGap: {
      marginTop: 14,
    },

    pmRow: {
      flexDirection: 'row',
      gap: 8,
    },

    pmCol: {
      flex: 1,
    },

    pmInput: {
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

    pmSel: {
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

    pmSelText: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 11.5,
      color: MO.text,
      marginRight: 3,
    },

    pmOpts: {
      marginTop: 2,
      backgroundColor: '#F5F5F5',
      borderWidth: 1,
      borderColor: MO.inputBorder,
      borderRadius: 1,
      overflow: 'hidden',
    },

    pmOpt: {
      height: 25,
      justifyContent: 'center',
      paddingHorizontal: 8,
    },

    pmOptActive: {
      backgroundColor: 'rgba(22,165,29,0.10)',
    },

    pmOptText: {
      fontFamily: Fonts.body,
      fontSize: 10,
      color: MO.text,
    },

    pmOptTextActive: {
      fontFamily: Fonts.bodyBold,
      color: MO.create,
    },

    /* ── Confirmation body ───────────────────────────────────── */
    pmPrompt: {
      fontFamily: Fonts.body,
      fontSize: 11.5,
      lineHeight: 16,
      color: MO.text,
      textAlign: 'center',
    },

    pmPreview: {
      marginTop: 11,
      height: 34,
      justifyContent: 'center',
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 3,
      backgroundColor: 'rgba(224,49,49,0.10)',
    },

    pmPreviewText: {
      textAlign: 'center',
      fontFamily: Fonts.bodyBold,
      fontSize: 12,
      color: '#000000',
    },

    pmMeta: {
      marginTop: 3,
      textAlign: 'center',
      fontFamily: Fonts.body,
      fontSize: 10,
      color: MO.sub,
    },

    /* FFDF50 at a fifth — a warm hint nobody mistakes for an error. */
    pmNote: {
      marginTop: 12,
      paddingHorizontal: 10,
      paddingVertical: 9,
      backgroundColor: 'rgba(255,223,80,0.20)',
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 3,
    },

    pmNoteText: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 14,
      color: C.hint,
      textAlign: 'center',
    },

    pmActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 9,
      marginTop: 16,
    },

    pmBtn: {
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 2,
    },

    pmBtnCancel: {
      width: 74,
      backgroundColor: MO.cancel,
    },

    pmBtnCreate: {
      width: 74,
      backgroundColor: MO.create,
    },

    /* A submit button held while its write is in flight. */
    pmBtnOff: {
      opacity: 0.5,
    },

    pmBtnText: {
      fontFamily: Fonts.bodyMedium,
      fontSize: 10.5,
      color: MO.white,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
