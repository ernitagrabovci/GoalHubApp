import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { InitialsTile, ListRow } from '@/components/list-row';
import { Screen, DetailHead, SectionLabel } from '@/components/screen';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_USERS, type AppUser } from '@/lib/data';
import { ROLE_LABELS, type Role } from '@/lib/session';

const ROLE_COLOR: Record<Role, string> = {
  administrator: '#1a9e5c',
  trainer: '#2fbf71',
  player: '#f5a623',
  parent: '#534ab7',
  financier: '#185fa5',
};

const ROLE_FILTERS: (Role | 'all')[] = ['all', 'administrator', 'trainer', 'player', 'parent', 'financier'];

export default function UsersScreen() {
  const router = useRouter();
  const [users, setUsers] = useState<AppUser[]>(ALL_USERS);
  const [filter, setFilter] = useState<Role | 'all'>('all');

  const filtered = useMemo(
    () => (filter === 'all' ? users : users.filter((u) => u.role === filter)),
    [users, filter],
  );

  const toggleActive = (id: string) =>
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, active: !u.active } : u)));

  return (
    <Screen>
      <DetailHead
        icon="person.fill"
        accent="#1a9e5c"
        title="users"
        subtitle={`${users.length} accounts · manage roles & access`}
      />

      {/* Role filter */}
      <View style={styles.filters}>
        {ROLE_FILTERS.map((r) => (
          <Pressable
            key={r}
            onPress={() => setFilter(r)}
            style={[styles.filterChip, filter === r && styles.filterChipActive]}>
            <Text style={[styles.filterText, filter === r && styles.filterTextActive]}>
              {r === 'all' ? 'all' : ROLE_LABELS[r]}
            </Text>
          </Pressable>
        ))}
      </View>

      <SectionLabel>{filter === 'all' ? 'accounts' : ROLE_LABELS[filter]} users</SectionLabel>
      <View style={styles.list}>
        {filtered.map((u) => (
          <ListRow
            key={u.id}
            title={u.name}
            subtitle={`${u.email} · active ${u.lastLogin}`}
            leading={<InitialsTile initials={u.initials} color={ROLE_COLOR[u.role]} />}
            trailing={
              <View style={styles.trailing}>
                <View style={[styles.roleChip, { borderColor: `${ROLE_COLOR[u.role]}55` }]}>
                  <View style={[styles.roleDot, { backgroundColor: ROLE_COLOR[u.role] }]} />
                  <Text style={[styles.roleText, { color: ROLE_COLOR[u.role] }]}>
                    {ROLE_LABELS[u.role]}
                  </Text>
                </View>
                <Pressable onPress={() => toggleActive(u.id)} hitSlop={8}>
                  <Text style={[styles.activeText, { color: u.active ? Colors.emerald : Colors.textMuted }]}>
                    {u.active ? 'active' : 'inactive'}
                  </Text>
                </Pressable>
              </View>
            }
            onPress={() => router.push(`/user?id=${u.id}`)}
          />
        ))}
      </View>

      <Pressable style={styles.action} onPress={() => alert('Add user — coming soon')}>
        <IconSymbol name="plus" size={18} color={Colors.textOnPrimary} />
        <Text style={styles.actionText}>add user</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  filterChip: {
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 7,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
  },
  filterChipActive: {
    backgroundColor: Colors.mint,
    borderColor: Colors.mint,
  },
  filterText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'lowercase',
  },
  filterTextActive: {
    color: Colors.textOnPrimary,
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
    backgroundColor: Colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
  },
  actionText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.textOnPrimary,
    textTransform: 'lowercase',
  },
});
