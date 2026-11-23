import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

import { AnimatedPressable } from '@/components/ui/animated-pressable';
import { Text } from '@/components/dashboard/dashboard-text';
import { Elevation, Fonts, LightColors, Radius } from '@/constants/theme';
import { useAppColors } from '@/lib/app-theme';
import { Easings, Motion, useReducedMotion } from '@/lib/motion';
import { I, scaled } from '@/lib/responsive';

/**
 * The filter box the list screens share: a button showing the current choice
 * that drops its options open beneath itself. The screen supplies its own box
 * and text styles, so each page keeps its look.
 */

export type FilterOption = { label: string; value: string };

type Props = {
  /** Spoken label for the trigger, e.g. "Filtro sipas ekipit". */
  label: string;
  /** The first entry is the neutral "all" option — its value is `''`. */
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  /** The screen's own box style, so the button matches the page. */
  boxStyle: StyleProp<ViewStyle>;
  textStyle: StyleProp<TextStyle>;
  minWidth?: number;
};

export function FilterSelect({
  label,
  options,
  value,
  onChange,
  boxStyle,
  textStyle,
  minWidth = 170,
}: Props) {
  const colors = useAppColors(LightColors);
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [reveal] = useState(() => new Animated.Value(0));
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    reveal.setValue(0);
    Animated.timing(reveal, {
      toValue: 1,
      duration: reduced ? 0 : Motion.standard,
      easing: Easings.enter,
      useNativeDriver: true,
    }).start();
  }, [open, reduced, reveal]);

  return (
    /* Raised while open so the menu draws over the rows below it. */
    <View style={open ? styles.lift : undefined}>
      <AnimatedPressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: open }}
        hitSlop={{ top: 6, bottom: 6, left: 2, right: 2 }}
        style={({ pressed }) => [boxStyle, pressed && styles.pressed]}
      >
        <Text style={textStyle} numberOfLines={1}>
          {current?.label ?? ''}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={I(14)} color={colors.text} />
      </AnimatedPressable>

      {open ? (
        <Animated.View
          style={[
            styles.menu,
            {
              minWidth,
              backgroundColor: colors.surfaceAlt,
              borderColor: colors.border,
              opacity: reveal,
              transform: [
                {
                  translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [-4, 0] }),
                },
              ],
            },
          ]}
        >
          {options.map((o) => {
            const active = o.value === value;
            return (
              <AnimatedPressable
                key={o.value || 'all'}
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={({ pressed }) => [styles.item, pressed && styles.pressed]}
              >
                <Text
                  style={[styles.itemText, { color: colors.text }, active && styles.itemTextActive]}
                  numberOfLines={1}
                >
                  {o.label}
                </Text>
              </AnimatedPressable>
            );
          })}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create(
  scaled({
    lift: {
      zIndex: 30,
    },

    menu: {
      /* `100%` is the trigger's own height, so the menu sits right under it. */
      position: 'absolute',
      top: '100%',
      left: 0,
      marginTop: 2,
      borderWidth: 1,
      borderRadius: Radius.md,
      overflow: 'hidden',
      ...Elevation.md,
    },

    item: {
      minHeight: 44,
      justifyContent: 'center',
      paddingHorizontal: 14,
      paddingVertical: 10,
    },

    itemText: {
      fontFamily: Fonts.body,
      fontSize: 13,
    },

    itemTextActive: {
      fontFamily: Fonts.bodyBold,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
