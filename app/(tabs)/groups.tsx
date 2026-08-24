import { useRouter } from 'expo-router';

import { InitialsTile, ListRow } from '@/components/list-row';
import { ListScreen } from '@/components/list-screen';
import { Colors } from '@/constants/theme';
import { ALL_GROUPS } from '@/lib/data';

export default function GroupsScreen() {
  const router = useRouter();

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
