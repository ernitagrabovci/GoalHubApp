import { StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts, type ThemeColors } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useThemedStyles } from '@/lib/theme';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link' | 'label' | 'muted';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const styles = useThemedStyles(createStyles);

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        type === 'label' ? styles.label : undefined,
        type === 'muted' ? styles.muted : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  default: {
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  defaultSemiBold: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.5,
    color: colors.mint,
  },
  subtitle: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.mint,
  },
  link: {
    fontFamily: Fonts.bodySemiBold,
    lineHeight: 22,
    fontSize: 15,
    color: colors.mint,
  },
  label: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.emerald,
  },
  muted: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
});
