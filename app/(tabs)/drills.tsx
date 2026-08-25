import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { IconTile, ListRow } from '@/components/list-row';
import { ListScreen } from '@/components/list-screen';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { type Drill } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';
import { drillsStore, useCollection } from '@/lib/store';

const GENERATED_POOL: Omit<Drill, 'id'>[] = [
  { title: 'Pressing 5v5', category: 'Tactical', level: 'advanced', duration: '20 min', players: '10–15', focus: 'Counter-pressing', color: '#8f86e8' },
  { title: 'Through-ball patterns', category: 'Possession', level: 'intermediate', duration: '18 min', players: '8–12', focus: 'Final-third entries', color: '#B0E4CC' },
  { title: 'Acceleration bursts', category: 'Fitness', level: 'beginner', duration: '15 min', players: 'Whole team', focus: 'First-step speed', color: '#5aa7e6' },
  { title: 'Overlap & cross', category: 'Tactical', level: 'advanced', duration: '22 min', players: '10–14', focus: 'Wide overloads', color: '#f5a623' },
  { title: 'Rondo 5v2 keep-ball', category: 'Possession', level: 'beginner', duration: '14 min', players: '8–10', focus: 'Quick ball circulation', color: '#B0E4CC' },
  { title: 'High press triggers', category: 'Tactical', level: 'advanced', duration: '24 min', players: '9–14', focus: 'Coordinated first wave', color: '#2fbf71' },
  { title: 'Combination finishing', category: 'Shooting', level: 'intermediate', duration: '20 min', players: '10–16', focus: 'One-touch finishing', color: '#E24B4A' },
  { title: 'Positional rotation', category: 'Possession', level: 'advanced', duration: '26 min', players: '11–18', focus: 'Rotation in the build-up', color: '#5aa7e6' },
  { title: 'Tempo transition sprints', category: 'Fitness', level: 'intermediate', duration: '16 min', players: 'Whole team', focus: 'Recovery + acceleration', color: '#f5a623' },
  { title: 'Crossing & heading', category: 'Shooting', level: 'intermediate', duration: '18 min', players: '10–14', focus: 'Delivery + near-post runs', color: '#8f86e8' },
];

const LEVEL_COLOR: Record<Drill['level'], string> = {
  beginner: '#2fbf71',
  intermediate: '#5aa7e6',
  advanced: '#f5a623',
};

export default function DrillsScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const drills = useCollection(drillsStore);

  const generate = () => {
    const tpl = GENERATED_POOL[Math.floor(Math.random() * GENERATED_POOL.length)];
    const drill: Drill = { ...tpl, id: `gen-${Date.now()}` };
    drillsStore.prepend(drill);
  };

  return (
    <ListScreen back
      icon="fitness-center"
      accent={Colors.info}
      title={t('drills.title')}
      subtitle={t('drills.subtitle')}
      searchable
      searchPlaceholder={t('drills.search')}
      searchKeys={(d) => `${d.title} ${d.category} ${d.focus}`}
      items={drills}
      itemKey={(d) => d.id}
      actionLabel={t('drills.action')}
      onAction={generate}
      renderItem={(d) => (
        <ListRow
          title={d.title}
          subtitle={`${t(`category.${d.category}`)} · ${d.focus}`}
          leading={<IconTile icon="fitness-center" color={d.color} />}
          trailing={
            <View style={styles.trailing}>
              <Text style={styles.duration}>{d.duration}</Text>
              <View style={[styles.levelChip, { backgroundColor: `${LEVEL_COLOR[d.level]}1a`, borderColor: `${LEVEL_COLOR[d.level]}45` }]}>
                <Text style={[styles.levelText, { color: LEVEL_COLOR[d.level] }]}>{t(`level.${d.level}`)}</Text>
              </View>
            </View>
          }
          onPress={() => router.push(`/drill?id=${d.id}`)}
        />
      )}
      emptyText={t('drills.empty')}
    />
  );
}

const styles = StyleSheet.create({
  trailing: {
    alignItems: 'flex-end',
    gap: 6,
  },
  duration: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.text,
  },
  levelChip: {
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  levelText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
