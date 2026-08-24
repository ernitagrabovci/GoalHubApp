import { StatusChip, type StatusTone } from '@/components/status-chip';
import { InitialsTile, ListRow } from '@/components/list-row';
import { ListScreen } from '@/components/list-screen';
import { ALL_INJURIES } from '@/lib/data';

const STATUS_TONE: Record<string, StatusTone> = {
  injured: 'danger',
  rehabilitation: 'warning',
  recovered: 'emerald',
};

export default function MedicalScreen() {
  return (
    <ListScreen
      icon="stethoscope"
      accent="#E24B4A"
      title="medical"
      subtitle={`${ALL_INJURIES.length} active cases · auto-notified to admin`}
      searchable
      searchPlaceholder="Search by player or injury…"
      items={ALL_INJURIES}
      itemKey={(i) => i.id}
      searchKeys={(i) => `${i.player} ${i.type}`}
      renderItem={(i) => (
        <ListRow
          title={i.player}
          subtitle={`${i.type} · return ${i.expected}`}
          leading={<InitialsTile initials={i.initials} color={i.color} />}
          trailing={<StatusChip label={i.status} tone={STATUS_TONE[i.status]} />}
          onPress={() => alert(`${i.player} — injury record coming soon`)}
        />
      )}
      actionLabel="register injury"
      onAction={() => alert('Register injury — coming soon')}
    />
  );
}
