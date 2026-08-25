import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { InitialsTile, ListRow } from '@/components/list-row';
import { ListScreen } from '@/components/list-screen';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useLanguage } from '@/lib/i18n';
import { ALL_GROUPS, ALL_PLAYERS, type Group } from '@/lib/data';
import { usePersistedState } from '@/lib/storage';

const GROUP_TYPES = ['Position group', 'Specialist', 'Age group'];
const GROUP_COLORS = ['#f5a623', '#5aa7e6', '#86C2A4', '#534AB7', '#408A71'];

function NewGroupForm({ onDone }: { onDone: (g: Group) => void }) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [type, setType] = useState<string>(GROUP_TYPES[0]);
  const [memberIds, setMemberIds] = useState<string[]>([]);

  const toggleMember = (id: string) =>
    setMemberIds((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));

  const submit = () => {
    if (!name.trim()) {
      alert(t('groups.alertName'));
      return;
    }
    if (memberIds.length === 0) {
      alert(t('groups.alertMember'));
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
      <Text style={styles.fieldLabel}>{t('groups.nameLabel')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('groups.namePlaceholder')}
        placeholderTextColor={Colors.textMuted}
        value={name}
        onChangeText={setName}
        autoCorrect={false}
      />
      <Text style={styles.fieldLabel}>{t('groups.typeLabel')}</Text>
      <View style={styles.wrap}>
        {GROUP_TYPES.map((ty) => {
          const selected = type === ty;
          return (
            <Pressable
              key={ty}
              onPress={() => setType(ty)}
              style={[styles.chip, selected && styles.chipActive]}>
              <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                {t(`group.type.${ty}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.fieldLabel}>{t('groups.membersLabel')}</Text>
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
        <Text style={styles.submitBtnText}>{t('groups.createGroup')}</Text>
      </Pressable>
    </View>
  );
}

export default function GroupsScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [groups, setGroups] = usePersistedState<Group[]>('groups:list', ALL_GROUPS);

  return (
    <ListScreen back
      icon="person.2.fill"
      accent={Colors.purple}
      title={t('groups.title')}
      subtitle={t('groups.subtitle')}
      searchable
      searchPlaceholder={t('groups.search')}
      searchKeys={(g) => `${g.name} ${g.type} ${g.members.map((m) => m.name).join(' ')}`}
      items={groups}
      itemKey={(g) => g.id}
      actionLabel={t('groups.createGroup')}
      actionForm={(close) => (
        <NewGroupForm
          onDone={(g) => {
            setGroups((prev) => [g, ...prev]);
            close();
            alert(t('groups.alertCreated', { name: g.name, count: g.members.length }));
          }}
        />
      )}
      renderItem={(g) => (
        <ListRow
          title={g.name}
          subtitle={`${t(`group.type.${g.type}`)} · ${g.members.length} ${t(g.members.length === 1 ? 'common.player' : 'common.players')}`}
          leading={<InitialsTile initials={g.name.slice(0, 2).toUpperCase()} color={g.color} />}
          onPress={() => router.push(`/group?id=${g.id}`)}
        />
      )}
      emptyText={t('groups.empty')}
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
