import { Fragment, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { InitialsTile, ListRow } from '@/components/list-row';
import { ListScreen } from '@/components/list-screen';
import { Colors, Fonts, Spacing } from '@/constants/theme';
import { ALL_GROUPS } from '@/lib/data';

export default function GroupsScreen() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <ListScreen
      icon="person.2.fill"
      accent={Colors.purple}
      title="groups"
      subtitle="squad groups for sessions & messages"
      searchable
      searchPlaceholder="Search groups…"
      searchKeys={(g) => `${g.name} ${g.type} ${g.members.map((m) => m.name).join(' ')}`}
      items={ALL_GROUPS}
      itemKey={(g) => g.id}
      actionLabel="create group"
      onAction={() => alert('Create group — coming soon')}
      renderItem={(g) => {
        const expanded = expandedId === g.id;
        return (
          <Fragment>
            <ListRow
              title={g.name}
              subtitle={`${g.type} · ${g.members.length} player${g.members.length === 1 ? '' : 's'}`}
              leading={<InitialsTile initials={g.name.slice(0, 2).toUpperCase()} color={g.color} />}
              onPress={() => setExpandedId(expanded ? null : g.id)}
            />
            {expanded ? (
              <View style={styles.members}>
                <Text style={styles.membersLabel}>members</Text>
                {g.members.map((m) => (
                  <View key={m.initials} style={styles.memberRow}>
                    <InitialsTile initials={m.initials} color={m.color} size={34} />
                    <Text style={styles.memberName}>{m.name}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </Fragment>
        );
      }}
      emptyText="No groups match that search."
    />
  );
}

const styles = StyleSheet.create({
  members: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  membersLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginBottom: 2,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  memberName: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text,
  },
});
