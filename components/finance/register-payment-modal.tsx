import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { ApiError } from '@/lib/api/errors';
import { playerUnpaidPeriods, registerPayment } from '@/lib/api/finance';
import { listPlayers } from '@/lib/api/players';
import type { ApiPlayer, ApiTeam, PlayerPeriods } from '@/lib/api/types';
import type { PickedFile } from '@/lib/api/upload';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * The register-payment dialog, shared by the admin's Pagesat tab and the
 * per-player quota page. The team narrows the squad and the player loads their
 * unpaid (and up to 12 upcoming) periods; `Krijo` posts the settled rows to
 * `POST /finance/payments`, with an optional receipt attached.
 *
 * Pass `fixedPlayer` to lock the dialog to one player (the quota page already
 * knows who it is) — the team/player pickers are then replaced by a label.
 */

/* Green palette shared by every popup in the app. */
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

const GREEN = '#159447';

/* The payment methods the backend accepts (`cash`/`bank_transfer`/`card`),
   shown with the labels the design uses. */
type PayMethod = 'cash' | 'bank_transfer' | 'card';

const PAY_METHODS: { key: PayMethod; label: string }[] = [
  { key: 'cash', label: 'Kesh' },
  { key: 'bank_transfer', label: 'Transfer bankar' },
  { key: 'card', label: 'Kartë bankare' },
];

/** 16840 → "$16,840" — grouped thousands, no cents. */
function usd(n: number) {
  return `$${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/** The dialog's three date boxes → the `YYYY-MM-DD` the API wants, or `null`. */
function toIsoDate(day: string, month: string, year: string): string | null {
  if (!day || !month || !year) return null;
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y)) return null;
  if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > 9999) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** In-flow dropdown: the options open directly under the field. */
function PSelect({
  value,
  placeholder,
  options,
  onChange,
}: {
  value: string | null;
  placeholder?: string;
  options: { key: string; label: string }[];
  onChange: (key: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.key === value);

  return (
    <View>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        style={({ pressed }) => [styles.pmSel, pressed && styles.pressed]}
      >
        <Text
          style={[styles.pmSelText, !current && styles.pmSelPlaceholder]}
          numberOfLines={1}
        >
          {current?.label ?? placeholder ?? '—'}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={I(11)} color="#777777" />
      </Pressable>
      {open ? (
        <View style={styles.pmOpts}>
          {options.map((o) => {
            const active = o.key === value;
            return (
              <Pressable
                key={o.key}
                onPress={() => {
                  onChange(o.key);
                  setOpen(false);
                }}
                style={[styles.pmOpt, active && styles.pmOptActive]}
              >
                <Text
                  style={[styles.pmOptText, active && styles.pmOptTextActive]}
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

export function RegisterPaymentModal({
  teams = [],
  fixedPlayer = null,
  onClose,
  onSaved,
}: {
  teams?: ApiTeam[];
  fixedPlayer?: { id: number; label: string } | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const { token, signOut } = useSession();
  const { width, height } = useWindowDimensions();
  const cardW = Math.min(width - 24, 360);
  const maxBody = Math.max(280, height - 187);

  const locked = fixedPlayer != null;

  const [teamId, setTeamId] = useState<number | null>(null);
  const [players, setPlayers] = useState<ApiPlayer[]>([]);
  const [playerId, setPlayerId] = useState<number | null>(fixedPlayer?.id ?? null);
  const [periods, setPeriods] = useState<PlayerPeriods | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [method, setMethod] = useState<PayMethod>('cash');
  const [invoice, setInvoice] = useState('');
  const [doc, setDoc] = useState<PickedFile | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // The squad follows the chosen team. A locked dialog skips this entirely.
  useEffect(() => {
    if (locked || !token || teamId == null) return;
    const controller = new AbortController();

    listPlayers(token, { team_id: teamId }, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setPlayers(res.data);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) {
          signOut();
          router.replace('/login');
          return;
        }
        setPlayers([]);
        setErr('Nuk mund të ngarkohen lojtarët.');
      });

    return () => controller.abort();
  }, [locked, token, teamId, router, signOut]);

  // The player's payable periods load once a player is picked.
  useEffect(() => {
    if (!token || playerId == null) return;
    const controller = new AbortController();

    playerUnpaidPeriods(token, playerId, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setPeriods(res);
        setPicked([]);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) {
          signOut();
          router.replace('/login');
          return;
        }
        setPeriods(null);
        setErr('Nuk mund të ngarkohen kuotat e lojtarit.');
      });

    return () => controller.abort();
  }, [token, playerId, router, signOut]);

  const teamOpts = teams.map((t) => ({ key: String(t.id), label: t.name }));
  const playerOpts = players.map((p) => ({ key: String(p.id), label: p.name ?? '—' }));

  /* Each row is keyed by what it settles: an existing fee, or a new period. */
  const periodRows = periods
    ? [
        ...periods.unpaid
          .filter((p) => p.id != null)
          .map((p) => ({ key: `fee:${p.id}`, label: p.period, amount: p.final_amount })),
        ...periods.future.map((p) => ({
          key: `new:${p.period_start}|${p.period_end}`,
          label: p.period,
          amount: p.final_amount,
        })),
      ]
    : [];

  const togglePeriod = (key: string) =>
    setPicked((list) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key]));

  /* Only pdf/jpg/jpeg/png are accepted by the backend's `document` rule. */
  const pickDoc = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png'],
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    setDoc({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? null });
  };

  const submit = () => {
    if (!token) return;
    if (playerId == null) {
      setErr('Zgjedh lojtarin.');
      return;
    }
    if (picked.length === 0) {
      setErr('Zgjedh të paktën një periudhë.');
      return;
    }
    const paidAt = toIsoDate(day, month, year);
    if (!paidAt) {
      setErr('Shkruaj datën e pagesës (DD/MM/YYYY).');
      return;
    }

    const feeIds = picked
      .filter((k) => k.startsWith('fee:'))
      .map((k) => Number(k.slice(4)));
    const newPeriods = picked.filter((k) => k.startsWith('new:')).map((k) => k.slice(4));

    setSaving(true);
    setErr(null);

    registerPayment(
      token,
      {
        player_id: playerId,
        fee_ids: feeIds.length ? feeIds : undefined,
        new_periods: newPeriods.length ? newPeriods : undefined,
        paid_at: paidAt,
        payment_method: method,
        invoice_number: invoice.trim() || undefined,
      },
      doc
    )
      .then(() => onSaved())
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) {
          signOut();
          router.replace('/login');
          return;
        }
        setSaving(false);
        if (e instanceof ApiError && e.status === 0) {
          setErr('Nuk mund të lidhemi me serverin. Kontrollo lidhjen.');
        } else if (e instanceof ApiError && e.status === 422) {
          setErr('Të dhënat nuk janë të vlefshme. Kontrollo fushat.');
        } else {
          setErr('Nuk mund të regjistrohet pagesa.');
        }
      });
  };

  return (
    <View style={[styles.pmCard, { width: cardW }]}>
      <View style={styles.pmHeader}>
        <Text style={styles.pmTitle}>Regjistro pagesën</Text>
        <Text style={styles.pmSubtitle}>
          Zgjedh lojtarin dhe shëno datën e dokumentit të pagesës
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

        {locked ? (
          <View>
            <Text style={styles.pmLabel}>Lojtari:</Text>
            <Text style={styles.pmLocked} numberOfLines={1}>
              {fixedPlayer?.label ?? '—'}
            </Text>
          </View>
        ) : (
          <View style={styles.pmRow}>
            <View style={styles.pmCol}>
              <Text style={styles.pmLabel}>Ekipi:</Text>
              <PSelect
                value={teamId == null ? null : String(teamId)}
                placeholder="Zgjidh ekipin"
                options={teamOpts}
                onChange={(key) => {
                  setTeamId(Number(key));
                  setPlayerId(null);
                  setPlayers([]);
                  setPeriods(null);
                  setPicked([]);
                  setErr(null);
                }}
              />
            </View>
            <View style={styles.pmCol}>
              <Text style={styles.pmLabel}>Lojtari:</Text>
              <PSelect
                value={playerId == null ? null : String(playerId)}
                placeholder={teamId == null ? 'Zgjidh ekipin' : 'Zgjidh lojtarin'}
                options={playerOpts}
                onChange={(key) => {
                  setPlayerId(Number(key));
                  setPeriods(null);
                  setPicked([]);
                  setErr(null);
                }}
              />
            </View>
          </View>
        )}

        <Text style={[styles.pmLabel, styles.pmGap]}>Zgjedh periudhat:</Text>
        {playerId == null ? (
          <Text style={styles.pmHint}>Zgjidh lojtarin për të parë kuotat.</Text>
        ) : periods === null ? (
          <Text style={styles.pmHint}>…</Text>
        ) : periodRows.length === 0 ? (
          <Text style={styles.pmHint}>Nuk ka kuota për pagesë.</Text>
        ) : (
          <View style={styles.pmPeriods}>
            {periodRows.map((p) => {
              const on = picked.includes(p.key);
              return (
                <Pressable
                  key={p.key}
                  onPress={() => togglePeriod(p.key)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  style={({ pressed }) => [styles.pmPeriodRow, pressed && styles.pressed]}
                >
                  <View style={[styles.pmCheck, on && styles.pmCheckOn]} />
                  <Text style={styles.pmPeriodText} numberOfLines={1}>
                    {p.label}
                  </Text>
                  <Text style={styles.pmPeriodAmount} numberOfLines={1}>
                    {usd(p.amount)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <Text style={[styles.pmLabel, styles.pmGap]}>Data e pagesës:</Text>
        <View style={styles.pmClockRow}>
          <TextInput
            value={day}
            onChangeText={setDay}
            placeholder="DD"
            placeholderTextColor={MO.ph}
            maxLength={2}
            keyboardType="number-pad"
            allowFontScaling={false}
            style={styles.pmDateBox}
          />
          <Text style={styles.pmSep}>/</Text>
          <TextInput
            value={month}
            onChangeText={setMonth}
            placeholder="MM"
            placeholderTextColor={MO.ph}
            maxLength={2}
            keyboardType="number-pad"
            allowFontScaling={false}
            style={styles.pmDateBox}
          />
          <Text style={styles.pmSep}>/</Text>
          <TextInput
            value={year}
            onChangeText={setYear}
            placeholder="YYYY"
            placeholderTextColor={MO.ph}
            maxLength={4}
            keyboardType="number-pad"
            allowFontScaling={false}
            style={styles.pmYearBox}
          />
        </View>

        <Text style={[styles.pmLabel, styles.pmGap]}>Metodat e pagesës:</Text>
        <PSelect value={method} options={PAY_METHODS} onChange={(k) => setMethod(k as PayMethod)} />

        <Text style={[styles.pmLabel, styles.pmGap]}>Nr. Fatura:</Text>
        <TextInput
          value={invoice}
          onChangeText={setInvoice}
          allowFontScaling={false}
          style={styles.pmInput}
        />

        <Text style={[styles.pmLabel, styles.pmGap]}>Dokumenti i pagesës:</Text>

        {/* Same upload zone as the player form's photo picker. */}
        <View style={styles.pmFileZone}>
          <Pressable
            onPress={pickDoc}
            accessibilityRole="button"
            accessibilityLabel="Ngarko dokumentin e pagesës"
            style={({ pressed }) => [styles.pmFileBtn, pressed && styles.pressed]}
          >
            <View style={styles.pmFileCircle}>
              <MaterialCommunityIcons name="cloud-upload-outline" size={I(22)} color={MO.white} />
            </View>
          </Pressable>
          <Text style={styles.pmFileHint} numberOfLines={1}>
            {doc?.name ?? 'Choose file'}
          </Text>
        </View>

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
            disabled={saving}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.pmBtn,
              styles.pmBtnCreate,
              saving && styles.pmBtnOff,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.pmBtnText}>{saving ? '…' : 'Krijo'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create(
  scaled({
    /* ── Register-payment popup ──────────────────────────────── */
    pmCard: {
      marginTop: 100,
      backgroundColor: MO.white,
      borderWidth: 2,
      borderColor: MO.border,
      borderRadius: 10,
      overflow: 'hidden',
    },

    pmHeader: {
      paddingHorizontal: 15,
      paddingTop: 11,
      paddingBottom: 9,
    },

    pmTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 20,
      lineHeight: 24,
      letterSpacing: -0.3,
      color: MO.title,
    },

    pmSubtitle: {
      fontFamily: Fonts.body,
      fontSize: 10,
      lineHeight: 13,
      color: MO.sub,
      marginTop: 2,
    },

    pmDivider: {
      height: 1,
      backgroundColor: MO.divider,
    },

    pmContent: {
      paddingHorizontal: 15,
      paddingTop: 11,
      paddingBottom: 15,
    },

    pmErr: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 9,
      lineHeight: 12,
      color: MO.err,
      marginBottom: 6,
    },

    pmLabel: {
      fontFamily: Fonts.body,
      fontSize: 9.5,
      lineHeight: 12,
      color: MO.sub,
      marginBottom: 4,
    },

    pmGap: {
      marginTop: 14,
    },

    pmHint: {
      fontFamily: Fonts.body,
      fontSize: 9,
      lineHeight: 12,
      color: MO.ph,
      marginTop: 2,
    },

    /* The locked-dialog player name, in place of the two pickers. */
    pmLocked: {
      height: 31,
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      lineHeight: 31,
      color: MO.text,
    },

    pmInput: {
      height: 31,
      backgroundColor: MO.inputBg,
      borderWidth: 1,
      borderColor: MO.inputBorder,
      borderRadius: 4,
      paddingHorizontal: 8,
      fontFamily: Fonts.body,
      fontSize: 11.5,
      color: MO.text,
    },

    pmRow: {
      flexDirection: 'row',
      gap: 8,
    },

    pmCol: {
      flex: 1,
    },

    pmSel: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 31,
      gap: 4,
      paddingHorizontal: 8,
      backgroundColor: MO.inputBg,
      borderWidth: 1,
      borderColor: MO.inputBorder,
      borderRadius: 4,
    },

    pmSelText: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 11.5,
      color: MO.text,
    },

    pmSelPlaceholder: {
      color: MO.ph,
    },

    pmOpts: {
      marginTop: 3,
      backgroundColor: MO.white,
      borderWidth: 1,
      borderColor: MO.inputBorder,
      borderRadius: 4,
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
      fontFamily: Fonts.bodySemiBold,
    },

    /* ── Period picker ───────────────────────────────────────── */
    pmPeriods: {
      borderWidth: 1,
      borderColor: MO.inputBorder,
      borderRadius: 4,
      overflow: 'hidden',
    },

    pmPeriodRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
      height: 30,
      paddingHorizontal: 8,
    },

    /* Square checkbox: black rim at rest, green fill once picked. */
    pmCheck: {
      width: 14,
      height: 14,
      borderRadius: 3,
      borderWidth: 1.5,
      borderColor: '#000000',
      backgroundColor: 'transparent',
    },

    pmCheckOn: {
      backgroundColor: MO.create,
    },

    pmPeriodText: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 10.5,
      color: MO.text,
    },

    pmPeriodAmount: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: MO.text,
    },

    pmClockRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 8,
    },

    pmDateBox: {
      width: 30,
      height: 30,
      backgroundColor: MO.inputBg,
      borderWidth: 1,
      borderColor: MO.inputBorder,
      borderRadius: 4,
      textAlign: 'center',
      fontFamily: Fonts.body,
      fontSize: 11,
      color: MO.text,
    },

    pmYearBox: {
      width: 50,
      height: 30,
      backgroundColor: MO.inputBg,
      borderWidth: 1,
      borderColor: MO.inputBorder,
      borderRadius: 4,
      textAlign: 'center',
      fontFamily: Fonts.body,
      fontSize: 11,
      color: MO.text,
    },

    pmSep: {
      fontFamily: Fonts.body,
      fontSize: 12,
      color: MO.sub,
    },

    /* Mirrors the player form's photo zone, but hugging the left edge. */
    pmFileZone: {
      height: 118,
      alignItems: 'flex-start',
      justifyContent: 'center',
    },

    pmFileBtn: {
      alignItems: 'center',
    },

    pmFileCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: GREEN,
      alignItems: 'center',
      justifyContent: 'center',
    },

    pmFileHint: {
      fontFamily: Fonts.body,
      fontSize: 12,
      color: MO.text,
      marginTop: 8,
    },

    pmActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 9,
      marginTop: 14,
    },

    pmBtn: {
      width: 74,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 4,
    },

    pmBtnCancel: {
      backgroundColor: MO.cancel,
    },

    pmBtnCreate: {
      backgroundColor: MO.create,
    },

    pmBtnOff: {
      opacity: 0.5,
    },

    pmBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 10.5,
      color: MO.white,
    },

    pressed: {
      opacity: 0.5,
    },
  })
);
