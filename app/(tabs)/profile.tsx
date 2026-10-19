import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InitialsTile, ListRow } from '@/components/list-row';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Fonts, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { listMyChildren } from '@/lib/api/children';
import { ApiError } from '@/lib/api/errors';
import type { ApiChild } from '@/lib/api/types';
import { positionLabel } from '@/lib/player-position';
import { useLanguage } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { useTheme, useThemedStyles } from '@/lib/theme';

const VERSION = '1.0.0';

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
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useThemedStyles(createStyles);
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

  const handleDelete = () => {
    alert(t('profile.accountDeleted'));
    signOut();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
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
              <ListRow
                title={child.name ?? '—'}
                subtitle={[
                  child.position ? positionLabel(child.position) : null,
                  child.jersey_number != null ? `Nr. ${child.jersey_number}` : null,
                  child.team?.name,
                ]
                  .filter(Boolean)
                  .join(' · ')}
                leading={
                  <InitialsTile
                    initials={(child.name ?? '')
                      .split(' ')
                      .filter(Boolean)
                      .map((word) => word[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                    color="#7B4F8E"
                  />
                }
                onPress={() =>
                  router.push({
                    pathname: '/profili-femiut',
                    params: { id: String(child.id), name: child.name ?? '' },
                  })
                }
              />
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
                  placeholderTextColor={colors.textMuted}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t('profile.email')}
                  value={emailDraft}
                  onChangeText={setEmailDraft}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!editBusy}
                  placeholderTextColor={colors.textMuted}
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
                    placeholderTextColor={colors.textMuted}
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
                  placeholderTextColor={colors.textMuted}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t('profile.newPassword')}
                  value={newPass}
                  onChangeText={setNewPass}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!passBusy}
                  placeholderTextColor={colors.textMuted}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t('profile.confirmPassword')}
                  value={confirmPass}
                  onChangeText={setConfirmPass}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!passBusy}
                  placeholderTextColor={colors.textMuted}
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
                <Pressable style={styles.dangerBtn} onPress={handleDelete}>
                  <Text style={styles.dangerBtnText}>{t('profile.deleteAccount')}</Text>
                </Pressable>
                <Pressable style={styles.cancelBtn} onPress={() => setConfirmingDelete(false)}>
                  <Text style={styles.cancelBtnText}>{t('profile.cancel')}</Text>
                </Pressable>
              </View>
            ) : (
              <SettingRow icon="trash" label={t('profile.deleteAccount')} value="" onPress={() => setConfirmingDelete(true)} />
            )}
          </View>

          {/* Sign out */}
          <Pressable style={styles.signOut} onPress={handleSignOut}>
            <IconSymbol name="logout" size={18} color={colors.danger} />
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
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const row = (
    <>
      <IconSymbol name={icon} size={18} color={colors.textMuted} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
      {onPress ? <IconSymbol name="chevron.right" size={16} color={colors.textMuted} /> : null}
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 26,
    color: colors.mint,
    textTransform: 'lowercase',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  profile: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: Fonts.heading,
    fontSize: 28,
  },
  name: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    color: colors.mint,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  roleDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  sectionLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.emerald,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  rowLabel: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: colors.textSecondary,
  },
  rowValue: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: colors.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderSoft,
  },
  inlineBody: {
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  inlineTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: colors.text,
  },
  inlineText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  inlineError: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: colors.danger,
  },
  inlineBtn: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
  },
  inlineBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textOnPrimary,
    textTransform: 'lowercase',
  },
  input: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
  },
  dangerBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textOnPrimary,
    textTransform: 'lowercase',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
  },
  cancelBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textSecondary,
    textTransform: 'lowercase',
  },
  signOut: {
    marginTop: Spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: `${colors.danger}1a`,
    borderColor: `${colors.danger}55`,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
  },
  signOutText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: colors.danger,
  },
  footnote: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.lg,
  },
  signedOut: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.xxl,
  },
  signedOutTitle: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    color: colors.mint,
    textTransform: 'lowercase',
  },
  signedOutSub: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  primary: {
    marginTop: Spacing.lg,
    backgroundColor: colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  primaryText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textOnPrimary,
  },
});
