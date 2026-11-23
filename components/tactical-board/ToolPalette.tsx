import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Tactical } from '@/constants/tactical-theme';
import type { Tool } from '@/lib/tactical/types';

type Item = {
  tool: Tool;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  tint?: string;
};

/** The reference order and colours. */
const ITEMS: Item[] = [
  { tool: 'select', label: 'Poziciono', icon: 'cursor-default' },
  { tool: 'animate', label: 'Animo', icon: 'play-circle-outline' },
  { tool: 'home', label: 'Shtëpi', icon: 'account', tint: Tactical.home },
  { tool: 'away', label: 'Mysafir', icon: 'account', tint: Tactical.away },
  { tool: 'gk', label: 'Portier', icon: 'account', tint: Tactical.gk },
  { tool: 'cone', label: 'Kon', icon: 'triangle', tint: Tactical.cone },
  { tool: 'coneSmall', label: 'Kon i vogël', icon: 'triangle-outline', tint: Tactical.cone },
  { tool: 'ball', label: 'Top', icon: 'soccer' },
  { tool: 'text', label: 'Tekst', icon: 'format-text' },
  { tool: 'move', label: 'Lëvizje', icon: 'arrow-right' },
  { tool: 'pass', label: 'Pasim', icon: 'arrow-right-thin' },
  { tool: 'line', label: 'Vijë', icon: 'minus' },
  { tool: 'zone', label: 'Zonë', icon: 'vector-square' },
];

type Props = {
  tool: Tool;
  onSelect: (tool: Tool) => void;
  horizontal: boolean;
};

export function ToolPalette({ tool, onSelect, horizontal }: Props) {
  const body = (
    <>
      {ITEMS.map((item) => {
        const active = tool === item.tool;
        const tint = active ? Tactical.selected : item.tint ?? Tactical.white;
        return (
          <Pressable
            key={item.tool}
            onPress={() => onSelect(item.tool)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={item.label}
            style={({ pressed }) => [
              styles.item,
              horizontal ? styles.itemH : styles.itemV,
              active && styles.itemActive,
              pressed && styles.pressed,
            ]}
          >
            <MaterialCommunityIcons
              name={item.icon}
              size={horizontal ? 20 : 22}
              color={tint}
            />
            <Text
              numberOfLines={horizontal ? 2 : 1}
              style={[
                styles.label,
                horizontal ? styles.labelH : styles.labelV,
                active && styles.labelActive,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </>
  );

  if (horizontal) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.hBar}
        contentContainerStyle={styles.hContent}
      >
        {body}
      </ScrollView>
    );
  }

  return (
    <View style={styles.vBar}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.vContent}>
        {body}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  hBar: {
    flexGrow: 0,
  },
  hContent: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 6,
    alignItems: 'stretch',
  },
  item: {
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemH: {
    width: 62,
    minHeight: 58,
    paddingHorizontal: 3,
    paddingVertical: 5,
    gap: 3,
  },
  itemV: {
    width: 64,
    minHeight: 52,
    paddingHorizontal: 5,
    paddingVertical: 6,
    flexDirection: 'row',
    gap: 6,
  },
  itemActive: {
    borderColor: Tactical.selected,
    backgroundColor: 'rgba(182,255,106,0.14)',
  },
  pressed: {
    opacity: 0.72,
  },
  label: {
    color: Tactical.textDim,
    fontSize: 9,
    lineHeight: 11,
  },
  labelH: {
    textAlign: 'center',
  },
  labelV: {
    flex: 1,
    fontSize: 10,
    lineHeight: 13,
  },
  labelActive: {
    color: Tactical.selected,
    fontWeight: '700',
  },
  vBar: {
    width: 78,
  },
  vContent: {
    padding: 7,
    gap: 6,
  },
});
