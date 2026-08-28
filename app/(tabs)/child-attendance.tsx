import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { DateTile } from '@/components/list-row';
import { Screen, DetailHead, SectionLabel, StatCell } from '@/components/screen';
import { StatusChip, type StatusTone } from '@/components/status-chip';
import { Fonts, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { ALL_PLAYERS, ALL_TRAININGS, TRAINING_ATTENDANCE, type AttendanceStatus } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';
import { useTheme, useThemedStyles } from '@/lib/theme';

const STATUS_TONE: Record<AttendanceStatus, StatusTone> = {
  present: 'emerald',
  absent: 'danger',
  unconfirmed: 'warning',
};

export default function ChildAttendanceScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useLanguage();
  const { child = 'Agon Gashi' } = useLocalSearchParams<{ child?: string }>();
  const childPlayer = ALL_PLAYERS.find((p) => p.name === child);
  const rows = ALL_TRAININGS.map((t) => {
    const roster = TRAINING_ATTENDANCE[t.id] ?? [];
    const mine = roster.find((r) => r.initials === childPlayer?.initials);
    return { training: t, status: (mine?.status ?? 'unconfirmed') as AttendanceStatus, reason: mine?.reason };
  });

  const present = rows.filter((r) => r.status === 'present').length;

  return (
    <Screen back>
      <DetailHead
        icon="calendar"
        accent="#408A71"
        title={t('childAttendance.title')}
        subtitle={t('childAttendance.subtitle', { name: child })}
      />

      <View style={styles.summary}>
        <StatCell value={`${present}/${rows.length}`} label={t('childAttendance.present')} color={colors.emerald} />
        <StatCell
          value={`${Math.round((present / Math.max(rows.length, 1)) * 100)}%`}
          label={t('childAttendance.rate')}
        />
      </View>

      <SectionLabel>{t('childAttendance.trainingLog')}</SectionLabel>
      <View style={styles.list}>
        {rows.map(({ training, status, reason }) => (
          <View key={training.id} style={styles.row}>
            <DateTile day={training.day} month={training.month} color={colors.mint} />
            <View style={styles.body}>
              <Text style={styles.title}>{t(`trainings.${training.type.toLowerCase()}`)}</Text>
              <Text style={styles.meta}>
                {training.field} · {training.time}
                {reason ? ` · ${reason}` : ''}
              </Text>
            </View>
            <StatusChip label={t(`attendance.${status}`)} tone={STATUS_TONE[status]} />
          </View>
        ))}
      </View>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  summary: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  list: {
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
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
  meta: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
});
