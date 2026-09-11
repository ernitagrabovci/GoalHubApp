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
 * Cilësimet e llogarisë — the first settings sub-page.
 *
 * Same light #FAFBFA canvas as the other root screens (club-profile,
 * fushat…). Pinned header (back arrow + "Cilësimet e llogarisë") over three
 * light-blue cards: personal data, change e-mail, change password.
 */

const C = {
  page: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',
  gray: '#8A8A8A',

  card: '#F6FBFF',
  border: 'rgba(100,140,190,0.30)',
  headLine: 'rgba(100,140,190,0.25)',
  formLine: 'rgba(100,140,190,0.22)',

  input: '#F6FBFF',
  inputBorder: '#000000',

  green: '#159447',
  greenPressed: '#0E7430',
};

const FCP = require('@/assets/dashboard/fcp.png');
const LANGUAGES = ['Shqip', 'English'];

/* ------------------------------------------------------------------ */
/* Small form pieces                                                   */
/* ------------------------------------------------------------------ */

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  flex?: boolean;
  secure?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words';
};

function Field({
  label,
  value,
  onChangeText,
  flex,
  secure,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: FieldProps) {
  return (
    <View style={[styles.fieldWrap, flex && styles.fieldFlex]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secure}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        allowFontScaling={false}
        style={styles.input}
      />
    </View>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
};

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        style={({ pressed }) => [styles.select, pressed && styles.pressed]}
      >
        <Text style={styles.selectText} numberOfLines={1}>
          {value}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={I(16)} color={C.gray} />
      </Pressable>
      {open ? (
        <View style={styles.optBox}>
          {options.map((o) => {
            const active = o === value;
            return (
              <Pressable
                key={o}
                onPress={() => {
                  onChange(o);
                  setOpen(false);
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
        </View>
      ) : null}
    </View>
  );
}

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: pressed ? C.greenPressed : C.green },
      ]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const [fullName, setFullName] = useState('Admin GoalHub');
  const [language, setLanguage] = useState('Shqip');

  const [currEmail, setCurrEmail] = useState('admin@goalhub.com');
  const [newEmail, setNewEmail] = useState('');
  const [emailPass, setEmailPass] = useState('');

  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

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
                <Text style={styles.title}>Cilësimet e llogarisë</Text>
                <Text style={styles.subtitle}>Profili dhe preferencat personale</Text>
              </View>
            </View>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          <View style={styles.colPad}>
            {/* ── Të dhënat personale ─────────────────────────── */}
            <View style={[styles.card, styles.cardFirst]}>
              <View style={styles.cardHeadCenter}>
                <Text style={styles.cardTitle}>Të dhënat personale</Text>
              </View>

              {/* Account — team logo, name, email */}
              <View style={styles.accountZone}>
                <View style={styles.avatarCircle}>
                  <Image source={FCP} style={styles.avatarImg} resizeMode="contain" />
                </View>
                <Text style={styles.profileName}>Admin GoalHub</Text>
                <Text style={styles.profileEmail}>admin@goalhub.com</Text>
              </View>
              <View style={styles.formDivider} />

              {/* Editable fields */}
              <View style={styles.cardBody}>
                <Field label="Emri i plotë:" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
                <View style={styles.fieldGap} />
                <SelectField label="Gjuha e platformës:" value={language} options={LANGUAGES} onChange={setLanguage} />
                <PrimaryButton
                  label="Ruaj Profilin"
                  onPress={() => {
                    /* persist handled later */
                  }}
                />
              </View>
            </View>

            {/* ── Ndrysho email adresën ────────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.cardHeadCenter}>
                <Text style={styles.cardTitle}>Ndrysho email adresën</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.gridRow}>
                  <Field
                    label="Email aktual"
                    value={currEmail}
                    onChangeText={setCurrEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    flex
                  />
                  <Field
                    label="Email i ri"
                    value={newEmail}
                    onChangeText={setNewEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    flex
                  />
                </View>
                <Field
                  label="Konfirmo fjalëkalimin:"
                  value={emailPass}
                  onChangeText={setEmailPass}
                  secure
                />
                <PrimaryButton
                  label="Ndrysho email adresën"
                  onPress={() => {
                    /* persist handled later */
                  }}
                />
              </View>
            </View>

            {/* ── Ndrysho fjalëkalimin ────────────────────────── */}
            <View style={[styles.card, styles.cardGap]}>
              <View style={styles.cardHeadCenter}>
                <Text style={styles.cardTitle}>Ndrysho fjalëkalimin</Text>
              </View>
              <View style={styles.cardBody}>
                <View style={styles.gridRow}>
                  <Field label="Fjalëkalimi aktual" value={currPass} onChangeText={setCurrPass} secure flex />
                  <Field label="Fjalëkalimi i ri" value={newPass} onChangeText={setNewPass} secure flex />
                </View>
                <Field label="Konfirmo fjalëkalimin e ri:" value={confirmPass} onChangeText={setConfirmPass} secure />
                <PrimaryButton
                  label="Ndrysho fjalëkalimin"
                  onPress={() => {
                    /* persist handled later */
                  }}
                />
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
      backgroundColor: C.page,
    },

    canvas: {
      flex: 1,
      backgroundColor: C.page,
    },

    /* Faint vertical canvas texture — same idea as the dashboards. */
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

    /* Light-blue info card */
    card: {
      backgroundColor: C.card,
      borderWidth: 2,
      borderColor: C.border,
      borderRadius: 8,
    },

    cardFirst: {
      marginTop: 12,
    },

    cardGap: {
      marginTop: 12,
    },

    cardHeadCenter: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 12,
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor: C.headLine,
    },

    cardTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 16,
      lineHeight: 20,
      letterSpacing: -0.2,
      color: C.text,
    },

    /* Account / avatar block */
    accountZone: {
      alignItems: 'center',
      paddingVertical: 16,
    },

    avatarCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: C.border,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    },

    avatarImg: {
      width: 62,
      height: 62,
    },

    profileName: {
      fontFamily: Fonts.bodyBold,
      fontSize: 17,
      lineHeight: 22,
      color: C.text,
      marginTop: 9,
    },

    profileEmail: {
      fontFamily: Fonts.body,
      fontSize: 13,
      lineHeight: 17,
      color: C.gray,
      marginTop: 1,
    },

    formDivider: {
      height: 1,
      backgroundColor: C.formLine,
      marginHorizontal: 15,
    },

    cardBody: {
      paddingHorizontal: 16,
      paddingTop: 13,
      paddingBottom: 15,
    },

    /* Form primitives */
    gridRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 9,
    },

    fieldWrap: {
      marginBottom: 6,
    },

    fieldFlex: {
      flex: 1,
    },

    fieldGap: {
      height: 4,
    },

    label: {
      fontFamily: Fonts.body,
      fontSize: 12,
      color: C.gray,
      marginBottom: 4,
    },

    input: {
      height: 36,
      backgroundColor: C.input,
      borderWidth: 1,
      borderColor: C.inputBorder,
      borderRadius: 2,
      paddingHorizontal: 10,
      paddingVertical: 0,
      fontSize: 13,
      fontFamily: Fonts.body,
      color: C.text,
    },

    select: {
      height: 36,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: C.input,
      borderWidth: 1,
      borderColor: C.inputBorder,
      borderRadius: 2,
      paddingHorizontal: 10,
    },

    selectText: {
      flex: 1,
      fontFamily: Fonts.body,
      fontSize: 13,
      color: C.text,
      marginRight: 6,
    },

    optBox: {
      marginTop: 4,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: C.inputBorder,
      borderRadius: 3,
      overflow: 'hidden',
    },

    opt: {
      height: 34,
      justifyContent: 'center',
      paddingHorizontal: 10,
    },

    optActive: {
      backgroundColor: 'rgba(21,148,71,0.10)',
    },

    optText: {
      fontFamily: Fonts.body,
      fontSize: 13,
      color: C.text,
    },

    optTextActive: {
      fontFamily: Fonts.bodyBold,
      color: C.green,
    },

    button: {
      height: 40,
      borderRadius: 3,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 16,
    },

    buttonText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 14,
      color: '#FFFFFF',
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
