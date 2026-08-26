import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InitialsTile, ListRow } from '@/components/list-row';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_PLAYERS } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { usePersistedState } from '@/lib/storage';

const VERSION = '1.0.0';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, updateProfile } = useSession();
  const { t, lang, setLang } = useLanguage();
  const [childName] = usePersistedState<string>('parent:selectedChild', 'Agon Gashi');

  const [subOpen, setSubOpen] = useState(false);
  const [securityOpen, setSecurityOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [curPass, setCurPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [nameDraft, setNameDraft] = useState('');
  const [emailDraft, setEmailDraft] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const child = ALL_PLAYERS.find((p) => p.name === childName);

  const handleSignOut = () => {
    signOut();
    router.replace('/login');
  };

  const handlePassword = () => {
    if (newPass && newPass === confirmPass) {
      alert(t('profile.passwordUpdated'));
      setSecurityOpen(false);
      setCurPass('');
      setNewPass('');
      setConfirmPass('');
    } else {
      alert(t('profile.passwordMismatch'));
    }
  };

  const handleEdit = () => {
    if (!user) return;
    updateProfile({
      name: nameDraft.trim() || user.name,
      email: emailDraft.trim() || user.email,
    });
    setEditOpen(false);
    setNameDraft('');
    setEmailDraft('');
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
                title={child.name}
                subtitle={t('common.personMeta', {
                  position: child.position,
                  number: child.number,
                  age: child.age,
                })}
                leading={<InitialsTile initials={child.initials} color={child.color} />}
                onPress={() => router.push('/child')}
              />
            </>
          ) : null}

          {/* Subscription */}
          <Text style={styles.sectionLabel}>{t('profile.subscription')}</Text>
          <View style={styles.card}>
            <SettingRow
              icon="verified-user"
              label={t('profile.subscription')}
              value="Club Pro · active"
              onPress={() => setSubOpen(!subOpen)}
            />
            {subOpen ? (
              <>
                <View style={styles.divider} />
                <View style={styles.inlineBody}>
                  <Text style={styles.inlineTitle}>{t('profile.subscriptionSub')}</Text>
                  <Text style={styles.inlineText}>{t('profile.plan')}</Text>
                  <Text style={styles.inlineText}>{t('profile.renews', { date: 'Sep 1, 2026' })}</Text>
                  <Pressable style={styles.inlineBtn} onPress={() => alert(t('profile.manageDemo'))}>
                    <Text style={styles.inlineBtnText}>{t('profile.manage')}</Text>
                  </Pressable>
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
                  placeholderTextColor={Colors.textMuted}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t('profile.email')}
                  value={emailDraft}
                  onChangeText={setEmailDraft}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholderTextColor={Colors.textMuted}
                />
                <Pressable style={styles.inlineBtn} onPress={handleEdit}>
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
                  placeholderTextColor={Colors.textMuted}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t('profile.newPassword')}
                  value={newPass}
                  onChangeText={setNewPass}
                  secureTextEntry
                  placeholderTextColor={Colors.textMuted}
                />
                <TextInput
                  style={styles.input}
                  placeholder={t('profile.confirmPassword')}
                  value={confirmPass}
                  onChangeText={setConfirmPass}
                  secureTextEntry
                  placeholderTextColor={Colors.textMuted}
                />
                <Pressable style={styles.inlineBtn} onPress={handlePassword}>
                  <Text style={styles.inlineBtnText}>{t('profile.save')}</Text>
                </Pressable>
              </View>
            ) : null}
          </View>

          {/* Preferences */}
          <Text style={styles.sectionLabel}>{t('profile.preferences')}</Text>
          <View style={styles.card}>
            <SettingRow icon="gearshape.fill" label={t('profile.theme')} value={t('profile.darkMint')} />
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
            <IconSymbol name="logout" size={18} color={Colors.danger} />
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
      <IconSymbol name={icon} size={18} color={Colors.textMuted} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
      {onPress ? <IconSymbol name="chevron.right" size={16} color={Colors.textMuted} /> : null}
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
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 26,
    color: Colors.mint,
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
    color: Colors.mint,
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
    color: Colors.textMuted,
  },
  sectionLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.emerald,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
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
    color: Colors.textSecondary,
  },
  rowValue: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.text,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.borderSoft,
  },
  inlineBody: {
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  inlineTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.text,
  },
  inlineText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },
  inlineBtn: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
  },
  inlineBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.textOnPrimary,
    textTransform: 'lowercase',
  },
  input: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.danger,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
  },
  dangerBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.textOnPrimary,
    textTransform: 'lowercase',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
  },
  cancelBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.textSecondary,
    textTransform: 'lowercase',
  },
  signOut: {
    marginTop: Spacing.xxl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: `${Colors.danger}1a`,
    borderColor: `${Colors.danger}55`,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
  },
  signOutText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.danger,
  },
  footnote: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
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
    color: Colors.mint,
    textTransform: 'lowercase',
  },
  signedOutSub: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  primary: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  primaryText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.textOnPrimary,
  },
});
