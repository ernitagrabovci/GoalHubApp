import { StyleSheet, Text, View } from 'react-native';

import { DateTile } from '@/components/list-row';
import { Screen, DetailHead, SectionLabel, StatCell } from '@/components/screen';
import { StatusChip, type StatusTone } from '@/components/status-chip';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_TRAININGS, TRAINING_ATTENDANCE, type AttendanceStatus } from '@/lib/data';

const STATUS_TONE: Record<AttendanceStatus, StatusTone> = {
  present: 'emerald',
  absent: 'danger',
  unconfirmed: 'warning',
};

export default function ChildAttendanceScreen() {
  const rows = ALL_TRAININGS.map((t) => {
    const roster = TRAINING_ATTENDANCE[t.id] ?? [];
    const mine = roster.find((r) => r.initials === 'AG');
    return { training: t, status: (mine?.status ?? 'unconfirmed') as AttendanceStatus, reason: mine?.reason };
  });

  const present = rows.filter((r) => r.status === 'present').length;

  return (
    <Screen back>
      <DetailHead
        icon="calendar"
        accent="#408A71"
        title="attendance"
        subtitle="Agon Gashi · training log"
      />

      <View style={styles.summary}>
        <StatCell value={`${present}/${rows.length}`} label="present" color={Colors.emerald} />
        <StatCell
          value={`${Math.round((present / Math.max(rows.length, 1)) * 100)}%`}
          label="rate"
        />
      </View>

      <SectionLabel>training log</SectionLabel>
      <View style={styles.list}>
        {rows.map(({ training, status, reason }) => (
          <View key={training.id} style={styles.row}>
            <DateTile day={training.day} month={training.month} color={Colors.mint} />
            <View style={styles.body}>
              <Text style={styles.title}>{training.type} training</Text>
              <Text style={styles.meta}>
                {training.field} · {training.time}
                {reason ? ` · ${reason}` : ''}
              </Text>
            </View>
            <StatusChip label={status} tone={STATUS_TONE[status]} />
          </View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
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
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
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
    color: Colors.text,
  },
  meta: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },
});
