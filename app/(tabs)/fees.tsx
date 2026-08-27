import { useRouter } from 'expo-router';
import { StatusChip, type StatusTone } from '@/components/status-chip';
import { InitialsTile, ListRow } from '@/components/list-row';
import { ListScreen } from '@/components/list-screen';
import { applyFeeOverrides, feesForRole, type FeeOverride, type FeeStatus } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { usePersistedState } from '@/lib/storage';

const STATUS_TONE: Record<FeeStatus, StatusTone> = {
  paid: 'emerald',
  unpaid: 'warning',
  delayed: 'purple',
  critical: 'danger',
};

export default function FeesScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useSession();
  const role = user?.role ?? 'administrator';
  const [overrides] = usePersistedState<Record<string, FeeOverride>>('payments:overrides', {});
  const fees = applyFeeOverrides(feesForRole(role), overrides);
  const title =
    role === 'player'
      ? t('fees.title.player')
      : role === 'parent'
        ? t('fees.title.parent')
        : t('fees.title.member');
  const subtitle =
    role === 'player' || role === 'parent'
      ? t('fees.subtitle.mine')
      : t('fees.subtitle.all', { count: fees.length });

  return (
    <ListScreen back
      icon="dollarsign.circle.fill"
      accent="#2fbf71"
      title={title}
      subtitle={subtitle}
      searchable
      searchPlaceholder={t('fees.search')}
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
              label={t(`status.${f.status}`)}
              tone={STATUS_TONE[f.status]}
            />
          }
          onPress={() => router.push(`/fee?id=${f.id}`)}
        />
      )}
      actionLabel={role === 'administrator' || role === 'financier' ? t('fees.financeOverview') : undefined}
      onAction={() => router.push('/finance')}
    />
  );
}
