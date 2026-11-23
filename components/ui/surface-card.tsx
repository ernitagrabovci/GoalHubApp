import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { AnimatedPressable } from '@/components/ui/animated-pressable';
import { Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/lib/theme';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  accessibilityLabel?: string;
  /** Optional rail/accent colour drawn on the leading edge. */
  accent?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
};

/** Frosted surface used for cards and grouped content. */
export function SurfaceCard({
  children,
  style,
  onPress,
  accessibilityLabel,
  accent,
  padding = 'md',
}: Props) {
  const styles = useThemedStyles(createStyles);
  const pad =
    padding === 'none' ? undefined : padding === 'sm' ? styles.padSm : padding === 'lg' ? styles.padLg : styles.padMd;

  const body = (
    <>
      {accent ? <View pointerEvents="none" style={[styles.accent, { backgroundColor: accent }]} /> : null}
      {children}
    </>
  );

  if (onPress) {
    return (
      <AnimatedPressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={[styles.card, pad, style]}
      >
        {body}
      </AnimatedPressable>
    );
  }

  return <View style={[styles.card, pad, style]}>{body}</View>;
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  padSm: {
    padding: Spacing.sm,
  },
  padMd: {
    padding: Spacing.md,
  },
  padLg: {
    padding: Spacing.lg,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
});
