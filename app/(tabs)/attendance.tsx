import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { InitialsTile } from '@/components/list-row';
import { Screen, SectionLabel, StatCell } from '@/components/screen';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_PLAYERS, TRAINING_ATTENDANCE } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';

function barColor(pct: number) {
  if (pct >= 90) return '#2fbf71';
  if (pct >= 70) return '#5aa7e6';
  if (pct >= 50) return '#f5a623';
  return '#E24B4A';
}

export default function AttendanceScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const trainings = Object.values(TRAINING_ATTENDANCE);
  const totalSessions = trainings.length;

  const rows = ALL_PLAYERS.map((p) => {
    let present = 0;
    let total = 0;
    trainings.forEach((rows) => {
      const r = rows.find((a) => a.initials === p.initials);
      if (r) {
        total += 1;
        if (r.status === 'present') present += 1;
      }
    });
    return { player: p, present, total, pct: total > 0 ? Math.round((present / total) * 100) : 0 };
  }).sort((a, b) => b.pct - a.pct);

  const teamPct = rows.length ? Math.round(rows.reduce((s, r) => s + r.pct, 0) / rows.length) : 0;

  return (
    <Screen back>
      <View style={styles.summary}>
        <StatCell value={`${teamPct}%`} label={t('attendance.teamAvg')} />
        <StatCell value={String(totalSessions)} label={t('attendance.sessions')} />
        <StatCell value={String(rows.filter((r) => r.pct >= 90).length)} label={t('attendance.threshold')} color="#2fbf71" />
      </View>

      <SectionLabel>{t('attendance.byPlayer')}</SectionLabel>
      <View style={styles.list}>
        {rows.map(({ player, pct }) => (
          <Pressable
            key={player.id}
            style={styles.row}
            onPress={() => router.push(`/player?id=${player.id}`)}>
            <InitialsTile initials={player.initials} color={player.color} size={38} />
            <View style={styles.body}>
              <View style={styles.rowTop}>
                <Text style={styles.name}>{player.name}</Text>
                <Text style={[styles.pct, { color: barColor(pct) }]}>{pct}%</Text>
              </View>
              <View style={styles.bar}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${pct}%`, backgroundColor: barColor(pct) },
                  ]}
                />
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
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
  body: {
    flex: 1,
    gap: 6,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  name: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.text,
  },
  pct: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 14,
  },
  bar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceAlt,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 3,
  },
});
