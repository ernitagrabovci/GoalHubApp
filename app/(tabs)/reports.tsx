import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen, DetailHead, StatCell, SectionLabel } from '@/components/screen';
import { StatusChip } from '@/components/status-chip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_MATCHES, ALL_NOTIFICATIONS, ALL_RATINGS, feesForRole } from '@/lib/data';

function resultOf(score: string): 'W' | 'D' | 'L' {
  const [a, b] = score.split('–').map((s) => parseInt(s.trim(), 10));
  if (a > b) return 'W';
  if (a < b) return 'L';
  return 'D';
}

const RESULT_TONE = { W: 'emerald', D: 'info', L: 'danger' } as const;

export default function ReportsScreen() {
  const [generated, setGenerated] = useState<Record<string, string | null>>({
    match: null,
    finance: null,
    activity: null,
  });
  const [date] = useState(
    () => `${new Date().getDate()} ${new Date().toLocaleString('en', { month: 'short' })}`,
  );

  const generate = (key: string, summary: string) => {
    setGenerated((prev) => ({ ...prev, [key]: summary }));
    alert('Report generated — ready to export.');
  };

  const played = ALL_MATCHES.filter((m) => m.status === 'played');
  const wins = played.filter((m) => resultOf(m.score ?? '0 – 0') === 'W').length;
  const fees = feesForRole('administrator');
  const paid = fees.filter((f) => f.status === 'paid').length;
  const pending = fees.filter((f) => f.status === 'unpaid' || f.status === 'delayed').length;
  const critical = fees.filter((f) => f.status === 'critical').length;

  const financeRows = [
    { month: 'Sep', collected: String(paid), pending: String(pending), critical: String(critical) },
    { month: 'Aug', collected: '14', pending: '3', critical: '1' },
    { month: 'Jul', collected: '12', pending: '4', critical: '2' },
  ];

  const activity = ALL_NOTIFICATIONS;

  return (
    <Screen>
      <DetailHead
        icon="chart.bar.fill"
        accent="#B0E4CC"
        title="reports"
        subtitle="season summaries · matches, finance & activity"
      />

      {/* Overview */}
      <View style={styles.statsRow}>
        <StatCell value={String(played.length)} label="matches" color="#B0E4CC" />
        <StatCell value={String(wins)} label="wins" color={Colors.emerald} />
        <StatCell value={`${ALL_RATINGS.length}`} label="ratings" color="#f5a623" />
      </View>

      <SectionLabel>match report</SectionLabel>
      <View style={styles.rowsCard}>
        {played.map((m) => {
          const res = resultOf(m.score ?? '0 – 0');
          return (
            <View key={m.id} style={styles.row}>
              <View style={styles.rowBody}>
                <Text style={styles.rowTitle}>{m.opponent}</Text>
                <Text style={styles.rowMeta}>{m.competition} · {m.day} {m.month}</Text>
              </View>
              <Text style={styles.score}>{m.score}</Text>
              <StatusChip label={res} tone={RESULT_TONE[res]} />
            </View>
          );
        })}
      </View>
      <Pressable
        style={styles.exportBtn}
        onPress={() => generate('match', `${played.length} played · ${wins} wins · ${date}`)}>
        <IconSymbol name="square.and.arrow.up" size={15} color={Colors.mint} />
        <Text style={styles.exportText}>export matches</Text>
      </Pressable>
      {generated.match ? (
        <View style={styles.generatedCard}>
          <IconSymbol name="checkmark.circle.fill" size={14} color={Colors.emerald} />
          <Text style={styles.generatedText}>match report · {generated.match}</Text>
        </View>
      ) : null}

      <SectionLabel>finance report</SectionLabel>
      <View style={styles.rowsCard}>
        {financeRows.map((r) => (
          <View key={r.month} style={styles.row}>
            <Text style={styles.rowTitle}>{r.month}</Text>
            <View style={styles.monthCol}>
              <Text style={[styles.countText, { color: Colors.emerald }]}>{r.collected} paid</Text>
              <Text style={styles.countSub}>{r.pending} pending · {r.critical} critical</Text>
            </View>
          </View>
        ))}
      </View>
      <Pressable
        style={styles.exportBtn}
        onPress={() => generate('finance', `${paid} paid · ${pending} pending · ${critical} critical · ${date}`)}>
        <IconSymbol name="square.and.arrow.up" size={15} color={Colors.mint} />
        <Text style={styles.exportText}>export finance</Text>
      </Pressable>
      {generated.finance ? (
        <View style={styles.generatedCard}>
          <IconSymbol name="checkmark.circle.fill" size={14} color={Colors.emerald} />
          <Text style={styles.generatedText}>finance report · {generated.finance}</Text>
        </View>
      ) : null}

      <SectionLabel>platform activity</SectionLabel>
      <View style={styles.rowsCard}>
        {activity.map((a) => (
          <View key={a.id} style={styles.row}>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>{a.title}</Text>
              <Text style={styles.rowMeta}>{a.source} · {a.time}</Text>
            </View>
            <IconSymbol name="chevron.right" size={16} color={Colors.textMuted} />
          </View>
        ))}
      </View>
      <Pressable
        style={styles.exportBtn}
        onPress={() => generate('activity', `${activity.length} events · ${date}`)}>
        <IconSymbol name="square.and.arrow.up" size={15} color={Colors.mint} />
        <Text style={styles.exportText}>export activity</Text>
      </Pressable>
      {generated.activity ? (
        <View style={styles.generatedCard}>
          <IconSymbol name="checkmark.circle.fill" size={14} color={Colors.emerald} />
          <Text style={styles.generatedText}>activity report · {generated.activity}</Text>
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  rowsCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomColor: Colors.borderSoft,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowBody: {
    flex: 1,
    gap: 1,
  },
  rowTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.text,
  },
  rowMeta: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
  },
  score: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 15,
    color: Colors.mint,
  },
  monthCol: {
    alignItems: 'flex-end',
    gap: 1,
  },
  countText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
  },
  countSub: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
  },
  exportText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.mint,
    textTransform: 'lowercase',
  },
  generatedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    backgroundColor: `${Colors.emerald}1a`,
    borderColor: `${Colors.emerald}55`,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  generatedText: {
    flex: 1,
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.emerald,
  },
});
