import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { InitialsTile, ListRow } from '@/components/list-row';
import { ListScreen } from '@/components/list-screen';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_GROUPS, ALL_PLAYERS, type Group } from '@/lib/data';
import { usePersistedState } from '@/lib/storage';

const GROUP_TYPES = ['Position group', 'Specialist', 'Age group'];
const GROUP_COLORS = ['#f5a623', '#5aa7e6', '#86C2A4', '#534AB7', '#408A71'];

function NewGroupForm({ onDone }: { onDone: (g: Group) => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<string>(GROUP_TYPES[0]);
  const [memberIds, setMemberIds] = useState<string[]>([]);

  const toggleMember = (id: string) =>
    setMemberIds((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));

  const submit = () => {
    if (!name.trim()) {
      alert('Enter a group name.');
      return;
    }
    if (memberIds.length === 0) {
      alert('Select at least one member.');
      return;
    }
    const members = ALL_PLAYERS.filter((p) => memberIds.includes(p.id)).map((p) => ({
      initials: p.initials,
      color: p.color,
      name: p.name,
    }));
    onDone({
      id: `g-${Date.now()}`,
      name: name.trim(),
      type,
      color: GROUP_COLORS[memberIds.length % GROUP_COLORS.length],
      members,
    });
  };

  return (
    <View style={styles.formCard}>
      <Text style={styles.fieldLabel}>group name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Set-piece takers"
        placeholderTextColor={Colors.textMuted}
        value={name}
        onChangeText={setName}
        autoCorrect={false}
      />
      <Text style={styles.fieldLabel}>type</Text>
      <View style={styles.wrap}>
        {GROUP_TYPES.map((t) => {
          const selected = type === t;
          return (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              style={[styles.chip, selected && styles.chipActive]}>
              <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                {t.toLowerCase()}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.fieldLabel}>members · tap to select</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerRow}>
        {ALL_PLAYERS.map((p) => {
          const selected = memberIds.includes(p.id);
          return (
            <Pressable
              key={p.id}
              onPress={() => toggleMember(p.id)}
              style={[styles.memberChip, selected && styles.memberChipActive]}>
              <InitialsTile initials={p.initials} color={p.color} size={28} />
              <Text style={[styles.memberChipText, selected && styles.memberChipTextActive]}>
                {p.name.split(' ')[0]}
              </Text>
              {selected ? (
                <IconSymbol name="checkmark.circle.fill" size={14} color={Colors.textOnPrimary} />
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
      <Pressable style={styles.submitBtn} onPress={submit}>
        <IconSymbol name="plus" size={16} color={Colors.textOnPrimary} />
        <Text style={styles.submitBtnText}>create group</Text>
      </Pressable>
    </View>
  );
}

export default function GroupsScreen() {
  const router = useRouter();
  const [groups, setGroups] = usePersistedState<Group[]>('groups:list', ALL_GROUPS);

  return (
    <ListScreen
      icon="person.2.fill"
      accent={Colors.purple}
      title="groups"
      subtitle="squad groups for sessions & messages"
      searchable
      searchPlaceholder="Search groups…"
      searchKeys={(g) => `${g.name} ${g.type} ${g.members.map((m) => m.name).join(' ')}`}
      items={groups}
      itemKey={(g) => g.id}
      actionLabel="create group"
      actionForm={(close) => (
        <NewGroupForm
          onDone={(g) => {
            setGroups((prev) => [g, ...prev]);
            close();
            alert(`"${g.name}" created with ${g.members.length} members.`);
          }}
        />
      )}
      renderItem={(g) => (
        <ListRow
          title={g.name}
          subtitle={`${g.type} · ${g.members.length} player${g.members.length === 1 ? '' : 's'}`}
          leading={<InitialsTile initials={g.name.slice(0, 2).toUpperCase()} color={g.color} />}
          onPress={() => router.push(`/group?id=${g.id}`)}
        />
      )}
      emptyText="No groups match that search."
    />
  );
}

const styles = StyleSheet.create({
  formCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  fieldLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  input: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    color: Colors.text,
    fontFamily: Fonts.body,
    fontSize: 14,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceAlt,
  },
  chipActive: {
    backgroundColor: Colors.mint,
    borderColor: Colors.mint,
  },
  chipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'lowercase',
  },
  chipTextActive: {
    color: Colors.textOnPrimary,
  },
  pickerRow: {
    gap: Spacing.sm,
    paddingVertical: 2,
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm + 2,
  },
  memberChipActive: {
    backgroundColor: Colors.mint,
    borderColor: Colors.mint,
  },
  memberChipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.text,
  },
  memberChipTextActive: {
    color: Colors.textOnPrimary,
  },
  submitBtn: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
  },
  submitBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.textOnPrimary,
    textTransform: 'lowercase',
  },
});
