import { StyleSheet, Text, type TextProps } from 'react-native';

import { Colors, Fonts } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

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

const styles = StyleSheet.create({
  default: {
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  defaultSemiBold: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    lineHeight: 22,
    color: Colors.text,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -0.5,
    color: Colors.mint,
  },
  subtitle: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 18,
    lineHeight: 24,
    color: Colors.mint,
  },
  link: {
    fontFamily: Fonts.bodySemiBold,
    lineHeight: 22,
    fontSize: 15,
    color: Colors.mint,
  },
  label: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: Colors.emerald,
  },
  muted: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: Colors.textMuted,
  },
});
