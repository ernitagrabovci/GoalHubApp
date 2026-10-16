import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { ApiError } from '@/lib/api/errors';
import { registerPayment } from '@/lib/api/finance';
import type { PickedFile } from '@/lib/api/upload';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';

/**
 * Regjistro pagesën — opened from "Regjistro pagesën" on an unpaid row of the
 * financier's Kuotat e anëtarësisë list. The row's own values come in as route
 * params, so the page always mirrors the entry it was opened from.
 *
 * The fee is settled from here: pick how it was paid, attach the receipt if
 * there is one, and save.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',
  hint: '#6E6E6E',

  /* Cards are two-tone: a lighter title strip over a deeper body. */
  cardBg: '#E3EEFB',
  headBg: '#F6FBFF',
  frame: '#000000',
  headLine: 'rgba(30,40,35,0.10)',

  green: '#159447',
  greenBtn: '#16A51D',
  red: '#E03131',
  orange: '#E4A000',

  inputBorder: '#777777',
};

const STATUS_TONE: Record<string, string> = {
  Paguar: C.green,
  Papaguar: C.orange,
  Skaduar: C.red,
};

/* The three ways the backend accepts a payment, in the label the form shows. */
const PAY_METHODS = ['Kesh', 'Transfer bankar', 'Kartë bankare'];

const METHOD_VALUE: Record<string, 'cash' | 'bank_transfer' | 'card'> = {
  Kesh: 'cash',
  'Transfer bankar': 'bank_transfer',
  'Kartë bankare': 'card',
};

/** Today as `YYYY-MM-DD`, the only date the form can submit. */
function today(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export default function RegisterPaymentScreen() {
  const router = useRouter();
  const { token, signOut } = useSession();

  const params = useLocalSearchParams<{
    id?: string;
    playerId?: string;
    name?: string;
    team?: string;
    period?: string;
    amount?: string;
    due?: string;
    status?: string;
  }>();

  const feeId = params.id ? Number(params.id) : null;
  const playerId = params.playerId ? Number(params.playerId) : null;

  const name = params.name ?? '—';
  const team = params.team ?? '—';
  const period = params.period ?? '—';
  const amount = params.amount ?? '—';
  const due = params.due ?? '—';
  const status = params.status ?? '—';

  const [method, setMethod] = useState(PAY_METHODS[0]);
  const [doc, setDoc] = useState<PickedFile | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const save = () => {
    if (!token || saving) return;
    if (!feeId || Number.isNaN(feeId) || !playerId || Number.isNaN(playerId)) {
      setError('Mungon kuota ose lojtari.');
      return;
    }

    setSaving(true);
    setError(null);

    registerPayment(
      token,
      {
        player_id: playerId,
        fee_ids: [feeId],
        paid_at: today(),
        payment_method: METHOD_VALUE[method] ?? 'cash',
      },
      doc
    )
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
          setError('Nuk mund të regjistrohet pagesa.');
        }
      });
  };

  /* Labels down the left, this quota's own values opposite them. */
  const DETAILS: [string, string][] = [
    ['Lojtari', name],
    ['Ekipi', team],
    ['Periudha', period],
    ['Shuma', amount],
    ['Afati', due],
    ['Statusi', status],
  ];

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
                  {`Kuota - ${name}`}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Regjistrimi i pagesës
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
            {/* ── Detajet ───────────────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.head}>
                <Text
                  style={styles.headText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  Detajet
                </Text>
              </View>
              <View style={styles.headLine} />

              <View style={styles.body}>
                {DETAILS.map(([label, value]) => {
                  const isStatus = label === 'Statusi';

                  return (
                    <View key={label} style={styles.dRow}>
                      <Text
                        style={styles.dLabel}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                      >
                        {label}
                      </Text>
                      <Text
                        style={[
                          styles.dValue,
                          isStatus && { color: STATUS_TONE[status] ?? C.hint },
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.6}
                      >
                        {value}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* ── Regjistro pagesën ─────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.head}>
                <Text
                  style={styles.headText}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.7}
                >
                  Regjistro pagesën
                </Text>
              </View>
              <View style={styles.headLine} />

              <View style={styles.form}>
                <Text style={styles.formLabel}>Metoda e pagesës</Text>
                <Select value={method} options={PAY_METHODS} onChange={setMethod} />

                <Text style={[styles.formLabel, styles.formGap]}>Dëshmi pagese (opsionale)</Text>

                <View style={styles.fileRow}>
                  <Pressable
                    onPress={pickDoc}
                    accessibilityRole="button"
                    accessibilityLabel="Ngarko dëshminë e pagesës"
                    style={({ pressed }) => [styles.fileCircle, pressed && styles.pressed]}
                  >
                    <MaterialCommunityIcons
                      name="cloud-upload-outline"
                      size={I(24)}
                      color="#F5F5F5"
                    />
                  </Pressable>

                  <Text style={styles.fileHint} numberOfLines={1}>
                    {doc?.name ?? 'Choose file'}
                  </Text>
                </View>

                {error ? (
                  <Text style={styles.errorText} numberOfLines={2}>
                    {error}
                  </Text>
                ) : null}

                <Pressable
                  onPress={save}
                  disabled={saving}
                  accessibilityRole="button"
                  accessibilityLabel="Ruaj cilësimet"
                  style={({ pressed }) => [
                    styles.saveBtn,
                    saving && styles.saveBtnOff,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={styles.saveBtnText}>Ruaj cilësimet</Text>
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
/* In-flow dropdown                                                    */
/* ------------------------------------------------------------------ */

/** The options open directly under the field. */
function Select({
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
        accessibilityLabel="Metoda e pagesës"
        style={({ pressed }) => [styles.sel, pressed && styles.pressed]}
      >
        <Text style={styles.selText} numberOfLines={1}>
          {value}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={I(13)} color={C.hint} />
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

    /* ── Card shell ──────────────────────────────────────────── */
    card: {
      marginTop: 14,
      backgroundColor: C.cardBg,
      borderWidth: 1,
      borderColor: C.frame,
      borderRadius: 7,
      overflow: 'hidden',
    },

    /* Lighter than the card body, so the title reads as its own strip. */
    head: {
      backgroundColor: C.headBg,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
      paddingVertical: 9,
    },

    headText: {
      textAlign: 'center',
      fontFamily: Fonts.bodyBold,
      fontSize: 14,
      lineHeight: 18,
      color: C.text,
    },

    headLine: {
      height: 1,
      backgroundColor: C.headLine,
    },

    /* ── Detail rows ─────────────────────────────────────────── */
    body: {
      paddingHorizontal: 11,
      paddingVertical: 8,
    },

    dRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      minHeight: 26,
    },

    /* The values run longer than the labels, so they take the bigger share. */
    dLabel: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 14,
      color: C.hint,
    },

    dValue: {
      flex: 1.25,
      textAlign: 'right',
      fontFamily: Fonts.bodyBold,
      fontSize: 11,
      lineHeight: 14,
      color: C.text,
    },

    /* ── Register form ───────────────────────────────────────── */
    form: {
      paddingHorizontal: 11,
      paddingTop: 11,
      paddingBottom: 14,
    },

    formLabel: {
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 14,
      color: C.hint,
      marginBottom: 5,
    },

    formGap: {
      marginTop: 16,
    },

    sel: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 34,
      gap: 4,
      paddingHorizontal: 9,
      borderWidth: 1,
      borderColor: C.inputBorder,
      borderRadius: 4,
    },

    selText: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 12,
      color: C.text,
    },

    opts: {
      marginTop: 3,
      backgroundColor: '#F5F5F5',
      borderWidth: 1,
      borderColor: C.inputBorder,
      borderRadius: 4,
      overflow: 'hidden',
    },

    opt: {
      height: 28,
      justifyContent: 'center',
      paddingHorizontal: 9,
    },

    optActive: {
      backgroundColor: 'rgba(22,165,29,0.10)',
    },

    optText: {
      fontFamily: Fonts.body,
      fontSize: 11,
      color: C.text,
    },

    optTextActive: {
      fontFamily: Fonts.bodySemiBold,
    },

    /* Circle on the left, the file name reading beside it. */
    fileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginTop: 4,
    },

    fileCircle: {
      width: 54,
      height: 54,
      borderRadius: 27,
      backgroundColor: C.green,
      alignItems: 'center',
      justifyContent: 'center',
    },

    fileHint: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 15,
      color: C.text,
    },

    /* Runs the full width of the card. */
    saveBtn: {
      height: 40,
      marginTop: 18,
      borderRadius: 5,
      backgroundColor: C.greenBtn,
      alignItems: 'center',
      justifyContent: 'center',
    },

    saveBtnOff: {
      opacity: 0.5,
    },

    errorText: {
      marginTop: 12,
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 15,
      color: C.red,
    },

    saveBtnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13,
      lineHeight: 16,
      color: '#F5F5F5',
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
