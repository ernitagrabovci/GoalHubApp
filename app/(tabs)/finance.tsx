import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Ring, StatBar } from '@/components/chart';
import { Screen, DetailHead, StatCell, SectionLabel } from '@/components/screen';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { feesForRole } from '@/lib/data';

const STATUS_COLOR: Record<'paid' | 'unpaid' | 'delayed' | 'critical', string> = {
  paid: Colors.emerald,
  unpaid: '#f5a623',
  delayed: Colors.purple,
  critical: Colors.danger,
};

export default function FinanceScreen() {
  const router = useRouter();
  const fees = feesForRole('administrator');

  const stats = useMemo(() => {
    const paid = fees.filter((f) => f.status === 'paid').length;
    const unpaid = fees.filter((f) => f.status === 'unpaid' || f.status === 'delayed').length;
    const critical = fees.filter((f) => f.status === 'critical').length;
    return { total: fees.length, paid, unpaid, critical };
  }, [fees]);

  const summary = [
    { status: 'paid' as const, label: 'paid', count: stats.paid },
    { status: 'unpaid' as const, label: 'unpaid', count: fees.filter((f) => f.status === 'unpaid').length },
    { status: 'delayed' as const, label: 'delayed', count: fees.filter((f) => f.status === 'delayed').length },
    { status: 'critical' as const, label: 'critical', count: stats.critical },
  ];

  const month = fees[0]?.month ?? 'Sep';

  return (
    <Screen>
      <DetailHead
        icon="dollarsign.circle.fill"
        accent={Colors.emerald}
        title="finance"
        subtitle={`membership fees · ${month} · FC Prishtina`}
      />

      {/* Overview */}
      <View style={styles.statsRow}>
        <StatCell value={String(stats.paid)} label="paid" color={Colors.emerald} />
        <StatCell value={String(stats.unpaid)} label="pending" color="#f5a623" />
        <StatCell value={String(stats.critical)} label="critical" color={Colors.danger} />
      </View>
      <View style={styles.collectedCard}>
        <View style={styles.collectedLeft}>
          <View style={[styles.collectedIcon, { backgroundColor: `${Colors.emerald}22` }]}>
            <IconSymbol name="dollarsign.circle.fill" size={20} color={Colors.emerald} />
          </View>
          <View style={styles.collectedBody}>
            <Text style={styles.collectedLabel}>collected this month</Text>
            <Text style={styles.collectedValue}>€8,420</Text>
            <Text style={styles.collectedSub}>{stats.total} fee records · {month}</Text>
          </View>
        </View>
        <Ring
          size={64}
          stroke={6}
          progress={stats.total ? stats.paid / stats.total : 0}
          color={Colors.emerald}
          label={`${stats.total ? Math.round((stats.paid / stats.total) * 100) : 0}%`}
          sublabel="paid"
        />
      </View>

      {/* Status breakdown */}
      <SectionLabel>status breakdown</SectionLabel>
      <View style={styles.breakdownCard}>
        {summary.map((s) => (
          <StatBar
            key={s.status}
            label={s.label}
            value={s.count}
            max={stats.total || 1}
            color={STATUS_COLOR[s.status]}
            display={`${s.count} · ${stats.total ? Math.round((s.count / stats.total) * 100) : 0}%`}
          />
        ))}
      </View>

      <Pressable style={styles.primaryBtn} onPress={() => router.push('/fees')}>
        <IconSymbol name="receipt" size={18} color={Colors.textOnPrimary} />
        <Text style={styles.primaryBtnText}>view all fees</Text>
      </Pressable>
      <Pressable style={styles.secondaryBtn} onPress={() => router.push('/expenses')}>
        <IconSymbol name="hammer.fill" size={18} color={Colors.mint} />
        <Text style={styles.secondaryBtnText}>club expenses</Text>
      </Pressable>
      <Pressable style={styles.secondaryBtn} onPress={() => router.push('/reports')}>
        <IconSymbol name="chart.bar.fill" size={18} color={Colors.mint} />
        <Text style={styles.secondaryBtnText}>finance reports</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  collectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  collectedLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  collectedIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectedBody: {
    flex: 1,
    gap: 2,
  },
  collectedLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  collectedValue: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    letterSpacing: -0.5,
    color: Colors.mint,
  },
  collectedSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },
  breakdownCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  primaryBtn: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
  },
  primaryBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.textOnPrimary,
    textTransform: 'lowercase',
  },
  secondaryBtn: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderColor: Colors.mint,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
  },
  secondaryBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.mint,
    textTransform: 'lowercase',
  },
});
