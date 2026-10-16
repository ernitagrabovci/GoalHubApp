import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { DeleteAccountModal } from '@/components/settings/delete-account-modal';
import { Fonts } from '@/constants/theme';
import { deactivateAccount } from '@/lib/api/account';
import { ApiError } from '@/lib/api/errors';
import { I, scaled } from '@/lib/responsive';
import { useSession, type SessionUser } from '@/lib/session';

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

/** A one-line result under a form: green on success, red on failure. */
type Msg = { text: string; ok: boolean };

/** Albanian copy for a failed settings save. */
function errorText(e: unknown): string {
  if (e instanceof ApiError && e.status === 422) {
    return 'Të dhënat nuk janë të vlefshme. Kontrollo fushat.';
  }
  if (e instanceof ApiError && e.status === 0) {
    return 'Nuk mund të lidhemi me serverin. Kontrollo lidhjen.';
  }
  return 'Diçka shkoi keq. Provo përsëri.';
}

function MsgLine({ msg }: { msg: Msg | null }) {
  if (!msg) return null;
  return <Text style={[styles.msg, { color: msg.ok ? C.green : C.red }]}>{msg.text}</Text>;
}

/* ------------------------------------------------------------------ */
/* Small form pieces                                                   */
/* ------------------------------------------------------------------ */

type FieldProps = {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  flex?: boolean;
  secure?: boolean;
  editable?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words';
};

function Field({
  label,
  value,
  onChangeText,
  flex,
  secure,
  editable = true,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: FieldProps) {
  return (
    <View style={[styles.fieldWrap, flex && styles.fieldFlex]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
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

function PrimaryButton({
  label,
  onPress,
  loading,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: pressed ? C.greenPressed : C.green },
        loading && styles.btnOff,
      ]}
    >
      <Text style={styles.buttonText}>{loading ? '…' : label}</Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------------ */
/* Administrator body                                                  */
/* ------------------------------------------------------------------ */

function AdminAccountBody({ user }: { user: SessionUser }) {
  const router = useRouter();
  const { signOut, updateProfile, changePassword } = useSession();

  const [fullName, setFullName] = useState(user.name);
  const [language, setLanguage] = useState('Shqip');
  const [profileMsg, setProfileMsg] = useState<Msg | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [emailPass, setEmailPass] = useState('');
  const [emailMsg, setEmailMsg] = useState<Msg | null>(null);
  const [savingEmail, setSavingEmail] = useState(false);

  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passMsg, setPassMsg] = useState<Msg | null>(null);
  const [savingPass, setSavingPass] = useState(false);

  /* A dead token on any of the three saves bounces to the login screen. */
  const handleAuth = (e: unknown) =>
    e instanceof ApiError && e.status === 401 ? true : false;

  const saveProfile = () => {
    if (savingProfile) return;
    if (!fullName.trim()) {
      setProfileMsg({ text: 'Shkruaj emrin e plotë.', ok: false });
      return;
    }
    setSavingProfile(true);
    setProfileMsg(null);
    updateProfile({
      name: fullName,
      email: user.email,
      language: language === 'English' ? 'en' : 'sq',
    })
      .then(() => setProfileMsg({ text: 'Profili u ruajt.', ok: true }))
      .catch((e) => {
        if (handleAuth(e)) {
          signOut();
          router.replace('/login');
          return;
        }
        setProfileMsg({ text: errorText(e), ok: false });
      })
      .finally(() => setSavingProfile(false));
  };

  const saveEmail = () => {
    if (savingEmail) return;
    if (!newEmail.trim() || !emailPass) {
      setEmailMsg({ text: 'Plotëso emailin e ri dhe fjalëkalimin.', ok: false });
      return;
    }
    setSavingEmail(true);
    setEmailMsg(null);
    updateProfile({ name: user.name, email: newEmail.trim(), password: emailPass })
      .then(() => {
        setEmailMsg({ text: 'Emaili u përditësua.', ok: true });
        setNewEmail('');
        setEmailPass('');
      })
      .catch((e) => {
        if (handleAuth(e)) {
          signOut();
          router.replace('/login');
          return;
        }
        setEmailMsg({
          text:
            e instanceof ApiError && e.status === 422
              ? 'Fjalëkalimi është i gabuar ose emaili është në përdorim.'
              : errorText(e),
          ok: false,
        });
      })
      .finally(() => setSavingEmail(false));
  };

  const savePassword = () => {
    if (savingPass) return;
    if (!currPass || !newPass) {
      setPassMsg({ text: 'Plotëso fjalëkalimin aktual dhe të ri.', ok: false });
      return;
    }
    if (newPass !== confirmPass) {
      setPassMsg({ text: 'Fjalëkalimet e reja nuk përputhen.', ok: false });
      return;
    }
    setSavingPass(true);
    setPassMsg(null);
    changePassword(currPass, newPass)
      .then(() => {
        setPassMsg({ text: 'Fjalëkalimi u ndryshua.', ok: true });
        setCurrPass('');
        setNewPass('');
        setConfirmPass('');
      })
      .catch((e) => {
        if (handleAuth(e)) {
          signOut();
          router.replace('/login');
          return;
        }
        setPassMsg({
          text:
            e instanceof ApiError && e.status === 422
              ? 'Fjalëkalimi aktual është i gabuar ose i dobët.'
              : errorText(e),
          ok: false,
        });
      })
      .finally(() => setSavingPass(false));
  };

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
          <Text style={styles.profileName}>{user.name}</Text>
          <Text style={styles.profileEmail}>{user.email}</Text>
        </View>
        <View style={styles.formDivider} />

        {/* Editable fields */}
        <View style={styles.cardBody}>
          <Field label="Emri i plotë:" value={fullName} onChangeText={setFullName} autoCapitalize="words" />
          <View style={styles.fieldGap} />
          <SelectField label="Gjuha e platformës:" value={language} options={LANGUAGES} onChange={setLanguage} />
          <MsgLine msg={profileMsg} />
          <PrimaryButton label="Ruaj Profilin" onPress={saveProfile} loading={savingProfile} />
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
              value={user.email}
              onChangeText={() => {}}
              editable={false}
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
          <MsgLine msg={emailMsg} />
          <PrimaryButton
            label="Ndrysho email adresën"
            onPress={saveEmail}
            loading={savingEmail}
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
          <MsgLine msg={passMsg} />
          <PrimaryButton
            label="Ndrysho fjalëkalimin"
            onPress={savePassword}
            loading={savingPass}
          />
        </View>
      </View>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Trainer body (and every other non-administrator role)               */
/* ------------------------------------------------------------------ */

function TrainerAccountBody({ user }: { user: SessionUser }) {
  const router = useRouter();
  const { token, signOut, updateProfile, changePassword } = useSession();

  const [newEmail, setNewEmail] = useState('');
  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [msg, setMsg] = useState<Msg | null>(null);
  const [saving, setSaving] = useState(false);

  const [dangerBusy, setDangerBusy] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const alertError = (e: unknown) =>
    Alert.alert(
      'Veprimi dështoi',
      e instanceof ApiError && e.status !== 0 && e.message
        ? e.message
        : 'Nuk mund të lidhemi me serverin. Kontrollo lidhjen.',
    );

  /* Deactivating is reversible: it flips the flag, then the session ends. */
  const onDeactivate = () => {
    if (!token || dangerBusy) return;
    Alert.alert(
      'Çaktivizo llogarinë',
      'Llogaria do të çaktivizohet dhe do të dilni. Mund ta riaktivizoni më vonë.',
      [
        { text: 'Anulo', style: 'cancel' },
        {
          text: 'Çaktivizo',
          style: 'destructive',
          onPress: () => {
            setDangerBusy(true);
            deactivateAccount(token)
              .then(() => {
                signOut();
                router.replace('/login');
              })
              .catch((e) => {
                setDangerBusy(false);
                alertError(e);
              });
          },
        },
      ],
    );
  };

  /* One save for both changes: email needs the current password anyway, and a
     new password needs it too — so one current-password field drives both. */
  const save = () => {
    if (saving) return;
    const wantsEmail = newEmail.trim().length > 0;
    const wantsPass = newPass.length > 0 || confirmPass.length > 0;

    if (!wantsEmail && !wantsPass) {
      setMsg({ text: 'Nuk ka ndryshime për të ruajtur.', ok: false });
      return;
    }
    if (!currPass) {
      setMsg({ text: 'Shkruaj fjalëkalimin aktual.', ok: false });
      return;
    }
    if (wantsPass && newPass !== confirmPass) {
      setMsg({ text: 'Fjalëkalimet e reja nuk përputhen.', ok: false });
      return;
    }

    setSaving(true);
    setMsg(null);

    const tasks: Promise<unknown>[] = [];
    if (wantsEmail) {
      tasks.push(updateProfile({ name: user.name, email: newEmail.trim(), password: currPass }));
    }
    if (wantsPass) {
      tasks.push(changePassword(currPass, newPass));
    }

    Promise.all(tasks)
      .then(() => {
        setMsg({ text: 'Cilësimet u ruajtën.', ok: true });
        setNewEmail('');
        setCurrPass('');
        setNewPass('');
        setConfirmPass('');
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) {
          signOut();
          router.replace('/login');
          return;
        }
        setMsg({ text: errorText(e), ok: false });
      })
      .finally(() => setSaving(false));
  };

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
              value={user.email}
              onChangeText={() => {}}
              editable={false}
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

          <MsgLine msg={msg} />

          <Pressable
            onPress={save}
            disabled={saving}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.save,
              { backgroundColor: pressed ? C.greenPressed : C.green },
              saving && styles.btnOff,
            ]}
          >
            <Text style={styles.saveText}>{saving ? '…' : 'Ruaj cilësimet'}</Text>
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
            onPress={onDeactivate}
            disabled={dangerBusy}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.dangerGhost,
              dangerBusy && styles.btnOff,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.dangerGhostText}>Çaktivizo llogarinë</Text>
          </Pressable>
          <Pressable
            onPress={() => setConfirmingDelete(true)}
            disabled={dangerBusy}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.dangerFill,
              dangerBusy && styles.btnOff,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.dangerFillText}>Fshij të gjitha të dhënat</Text>
          </Pressable>
        </View>
      </View>

      {confirmingDelete ? (
        <DeleteAccountModal
          token={token}
          onClose={() => setConfirmingDelete(false)}
          onDeleted={() => {
            signOut();
            router.replace('/login');
          }}
        />
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Screen                                                              */
/* ------------------------------------------------------------------ */

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { user } = useSession();

  const isAdmin = user?.role === 'administrator';

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
            {user ? (
              isAdmin ? (
                <AdminAccountBody user={user} />
              ) : (
                <TrainerAccountBody user={user} />
              )
            ) : null}
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
    },

    canvas: {
      flex: 1,
    },

    /* Faint vertical canvas texture — same idea as the dashboards. */
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
      backgroundColor: '#F5F5F5',
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
      backgroundColor: '#F5F5F5',
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
      color: '#F5F5F5',
    },

    /* Result line under a form, and the dimmed state while a save is in flight. */
    msg: {
      fontFamily: Fonts.bodySemiBold,
      fontSize: 11.5,
      lineHeight: 15,
      textAlign: 'center',
      marginTop: 10,
    },

    btnOff: {
      opacity: 0.6,
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
      color: '#F5F5F5',
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
      color: '#F5F5F5',
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
