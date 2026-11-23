import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
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
import { Fonts } from '@/constants/theme';
import {
  createCompetition,
  deleteCompetition,
  listCompetitions,
  toggleCompetition,
} from '@/lib/api/competitions';
import { ApiError } from '@/lib/api/errors';
import type { ApiCompetition } from '@/lib/api/types';
import { I, scaled } from '@/lib/responsive';
import { useSession } from '@/lib/session';
import { useAppColors, usePaletteStyles, type AppColorsOf } from '@/lib/app-theme';

/**
 * Kompeticionet — page opened from the club profile's "Kompeticionet" card.
 * Same visual language as the dashboards: #F7F9F8 canvas, cards with a thin
 * border and light-blue interior, green actions. Two large cards: an add
 * form ("Shto Kompeticion të Ri") and the club's competition list whose
 * header reads "Rrjetet sociale". Rows carry colored text badges
 * (Kupë / Ligë / Miqësore), the gray name in the middle, a red-outlined
 * "Çaktivizo" and a solid-red "Fshi".
 *
 * The list comes from `GET /competitions`; the add form and the row buttons
 * write through `POST /competitions`, `POST /competitions/{id}/toggle` and
 * `DELETE /competitions/{id}`, then reload the list.
 */

const C_LIGHT = {
  page: '#F7F9F8',
  line: 'rgba(0,0,0,0.025)',
  card: '#F7F9F8', // light-blue interior (the write areas share this tone)
  border: 'rgba(100,140,190,0.30)',
  headLine: 'rgba(30,40,35,0.10)',
  inputBorder: '#DCE5DF',
  placeholder: '#A8A8A8',
  text: '#17251E',
  gray: '#52645A',
  name: '#7A7A7A',
  green: '#2E7D5B',
  greenBtn: '#049729',
  kupe: '#E48500',
  lige: '#008CE4',
  mikesore: '#049729',
  red: '#B91C1C',
  fshi: '#D90000',
  chipOff: '#C4C4C4',
  white: '#FFFFFF',
};

const DIVIDER = 'rgba(30,40,35,0.10)';

type CompType = { key: string; label: string; color: string };

const COMP_TYPES = (C: AppColorsOf<typeof C_LIGHT>): CompType[] => ([
  { key: 'kupe', label: 'Kupë', color: C.kupeText },
  { key: 'lige', label: 'Ligë', color: C.ligeText },
  { key: 'mikesore', label: 'Miqësore', color: C.mikesoreText },
]);

type CompRow = {
  id: number;
  name: string;
  type: CompType;
  active: boolean;
};

/** Backend competition type → the badge shown on the row. */
const TYPE_BY_API = (C: AppColorsOf<typeof C_LIGHT>): Record<string, CompType> => ({
  cup: COMP_TYPES(C)[0],
  league: COMP_TYPES(C)[1],
  friendly: COMP_TYPES(C)[2],
});

/** An unrecognised backend type falls back to the "Ligë" badge. */
function toCompType(type: string, C: AppColorsOf<typeof C_LIGHT>): CompType {
  return TYPE_BY_API(C)[type.toLowerCase()] ?? COMP_TYPES(C)[1];
}

/** The form's badge key → the value the API's `type` field expects. */
const API_TYPE: Record<string, 'league' | 'cup' | 'friendly'> = {
  kupe: 'cup',
  lige: 'league',
  mikesore: 'friendly',
};

/** A failed write, in the label the inline error shows. */
function errorText(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return 'Nuk mund të lidhemi me serverin. Kontrollo lidhjen.';
    if (error.status === 422) return 'Të dhënat nuk janë të vlefshme.';
    return 'Diçka shkoi keq. Provo përsëri.';
  }
  return 'Diçka shkoi keq. Provo përsëri.';
}

/** Maps an API competition onto the page's row shape. */
function toRow(c: ApiCompetition, C: AppColorsOf<typeof C_LIGHT>): CompRow {
  return {
    id: c.id,
    name: c.name,
    type: toCompType(c.type, C),
    active: c.is_active,
  };
}

export default function CompetitionsScreen() {
  const C = useAppColors(C_LIGHT);
  const styles = usePaletteStyles(createStyles, C);
  const router = useRouter();
  const { token, signOut } = useSession();

  const [list, setList] = useState<CompRow[]>([]);
  const [name, setName] = useState('');
  const [typeKey, setTypeKey] = useState<string | null>(null);
  const [typeOpen, setTypeOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    listCompetitions(token, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setList(res.data.map((c) => toRow(c, C)));
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) {
          signOut();
          router.replace('/login');
        }
      });
    return () => controller.abort();
  }, [token, router, signOut, reloadKey, C]);

  /** A write finished — clear any error and re-run the list fetch. */
  const refresh = () => {
    setError(null);
    setReloadKey((k) => k + 1);
  };

  /** Every write shares the same 401 sign-out path. */
  const onWriteError = (err: unknown) => {
    if (err instanceof ApiError && err.status === 401) {
      signOut();
      router.replace('/login');
      return;
    }
    setBusy(false);
    setError(errorText(err));
  };

  const canAdd = name.trim().length > 0 && typeKey != null;

  const addComp = () => {
    if (!token || busy) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Shkruaj emrin e kompeticionit.');
      return;
    }
    const apiType = typeKey ? API_TYPE[typeKey] : undefined;
    if (!apiType) {
      setError('Zgjidh llojin e kompeticionit.');
      return;
    }

    setBusy(true);
    setError(null);
    createCompetition(token, { name: trimmed, type: apiType })
      .then(() => {
        setName('');
        setTypeKey(null);
        setTypeOpen(false);
        setBusy(false);
        refresh();
      })
      .catch(onWriteError);
  };

  const removeComp = (id: number) => {
    if (!token || busy) return;
    setBusy(true);
    setError(null);
    deleteCompetition(token, id)
      .then(() => {
        setBusy(false);
        refresh();
      })
      .catch(onWriteError);
  };

  const toggleComp = (id: number) => {
    if (!token || busy) return;
    setBusy(true);
    setError(null);
    toggleCompetition(token, id)
      .then(() => {
        setBusy(false);
        refresh();
      })
      .catch(onWriteError);
  };

  const selectedType = COMP_TYPES(C).find((t) => t.key === typeKey);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.canvas}>
        {/* Very subtle circular background pattern in the empty space below */}
        <View pointerEvents="none" style={styles.deco}>
          <View style={styles.decoRingOuter} />
          <View style={styles.decoRingInner} />
          <View style={styles.decoFill} />
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
                <MaterialCommunityIcons name="chevron-left" size={I(24)} color={C.textText} />
              </Pressable>
              <View style={styles.headerText}>
                <Text style={styles.title}>Kompeticionet</Text>
                <Text style={styles.subtitle}>Lista e garave të klubit</Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.colPad}>
            {/* ── Shto Kompeticion të Ri ─────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Shto Kompeticion të Ri</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.formRow}>
                  <View style={styles.fieldCol}>
                    <Text style={styles.label}>Emri</Text>
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="Superliga"
                      placeholderTextColor={C.placeholderText}
                      allowFontScaling={false}
                      style={styles.input}
                    />
                  </View>
                  <View style={styles.fieldCol}>
                    <Text style={styles.label}>Lloji</Text>
                    <Pressable
                      onPress={() => {
                        setTypeOpen((v) => !v);
                      }}
                      accessibilityRole="button"
                      style={({ pressed }) => [styles.select, pressed && styles.pressed]}
                    >
                      <Text
                        style={[styles.selectText, !selectedType && styles.placeholderText]}
                        numberOfLines={1}
                      >
                        {selectedType ? selectedType.label : 'Zgjidh…'}
                      </Text>
                      <MaterialCommunityIcons name="chevron-down" size={I(18)} color={C.grayText} />
                    </Pressable>
                  </View>
                </View>

                {typeOpen ? (
                  <View style={styles.optBox}>
                    {COMP_TYPES(C).map((t) => {
                      const active = t.key === typeKey;
                      return (
                        <Pressable
                          key={t.key}
                          onPress={() => {
                            setTypeKey(t.key);
                            setTypeOpen(false);
                          }}
                          style={({ pressed }) => [
                            styles.opt,
                            active && styles.optActive,
                            pressed && styles.pressed,
                          ]}
                        >
                          <View style={[styles.optDot, { backgroundColor: t.color }]} />
                          <Text style={[styles.optText, active && styles.optTextActive]}>
                            {t.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ) : null}

                <Pressable
                  onPress={addComp}
                  disabled={busy}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.addBtn,
                    pressed && canAdd && styles.goPressed,
                  ]}
                >
                  <Text style={styles.addBtnText}>+ Shto</Text>
                </Pressable>

                {error ? (
                  <Text style={styles.errorText} numberOfLines={2}>
                    {error}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* ── Rrjetet sociale (lista e kompeticioneve) ───────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Rrjetet sociale</Text>
              </View>
              {list.map((row) => {
                const dim = !row.active;
                return (
                  <View key={row.id} style={styles.compRow}>
                    <View
                      style={[
                        styles.chip,
                        { backgroundColor: dim ? C.chipOff : row.type.color },
                      ]}
                    >
                      <Text style={styles.chipText} numberOfLines={1}>
                        {row.type.label}
                      </Text>
                    </View>
                    <Text
                      style={[styles.compName, dim && { color: C.grayText }]}
                      numberOfLines={1}
                    >
                      {row.name}
                    </Text>
                    <View style={styles.rowActions}>
                      <Pressable
                        onPress={() => toggleComp(row.id)}
                        disabled={busy}
                        hitSlop={6}
                        accessibilityRole="button"
                        style={({ pressed }) => [
                          styles.deactBtn,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.deactText} numberOfLines={1}>
                          {dim ? 'Aktivizo' : 'Çaktivizo'}
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => removeComp(row.id)}
                        disabled={busy}
                        hitSlop={6}
                        accessibilityRole="button"
                        style={({ pressed }) => [
                          styles.delBtn,
                          pressed && styles.pressed,
                        ]}
                      >
                        <Text style={styles.delText}>Fshi</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
              {list.length === 0 ? (
                <Text style={styles.emptyText}>Nuk ka kompeticione ende.</Text>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (C: AppColorsOf<typeof C_LIGHT>) => StyleSheet.create(
  scaled({
    safe: {
      flex: 1,
    },

    canvas: {
      flex: 1,
    },

    /* Subtle decorative circles filling the lower empty space */
    deco: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: -120,
      height: 340,
      alignItems: 'center',
      justifyContent: 'flex-end',
      zIndex: 0,
    },

    decoRingOuter: {
      position: 'absolute',
      width: 340,
      height: 340,
      borderRadius: 170,
      borderWidth: 1,
      borderColor: 'rgba(21,148,71,0.05)',
      bottom: -120,
    },

    decoRingInner: {
      position: 'absolute',
      width: 220,
      height: 220,
      borderRadius: 110,
      borderWidth: 1,
      borderColor: 'rgba(34,87,122,0.06)',
      bottom: -70,
    },

    decoFill: {
      position: 'absolute',
      width: 130,
      height: 130,
      borderRadius: 65,
      backgroundColor: 'rgba(34,87,122,0.04)',
      bottom: -30,
      left: 30,
    },

    colPad: {
      alignSelf: 'center',
      width: '100%',
      paddingHorizontal: 27,
    },

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
      color: C.textText,
    },

    subtitle: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 16,
      color: C.grayText,
      marginTop: 1,
    },

    scroll: {
      paddingBottom: 220,
    },

    card: {
      backgroundColor: C.cardFill,
      borderWidth: 2,
      borderColor: C.borderBorder,
      borderRadius: 8,
    },

    cardGap: {
      marginTop: 14,
    },

    cardHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingTop: 12,
      paddingBottom: 11,
      borderBottomWidth: 1,
      borderBottomColor: C.headLineBorder,
      borderTopLeftRadius: 7,
      borderTopRightRadius: 7,
    },

    cardHeadText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 16,
      color: C.textText,
      textAlign: 'center',
    },

    cardBody: {
      paddingHorizontal: 14,
      paddingVertical: 14,
    },

    /* Add form */
    formRow: {
      flexDirection: 'row',
      gap: 10,
    },

    fieldCol: {
      flex: 1,
    },

    label: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 16,
      color: C.grayText,
      marginBottom: 4,
    },

    input: {
      height: 44,
      backgroundColor: C.cardFill,
      borderWidth: 0.5,
      borderColor: C.inputBorderBorder,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 0,
      fontSize: 14,
      lineHeight: 18,
      fontFamily: Fonts.body,
      color: C.textText,
    },

    select: {
      height: 44,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: C.cardFill,
      borderWidth: 0.5,
      borderColor: C.inputBorderBorder,
      borderRadius: 10,
      paddingHorizontal: 12,
    },

    selectText: {
      fontFamily: Fonts.body,
      fontSize: 13,
      color: C.textText,
      flex: 1,
    },

    placeholderText: {
      color: C.placeholderText,
    },

    optBox: {
      marginTop: 5,
      backgroundColor: C.whiteFill,
      borderWidth: 0.5,
      borderColor: C.inputBorderBorder,
      borderRadius: 4,
      overflow: 'hidden',
    },

    opt: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: 44,
      paddingHorizontal: 12,
      gap: 9,
    },

    optActive: {
      backgroundColor: 'rgba(7, 155, 88, 0.10)',
    },

    optDot: {
      width: 14,
      height: 14,
      borderRadius: 4,
    },

    optText: {
      fontFamily: Fonts.body,
      fontSize: 13,
      color: C.textText,
    },

    optTextActive: {
      fontFamily: Fonts.bodyBold,
      color: C.greenText,
    },

    addBtn: {
      marginTop: 14,
      height: 44,
      borderRadius: 4,
      backgroundColor: C.greenBtnFill,
      alignItems: 'center',
      justifyContent: 'center',
    },

    addBtnText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 14,
      color: '#FFFFFF',
    },

    /* List rows */
    compRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: DIVIDER,
    },

    chip: {
      width: 60,
      height: 26,
      borderRadius: 6,
      alignItems: 'center',
      justifyContent: 'center',
    },

    chipText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 10.5,
      lineHeight: 13,
      color: C.whiteText,
      textAlign: 'center',
    },

    compName: {
      flex: 1,
      fontFamily: Fonts.bodyMedium,
      fontSize: 13.5,
      color: C.nameText,
      marginHorizontal: 9,
    },

    rowActions: {
      flexDirection: 'row',
      gap: 6,
    },

    deactBtn: {
      height: 34,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: C.redBorder,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },

    deactText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.redText,
    },

    delBtn: {
      height: 34,
      paddingHorizontal: 14,
      backgroundColor: C.fshiFill,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },

    delText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.whiteText,
    },

    emptyText: {
      fontFamily: Fonts.body,
      fontSize: 13,
      color: C.grayText,
      textAlign: 'center',
      paddingVertical: 18,
    },

    errorText: {
      marginTop: 10,
      fontFamily: Fonts.body,
      fontSize: 11.5,
      lineHeight: 15,
      color: C.redText,
    },

    goPressed: {
      opacity: 0.85,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
