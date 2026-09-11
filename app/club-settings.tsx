import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';

/**
 * Cilësimet e klubit — the second settings sub-page.
 *
 * Same light #FAFBFA canvas and the same cards used on "Profil i klubit"
 * (Identitet Visual, Informacioni bazë, Kontaktet zyrtare, Rrjetet sociale,
 * Historia e klubit), plus one extra card at the end: Cilësimet e pagesave
 * (payment deadline day + tolerance window) with Anulo / Ruaj ndryshimet.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  card: '#FFFFFF',
  border: 'rgba(100,140,190,0.30)',
  fill: '#F6FBFF',
  headLine: 'rgba(30,40,35,0.10)',

  input: '#F4F7F5',
  inputBorder: '#000000',
  placeholder: '#A8A8A8',

  text: '#111111',
  gray: '#8A8A8A',

  green: '#159447',
  greenBright: '#159447',

  q1Bg: '#F2FBF5',
  q1Line: '#69C994',
  q1Btn: '#159447',

  swatchAway: '#F2EFE9',

  red: '#ED5050',
};

const YEARS = Array.from({ length: 47 }, (_, i) => String(2026 - i)); // 2026 → 1980

const FCP = require('@/assets/dashboard/fcp.png');

/* ------------------------------------------------------------------ */
/* Small reusable form pieces                                          */
/* ------------------------------------------------------------------ */

type FieldProps = {
  label?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  containerStyle?: object;
  flex?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'url' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
};

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  containerStyle,
  flex,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  multiline,
}: FieldProps) {
  return (
    <View style={[styles.fieldWrap, flex && styles.fieldFlex, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.placeholder}
        style={[styles.input, multiline && styles.textarea]}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        allowFontScaling={false}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

type SelectFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  open: boolean;
  onToggle: (id: string | null) => void;
  flex?: boolean;
};

function SelectField({ id, label, value, onChange, options, open, onToggle, flex }: SelectFieldProps) {
  return (
    <View style={[styles.fieldWrap, flex && styles.fieldFlex]}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => onToggle(open ? null : id)}
        accessibilityRole="button"
        style={({ pressed }) => [styles.select, pressed && styles.pressed]}
      >
        <Text
          style={[styles.selectText, !value && styles.placeholderText]}
          numberOfLines={1}
        >
          {value || 'Zgjidh…'}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={I(16)} color={C.gray} />
      </Pressable>
      {open ? (
        <View style={styles.optBox}>
          <ScrollView
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            style={styles.optList}
          >
            {options.map((o) => {
              const active = o === value;
              return (
                <Pressable
                  key={o}
                  onPress={() => {
                    onChange(o);
                    onToggle(null);
                  }}
                  style={({ pressed }) => [
                    styles.opt,
                    active && styles.optActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.optText, active && styles.optTextActive]}>{o}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}

function ColorSwatch({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.swatchCol}>
      <View style={styles.swatchOuter}>
        <View style={[styles.swatchInner, { backgroundColor: color }]} />
      </View>
      <Text style={styles.swatchLabel}>{label}</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

type Form = {
  officialName: string;
  shortName: string;
  foundationYear: string;
  licenseNumber: string;
  city: string;
  country: string;
  address: string;
  selA: string;
  selB: string;
  contactEmail: string;
  phone: string;
  website: string;
  facebook: string;
  instagram: string;
  youtube: string;
  twitter: string;
  history: string;
};

const INITIAL_FORM: Form = {
  officialName: '',
  shortName: '',
  foundationYear: '',
  licenseNumber: '',
  city: '',
  country: '',
  address: '',
  selA: '',
  selB: '',
  contactEmail: '',
  phone: '',
  website: '',
  facebook: '',
  instagram: '',
  youtube: '',
  twitter: '',
  history: '',
};

export default function ClubSettingsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const [form, setForm] = useState<Form>(INITIAL_FORM);
  const [openSel, setOpenSel] = useState<string | null>(null);
  const [showLogo, setShowLogo] = useState(false);

  const [dueDay, setDueDay] = useState('5');
  const [tolerance, setTolerance] = useState('10');

  const set = (k: keyof Form) => (v: string) => setForm((p) => ({ ...p, [k]: v }));

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
              <View style={styles.headerText}>
                <Text style={styles.title}>Cilësimet e klubit</Text>
                <Text style={styles.subtitle}>Identiteti dhe informacioni i klubit</Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.colPad}>
            {/* ── Identitet Visual ─────────────────────────────── */}
            <View style={[styles.card, { marginTop: 12 }]}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Identitet Visual</Text>
              </View>

              <View style={styles.logoZone}>
                <Pressable
                  onPress={() => setShowLogo((v) => !v)}
                  accessibilityRole="button"
                  accessibilityLabel="Ngarko ose ndrysho logon"
                  style={({ pressed }) => [styles.logoButton, pressed && styles.pressed]}
                >
                  {showLogo ? (
                    <View style={styles.crestWrap}>
                      <Image source={FCP} style={styles.crest} resizeMode="contain" />
                      <View style={styles.logoBadge}>
                        <MaterialCommunityIcons
                          name="cloud-upload-outline"
                          size={I(13)}
                          color="#FFFFFF"
                        />
                      </View>
                    </View>
                  ) : (
                    <View style={styles.logoCircle}>
                      <MaterialCommunityIcons
                        name="cloud-upload-outline"
                        size={I(24)}
                        color="#FFFFFF"
                      />
                    </View>
                  )}
                </Pressable>
                <Text style={styles.logoHint}>Ngarko/Ndrysho logon</Text>
              </View>

              <View style={styles.colors}>
                <Text style={styles.colorsLabel}>Ngjyrat Zyrtare</Text>
                <View style={styles.swatches}>
                  <ColorSwatch label="Home" color={C.green} />
                  <ColorSwatch label="Away" color={C.swatchAway} />
                  <ColorSwatch label="Third" color="#000000" />
                </View>
              </View>
            </View>

            {/* ── Informacioni baze ────────────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Informacioni baze</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.gridRow}>
                  <Field label="Emri Zyrtar" value={form.officialName} onChangeText={set('officialName')} flex />
                  <Field label="Shkurtesa" value={form.shortName} onChangeText={set('shortName')} autoCapitalize="characters" flex />
                </View>
                <View style={styles.gridRow}>
                  <SelectField id="foundation" label="Viti i themelimit" value={form.foundationYear} onChange={set('foundationYear')} options={YEARS} open={openSel === 'foundation'} onToggle={setOpenSel} flex />
                  <Field label="Nr. i Licencës" value={form.licenseNumber} onChangeText={set('licenseNumber')} flex />
                </View>
                <View style={styles.gridRow}>
                  <Field label="Qyteti" value={form.city} onChangeText={set('city')} flex />
                  <Field label="Shteti" value={form.country} onChangeText={set('country')} flex />
                </View>
                <Field label="Adresa" value={form.address} onChangeText={set('address')} />
                <View style={styles.gridRow}>
                  <SelectField id="selA" label="Viti i themelimit" value={form.selA} onChange={set('selA')} options={YEARS} open={openSel === 'selA'} onToggle={setOpenSel} flex />
                  <SelectField id="selB" label="Viti i themelimit" value={form.selB} onChange={set('selB')} options={YEARS} open={openSel === 'selB'} onToggle={setOpenSel} flex />
                </View>
              </View>
            </View>

            {/* ── Kontaktet zyrtare ────────────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Kontaktet zyrtare</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.gridRow}>
                  <Field label="Email Zyrtar" value={form.contactEmail} onChangeText={set('contactEmail')} keyboardType="email-address" autoCapitalize="none" flex />
                  <Field label="Nr. Tel" value={form.phone} onChangeText={set('phone')} keyboardType="phone-pad" autoCapitalize="none" flex />
                </View>
                <Field label="Faqja e internetit" value={form.website} onChangeText={set('website')} keyboardType="url" autoCapitalize="none" />
              </View>
            </View>

            {/* ── Rrjetet sociale ──────────────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Rrjetet sociale</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.gridRow}>
                  <Field label="Facebook" value={form.facebook} onChangeText={set('facebook')} autoCapitalize="none" flex />
                  <Field label="Instagram" value={form.instagram} onChangeText={set('instagram')} autoCapitalize="none" flex />
                </View>
                <View style={styles.gridRow}>
                  <Field label="Youtube" value={form.youtube} onChangeText={set('youtube')} autoCapitalize="none" flex />
                  <Field label="Twitter/X" value={form.twitter} onChangeText={set('twitter')} autoCapitalize="none" flex />
                </View>
              </View>
            </View>

            {/* ── Historia e klubit ────────────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Historia e klubit</Text>
              </View>
              <View style={styles.cardBody}>
                <Field
                  label="Përshkrim:"
                  value={form.history}
                  onChangeText={set('history')}
                  multiline
                  placeholder="Shkruaj historinë e klubit…"
                />
              </View>
            </View>

            {/* ── Cilësimet e pagesave ─────────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.cardHead}>
                <Text style={styles.cardHeadText}>Cilësimet e pagesave</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.payLabel}>Dita e afatit të pagesës:</Text>
                <View style={styles.payRow}>
                  <TextInput
                    value={dueDay}
                    onChangeText={setDueDay}
                    keyboardType="number-pad"
                    maxLength={2}
                    allowFontScaling={false}
                    style={styles.paySquare}
                  />
                  <Text style={styles.payText}>e çdo muaji (p.sh. 5 = deri më 5 të muajit)</Text>
                </View>
                <Text style={styles.payNote}>
                  Muaji i parë proporcional → afati = kjo ditë e muajit pasues
                </Text>

                <View style={styles.paySpacer} />

                <Text style={styles.payLabel}>Periudha e tolerancës (ditë):</Text>
                <View style={styles.payRow}>
                  <TextInput
                    value={tolerance}
                    onChangeText={setTolerance}
                    keyboardType="number-pad"
                    maxLength={2}
                    allowFontScaling={false}
                    style={styles.paySquare}
                  />
                  <Text style={styles.payText}>ditë pas afatit → statusi kalon në Skaduar</Text>
                </View>
                <Text style={styles.payNote}>0 = skadon pas afatit     30 = një muaj tolerancë</Text>
              </View>
            </View>

            {/* ── Actions (outside the cards) ──────────────────── */}
            <View style={styles.actions}>
              <Pressable
                onPress={() => router.back()}
                accessibilityRole="button"
                style={({ pressed }) => [styles.btn, styles.btnCancel, pressed && styles.pressed]}
              >
                <Text style={styles.btnText}>Anulo</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  /* persist handled later */
                }}
                accessibilityRole="button"
                style={({ pressed }) => [styles.btn, styles.btnSave, pressed && styles.pressed]}
              >
                <Text style={styles.btnText}>Ruaj ndryshimet</Text>
              </Pressable>
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
      paddingBottom: 46,
    },

    /* Generic info card */
    card: {
      backgroundColor: C.fill,
      borderWidth: 2,
      borderColor: C.border,
      borderRadius: 7,
    },

    cardGap: {
      marginTop: 10,
    },

    cardHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 12,
      paddingTop: 9,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
      borderTopLeftRadius: 6,
      borderTopRightRadius: 6,
    },

    cardHeadText: {
      fontFamily: Fonts.bodyBold,
      fontSize: 15,
      color: C.text,
    },

    cardBody: {
      paddingHorizontal: 15,
      paddingVertical: 10,
    },

    /* Logo upload */
    logoZone: {
      height: 120,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.fill,
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
    },

    logoButton: {
      alignItems: 'center',
    },

    logoCircle: {
      width: 55,
      height: 55,
      borderRadius: 24,
      backgroundColor: C.greenBright,
      alignItems: 'center',
      justifyContent: 'center',
    },

    crestWrap: {
      position: 'relative',
      width: 54,
      height: 54,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
      borderRadius: 27,
      borderWidth: 1,
      borderColor: C.border,
    },

    crest: {
      width: 0,
      height: 40,
    },

    logoBadge: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: C.greenBright,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },

    logoHint: {
      fontFamily: Fonts.body,
      fontSize: 12,
      color: C.gray,
      marginTop: 8,
    },

    /* Official colors */
    colors: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      paddingVertical: 6,
      paddingHorizontal: 15,
    },

    colorsLabel: {
      fontFamily: Fonts.bodyBold,
      fontSize: 13.5,
      color: C.text,
    },

    swatches: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 12,
    },

    swatchCol: {
      alignItems: 'center',
    },

    swatchOuter: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.16)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    swatchInner: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: 'rgba(30,40,35,0.12)',
    },

    swatchLabel: {
      fontFamily: Fonts.body,
      fontSize: 10,
      color: C.gray,
      marginTop: 2,
    },

    /* Form primitives */
    gridRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },

    fieldWrap: {
      marginBottom: 8,
    },

    fieldFlex: {
      flex: 1,
    },

    label: {
      fontFamily: Fonts.body,
      fontSize: 12,
      color: C.gray,
      marginBottom: 3,
    },

    input: {
      height: 28,
      backgroundColor: C.input,
      borderWidth: 0.5,
      borderColor: C.inputBorder,
      borderRadius: 2,
      paddingHorizontal: 9,
      paddingVertical: 0,
      fontSize: 12,
      lineHeight: 16,
      fontFamily: Fonts.body,
      color: C.text,
    },

    textarea: {
      height: 80,
      paddingTop: 7,
      paddingBottom: 7,
    },

    /* Custom select */
    select: {
      height: 46,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: C.input,
      borderWidth: 0.5,
      borderColor: C.inputBorder,
      borderRadius: 2,
      paddingHorizontal: 9,
    },

    selectText: {
      fontFamily: Fonts.body,
      fontSize: 12,
      color: C.text,
      flex: 1,
    },

    placeholderText: {
      color: C.placeholder,
    },

    optBox: {
      marginTop: 3,
      backgroundColor: '#FFFFFF',
      borderWidth: 0.5,
      borderColor: C.inputBorder,
      borderRadius: 3,
      overflow: 'hidden',
    },

    optList: {
      maxHeight: 116,
    },

    opt: {
      height: 30,
      justifyContent: 'center',
      paddingHorizontal: 9,
    },

    optActive: {
      backgroundColor: 'rgba(7, 155, 88, 0.10)',
    },

    optText: {
      fontFamily: Fonts.body,
      fontSize: 12,
      color: C.text,
    },

    optTextActive: {
      fontFamily: Fonts.bodyBold,
      color: C.green,
    },

    /* Cilësimet e pagesave */
    payLabel: {
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 16,
      color: C.gray,
      marginBottom: 6,
    },

    payRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    paySquare: {
      width: 26,
      height: 26,
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 2,
      paddingHorizontal: 0,
      paddingVertical: 0,
      textAlign: 'center',
      fontSize: 13,
      fontFamily: Fonts.body,
      color: '#000000',
    },

    payText: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 12,
      lineHeight: 16,
      color: C.gray,
      marginLeft: 8,
    },

    payNote: {
      fontFamily: Fonts.body,
      fontSize: 11,
      lineHeight: 15,
      color: C.gray,
      marginTop: 5,
    },

    paySpacer: {
      height: 14,
    },

    /* Actions below the cards */
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 9,
      marginTop: 14,
    },

    btn: {
      height: 40,
      borderRadius: 3,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 18,
    },

    btnCancel: {
      backgroundColor: C.red,
    },

    btnSave: {
      backgroundColor: C.green,
    },

    btnText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 13,
      color: '#FFFFFF',
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
