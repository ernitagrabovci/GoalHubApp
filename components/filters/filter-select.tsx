import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
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
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value) ?? options[0];

  return (
    /* Raised while open so the menu draws over the rows below it. */
    <View style={open ? styles.lift : undefined}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [boxStyle, pressed && styles.pressed]}
      >
        <Text style={textStyle} numberOfLines={1}>
          {current?.label ?? ''}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={I(14)} color="#111111" />
      </Pressable>

      {open ? (
        <View style={[styles.menu, { minWidth }]}>
          {options.map((o) => {
            const active = o.value === value;
            return (
              <Pressable
                key={o.value || 'all'}
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                accessibilityRole="button"
                style={({ pressed }) => [styles.item, pressed && styles.pressed]}
              >
                <Text
                  style={[styles.itemText, active && styles.itemTextActive]}
                  numberOfLines={1}
                >
                  {o.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
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
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#000000',
      borderRadius: 4,
      overflow: 'hidden',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 6,
    },

    item: {
      paddingHorizontal: 12,
      paddingVertical: 9,
    },

    itemText: {
      fontFamily: Fonts.body,
      fontSize: 12,
      color: '#111111',
    },

    itemTextActive: {
      fontFamily: Fonts.bodyBold,
    },

    pressed: {
      opacity: 0.5,
    },
  }),
);
