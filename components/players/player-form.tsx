import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * Shared player form — used by "Regjistro lojtar të ri" and by the edit page
 * for an existing player. Personal data card (with a photo upload zone) on
 * top, sports data card below it, then the Anulo / Konfirmo actions.
 *
 * `avatarInitials` renders the profile circle in front of the header title.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  card: '#F6FBFF',
  border: 'rgba(100,140,190,0.30)',
  headLine: 'rgba(30,40,35,0.10)',

  input: '#FFFFFF',
  inputBorder: '#000000',
  hint: '#C9C9C9',

  text: '#111111',
  gray: '#8A8A8A',

  green: '#159447',
  greenSoft: '#DDF6E7',
  red: '#ED5050',
};

export function PlayerForm({
  title,
  subtitle,
  avatarInitials,
}: {
  title: string;
  subtitle: string;
  avatarInitials?: string;
}) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const [plan, setPlan] = useState<'nxenes' | 'kontraktual'>('nxenes');
  const [cycle, setCycle] = useState<'fillimit' | 'muajit'>('fillimit');

  const amountLabel = plan === 'nxenes' ? 'Kuota mujore (euro)' : 'Paga mujore (euro)';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.canvas}>
        {/* Faint vertical canvas texture — decorative only */}
        <View pointerEvents="none" style={styles.lines}>
          {Array.from({ length: lineCount }).map((_, index) => (
            <View key={index} style={[styles.line, { left: index * 9 }]} />
          ))}
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
                      color="#FFFFFF"
                    />
                  </View>
                </Pressable>
                <Text style={styles.photoHint}>Ngarko foton</Text>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.row}>
                  <View style={styles.col}>
                    <Text style={styles.label}>Emri i plotë:</Text>
                    <TextInput style={styles.input} placeholderTextColor={C.gray} />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>Email:</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="email-address"
                      placeholderTextColor={C.gray}
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={styles.col}>
                    <Text style={styles.label}>Data e lindjes:</Text>
                    <TextInput style={styles.input} placeholderTextColor={C.gray} />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>Nacionaliteti:</Text>
                    <TextInput style={styles.input} placeholderTextColor={C.gray} />
                  </View>
                </View>

                <View style={[styles.row, styles.rowLast]}>
                  <View style={styles.col}>
                    <Text style={styles.label}>Fjalëkalimi:</Text>
                    <TextInput style={styles.input} secureTextEntry placeholderTextColor={C.gray} />
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>Konfirmo:</Text>
                    <TextInput style={styles.input} secureTextEntry placeholderTextColor={C.gray} />
                  </View>
                </View>
              </View>
            </View>

            {/* ── Të dhënat sportive ────────────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Të dhënat sportive</Text>
              </View>

              <View style={styles.cardBody}>
                {/* Nr. i fanellës + Pozicioni + "e re" */}
                <View style={styles.row}>
                  <View style={styles.nrCol}>
                    <Text style={styles.label}>Nr. i fanellës:</Text>
                    <TextInput
                      style={[styles.input, styles.nrInput]}
                      keyboardType="number-pad"
                      placeholderTextColor={C.gray}
                    />
                  </View>

                  <View style={styles.col}>
                    <Text style={styles.label}>Pozicioni:</Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Zgjidh pozicionin"
                      style={({ pressed }) => [styles.sel, pressed && styles.pressed]}
                    >
                      <Text style={styles.selText} numberOfLines={1}>
                        Portier
                      </Text>
                      <MaterialCommunityIcons name="chevron-down" size={I(15)} color={C.gray} />
                    </Pressable>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Shto pozicion të re"
                    style={({ pressed }) => [styles.newPosBtn, pressed && styles.pressed]}
                  >
                    <MaterialCommunityIcons name="plus" size={I(13)} color={C.text} />
                    <Text style={styles.newPosText}>e re</Text>
                  </Pressable>
                </View>

                {/* Ekipi */}
                <View style={styles.row}>
                  <View style={styles.col}>
                    <Text style={styles.label}>Ekipi:</Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Zgjidh ekipin"
                      style={({ pressed }) => [styles.sel, pressed && styles.pressed]}
                    >
                      <Text style={styles.selText}>Ekipi i Parë</Text>
                      <MaterialCommunityIcons name="chevron-down" size={I(15)} color={C.gray} />
                    </Pressable>
                  </View>
                </View>

                {/* Contract window */}
                <View style={styles.dateCols}>
                  <View style={styles.dateCol}>
                    <Text style={styles.label}>Fillimi i kontratës:</Text>
                    <DateGroup />
                  </View>
                  <View style={[styles.dateCol, styles.dateColRight]}>
                    <Text style={[styles.label, styles.labelRight]}>Mbarimi i kontratës:</Text>
                    <DateGroup />
                  </View>
                </View>

                {/* Licensa */}
                <View style={[styles.row, styles.rowTight]}>
                  <View style={styles.col}>
                    <Text style={styles.label}>Licensa FFK:</Text>
                    <TextInput style={styles.input} placeholderTextColor={C.gray} />
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
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={amountLabel}
                      style={({ pressed }) => [styles.sel, pressed && styles.pressed]}
                    >
                      <Text style={styles.selText}>30</Text>
                      <MaterialCommunityIcons name="chevron-down" size={I(15)} color={C.gray} />
                    </Pressable>
                  </View>
                  <View style={styles.col}>
                    <Text style={styles.label}>Afati i pagesës (ditë)</Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Afati i pagesës"
                      style={({ pressed }) => [styles.sel, pressed && styles.pressed]}
                    >
                      <Text style={styles.selText}>10</Text>
                      <MaterialCommunityIcons name="chevron-down" size={I(15)} color={C.gray} />
                    </Pressable>
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
            <View style={styles.actions}>
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                style={({ pressed }) => [styles.btn, styles.btnCancel, pressed && styles.pressed]}
              >
                <Text style={styles.btnText}>Anulo</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [styles.btn, styles.btnConfirm, pressed && styles.pressed]}
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

/** DD / MM / YYYY entry group used for both contract dates. */
function DateGroup() {
  return (
    <View style={styles.dateGroup}>
      <TextInput
        style={[styles.input, styles.dateSq]}
        placeholder="DD"
        placeholderTextColor={C.hint}
        keyboardType="number-pad"
        maxLength={2}
      />
      <Text style={styles.dateSlash}>/</Text>
      <TextInput
        style={[styles.input, styles.dateSq]}
        placeholder="MM"
        placeholderTextColor={C.hint}
        keyboardType="number-pad"
        maxLength={2}
      />
      <TextInput
        style={[styles.input, styles.dateYear]}
        placeholder="YYYY"
        placeholderTextColor={C.hint}
        keyboardType="number-pad"
        maxLength={4}
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
      backgroundColor: C.page,
    },

    canvas: {
      flex: 1,
      backgroundColor: C.page,
    },

    lines: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 0,
    },

    line: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 1,
      backgroundColor: C.line,
    },

    colPad: {
      alignSelf: 'center',
      width: '100%',
      paddingHorizontal: 27,
    },

    /* Pinned header */
    header: {
      backgroundColor: C.page,
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
      color: '#FFFFFF',
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

    btnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13.5,
      color: '#FFFFFF',
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
