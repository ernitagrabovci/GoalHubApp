import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Tactical } from '@/constants/tactical-theme';

type Option = { value: string; label: string };

type Props = {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  placeholder?: string;
};

/** Compact dark dropdown with an in-flow option list. */
export function BoardSelect({ value, options, onChange, placeholder }: Props) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);

  return (
    <View>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        style={({ pressed }) => [styles.field, pressed && styles.pressed]}
      >
        <Text style={styles.value} numberOfLines={1}>
          {current?.label || placeholder || '— Zgjidh —'}
        </Text>
        <MaterialCommunityIcons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={Tactical.textDim}
        />
      </Pressable>

      {open ? (
        <View style={styles.options}>
          {options.map((o) => {
            const active = o.value === value;
            return (
              <Pressable
                key={o.value || o.label}
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                style={[styles.option, active && styles.optionActive]}
              >
                <Text
                  style={[styles.optionText, active && styles.optionTextActive]}
                  numberOfLines={1}
                >
                  {o.label}
                </Text>
                {active ? (
                  <MaterialCommunityIcons
                    name="check"
                    size={14}
                    color={Tactical.selected}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    minHeight: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Tactical.borderSoft,
    backgroundColor: 'rgba(5,12,24,0.30)',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  pressed: {
    opacity: 0.8,
  },
  value: {
    color: Tactical.text,
    fontSize: 13,
    flex: 1,
  },
  options: {
    marginTop: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Tactical.borderSoft,
    backgroundColor: Tactical.panelSolid,
    overflow: 'hidden',
  },
  option: {
    minHeight: 36,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  optionActive: {
    backgroundColor: 'rgba(182,255,106,0.12)',
  },
  optionText: {
    color: Tactical.textDim,
    fontSize: 13,
    flex: 1,
  },
  optionTextActive: {
    color: Tactical.selected,
    fontWeight: '600',
  },
});
