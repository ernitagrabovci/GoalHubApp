import { useRouter } from 'expo-router';
import { StatusChip, type StatusTone } from '@/components/status-chip';
import { InitialsTile, ListRow } from '@/components/list-row';
import { ListScreen } from '@/components/list-screen';
import { feesForRole, type FeeStatus } from '@/lib/data';
import { useSession } from '@/lib/session';

const STATUS_TONE: Record<FeeStatus, StatusTone> = {
  paid: 'emerald',
  unpaid: 'warning',
  delayed: 'purple',
  critical: 'danger',
};

export default function FeesScreen() {
  const router = useRouter();
  const { user } = useSession();
  const role = user?.role ?? 'administrator';
  const fees = feesForRole(role);
  const title =
    role === 'player' ? 'my fees' : role === 'parent' ? "child's fees" : 'membership fees';
  const subtitle =
    role === 'player' || role === 'parent'
      ? 'Your monthly club quota'
      : `${fees.length} entries · September · FC Prishtina`;

  return (
    <ListScreen back
      icon="dollarsign.circle.fill"
      accent="#2fbf71"
      title={title}
      subtitle={subtitle}
      searchable
      searchPlaceholder="Search by member or month…"
      items={fees}
      itemKey={(f) => f.id}
      searchKeys={(f) => `${f.name} ${f.month}`}
      renderItem={(f) => (
        <ListRow
          title={f.name}
          subtitle={`${f.month} · ${f.amount}`}
          leading={<InitialsTile initials={f.initials} color={f.color} />}
          trailing={
            <StatusChip
              label={f.status}
              tone={STATUS_TONE[f.status]}
            />
          }
          onPress={() => router.push(`/fee?id=${f.id}`)}
        />
      )}
      actionLabel={role === 'administrator' || role === 'financier' ? 'finance overview' : undefined}
      onAction={() => router.push('/finance')}
    />
  );
}
