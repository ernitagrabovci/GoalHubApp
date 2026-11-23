import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { Tactical } from '@/constants/tactical-theme';
import type { Phase } from '@/lib/tactical/types';

type Props = {
  phases: Phase[];
  current: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onDelete: (index: number) => void;
};

export function PhaseStrip({ phases, current, onSelect, onAdd, onDelete }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.bar}
      contentContainerStyle={styles.content}
    >
      {phases.map((phase, i) => {
        const active = i === current;
        return (
          <Pressable
            key={phase.id}
            onPress={() => onSelect(i)}
            onLongPress={() => onDelete(i)}
            delayLongPress={350}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${phase.label}, ${Math.round(phase.duration / 1000)} sekonda`}
            style={({ pressed }) => [
              styles.card,
              active && styles.cardActive,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.title, active && styles.titleActive]} numberOfLines={1}>
              {phase.label}
            </Text>
            <Text style={[styles.sub, active && styles.subActive]}>
              {(phase.duration / 1000).toFixed(1)}s
            </Text>
          </Pressable>
        );
      })}

      <Pressable
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel="Shto fazë"
        style={({ pressed }) => [styles.add, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons name="plus" size={22} color={Tactical.text} />
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexGrow: 0,
  },
  content: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 7,
    alignItems: 'center',
  },
  card: {
    minWidth: 86,
    height: 52,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Tactical.border,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(5,12,24,0.24)',
  },
  cardActive: {
    backgroundColor: Tactical.save,
    borderColor: Tactical.save,
  },
  pressed: {
    opacity: 0.75,
  },
  title: {
    color: Tactical.text,
    fontSize: 13,
    fontWeight: '700',
  },
  titleActive: {
    color: Tactical.saveInk,
  },
  sub: {
    color: Tactical.textFaint,
    fontSize: 10,
    marginTop: 2,
  },
  subActive: {
    color: 'rgba(11,26,6,0.62)',
  },
  add: {
    width: 52,
    height: 52,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Tactical.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
