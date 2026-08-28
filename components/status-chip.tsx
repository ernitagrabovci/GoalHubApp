import { StyleSheet, Text, View } from 'react-native';

import { Fonts, Radius } from '@/constants/theme';

export type StatusTone = 'mint' | 'emerald' | 'warning' | 'danger' | 'info' | 'purple' | 'muted';

/** Static mid-tone brand colors so chips stay readable in both themes. */
export const TONE_COLORS: Record<StatusTone, string> = {
  mint: '#2fbf71',
  emerald: '#2fbf71',
  warning: '#f5a623',
  danger: '#E24B4A',
  info: '#5aa7e6',
  purple: '#8f86e8',
  muted: '#6B887B',
};

export function StatusChip({ label, tone }: { label: string; tone: StatusTone }) {
  const color = TONE_COLORS[tone];
  return (
    <View style={[styles.chip, { backgroundColor: `${color}1a`, borderColor: `${color}45` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
