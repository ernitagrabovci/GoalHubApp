import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { AnimatedPressable } from '@/components/ui/animated-pressable';
import { Elevation, Fonts, Radius, type ThemeColors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/lib/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconSymbolName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** Brand button with consistent variants, sizes and interaction states. */
export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  accessibilityLabel,
  style,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const inactive = disabled || loading;

  const textColor =
    variant === 'primary' || variant === 'danger'
      ? colors.textOnPrimary
      : variant === 'secondary'
        ? colors.brand
        : colors.brand;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={[
        styles.base,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        inactive && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <View style={styles.content}>
          {icon ? <IconSymbol name={icon} size={18} color={textColor} /> : null}
          <Text style={[styles.label, { color: textColor }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  primary: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
    ...Elevation.sm,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderColor: colors.brand,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  danger: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  sm: {
    minHeight: 36,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  md: {
    minHeight: 46,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  lg: {
    minHeight: 54,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
});
