import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DateTile, InitialsTile } from '@/components/list-row';
import { Screen, SectionLabel } from '@/components/screen';
import { StatusChip, type StatusTone } from '@/components/status-chip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_TRAININGS, TRAINING_ATTENDANCE, type AttendanceStatus, type AttRow } from '@/lib/data';

const STATUS_TONE: Record<AttendanceStatus, StatusTone> = {
  present: 'emerald',
  absent: 'danger',
  unconfirmed: 'warning',
};

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: 'present',
  absent: 'absent',
  unconfirmed: 'unconfirmed',
};

const NEXT: Record<AttendanceStatus, AttendanceStatus> = {
  present: 'absent',
  absent: 'unconfirmed',
  unconfirmed: 'present',
};

export default function TrainingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const training = ALL_TRAININGS.find((t) => t.id === id) ?? ALL_TRAININGS[0];
  const [rows, setRows] = useState<AttRow[]>(
    () => TRAINING_ATTENDANCE[training.id] ?? TRAINING_ATTENDANCE.t1,
  );

  const present = rows.filter((r) => r.status === 'present').length;

  const toggle = (initials: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.initials === initials ? { ...r, status: NEXT[r.status], reason: undefined } : r,
      ),
    );
  };

  return (
    <Screen back>
      {/* Training info */}
      <View style={styles.infoCard}>
        <DateTile day={training.day} month={training.month} color={Colors.mint} />
        <View style={styles.infoBody}>
          <Text style={styles.type}>{training.type} training</Text>
          <Text style={styles.meta}>
            {training.field} · {training.time}
          </Text>
          <View style={styles.presentRow}>
            <IconSymbol name="person.2.fill" size={14} color={Colors.mint} />
            <Text style={styles.presentText}>
              {present}/{rows.length} present
            </Text>
          </View>
        </View>
      </View>

      <SectionLabel>attendance — tap a player to change status</SectionLabel>
      <View style={styles.list}>
        {rows.map((r) => (
          <Pressable key={r.initials} style={styles.row} onPress={() => toggle(r.initials)}>
            <InitialsTile initials={r.initials} color={r.color} size={38} />
            <View style={styles.rowBody}>
              <Text style={styles.name}>{r.player}</Text>
              {r.status === 'absent' && r.reason ? (
                <Text style={styles.reason}>{r.reason}</Text>
              ) : null}
            </View>
            <StatusChip label={STATUS_LABEL[r.status]} tone={STATUS_TONE[r.status]} />
          </Pressable>
        ))}
      </View>

      <Pressable
        style={styles.finalizeBtn}
        onPress={() => {
          alert(`Attendance saved — ${present}/${rows.length} present.`);
          router.back();
        }}>
        <IconSymbol name="checkmark.circle.fill" size={18} color={Colors.textOnPrimary} />
        <Text style={styles.finalizeText}>finalize attendance</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  infoBody: {
    flex: 1,
    gap: 3,
  },
  type: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 18,
    color: Colors.mint,
    textTransform: 'lowercase',
  },
  meta: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  presentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  presentText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.mint,
  },
  list: {
    gap: Spacing.sm,
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
  rowBody: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.text,
  },
  reason: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },
  finalizeBtn: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
  },
  finalizeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.textOnPrimary,
    textTransform: 'lowercase',
  },
});
