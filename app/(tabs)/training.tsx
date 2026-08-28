import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DateTile, InitialsTile } from '@/components/list-row';
import { Screen, SectionLabel } from '@/components/screen';
import { StatusChip, type StatusTone } from '@/components/status-chip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { ALL_TRAININGS, TRAINING_ATTENDANCE, type AttendanceStatus, type AttRow } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { usePersistedState } from '@/lib/storage';
import { useTheme, useThemedStyles } from '@/lib/theme';

const STATUS_TONE: Record<AttendanceStatus, StatusTone> = {
  present: 'emerald',
  absent: 'danger',
  unconfirmed: 'warning',
};

const NEXT: Record<AttendanceStatus, AttendanceStatus> = {
  present: 'absent',
  absent: 'unconfirmed',
  unconfirmed: 'present',
};

export default function TrainingScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useSession();
  const role = user?.role ?? 'administrator';
  const isPlayer = role === 'player';
  const isParent = role === 'parent';
  const { id } = useLocalSearchParams<{ id?: string }>();
  const training = ALL_TRAININGS.find((t) => t.id === id) ?? ALL_TRAININGS[0];
  const baseRows: AttRow[] = TRAINING_ATTENDANCE[training.id] ?? TRAINING_ATTENDANCE.t1;

  const mine = isPlayer ? 'AL' : 'AG';
  const myInitial = baseRows.find((r) => r.initials === mine);

  const [rows, setRows] = usePersistedState<AttRow[]>(`training:${training.id}:rows`, baseRows);
  const [myStatus, setMyStatus] = usePersistedState<AttendanceStatus>(
    `training:${training.id}:my`,
    myInitial?.status ?? 'unconfirmed',
  );
  const [myReason, setMyReason] = usePersistedState<string | undefined>(
    `training:${training.id}:reason`,
    myInitial?.reason,
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
        <DateTile day={training.day} month={training.month} color={colors.mint} />
        <View style={styles.infoBody}>
          <Text style={styles.type}>{t(`trainings.${training.type.toLowerCase()}`)}</Text>
          <Text style={styles.meta}>
            {training.field} · {training.time}
          </Text>
          <View style={styles.presentRow}>
            <IconSymbol name="person.2.fill" size={14} color={colors.mint} />
            <Text style={styles.presentText}>
              {t('sections.presentCount', { present, total: rows.length })}
            </Text>
          </View>
        </View>
      </View>

      {/* Player: my attendance confirmation */}
      {isPlayer ? (
        <>
          <SectionLabel>{t('training.myAttendance')}</SectionLabel>
          <View style={styles.myCard}>
            <InitialsTile initials="AL" color="#B0E4CC" size={42} />
            <View style={styles.myBody}>
              <Text style={styles.myName}>Ardit Llapashtica</Text>
              <Text style={styles.myMeta}>
                {t(`trainings.${training.type.toLowerCase()}`)} · {training.day} {training.month}
              </Text>
              {myStatus === 'absent' && myReason ? (
                <Text style={styles.myReason}>{myReason}</Text>
              ) : null}
            </View>
            <StatusChip label={t(`attendance.${myStatus}`)} tone={STATUS_TONE[myStatus]} />
          </View>

          <View style={styles.myActions}>
            {myStatus !== 'present' ? (
              <Pressable
                style={styles.myBtn}
                onPress={() => {
                  setMyStatus('present');
                  setMyReason(undefined);
                  alert(
                    t('training.alertConfirmed', {
                      type: t(`trainings.${training.type.toLowerCase()}`),
                    }),
                  );
                }}>
                <IconSymbol name="checkmark.circle.fill" size={17} color={colors.textOnPrimary} />
                <Text style={styles.myBtnText}>{t('training.confirmPresence')}</Text>
              </Pressable>
            ) : null}
            {myStatus !== 'absent' ? (
              <Pressable
                style={[styles.myBtn, styles.myBtnAlt]}
                onPress={() => {
                  setMyStatus('absent');
                  setMyReason(t('training.reportedByPlayer'));
                  alert(t('training.alertAbsence'));
                }}>
                <IconSymbol name="warning" size={16} color={colors.warning} />
                <Text style={[styles.myBtnText, { color: colors.warning }]}>
                  {t('training.reportAbsence')}
                </Text>
              </Pressable>
            ) : null}
            {myStatus === 'absent' ? (
              <Pressable
                style={[styles.myBtn, styles.myBtnGhost]}
                onPress={() => {
                  setMyStatus('unconfirmed');
                  setMyReason(undefined);
                  alert(t('training.alertCancelled'));
                }}>
                <IconSymbol name="arrow-left" size={16} color={colors.mint} />
                <Text style={[styles.myBtnText, { color: colors.mint }]}>
                  {t('training.cancelAbsence')}
                </Text>
              </Pressable>
            ) : null}
          </View>
        </>
      ) : null}

      {/* Parent: child attendance, read-only */}
      {isParent ? (
        <>
          <SectionLabel>{t('training.attendanceTitle', { name: 'Agon Gashi' })}</SectionLabel>
          <View style={styles.myCard}>
            <InitialsTile initials="AG" color="#8f86e8" size={42} />
            <View style={styles.myBody}>
              <Text style={styles.myName}>Agon Gashi</Text>
              <Text style={styles.myMeta}>
                {t(`trainings.${training.type.toLowerCase()}`)} · {training.day} {training.month}
              </Text>
              {myStatus === 'absent' && myReason ? (
                <Text style={styles.myReason}>{myReason}</Text>
              ) : null}
            </View>
            <StatusChip label={t(`attendance.${myStatus}`)} tone={STATUS_TONE[myStatus]} />
          </View>
          <Text style={styles.readOnlyNote}>{t('training.readOnly')}</Text>
        </>
      ) : null}

      {/* Staff: full roll-call */}
      {!isPlayer && !isParent ? (
        <>
          <SectionLabel>{t('training.staffHint')}</SectionLabel>
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
                <StatusChip label={t(`attendance.${r.status}`)} tone={STATUS_TONE[r.status]} />
              </Pressable>
            ))}
          </View>

          <Pressable
            style={styles.finalizeBtn}
            onPress={() => {
              alert(t('training.alertFinalized', { present, total: rows.length }));
              router.back();
            }}>
            <IconSymbol name="checkmark.circle.fill" size={18} color={colors.textOnPrimary} />
            <Text style={styles.finalizeText}>{t('training.finalize')}</Text>
          </Pressable>
        </>
      ) : null}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
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
    color: colors.mint,
    textTransform: 'lowercase',
  },
  meta: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
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
    color: colors.mint,
  },
  myCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
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
    color: colors.text,
  },
  myMeta: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  myReason: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: colors.textMuted,
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
    backgroundColor: colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
  },
  myBtnAlt: {
    backgroundColor: `${colors.warning}1a`,
    borderColor: `${colors.warning}55`,
    borderWidth: 1,
  },
  myBtnGhost: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
  },
  myBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: colors.textOnPrimary,
    textTransform: 'lowercase',
  },
  readOnlyNote: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: colors.textMuted,
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
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
    color: colors.text,
  },
  reason: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  finalizeBtn: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
  },
  finalizeText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textOnPrimary,
    textTransform: 'lowercase',
  },
});
