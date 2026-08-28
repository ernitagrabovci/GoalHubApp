import type { ThemeColors } from '@/constants/theme';
import { useTheme } from '@/lib/theme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof ThemeColors
) {
  const { colors, isDark } = useTheme();
  return (isDark ? props.dark : props.light) ?? colors[colorName];
}
