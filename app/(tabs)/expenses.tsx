import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconTile } from '@/components/list-row';
import { Screen, DetailHead, SectionLabel, StatCell } from '@/components/screen';
import { StatusChip, type StatusTone } from '@/components/status-chip';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_EXPENSES, type ExpenseStatus } from '@/lib/data';

const STATUS_TONE: Record<ExpenseStatus, StatusTone> = {
  paid: 'emerald',
  pending: 'warning',
  reimbursed: 'info',
};

const CATEGORY_META: Record<string, { icon: IconSymbolName; color: string }> = {
  travel: { icon: 'map.fill', color: '#185fa5' },
  equipment: { icon: 'fitness-center', color: '#408A71' },
  medical: { icon: 'stethoscope', color: '#f5a623' },
  facilities: { icon: 'hammer.fill', color: '#534AB7' },
  staff: { icon: 'person.2.fill', color: '#5aa7e6' },
};

function amountOf(amount: string) {
  return parseInt(amount.replace('€', ''), 10);
}

export default function ExpensesScreen() {
  const month = 'Sep';
  const monthExpenses = ALL_EXPENSES.filter((e) => e.month === month);
  const total = monthExpenses.reduce((sum, e) => sum + amountOf(e.amount), 0);
  const pending = monthExpenses.filter((e) => e.status === 'pending').length;

  const byCategory = Object.entries(
    monthExpenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + amountOf(e.amount);
      return acc;
    }, {}),
  );

  return (
    <Screen back>
      <DetailHead
        icon="receipt"
        accent="#408A71"
        title="expenses"
        subtitle={`club spending · ${month} · FC Prishtina`}
      />

      <View style={styles.statsRow}>
        <StatCell value={`€${total}`} label="this month" color={Colors.emerald} />
        <StatCell value={String(monthExpenses.length)} label="records" />
        <StatCell value={String(pending)} label="pending" color="#f5a623" />
      </View>

      <SectionLabel>by category · {month}</SectionLabel>
      <View style={styles.rowsCard}>
        {byCategory.map(([cat, amount]) => {
          const meta = CATEGORY_META[cat] ?? { icon: 'receipt' as const, color: Colors.textMuted };
          return (
            <View key={cat} style={styles.row}>
              <IconTile icon={meta.icon} color={meta.color} size={34} />
              <Text style={styles.rowLabel}>{cat}</Text>
              <Text style={styles.rowAmount}>€{amount}</Text>
            </View>
          );
        })}
      </View>

      <SectionLabel>all expenses</SectionLabel>
      <View style={styles.list}>
        {ALL_EXPENSES.map((e) => {
          const meta = CATEGORY_META[e.category] ?? { icon: 'receipt' as const, color: Colors.textMuted };
          return (
            <View key={e.id} style={styles.expenseRow}>
              <IconTile icon={meta.icon} color={meta.color} size={36} />
              <View style={styles.expenseBody}>
                <Text style={styles.expenseTitle}>{e.title}</Text>
                <Text style={styles.expenseMeta}>
                  {e.month} · {e.category}
                </Text>
              </View>
              <Text style={styles.expenseAmount}>{e.amount}</Text>
              <StatusChip label={e.status} tone={STATUS_TONE[e.status]} />
            </View>
          );
        })}
      </View>

      <Pressable style={styles.action} onPress={() => alert('Add expense — coming soon')}>
        <IconSymbol name="plus" size={18} color={Colors.textOnPrimary} />
        <Text style={styles.actionText}>add expense</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
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
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomColor: Colors.borderSoft,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: {
    flex: 1,
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    textTransform: 'capitalize',
    color: Colors.text,
  },
  rowAmount: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 15,
    color: Colors.mint,
  },
  list: {
    gap: Spacing.md,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  expenseBody: {
    flex: 1,
    gap: 2,
  },
  expenseTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.text,
  },
  expenseMeta: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'capitalize',
  },
  expenseAmount: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 14,
    color: Colors.text,
  },
  action: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
  },
  actionText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.textOnPrimary,
    textTransform: 'lowercase',
  },
});
