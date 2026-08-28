import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { DateTile, ListRow } from '@/components/list-row';
import { ListScreen } from '@/components/list-screen';
import { StatusTone, TONE_COLORS } from '@/components/status-chip';
import { Fonts, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { ALL_TRAININGS, CLUB_FIELDS, type Training } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { usePersistedState } from '@/lib/storage';
import { useTheme, useThemedStyles } from '@/lib/theme';

const TRAIN_TYPES = ['Tactical', 'Physical', 'Recovery', 'Regular'] as const;
const TONE_BY_TYPE: Record<string, StatusTone> = {
  Tactical: 'mint',
  Physical: 'info',
  Recovery: 'emerald',
  Regular: 'purple',
};
const MONTHS = ['AUG', 'SEP'];

function NewTrainingForm({ existing, onDone }: { existing: Training[]; onDone: (t: Training) => void }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useLanguage();
  const [type, setType] = useState<string>(TRAIN_TYPES[0]);
  const [day, setDay] = useState('');
  const [month, setMonth] = useState<string>(MONTHS[1]);
  const [time, setTime] = useState('');
  const [field, setField] = useState<string>(CLUB_FIELDS.find((f) => f.status === 'active')?.name ?? 'Field 1');

  const hasSlot = day.trim() !== '' && time.trim() !== '';
  const bookedNames = new Set(
    hasSlot
      ? existing
          .filter(
            (tr) =>
              parseInt(tr.day, 10) === parseInt(day.trim(), 10) &&
              tr.month.toUpperCase() === month.toUpperCase() &&
              tr.time.trim().toLowerCase() === time.trim().toLowerCase(),
          )
          .map((tr) => tr.field)
      : [],
  );
  const freeFields = CLUB_FIELDS.filter((f) => f.status === 'active' && !bookedNames.has(f.name));
  const availParts: string[] = [];
  if (freeFields.length > 0) availParts.push(`${freeFields.map((f) => f.name).join(' & ')} ${t('trainings.free')}`);
  if (bookedNames.size > 0) availParts.push(`${[...bookedNames].join(' & ')} ${t('trainings.booked')}`);
  const availability = hasSlot && availParts.length > 0 ? availParts.join(' · ') : t('trainings.fieldAvailability');

  const submit = () => {
    const d = parseInt(day.trim(), 10);
    if (!Number.isFinite(d) || d < 1 || d > 31) {
      alert(t('trainings.alertDay'));
      return;
    }
    if (!time.trim() || !field.trim()) {
      alert(t('trainings.alertTime'));
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
      <Text style={styles.fieldLabel}>{t('trainings.formType')}</Text>
      <View style={styles.wrap}>
        {TRAIN_TYPES.map((ty) => {
          const selected = type === ty;
          return (
            <Pressable
              key={ty}
              onPress={() => setType(ty)}
              style={[styles.chip, selected && styles.chipActive]}>
              <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                {t(`trainings.${ty.toLowerCase()}`)}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.formRow}>
        <View style={[styles.inputBox, styles.dayBox]}>
          <TextInput
            style={styles.input}
            placeholder={t('trainings.formDay')}
            placeholderTextColor={colors.textMuted}
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
                <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                  {t(`month.${m}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={styles.formRow}>
        <View style={[styles.inputBox, styles.timeBox]}>
          <TextInput
            style={styles.input}
            placeholder={t('trainings.formTime')}
            placeholderTextColor={colors.textMuted}
            value={time}
            onChangeText={setTime}
            autoCorrect={false}
          />
        </View>
      </View>
      <Text style={styles.fieldLabel}>{t('trainings.formField')}</Text>
      <View style={styles.fieldWrap}>
        <View style={styles.wrap}>
          {CLUB_FIELDS.map((f) => {
            const maintenance = f.status === 'maintenance';
            const booked = bookedNames.has(f.name);
            const selected = field === f.name;
            const disabled = booked || maintenance;
            return (
              <Pressable
                key={f.id}
                disabled={disabled}
                onPress={() => setField(f.name)}
                style={[styles.fieldChip, selected && styles.fieldChipActive, disabled && styles.fieldChipDisabled]}>
                <Text
                  style={[
                    styles.fieldChipText,
                    selected && styles.fieldChipTextActive,
                    disabled && styles.fieldChipTextDisabled,
                  ]}>
                  {f.name}
                </Text>
                {booked ? (
                  <Text style={styles.fieldTag}>{t('trainings.booked')}</Text>
                ) : !maintenance ? (
                  <Text style={[styles.fieldTag, styles.fieldTagFree]}>{t('trainings.free')}</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.availabilityHint}>{availability}</Text>
      </View>
      <Pressable style={styles.submitBtn} onPress={submit}>
        <IconSymbol name="plus" size={16} color={colors.textOnPrimary} />
        <Text style={styles.submitBtnText}>{t('trainings.addTraining')}</Text>
      </Pressable>
    </View>
  );
}

export default function TrainingsScreen() {
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useSession();
  const canPlan = user?.role === 'administrator' || user?.role === 'trainer';
  const [trainings, setTrainings] = usePersistedState<Training[]>('trainings:list', ALL_TRAININGS);

  return (
    <ListScreen back
      icon="calendar"
      accent="#B0E4CC"
      title={t('trainings.title')}
      subtitle={t('trainings.subtitle', { count: trainings.length })}
      searchable
      searchPlaceholder={t('trainings.search')}
      items={trainings}
      itemKey={(tr) => tr.id}
      searchKeys={(tr) => `${tr.type} ${tr.field}`}
      renderItem={(tr) => {
        const color = TONE_COLORS[tr.tone];
        return (
          <ListRow
            title={t(`trainings.${tr.type.toLowerCase()}`)}
            subtitle={`${tr.field} · ${tr.time}`}
            leading={<DateTile day={tr.day} month={tr.month} color={color} />}
            trailing={
              <View style={styles.presence}>
                <IconSymbol name="person.2.fill" size={16} color={color} />
                <Text style={[styles.presenceText, { color }]}>
                  {tr.present}/{tr.total}
                </Text>
              </View>
            }
            onPress={() => router.push(`/training?id=${tr.id}`)}
          />
        );
      }}
      actionLabel={canPlan ? t('trainings.newTraining') : undefined}
      actionForm={
        canPlan
          ? (close) => (
              <NewTrainingForm
                existing={trainings}
                onDone={(tr) => {
                  setTrainings((prev) => [tr, ...prev]);
                  close();
                  alert(
                    t('trainings.alertAdded', {
                      type: t(`trainings.${tr.type.toLowerCase()}`),
                      day: tr.day,
                      month: tr.month,
                    }),
                  );
                }}
              />
            )
          : undefined
      }
    />
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  presence: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  presenceText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
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
    color: colors.textMuted,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    backgroundColor: colors.surfaceAlt,
  },
  chipActive: {
    backgroundColor: colors.mint,
    borderColor: colors.mint,
  },
  chipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.textOnPrimary,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  inputBox: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
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
  fieldWrap: {
    gap: Spacing.sm,
  },
  fieldChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    backgroundColor: colors.surfaceAlt,
  },
  fieldChipActive: {
    backgroundColor: colors.mint,
    borderColor: colors.mint,
  },
  fieldChipDisabled: {
    opacity: 0.5,
  },
  fieldChipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: colors.textSecondary,
  },
  fieldChipTextActive: {
    color: colors.textOnPrimary,
  },
  fieldChipTextDisabled: {
    color: colors.textMuted,
  },
  fieldTag: {
    fontFamily: Fonts.body,
    fontSize: 10,
    textTransform: 'uppercase',
    color: colors.warning,
  },
  fieldTagFree: {
    color: colors.mint,
  },
  availabilityHint: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  input: {
    color: colors.text,
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
    backgroundColor: colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
  },
  submitBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textOnPrimary,
    textTransform: 'lowercase',
  },
});
