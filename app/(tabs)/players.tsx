import { StatusChip, type StatusTone } from '@/components/status-chip';
import { ListRow, InitialsTile } from '@/components/list-row';
import { ListScreen } from '@/components/list-screen';
import { ALL_PLAYERS, type Health } from '@/lib/data';

const HEALTH_TONE: Record<Health, StatusTone> = {
  active: 'emerald',
  injured: 'danger',
  rehabilitation: 'warning',
  suspended: 'muted',
};

const HEALTH_LABEL: Record<Health, string> = {
  active: 'active',
  injured: 'injured',
  rehabilitation: 'rehab',
  suspended: 'suspended',
};

export default function PlayersScreen() {
  return (
    <ListScreen
      icon="person.2.fill"
      accent="#B0E4CC"
      title="players"
      subtitle={`${ALL_PLAYERS.length} registered · FC Prishtina`}
      searchable
      searchPlaceholder="Search by name or position…"
      items={ALL_PLAYERS}
      itemKey={(p) => p.id}
      searchKeys={(p) => `${p.name} ${p.position} ${p.number}`}
      renderItem={(p) => (
        <ListRow
          title={p.name}
          subtitle={`${p.position} · No. ${p.number} · ★ ${p.rating.toFixed(1)}`}
          leading={<InitialsTile initials={p.initials} color={p.color} />}
          trailing={<StatusChip label={HEALTH_LABEL[p.health]} tone={HEALTH_TONE[p.health]} />}
          onPress={() => alert(`${p.name} — profile coming soon`)}
        />
      )}
      actionLabel="add player"
      onAction={() => alert('Add player — coming soon')}
    />
  );
}
