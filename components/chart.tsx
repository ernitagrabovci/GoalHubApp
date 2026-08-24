import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

/** Horizontal progress bar — label + value on top, fill below. */
export function StatBar({
  label,
  value,
  max = 10,
  color = Colors.mint,
  display,
}: {
  label: string;
  value: number;
  max?: number;
  color?: string;
  /** Text shown next to the label; defaults to the numeric value. */
  display?: string;
}) {
  const pct = Math.min(Math.max(value / max, 0), 1) * 100;
  const width = `${pct}%` as const;
  return (
    <View style={styles.barRow}>
      <View style={styles.barLabels}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={[styles.barValue, { color }]}>{display ?? value}</Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width, backgroundColor: color }]} />
      </View>
    </View>
  );
}

/** Circular progress indicator with a centered label. */
export function Ring({
  size = 76,
  stroke = 6,
  progress,
  color = Colors.mint,
  label,
  sublabel,
}: {
  size?: number;
  stroke?: number;
  /** 0..1 fraction. */
  progress: number;
  color?: string;
  label?: string;
  sublabel?: string;
}) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(Math.max(progress, 0), 1);
  const offset = circumference * (1 - clamped);
  const center = size / 2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke={Colors.surfaceAlt}
          strokeWidth={stroke}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>
      <View style={styles.ringLabel}>
        {label ? <Text style={[styles.ringLabelText, { color }]}>{label}</Text> : null}
        {sublabel ? <Text style={styles.ringSubText}>{sublabel}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barRow: {
    gap: 4,
  },
  barLabels: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  barLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'lowercase',
  },
  barValue: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
  },
  barTrack: {
    height: 6,
    borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceAlt,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: Radius.pill,
  },
  ringLabel: {
    alignItems: 'center',
    gap: 0,
  },
  ringLabelText: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 18,
    letterSpacing: -0.5,
  },
  ringSubText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
});
