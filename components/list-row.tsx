import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Fonts, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/lib/theme';
import { useLanguage } from '@/lib/i18n';

type ListRowProps = {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  dimmed?: boolean;
};

/** A card-style list row used across the module screens. */
export function ListRow({ title, subtitle, leading, trailing, onPress, dimmed }: ListRowProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      {leading}
      <View style={styles.body}>
        <Text style={[styles.title, dimmed && styles.titleDimmed]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ?? <IconSymbol name="chevron.right" size={18} color={colors.textMuted} />}
    </Pressable>
  );
}

/** Circular initials avatar, tinted with the item's accent color. */
export function InitialsTile({ initials, color, size = 42 }: { initials: string; color: string; size?: number }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `${color}22`,
        },
      ]}
    >
      <Text style={[styles.tileText, { color }]}>{initials}</Text>
    </View>
  );
}

/** Rounded-square icon tile, tinted with the item's accent color. */
export function IconTile({
  icon,
  color,
  size = 42,
}: {
  icon: IconSymbolName;
  color: string;
  size?: number;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <View
      style={[
        styles.tile,
        {
          width: size,
          height: size,
          borderRadius: size * 0.28,
          backgroundColor: `${color}22`,
        },
      ]}
    >
      <IconSymbol name={icon} size={size * 0.5} color={color} />
    </View>
  );
}

/** A square date chip showing a day + month, e.g. for trainings/matches. */
export function DateTile({ day, month, color }: { day: string; month: string; color: string }) {
  const { t } = useLanguage();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.dateTile, { borderColor: `${color}55` }]}>
      <Text style={[styles.dateDay, { color }]}>{day}</Text>
      <Text style={styles.dateMonth}>{t(`month.${month.toUpperCase()}`)}</Text>
    </View>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.glassBorder,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  rowPressed: {
    backgroundColor: colors.surfaceAlt,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: colors.text,
  },
  titleDimmed: {
    color: colors.textMuted,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileText: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 13,
  },
  dateTile: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  dateDay: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 15,
  },
  dateMonth: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 9,
    letterSpacing: 1,
    color: colors.textMuted,
    marginTop: 1,
  },
});
