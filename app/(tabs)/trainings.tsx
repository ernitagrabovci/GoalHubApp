import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { DateTile, ListRow } from '@/components/list-row';
import { ListScreen } from '@/components/list-screen';
import { StatusTone, TONE_COLORS } from '@/components/status-chip';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_TRAININGS, type Training } from '@/lib/data';
import { useSession } from '@/lib/session';
import { usePersistedState } from '@/lib/storage';

const TRAIN_TYPES = ['Tactical', 'Physical', 'Recovery', 'Regular'] as const;
const TONE_BY_TYPE: Record<string, StatusTone> = {
  Tactical: 'mint',
  Physical: 'info',
  Recovery: 'emerald',
  Regular: 'purple',
};
const MONTHS = ['AUG', 'SEP'];

function NewTrainingForm({ onDone }: { onDone: (t: Training) => void }) {
  const [type, setType] = useState<string>(TRAIN_TYPES[0]);
  const [day, setDay] = useState('');
  const [month, setMonth] = useState<string>(MONTHS[1]);
  const [time, setTime] = useState('');
  const [field, setField] = useState('');

  const submit = () => {
    const d = parseInt(day.trim(), 10);
    if (!Number.isFinite(d) || d < 1 || d > 31) {
      alert('Enter a valid day of the month.');
      return;
    }
    if (!time.trim() || !field.trim()) {
      alert('Enter a start time and a training field.');
      return;
    }
    onDone({
      id: `t-${Date.now()}`,
      day: String(d),
      month,
      type,
      field: field.trim(),
      time: time.trim(),
      present: 0,
      total: 42,
      tone: TONE_BY_TYPE[type] ?? 'mint',
    });
  };

  return (
    <View style={styles.formCard}>
      <Text style={styles.fieldLabel}>type</Text>
      <View style={styles.wrap}>
        {TRAIN_TYPES.map((t) => {
          const selected = type === t;
          return (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              style={[styles.chip, selected && styles.chipActive]}>
              <Text style={[styles.chipText, selected && styles.chipTextActive]}>{t}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.formRow}>
        <View style={[styles.inputBox, styles.dayBox]}>
          <TextInput
            style={styles.input}
            placeholder="Day"
            placeholderTextColor={Colors.textMuted}
            value={day}
            onChangeText={setDay}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.wrap}>
          {MONTHS.map((m) => {
            const selected = month === m;
            return (
              <Pressable
                key={m}
                onPress={() => setMonth(m)}
                style={[styles.chip, selected && styles.chipActive]}>
                <Text style={[styles.chipText, selected && styles.chipTextActive]}>{m}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={styles.formRow}>
        <View style={[styles.inputBox, styles.timeBox]}>
          <TextInput
            style={styles.input}
            placeholder="Time e.g. 09:00"
            placeholderTextColor={Colors.textMuted}
            value={time}
            onChangeText={setTime}
            autoCorrect={false}
          />
        </View>
        <View style={[styles.inputBox, styles.fieldBox]}>
          <TextInput
            style={styles.input}
            placeholder="Field"
            placeholderTextColor={Colors.textMuted}
            value={field}
            onChangeText={setField}
            autoCorrect={false}
          />
        </View>
      </View>
      <Pressable style={styles.submitBtn} onPress={submit}>
        <IconSymbol name="plus" size={16} color={Colors.textOnPrimary} />
        <Text style={styles.submitBtnText}>add training</Text>
      </Pressable>
    </View>
  );
}

export default function TrainingsScreen() {
  const router = useRouter();
  const { user } = useSession();
  const canPlan = user?.role === 'administrator' || user?.role === 'trainer';
  const [trainings, setTrainings] = usePersistedState<Training[]>('trainings:list', ALL_TRAININGS);

  return (
    <ListScreen
      icon="calendar"
      accent="#B0E4CC"
      title="trainings"
      subtitle={`${trainings.length} this week · attendance tracked`}
      searchable
      searchPlaceholder="Search by type or field…"
      items={trainings}
      itemKey={(t) => t.id}
      searchKeys={(t) => `${t.type} ${t.field}`}
      renderItem={(t) => {
        const color = TONE_COLORS[t.tone];
        return (
          <ListRow
            title={`${t.type} training`}
            subtitle={`${t.field} · ${t.time}`}
            leading={<DateTile day={t.day} month={t.month} color={color} />}
            trailing={
              <View style={styles.presence}>
                <IconSymbol name="person.2.fill" size={16} color={color} />
                <Text style={[styles.presenceText, { color }]}>
                  {t.present}/{t.total}
                </Text>
              </View>
            }
            onPress={() => router.push(`/training?id=${t.id}`)}
          />
        );
      }}
      actionLabel={canPlan ? 'new training' : undefined}
      actionForm={
        canPlan
          ? (close) => (
              <NewTrainingForm
                onDone={(t) => {
                  setTrainings((prev) => [t, ...prev]);
                  close();
                  alert(`${t.type} training added for ${t.day} ${t.month}.`);
                }}
              />
            )
          : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  presence: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  presenceText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  fieldLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceAlt,
  },
  chipActive: {
    backgroundColor: Colors.mint,
    borderColor: Colors.mint,
  },
  chipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.textOnPrimary,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  inputBox: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
  },
  dayBox: {
    width: 72,
  },
  timeBox: {
    flex: 1,
  },
  fieldBox: {
    flex: 1,
  },
  input: {
    color: Colors.text,
    fontFamily: Fonts.body,
    fontSize: 14,
    paddingVertical: Spacing.sm + 2,
  },
  submitBtn: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
  },
  submitBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.textOnPrimary,
    textTransform: 'lowercase',
  },
});
