import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { InitialsTile, ListRow } from '@/components/list-row';
import { Screen, DetailHead, SectionLabel } from '@/components/screen';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { ALL_USERS, type AppUser } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';
import { type Role } from '@/lib/session';
import { usePersistedState } from '@/lib/storage';
import { useTheme, useThemedStyles } from '@/lib/theme';

const ROLE_COLOR: Record<Role, string> = {
  administrator: '#1a9e5c',
  trainer: '#2fbf71',
  player: '#f5a623',
  parent: '#534ab7',
  financier: '#185fa5',
};

const ROLE_FILTERS: (Role | 'all')[] = ['all', 'administrator', 'trainer', 'player', 'parent', 'financier'];

export default function UsersScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { t } = useLanguage();
  const [users, setUsers] = usePersistedState<AppUser[]>('users:list', ALL_USERS);
  const [filter, setFilter] = useState<Role | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newRole, setNewRole] = useState<Role>('player');

  const filtered = useMemo(
    () => (filter === 'all' ? users : users.filter((u) => u.role === filter)),
    [users, filter],
  );

  const toggleActive = (id: string) =>
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, active: !u.active } : u)));

  const addUser = () => {
    if (!name.trim() || !email.trim()) {
      alert(t('users.alertName'));
      return;
    }
    const initials = name
      .trim()
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
    setUsers((prev) => [
      ...prev,
      {
        id: `u-${Date.now()}`,
        name: name.trim(),
        initials,
        role: newRole,
        email: email.trim(),
        club: 'FC Prishtina',
        active: true,
        lastLogin: 'never',
      },
    ]);
    setName('');
    setEmail('');
    setShowForm(false);
    alert(t('users.alertAdded', { name: name.trim(), role: t(`role.${newRole}`) }));
  };

  return (
    <Screen back>
      <DetailHead
        icon="person.fill"
        accent="#1a9e5c"
        title={t('users.title')}
        subtitle={t('users.subtitle', { count: users.length })}
      />

      {/* Role filter */}
      <View style={styles.filters}>
        {ROLE_FILTERS.map((r) => (
          <Pressable
            key={r}
            onPress={() => setFilter(r)}
            style={[styles.filterChip, filter === r && styles.filterChipActive]}>
            <Text style={[styles.filterText, filter === r && styles.filterTextActive]}>
              {r === 'all' ? t('users.all') : t(`role.${r}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      {showForm ? (
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>{t('users.newAccount')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('users.fullName')}
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder={t('users.email')}
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.fieldLabel}>{t('users.role')}</Text>
          <View style={styles.wrap}>
            {(Object.keys(ROLE_COLOR) as Role[]).map((r) => {
              const selected = newRole === r;
              return (
                <Pressable
                  key={r}
                  onPress={() => setNewRole(r)}
                  style={[styles.chip, selected && { backgroundColor: ROLE_COLOR[r], borderColor: ROLE_COLOR[r] }]}>
                  <Text style={[styles.chipText, selected && { color: colors.textOnPrimary }]}>
                    {t(`role.${r}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable style={styles.submitBtn} onPress={addUser}>
            <IconSymbol name="plus" size={16} color={colors.textOnPrimary} />
            <Text style={styles.submitBtnText}>{t('users.createAccount')}</Text>
          </Pressable>
        </View>
      ) : null}

      <SectionLabel>
        {filter === 'all' ? t('users.sectionAll') : t('users.sectionRole', { role: t(`role.${filter}`) })}
      </SectionLabel>
      <View style={styles.list}>
        {filtered.map((u) => (
          <ListRow
            key={u.id}
            title={u.name}
            subtitle={t('users.rowMeta', { email: u.email, lastLogin: u.lastLogin })}
            leading={<InitialsTile initials={u.initials} color={ROLE_COLOR[u.role]} />}
            trailing={
              <View style={styles.trailing}>
                <View style={[styles.roleChip, { borderColor: `${ROLE_COLOR[u.role]}55` }]}>
                  <View style={[styles.roleDot, { backgroundColor: ROLE_COLOR[u.role] }]} />
                  <Text style={[styles.roleText, { color: ROLE_COLOR[u.role] }]}>
                    {t(`role.${u.role}`)}
                  </Text>
                </View>
                <Pressable onPress={() => toggleActive(u.id)} hitSlop={8}>
                  <Text style={[styles.activeText, { color: u.active ? colors.emerald : colors.textMuted }]}>
                    {t(u.active ? 'users.active' : 'users.inactive')}
                  </Text>
                </Pressable>
              </View>
            }
            onPress={() => router.push(`/user?id=${u.id}`)}
          />
        ))}
      </View>

      <Pressable style={styles.action} onPress={() => setShowForm((s) => !s)}>
        <IconSymbol name={showForm ? 'xmark' : 'plus'} size={18} color={colors.textOnPrimary} />
        <Text style={styles.actionText}>{showForm ? t('common.closeForm') : t('users.addUser')}</Text>
      </Pressable>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  filterChip: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 7,
    paddingHorizontal: Spacing.md,
    backgroundColor: colors.surface,
  },
  filterChipActive: {
    backgroundColor: colors.mint,
    borderColor: colors.mint,
  },
  filterText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'lowercase',
  },
  filterTextActive: {
    color: colors.textOnPrimary,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    color: colors.text,
    fontFamily: Fonts.body,
    fontSize: 14,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    backgroundColor: colors.surfaceAlt,
  },
  chipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'lowercase',
  },
  submitBtn: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
  },
  submitBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textOnPrimary,
    textTransform: 'lowercase',
  },
  list: {
    gap: Spacing.md,
  },
  trailing: {
    alignItems: 'flex-end',
    gap: 6,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  roleDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  roleText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  activeText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    textTransform: 'lowercase',
  },
  action: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
  },
  actionText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textOnPrimary,
    textTransform: 'lowercase',
  },
});
