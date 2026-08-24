import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen, SectionLabel } from '@/components/screen';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_PLAYERS } from '@/lib/data';

const OCCURRED = ['training', 'match', 'other'] as const;
const INITIAL_STATUS = ['injured', 'rehabilitation'] as const;

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export default function InjuryCreateScreen() {
  const router = useRouter();
  const [player, setPlayer] = useState(ALL_PLAYERS[0].name);
  const [type, setType] = useState('');
  const [occurred, setOccurred] = useState<string>('training');
  const [status, setStatus] = useState<string>('injured');
  const [date, setDate] = useState('');
  const [expected, setExpected] = useState('');
  const [description, setDescription] = useState('');
  const [treatment, setTreatment] = useState('');
  const [notifyAdmin, setNotifyAdmin] = useState(true);

  return (
    <Screen back>
      <SectionLabel>player</SectionLabel>
      <View style={styles.chips}>
        {ALL_PLAYERS.map((p) => (
          <Chip
            key={p.id}
            label={p.initials}
            active={player === p.name}
            onPress={() => setPlayer(p.name)}
          />
        ))}
      </View>
      <Text style={styles.selected}>{player}</Text>

      <SectionLabel>injury type</SectionLabel>
      <TextInput
        style={styles.input}
        placeholder="e.g. Hamstring strain"
        placeholderTextColor={Colors.textMuted}
        value={type}
        onChangeText={setType}
      />

      <SectionLabel>occurred during</SectionLabel>
      <View style={styles.chips}>
        {OCCURRED.map((o) => (
          <Chip key={o} label={o} active={occurred === o} onPress={() => setOccurred(o)} />
        ))}
      </View>

      <SectionLabel>initial status</SectionLabel>
      <View style={styles.chips}>
        {INITIAL_STATUS.map((s) => (
          <Chip key={s} label={s} active={status === s} onPress={() => setStatus(s)} />
        ))}
      </View>

      <SectionLabel>dates</SectionLabel>
      <View style={styles.dateRow}>
        <TextInput
          style={[styles.input, styles.flex]}
          placeholder="Injury date (DD/MM/YYYY)"
          placeholderTextColor={Colors.textMuted}
          value={date}
          onChangeText={setDate}
        />
        <TextInput
          style={[styles.input, styles.flex]}
          placeholder="Expected return"
          placeholderTextColor={Colors.textMuted}
          value={expected}
          onChangeText={setExpected}
        />
      </View>

      <SectionLabel>description</SectionLabel>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="What happened?"
        placeholderTextColor={Colors.textMuted}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <SectionLabel>treatment</SectionLabel>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Recommended treatment / physio"
        placeholderTextColor={Colors.textMuted}
        value={treatment}
        onChangeText={setTreatment}
        multiline
      />

      <Pressable style={styles.toggleRow} onPress={() => setNotifyAdmin((v) => !v)}>
        <View style={[styles.toggle, notifyAdmin && styles.toggleOn]}>
          <View style={[styles.toggleKnob, notifyAdmin && styles.toggleKnobOn]} />
        </View>
        <View style={styles.toggleBody}>
          <Text style={styles.toggleTitle}>notify admin</Text>
          <Text style={styles.toggleSub}>
            auto-sets {player}&apos;s health status and notifies the administrator
          </Text>
        </View>
      </Pressable>

      <Pressable
        style={styles.saveBtn}
        onPress={() => {
          if (!type.trim()) {
            alert('Please enter the injury type.');
            return;
          }
          alert(`${player} — ${type} registered. Health status set to ${status}.`);
          router.back();
        }}>
        <IconSymbol name="plus" size={18} color={Colors.textOnPrimary} />
        <Text style={styles.saveBtnText}>register injury</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 7,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
  },
  chipActive: {
    backgroundColor: Colors.mint,
    borderColor: Colors.mint,
  },
  chipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'lowercase',
  },
  chipTextActive: {
    color: Colors.textOnPrimary,
  },
  selected: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.mint,
    marginTop: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.body,
  },
  multiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  dateRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  flex: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xl,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  toggle: {
    width: 46,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceAlt,
    padding: 2,
  },
  toggleOn: {
    backgroundColor: Colors.mint,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.textMuted,
  },
  toggleKnobOn: {
    backgroundColor: Colors.textOnPrimary,
    marginLeft: 18,
  },
  toggleBody: {
    flex: 1,
    gap: 2,
  },
  toggleTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.text,
    textTransform: 'lowercase',
  },
  toggleSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },
  saveBtn: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
  },
  saveBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.textOnPrimary,
    textTransform: 'lowercase',
  },
});
