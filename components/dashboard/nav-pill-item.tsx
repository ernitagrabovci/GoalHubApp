import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { Text } from '@/components/dashboard/dashboard-text';
import { AnimatedPressable } from '@/components/ui/animated-pressable';
import { NavC } from '@/constants/dashboard-theme';
import { useAppColors, usePaletteStyles, type AppColorsOf } from '@/lib/app-theme';
import { Fonts } from '@/constants/theme';
import { useNavFocus } from '@/lib/motion';
import { scaled } from '@/lib/responsive';

type MciName = ComponentProps<typeof MaterialCommunityIcons>['name'];

export type NavIconName = MciName;

type Props = {
  label: string;
  icon: MciName;
  focused: boolean;
  onPress: () => void;
  unread?: number;
  iconSize?: number;
  labelSize?: number;
};

/** One item of the floating bottom navigation. */
export function NavPillItem({
  label,
  icon,
  focused,
  onPress,
  unread = 0,
  iconSize = 21,
  labelSize = 11,
}: Props) {
  const C = useAppColors(NavC);
  const styles = usePaletteStyles(createStyles, C);
  const { iconStyle, capsuleStyle } = useNavFocus(focused);
  const color = focused ? C.greenText : C.mutedText;

  return (
    <AnimatedPressable
      onPress={onPress}
      style={styles.wrap}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: focused }}
    >
      <View style={styles.item}>
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.active, capsuleStyle]}
        />
        <Animated.View style={[styles.iconWrap, iconStyle]}>
          <MaterialCommunityIcons name={icon} size={iconSize} color={color} />
          {unread > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
            </View>
          ) : null}
        </Animated.View>
        <Text style={[styles.label, { fontSize: labelSize, color }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </AnimatedPressable>
  );
}

const createStyles = (C: AppColorsOf<typeof NavC>) => StyleSheet.create(scaled({
  wrap: {
    flex: 1,
    alignItems: 'center',
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 2,
  },
  active: {
    borderRadius: 12,
    backgroundColor: C.activeBgFill,
  },
  iconWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -9,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: C.badgeFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 8,
    lineHeight: 10,
    color: '#FFFFFF',
  },
  label: {
    fontFamily: Fonts.bodySemiBold,
  },
}));
