import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';
import { deleteAccount } from '@/lib/api/account';
import { listMyChildren } from '@/lib/api/children';
import { ApiError } from '@/lib/api/errors';
import type { ApiChild } from '@/lib/api/types';
import { positionLabel } from '@/lib/player-position';
import { useLanguage } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { useTheme } from '@/lib/theme';

const VERSION = '1.0.0';

const C = {
  text: '#111111',
  gray: '#6E6E6E',
  placeholder: '#A8A8A8',

  card: '#F1FBF5',
  cardBorder: '#CFE6D8',
  divider: '#D8ECE1',

  section: '#159447',
  green: '#159447',
  greenPressed: '#0E7430',
  red: '#E03131',
  redSoft: 'rgba(224,49,49,0.12)',
  line: '#000000',
  white: '#F5F5F5',
};

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) return 'Too many attempts. Please wait a minute and try again.';
    if (error.status === 0) return 'Network error. Check your connection and try again.';
    const field = error.fieldErrors?.current_password?.[0] ?? error.fieldErrors?.password?.[0];
    return field ?? error.message;
  }
  return 'Something went wrong. Please try again.';
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, token, signOut, updateProfile, changePassword } = useSession();
  const { t, lang, setLang } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const [child, setChild] = useState<ApiChild | null>(null);

  const [subOpen, setSubOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [curPass, setCurPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passBusy, setPassBusy] = useState(false);
  const [passError, setPassError] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState('');
  const [emailDraft, setEmailDraft] = useState('');
  const [editPass, setEditPass] = useState('');
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletePass, setDeletePass] = useState('');
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  /* A parent's linked child comes from their own children list. */
  useEffect(() => {
    if (!token || user?.role !== 'parent') return;
    const controller = new AbortController();

    listMyChildren(token, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setChild(res.data[0] ?? null);
      })
      .catch((e) => {
        if (controller.signal.aborted) return;
        if (e instanceof ApiError && e.status === 401) {
          signOut();
          router.replace('/login');
        }
      });

    return () => controller.abort();
  }, [token, user?.role, router, signOut]);

  const nextEmail = emailDraft.trim();
  const emailChanged = nextEmail !== '' && nextEmail !== user?.email;

  const handleSignOut = () => {
    signOut();
    router.replace('/login');
  };

  const handlePassword = async () => {
    if (passBusy) return;
    if (!newPass || newPass !== confirmPass) {
      setPassError(t('profile.passwordMismatch'));
      return;
    }

    setPassBusy(true);
    setPassError(null);
    try {
      await changePassword(curPass, newPass);
      alert(t('profile.passwordUpdated'));
      setSecurityOpen(false);
      setCurPass('');
      setNewPass('');
      setConfirmPass('');
    } catch (err) {
      setPassError(errorMessage(err));
    } finally {
      setPassBusy(false);
    }
  };

  const handleEdit = async () => {
    if (!user || editBusy) return;
    if (emailChanged && !editPass) {
      setEditError('Enter your password to change your email.');
      return;
    }

    setEditBusy(true);
    setEditError(null);
    try {
      await updateProfile({
        name: nameDraft.trim() || user.name,
        email: nextEmail || user.email,
        password: emailChanged ? editPass : undefined,
      });
      setEditOpen(false);
      setNameDraft('');
      setEmailDraft('');
      setEditPass('');
    } catch (err) {
      setEditError(errorMessage(err));
    } finally {
      setEditBusy(false);
    }
  };

  const handleDelete = async () => {
    if (deleteBusy) return;
    if (!token) return;
    if (!deletePass) {
      setDeleteError(t('profile.currentPassword'));
      return;
    }

    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteAccount(token, deletePass);
      alert(t('profile.accountDeleted'));
      signOut();
      router.replace('/login');
    } catch (err) {
      setDeleteError(errorMessage(err));
    } finally {
      setDeleteBusy(false);
    }
  };

  const closeDelete = () => {
    setConfirmingDelete(false);
    setDeletePass('');
    setDeleteError(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>{t('profile.title')}</Text>
      </View>

      {!user ? (
        <View style={styles.signedOut}>
          <Text style={styles.signedOutTitle}>{t('profile.signedOutTitle')}</Text>
          <Text style={styles.signedOutSub}>
            {t('profile.signedOutSub')}
          </Text>
          <Pressable style={styles.primary} onPress={() => router.replace('/login')}>
            <Text style={styles.primaryText}>{t('profile.goToSignIn')}</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          {/* Profile */}
          <View style={styles.profile}>
            <View style={[styles.avatar, { backgroundColor: `${user.color}26` }]}>
              <Text style={[styles.avatarText, { color: user.color }]}>{user.initials}</Text>
            </View>
            <Text style={styles.name}>{user.name}</Text>
            <View style={[styles.roleBadge, { borderColor: `${user.color}55` }]}>
              <View style={[styles.roleDot, { backgroundColor: user.color }]} />
              <Text style={[styles.roleBadgeText, { color: user.color }]}>
                {t(`role.${user.role}`)}
              </Text>
            </View>
            <Text style={styles.subtitle}>
              {user.subtitle} · {user.club}
            </Text>
          </View>

          {/* Linked child — parent only */}
          {user.role === 'parent' && child ? (
            <>
              <Text style={styles.sectionLabel}>{t('profile.linkedChild')}</Text>
              <View style={styles.card}>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/profili-femiut',
                      params: { id: String(child.id), name: child.name ?? '' },
                    })
                  }
                  accessibilityRole="button"
                  style={({ pressed }) => [styles.childRow, pressed && styles.pressed]}
                >
                  <View style={styles.childTile}>
                    <Text style={styles.childInitials}>
                      {(child.name ?? '')
                        .split(' ')
                        .filter(Boolean)
                        .map((word) => word[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.childBody}>
                    <Text style={styles.childName} numberOfLines={1}>
                      {child.name ?? '—'}
                    </Text>
                    <Text style={styles.childSub} numberOfLines={1}>
                      {[
                        child.position ? positionLabel(child.position) : null,
                        child.jersey_number != null ? `Nr. ${child.jersey_number}` : null,
                        child.team?.name,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  </View>
                  <IconSymbol name="chevron.right" size={16} color={C.gray} />
                </Pressable>
              </View>
            </>
          ) : null}

          {/* Subscription */}
          <Text style={styles.sectionLabel}>{t('profile.subscription')}</Text>
          <View style={styles.card}>
            <SettingRow
              icon="verified-user"
              label={t('profile.subscription')}
              value="—"
              onPress={() => setSubOpen(!subOpen)}
            />
            {subOpen ? (
              <>
                <View style={styles.divider} />
                <View style={styles.inlineBody}>
                  <Text style={styles.inlineTitle}>{t('profile.subscriptionSub')}</Text>
                  <Text style={styles.inlineText}>
                    Abonimi i klubit menaxhohet nga administratori.
                  </Text>
                </View>
              </>
            ) : null}
          </View>

          {/* Account */}
          <Text style={styles.sectionLabel}>{t('profile.account')}</Text>
          <View style={styles.card}>
            <SettingRow icon="mail" label={t('profile.email')} value={user.email} />
            <View style={styles.divider} />
            <SettingRow icon="person.fill" label={t('profile.role')} value={t(`role.${user.role}`)} />
            <View style={styles.divider} />
            <SettingRow icon="pencil" label={t('profile.editProfile')} value="" onPress={() => setEditOpen(!editOpen)} />
            {editOpen ? (
              <View style={styles.inlineBody}>
                <TextInput
                  style={styles.input}
                  placeholder={t('profile.name')}
                  value={nameDraft}
                  onChangeText={setNameDraft}
                  editable={!editBusy}
                  placeholderTextColor={C.placeholder}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t('profile.email')}
                  value={emailDraft}
                  onChangeText={setEmailDraft}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!editBusy}
                  placeholderTextColor={C.placeholder}
                />
                {emailChanged ? (
                  <TextInput
                    style={styles.input}
                    placeholder={t('profile.currentPassword')}
                    value={editPass}
                    onChangeText={setEditPass}
                    secureTextEntry
                    autoCapitalize="none"
                    editable={!editBusy}
                    placeholderTextColor={C.placeholder}
                  />
                ) : null}
                {editError ? (
                  <Text style={styles.inlineError} accessibilityRole="alert">
                    {editError}
                  </Text>
                ) : null}
                <Pressable style={styles.inlineBtn} onPress={handleEdit} disabled={editBusy}>
                  <Text style={styles.inlineBtnText}>{t('profile.save')}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          {/* Security */}
          <Text style={styles.sectionLabel}>{t('profile.security')}</Text>
          <View style={styles.card}>
            <SettingRow icon="lock" label={t('profile.changePassword')} value="" onPress={() => setSecurityOpen(!securityOpen)} />
            {securityOpen ? (
              <View style={styles.inlineBody}>
                <TextInput
                  style={styles.input}
                  placeholder={t('profile.currentPassword')}
                  value={curPass}
                  onChangeText={setCurPass}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!passBusy}
                  placeholderTextColor={C.placeholder}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t('profile.newPassword')}
                  value={newPass}
                  onChangeText={setNewPass}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!passBusy}
                  placeholderTextColor={C.placeholder}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t('profile.confirmPassword')}
                  value={confirmPass}
                  onChangeText={setConfirmPass}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!passBusy}
                  placeholderTextColor={C.placeholder}
                />
                {passError ? (
                  <Text style={styles.inlineError} accessibilityRole="alert">
                    {passError}
                  </Text>
                ) : null}
                <Pressable style={styles.inlineBtn} onPress={handlePassword} disabled={passBusy}>
                  <Text style={styles.inlineBtnText}>{t('profile.save')}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          {/* Preferences */}
          <Text style={styles.sectionLabel}>{t('profile.preferences')}</Text>
          <View style={styles.card}>
            <SettingRow
              icon="gearshape.fill"
              label={t('profile.theme')}
              value={isDark ? t('profile.darkMint') : t('profile.lightMint')}
              onPress={toggleTheme}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="globe"
              label={t('profile.language')}
              value={lang === 'en' ? t('profile.english') : t('profile.albanian')}
              onPress={() => setLang(lang === 'en' ? 'sq' : 'en')}
            />
          </View>

          {/* About */}
          <Text style={styles.sectionLabel}>{t('profile.about')}</Text>
          <View style={styles.card}>
            <SettingRow icon="info" label={t('profile.app')} value="goalhub" />
            <View style={styles.divider} />
            <SettingRow icon="doc.text.fill" label={t('profile.version')} value={VERSION} />
          </View>

          {/* Delete account */}
          <Text style={styles.sectionLabel}>{t('profile.deleteAccount')}</Text>
          <View style={styles.card}>
            {confirmingDelete ? (
              <View style={styles.inlineBody}>
                <Text style={styles.inlineTitle}>{t('profile.deleteConfirm')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder={t('profile.currentPassword')}
                  value={deletePass}
                  onChangeText={setDeletePass}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!deleteBusy}
                  placeholderTextColor={C.placeholder}
                />
                {deleteError ? (
                  <Text style={styles.inlineError} accessibilityRole="alert">
                    {deleteError}
                  </Text>
                ) : null}
                <Pressable
                  style={[styles.dangerBtn, deleteBusy && styles.rowDisabled]}
                  onPress={handleDelete}
                  disabled={deleteBusy}
                >
                  <Text style={styles.dangerBtnText}>
                    {deleteBusy ? '…' : t('profile.deleteAccount')}
                  </Text>
                </Pressable>
                <Pressable style={styles.cancelBtn} onPress={closeDelete} disabled={deleteBusy}>
                  <Text style={styles.cancelBtnText}>{t('profile.cancel')}</Text>
                </Pressable>
              </View>
            ) : (
              <SettingRow icon="trash" label={t('profile.deleteAccount')} value="" onPress={() => setConfirmingDelete(true)} />
            )}
          </View>

          {/* Sign out */}
          <Pressable style={styles.signOut} onPress={handleSignOut}>
            <IconSymbol name="logout" size={18} color={C.white} />
            <Text style={styles.signOutText}>{t('profile.signOut')}</Text>
          </Pressable>
          <Text style={styles.footnote}>
            {t('profile.footnote')}
          </Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SettingRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: IconSymbolName;
  label: string;
  value: string;
  onPress?: () => void;
}) {
  const row = (
    <>
      <IconSymbol name={icon} size={20} color={C.text} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
      {onPress ? <IconSymbol name="chevron.right" size={16} color={C.gray} /> : null}
    </>
  );
  if (onPress) {
    return (
      <Pressable style={({ pressed }) => [styles.row, pressed && { opacity: 0.6 }]} onPress={onPress}>
        {row}
      </Pressable>
    );
  }
  return <View style={styles.row}>{row}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 27,
    paddingTop: 2,
    paddingBottom: 4,
  },
  title: {
    fontFamily: Fonts.bodyBold,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.3,
    color: C.text,
    textTransform: 'lowercase',
  },
  content: {
    paddingHorizontal: 27,
    paddingBottom: 46,
  },
  profile: {
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    marginBottom: 6,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.cardBorder,
  },
  avatarText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 26,
  },
  name: {
    fontFamily: Fonts.bodyBold,
    fontSize: 22,
    lineHeight: 27,
    color: C.text,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  roleDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 17,
    color: C.gray,
  },
  sectionLabel: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: C.section,
    marginTop: 18,
    marginBottom: 8,
  },
  card: {
    backgroundColor: C.card,
    borderColor: C.cardBorder,
    borderWidth: 2,
    borderRadius: 5,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 54,
    paddingVertical: 10,
  },
  rowLabel: {
    flex: 1,
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    lineHeight: 19,
    color: C.text,
  },
  rowValue: {
    flexShrink: 1,
    maxWidth: '46%',
    textAlign: 'right',
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 17,
    color: C.gray,
  },
  divider: {
    height: 2,
    backgroundColor: C.divider,
  },
  inlineBody: {
    gap: 8,
    paddingVertical: 14,
  },
  inlineTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    lineHeight: 17,
    color: C.text,
  },
  inlineText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 16,
    color: C.gray,
  },
  inlineError: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    lineHeight: 16,
    color: C.red,
  },
  inlineBtn: {
    marginTop: 4,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.green,
    borderRadius: 3,
  },
  inlineBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: C.white,
  },
  input: {
    height: 42,
    fontFamily: Fonts.body,
    fontSize: 13,
    color: C.text,
    backgroundColor: 'transparent',
    borderColor: C.line,
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 10,
  },
  dangerBtn: {
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.red,
    borderRadius: 3,
  },
  dangerBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: C.white,
  },
  rowDisabled: {
    opacity: 0.6,
  },
  cancelBtn: {
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderColor: C.line,
    borderWidth: 1,
    borderRadius: 3,
  },
  cancelBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: C.text,
  },
  signOut: {
    marginTop: 22,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: C.red,
    borderRadius: 5,
  },
  signOutText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
    lineHeight: 21,
    color: C.white,
  },
  footnote: {
    fontFamily: Fonts.body,
    fontSize: 11.5,
    lineHeight: 15,
    color: C.gray,
    textAlign: 'center',
    marginTop: 12,
  },
  signedOut: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 32,
  },
  signedOutTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 22,
    lineHeight: 27,
    color: C.text,
    textTransform: 'lowercase',
  },
  signedOutSub: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 19,
    color: C.gray,
    textAlign: 'center',
  },
  primary: {
    marginTop: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: C.green,
    borderRadius: 5,
  },
  primaryText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: C.white,
  },

  /* Linked child — the parent's one-row card. */
  childRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  childTile: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EFE6F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  childInitials: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: '#7B4F8E',
  },
  childBody: {
    flex: 1,
    gap: 2,
  },
  childName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    lineHeight: 19,
    color: C.text,
  },
  childSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 16,
    color: C.gray,
  },
  pressed: {
    opacity: 0.5,
  },
});
