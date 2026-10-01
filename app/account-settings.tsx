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
import { useSession } from '@/lib/session';

/**
 * Cilësimet e llogarisë — one shell (light #FAFBFA canvas, pinned header) over
 * a body that depends on the role: the administrator gets the club-facing
 * panels, everyone else the narrower account-and-danger-zone page.
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

  inputBorder: '#000000',

  green: '#159447',
  greenPressed: '#0E7430',
  red: '#E03131',
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
/* Administrator body                                                  */
/* ------------------------------------------------------------------ */

function AdminAccountBody() {
  const [fullName, setFullName] = useState('Admin GoalHub');
  const [language, setLanguage] = useState('Shqip');

  const [currEmail, setCurrEmail] = useState('admin@goalhub.com');
  const [newEmail, setNewEmail] = useState('');
  const [emailPass, setEmailPass] = useState('');

  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  return (
    <>
      {/* ── Të dhënat personale ─────────────────────────────── */}
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

      {/* ── Ndrysho email adresën ────────────────────────────── */}
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

      {/* ── Ndrysho fjalëkalimin ─────────────────────────────── */}
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
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Trainer body (and every other non-administrator role)               */
/* ------------------------------------------------------------------ */

function TrainerAccountBody() {
  const [currEmail, setCurrEmail] = useState('admin@goalhub.com');
  const [newEmail, setNewEmail] = useState('');
  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');

  return (
    <>
      {/* ── Ndrysho email adresën ────────────────────────────── */}
      <View style={[styles.card, styles.cardFirst]}>
        <View style={styles.cardHeadCenter}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            Ndrysho email adresën
          </Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.gridRow}>
            <Field
              label="Email aktual:"
              value={currEmail}
              onChangeText={setCurrEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              flex
            />
            <Field
              label="Email i ri:"
              value={newEmail}
              onChangeText={setNewEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              flex
            />
          </View>

          <View style={[styles.gridRow, styles.gridGap]}>
            <Field
              label="Fjalëkalimi aktual:"
              value={currPass}
              onChangeText={setCurrPass}
              secure
              flex
            />
            <Field
              label="Fjalëkalimi i ri:"
              value={newPass}
              onChangeText={setNewPass}
              secure
              flex
            />
          </View>

          <View style={styles.gridGap}>
            <Field
              label="Konfirmo fjalëkalimin e ri:"
              value={confirmPass}
              onChangeText={setConfirmPass}
              secure
            />
          </View>

          <Pressable
            onPress={() => {
              /* persist handled later */
            }}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.save,
              { backgroundColor: pressed ? C.greenPressed : C.green },
            ]}
          >
            <Text style={styles.saveText}>Ruaj cilësimet</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Zona e rrezikut ──────────────────────────────────── */}
      <View style={styles.danger}>
        <Text style={styles.dangerTitle}>Zona e rrezikut</Text>
        <Text
          style={styles.dangerText}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          Veprimet e mëposhtme janë të pakthyeshme. Veproni me kujdes.
        </Text>

        <View style={styles.dangerActions}>
          <Pressable
            onPress={() => {
              /* persist handled later */
            }}
            accessibilityRole="button"
            style={({ pressed }) => [styles.dangerGhost, pressed && styles.pressed]}
          >
            <Text style={styles.dangerGhostText}>Çaktivizo llogarinë</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              /* persist handled later */
            }}
            accessibilityRole="button"
            style={({ pressed }) => [styles.dangerFill, pressed && styles.pressed]}
          >
            <Text style={styles.dangerFillText}>Fshij të gjitha të dhënat</Text>
          </Pressable>
        </View>
      </View>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { user } = useSession();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const isAdmin = user?.role === 'administrator';

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
                <Text style={styles.title} numberOfLines={1}>
                  Cilësimet e llogarisë
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  Profili dhe preferencat personale
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
            {isAdmin ? <AdminAccountBody /> : <TrainerAccountBody />}
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

    /* Light-blue card */
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

    gridGap: {
      marginTop: 4,
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

    /* Transparent, so the card's own fill shows through. */
    input: {
      height: 36,
      backgroundColor: 'transparent',
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
      backgroundColor: 'transparent',
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

    /* Trainer's save — a touch taller and earlier than the card buttons. */
    save: {
      height: 42,
      borderRadius: 3,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 14,
    },

    saveText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 14,
      color: '#FFFFFF',
    },

    /* ── Zona e rrezikut ─────────────────────────────────────── */
    danger: {
      marginTop: 12,
      paddingHorizontal: 16,
      paddingVertical: 15,
      backgroundColor: 'rgba(224,49,49,0.20)',
      borderWidth: 1,
      borderColor: C.green,
      borderRadius: 8,
    },

    dangerTitle: {
      fontFamily: Fonts.bodyBold,
      fontSize: 16,
      lineHeight: 20,
      letterSpacing: -0.2,
      color: '#000000',
      textAlign: 'center',
    },

    dangerText: {
      fontFamily: Fonts.body,
      fontSize: 10.5,
      lineHeight: 14,
      color: '#000000',
      textAlign: 'center',
      marginTop: 3,
    },

    dangerActions: {
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 15,
    },

    dangerGhost: {
      height: 33,
      paddingHorizontal: 13,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: C.red,
      borderRadius: 6,
    },

    dangerGhostText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      color: '#000000',
    },

    dangerFill: {
      height: 33,
      paddingHorizontal: 13,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: C.red,
      borderRadius: 6,
    },

    dangerFillText: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      color: '#FFFFFF',
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
