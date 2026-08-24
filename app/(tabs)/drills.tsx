import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { IconTile, ListRow } from '@/components/list-row';
import { ListScreen } from '@/components/list-screen';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { ALL_DRILLS, type Drill } from '@/lib/data';

const GENERATED_POOL: Omit<Drill, 'id'>[] = [
  { title: 'Pressing 5v5', category: 'Tactical', level: 'advanced', duration: '20 min', players: '10–15', focus: 'Counter-pressing', color: '#8f86e8' },
  { title: 'Through-ball patterns', category: 'Possession', level: 'intermediate', duration: '18 min', players: '8–12', focus: 'Final-third entries', color: '#B0E4CC' },
  { title: 'Acceleration bursts', category: 'Fitness', level: 'beginner', duration: '15 min', players: 'Whole team', focus: 'First-step speed', color: '#5aa7e6' },
  { title: 'Overlap & cross', category: 'Tactical', level: 'advanced', duration: '22 min', players: '10–14', focus: 'Wide overloads', color: '#f5a623' },
];

const LEVEL_COLOR: Record<Drill['level'], string> = {
  beginner: '#2fbf71',
  intermediate: '#5aa7e6',
  advanced: '#f5a623',
};

export default function DrillsScreen() {
  const [drills, setDrills] = useState<Drill[]>(ALL_DRILLS);

  const generate = () => {
    const tpl = GENERATED_POOL[Math.floor(Math.random() * GENERATED_POOL.length)];
    const drill: Drill = { ...tpl, id: `gen-${Date.now()}` };
    setDrills((prev) => [drill, ...prev]);
  };

  return (
    <ListScreen
      icon="fitness-center"
      accent={Colors.info}
      title="drills"
      subtitle="your drill library for training sessions"
      searchable
      searchPlaceholder="Search drills…"
      searchKeys={(d) => `${d.title} ${d.category} ${d.focus}`}
      items={drills}
      itemKey={(d) => d.id}
      actionLabel="AI generate drill"
      onAction={generate}
      renderItem={(d) => (
        <ListRow
          title={d.title}
          subtitle={`${d.category} · ${d.focus}`}
          leading={<IconTile icon="fitness-center" color={d.color} />}
          trailing={
            <View style={styles.trailing}>
              <Text style={styles.duration}>{d.duration}</Text>
              <View style={[styles.levelChip, { backgroundColor: `${LEVEL_COLOR[d.level]}1a`, borderColor: `${LEVEL_COLOR[d.level]}45` }]}>
                <Text style={[styles.levelText, { color: LEVEL_COLOR[d.level] }]}>{d.level}</Text>
              </View>
            </View>
          }
        />
      )}
      emptyText="No drills match that search."
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
