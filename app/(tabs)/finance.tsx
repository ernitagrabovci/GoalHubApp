import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Ring, StatBar } from '@/components/chart';
import { Screen, DetailHead, StatCell, SectionLabel } from '@/components/screen';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { feesForRole, type Fee } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';

const STATUS_COLOR: Record<'paid' | 'unpaid' | 'delayed' | 'critical', string> = {
  paid: Colors.emerald,
  unpaid: '#f5a623',
  delayed: Colors.purple,
  critical: Colors.danger,
};

export default function FinanceScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const fees = feesForRole('administrator');

  const stats = useMemo(() => {
    const paid = fees.filter((f) => f.status === 'paid').length;
    const unpaid = fees.filter((f) => f.status === 'unpaid' || f.status === 'delayed').length;
    const critical = fees.filter((f) => f.status === 'critical').length;
    return { total: fees.length, paid, unpaid, critical };
  }, [fees]);

  const summary = [
    { status: 'paid' as const, count: stats.paid },
    { status: 'unpaid' as const, count: fees.filter((f) => f.status === 'unpaid').length },
    { status: 'delayed' as const, count: fees.filter((f) => f.status === 'delayed').length },
    { status: 'critical' as const, count: stats.critical },
  ];

  const month = fees[0]?.month ?? 'Sep';

  const amountOf = (f: Fee) => parseInt(f.amount.replace(/\D/g, ''), 10) || 0;
  const collected = fees
    .filter((f) => f.month === month && f.status === 'paid')
    .reduce((sum, f) => sum + amountOf(f), 0);

  return (
    <Screen back>
      <DetailHead
        icon="dollarsign.circle.fill"
        accent={Colors.emerald}
        title={t('finance.title')}
        subtitle={t('finance.subtitle', { month })}
      />

      {/* Overview */}
      <View style={styles.statsRow}>
        <StatCell value={String(stats.paid)} label={t('status.paid')} color={Colors.emerald} />
        <StatCell value={String(stats.unpaid)} label={t('finance.pending')} color="#f5a623" />
        <StatCell value={String(stats.critical)} label={t('status.critical')} color={Colors.danger} />
      </View>
      <View style={styles.collectedCard}>
        <View style={styles.collectedLeft}>
          <View style={[styles.collectedIcon, { backgroundColor: `${Colors.emerald}22` }]}>
            <IconSymbol name="dollarsign.circle.fill" size={20} color={Colors.emerald} />
          </View>
          <View style={styles.collectedBody}>
            <Text style={styles.collectedLabel}>{t('finance.collectedThisMonth')}</Text>
            <Text style={styles.collectedValue}>€{collected.toLocaleString()}</Text>
            <Text style={styles.collectedSub}>
              {t('finance.feeRecords', { total: stats.total, month })}
            </Text>
          </View>
        </View>
        <Ring
          size={64}
          stroke={6}
          progress={stats.total ? stats.paid / stats.total : 0}
          color={Colors.emerald}
          label={`${stats.total ? Math.round((stats.paid / stats.total) * 100) : 0}%`}
          sublabel={t('status.paid')}
        />
      </View>

      {/* Status breakdown */}
      <SectionLabel>{t('sections.statusBreakdown')}</SectionLabel>
      <View style={styles.breakdownCard}>
        {summary.map((s) => (
          <StatBar
            key={s.status}
            label={t(`status.${s.status}`)}
            value={s.count}
            max={stats.total || 1}
            color={STATUS_COLOR[s.status]}
            display={`${s.count} · ${stats.total ? Math.round((s.count / stats.total) * 100) : 0}%`}
          />
        ))}
      </View>

      <Pressable style={styles.primaryBtn} onPress={() => router.push('/fees')}>
        <IconSymbol name="receipt" size={18} color={Colors.textOnPrimary} />
        <Text style={styles.primaryBtnText}>{t('finance.viewAllFees')}</Text>
      </Pressable>
      <Pressable style={styles.secondaryBtn} onPress={() => router.push('/expenses')}>
        <IconSymbol name="hammer.fill" size={18} color={Colors.mint} />
        <Text style={styles.secondaryBtnText}>{t('finance.clubExpenses')}</Text>
      </Pressable>
      <Pressable style={styles.secondaryBtn} onPress={() => router.push('/reports')}>
        <IconSymbol name="chart.bar.fill" size={18} color={Colors.mint} />
        <Text style={styles.secondaryBtnText}>{t('finance.financeReports')}</Text>
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
