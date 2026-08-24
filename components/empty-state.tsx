import { StyleSheet, Text, View } from 'react-native';

import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

/** Friendly placeholder shown when a list has no items. */
export function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: IconSymbolName;
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={styles.box}>
      <View style={styles.iconWrap}>
        <IconSymbol name={icon} size={22} color={Colors.textMuted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xl + Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
    marginBottom: 2,
  },
  title: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.text,
    textTransform: 'lowercase',
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
