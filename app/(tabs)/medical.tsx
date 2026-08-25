import { useRouter } from 'expo-router';

import { StatusChip, type StatusTone } from '@/components/status-chip';
import { InitialsTile, ListRow } from '@/components/list-row';
import { ListScreen } from '@/components/list-screen';
import { useLanguage } from '@/lib/i18n';
import { injuriesStore, useCollection } from '@/lib/store';

const STATUS_TONE: Record<string, StatusTone> = {
  injured: 'danger',
  rehabilitation: 'warning',
  recovered: 'emerald',
};

export default function MedicalScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const injuries = useCollection(injuriesStore);
  const active = injuries.filter((i) => i.status !== 'recovered').length;
  return (
    <ListScreen back
      icon="stethoscope"
      accent="#E24B4A"
      title={t('medical.title')}
      subtitle={t('medical.subtitle', { active })}
      searchable
      searchPlaceholder={t('medical.search')}
      items={injuries}
      itemKey={(i) => i.id}
      searchKeys={(i) => `${i.player} ${i.type}`}
      renderItem={(i) => (
        <ListRow
          title={i.player}
          subtitle={`${i.type} · ${t('injuries.return', { expected: i.expected })}`}
          leading={<InitialsTile initials={i.initials} color={i.color} />}
          trailing={<StatusChip label={t(`health.${i.status}`)} tone={STATUS_TONE[i.status]} />}
          onPress={() => router.push(`/injury?id=${i.id}`)}
        />
      )}
      actionLabel={t('medical.registerInjury')}
      onAction={() => router.push('/injury-create')}
    />
  );
}
