import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DateTile, InitialsTile } from '@/components/list-row';
import { Screen, SectionLabel } from '@/components/screen';
import { StatusChip, type StatusTone } from '@/components/status-chip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_TRAININGS, TRAINING_ATTENDANCE, type AttendanceStatus, type AttRow } from '@/lib/data';
import { useSession } from '@/lib/session';

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
  const { user } = useSession();
  const role = user?.role ?? 'administrator';
  const isPlayer = role === 'player';
  const isParent = role === 'parent';
  const { id } = useLocalSearchParams<{ id?: string }>();
  const training = ALL_TRAININGS.find((t) => t.id === id) ?? ALL_TRAININGS[0];
  const baseRows: AttRow[] = TRAINING_ATTENDANCE[training.id] ?? TRAINING_ATTENDANCE.t1;

  const mine = isPlayer ? 'AL' : 'AG';
  const myInitial = baseRows.find((r) => r.initials === mine);

  const [rows, setRows] = useState<AttRow[]>(baseRows);
  const [myStatus, setMyStatus] = useState<AttendanceStatus>(
    myInitial?.status ?? 'unconfirmed',
  );
  const [myReason, setMyReason] = useState<string | undefined>(myInitial?.reason);

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
            <Text style={styles.presentText}>{present}/{rows.length} present</Text>
          </View>
        </View>
      </View>

      {/* Player: my attendance confirmation */}
      {isPlayer ? (
        <>
          <SectionLabel>my attendance</SectionLabel>
          <View style={styles.myCard}>
            <InitialsTile initials="AL" color="#B0E4CC" size={42} />
            <View style={styles.myBody}>
              <Text style={styles.myName}>Ardit Llapashtica</Text>
              <Text style={styles.myMeta}>
                {training.type} training · {training.day} {training.month}
              </Text>
              {myStatus === 'absent' && myReason ? (
                <Text style={styles.myReason}>{myReason}</Text>
              ) : null}
            </View>
            <StatusChip label={STATUS_LABEL[myStatus]} tone={STATUS_TONE[myStatus]} />
          </View>

          <View style={styles.myActions}>
            {myStatus !== 'present' ? (
              <Pressable
                style={styles.myBtn}
                onPress={() => {
                  setMyStatus('present');
                  setMyReason(undefined);
                  alert(`Presence confirmed for ${training.type} training.`);
                }}>
                <IconSymbol name="checkmark.circle.fill" size={17} color={Colors.textOnPrimary} />
                <Text style={styles.myBtnText}>confirm presence</Text>
              </Pressable>
            ) : null}
            {myStatus !== 'absent' ? (
              <Pressable
                style={[styles.myBtn, styles.myBtnAlt]}
                onPress={() => {
                  setMyStatus('absent');
                  setMyReason('reported by player');
                  alert('Absence reported — the coach has been notified.');
                }}>
                <IconSymbol name="warning" size={16} color={Colors.warning} />
                <Text style={[styles.myBtnText, { color: Colors.warning }]}>report absence</Text>
              </Pressable>
            ) : null}
            {myStatus === 'absent' ? (
              <Pressable
                style={[styles.myBtn, styles.myBtnGhost]}
                onPress={() => {
                  setMyStatus('unconfirmed');
                  setMyReason(undefined);
                  alert('Absence cancelled.');
                }}>
                <IconSymbol name="arrow-left" size={16} color={Colors.mint} />
                <Text style={[styles.myBtnText, { color: Colors.mint }]}>cancel absence</Text>
              </Pressable>
            ) : null}
          </View>
        </>
      ) : null}

      {/* Parent: child attendance, read-only */}
      {isParent ? (
        <>
          <SectionLabel>Agon Gashi · attendance</SectionLabel>
          <View style={styles.myCard}>
            <InitialsTile initials="AG" color="#8f86e8" size={42} />
            <View style={styles.myBody}>
              <Text style={styles.myName}>Agon Gashi</Text>
              <Text style={styles.myMeta}>
                {training.type} training · {training.day} {training.month}
              </Text>
              {myStatus === 'absent' && myReason ? (
                <Text style={styles.myReason}>{myReason}</Text>
              ) : null}
            </View>
            <StatusChip label={STATUS_LABEL[myStatus]} tone={STATUS_TONE[myStatus]} />
          </View>
          <Text style={styles.readOnlyNote}>read-only · managed by the coaching staff</Text>
        </>
      ) : null}

      {/* Staff: full roll-call */}
      {!isPlayer && !isParent ? (
        <>
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
        </>
      ) : null}
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
  myCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  myBody: {
    flex: 1,
    gap: 2,
  },
  myName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.text,
  },
  myMeta: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },
  myReason: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },
  myActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  myBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
  },
  myBtnAlt: {
    backgroundColor: `${Colors.warning}1a`,
    borderColor: `${Colors.warning}55`,
    borderWidth: 1,
  },
  myBtnGhost: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  myBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.textOnPrimary,
    textTransform: 'lowercase',
  },
  readOnlyNote: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.lg,
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
