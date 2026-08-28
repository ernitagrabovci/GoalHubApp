import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Ring, StatBar } from '@/components/chart';
import { Screen, DetailHead, StatCell, SectionLabel } from '@/components/screen';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { applyFeeOverrides, feesForRole, type Fee, type FeeOverride } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { usePersistedState } from '@/lib/storage';
import { useTheme, useThemedStyles } from '@/lib/theme';

const statusColor = (
  colors: ThemeColors,
): Record<'paid' | 'unpaid' | 'delayed' | 'critical', string> => ({
  paid: colors.emerald,
  unpaid: '#f5a623',
  delayed: colors.purple,
  critical: colors.danger,
});

const METHODS = ['cash', 'bank', 'card'] as const;

export default function FinanceScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useLanguage();
  const { user } = useSession();
  const canRegister = user?.role === 'administrator' || user?.role === 'financier';

  const [overrides, setOverrides] = usePersistedState<Record<string, FeeOverride>>('payments:overrides', {});
  const fees = useMemo(
    () => applyFeeOverrides(feesForRole('administrator'), overrides),
    [overrides],
  );

  const [showReg, setShowReg] = useState(false);
  const [regKey, setRegKey] = useState<string | null>(null);
  const [regMethod, setRegMethod] = useState<string>(METHODS[0]);

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

  const unpaidFees = fees.filter((f) => f.status !== 'paid');
  const month = fees[0]?.month ?? 'Sep';

  const amountOf = (f: Fee) => parseInt(f.amount.replace(/\D/g, ''), 10) || 0;
  const collected = fees
    .filter((f) => f.month === month && f.status === 'paid')
    .reduce((sum, f) => sum + amountOf(f), 0);

  const confirmPayment = () => {
    if (!regKey) {
      alert(t('finance.selectFee'));
      return;
    }
    const [name, monthPart] = regKey.split('|');
    setOverrides((prev) => ({ ...prev, [regKey]: { method: regMethod, paidAt: 'Today' } }));
    setRegKey(null);
    setShowReg(false);
    alert(t('finance.alertPaid', { name, month: monthPart }));
  };

  return (
    <Screen back>
      <DetailHead
        icon="dollarsign.circle.fill"
        accent={colors.emerald}
        title={t('finance.title')}
        subtitle={t('finance.subtitle', { month })}
      />

      {canRegister ? (
        <>
          <Pressable style={styles.registerToggle} onPress={() => setShowReg((s) => !s)}>
            <IconSymbol name={showReg ? 'xmark' : 'plus'} size={16} color={colors.textOnPrimary} />
            <Text style={styles.registerToggleText}>
              {showReg ? t('common.closeForm') : t('finance.register')}
            </Text>
          </Pressable>
          {showReg ? (
            <View style={styles.regCard}>
              <Text style={styles.fieldLabel}>{t('finance.selectFee')}</Text>
              {unpaidFees.length === 0 ? (
                <Text style={styles.regEmpty}>{t('finance.noUnpaid')}</Text>
              ) : (
                <View style={styles.wrap}>
                  {unpaidFees.map((f) => {
                    const key = `${f.name}|${f.month}`;
                    const selected = regKey === key;
                    return (
                      <Pressable
                        key={key}
                        onPress={() => setRegKey(selected ? null : key)}
                        style={[styles.chip, selected && styles.chipActive]}>
                        <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                          {f.name} · {f.month}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
              <Text style={styles.fieldLabel}>{t('finance.method')}</Text>
              <View style={styles.wrap}>
                {METHODS.map((m) => {
                  const selected = regMethod === m;
                  return (
                    <Pressable
                      key={m}
                      onPress={() => setRegMethod(m)}
                      style={[styles.chip, selected && styles.chipActive]}>
                      <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                        {t(`finance.${m}`)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable style={styles.regBtn} onPress={confirmPayment}>
                <IconSymbol name="checkmark.circle.fill" size={16} color={colors.textOnPrimary} />
                <Text style={styles.regBtnText}>{t('finance.confirm')}</Text>
              </Pressable>
            </View>
          ) : null}
        </>
      ) : null}

      {/* Overview */}
      <View style={styles.statsRow}>
        <StatCell value={String(stats.paid)} label={t('status.paid')} color={colors.emerald} />
        <StatCell value={String(stats.unpaid)} label={t('finance.pending')} color="#f5a623" />
        <StatCell value={String(stats.critical)} label={t('status.critical')} color={colors.danger} />
      </View>
      <View style={styles.collectedCard}>
        <View style={styles.collectedLeft}>
          <View style={[styles.collectedIcon, { backgroundColor: `${colors.emerald}22` }]}>
            <IconSymbol name="dollarsign.circle.fill" size={20} color={colors.emerald} />
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
          color={colors.emerald}
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
            color={statusColor(colors)[s.status]}
            display={`${s.count} · ${stats.total ? Math.round((s.count / stats.total) * 100) : 0}%`}
          />
        ))}
      </View>

      <Pressable style={styles.primaryBtn} onPress={() => router.push('/fees')}>
        <IconSymbol name="receipt" size={18} color={colors.textOnPrimary} />
        <Text style={styles.primaryBtnText}>{t('finance.viewAllFees')}</Text>
      </Pressable>
      <Pressable style={styles.secondaryBtn} onPress={() => router.push('/expenses')}>
        <IconSymbol name="hammer.fill" size={18} color={colors.mint} />
        <Text style={styles.secondaryBtnText}>{t('finance.clubExpenses')}</Text>
      </Pressable>
      <Pressable style={styles.secondaryBtn} onPress={() => router.push('/reports')}>
        <IconSymbol name="chart.bar.fill" size={18} color={colors.mint} />
        <Text style={styles.secondaryBtnText}>{t('finance.financeReports')}</Text>
      </Pressable>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
    backgroundColor: colors.surface,
    borderColor: colors.border,
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
    color: colors.textMuted,
  },
  collectedValue: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    letterSpacing: -0.5,
    color: colors.mint,
  },
  collectedSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  breakdownCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
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
    backgroundColor: colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
  },
  primaryBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textOnPrimary,
    textTransform: 'lowercase',
  },
  secondaryBtn: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: colors.surface,
    borderColor: colors.mint,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
  },
  secondaryBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: colors.mint,
    textTransform: 'lowercase',
  },
  registerToggle: {
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
  },
  registerToggleText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textOnPrimary,
    textTransform: 'lowercase',
  },
  regCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  regEmpty: {
    fontFamily: Fonts.body,
    fontSize: 13,
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
  regBtn: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
  },
  regBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textOnPrimary,
    textTransform: 'lowercase',
  },
});
