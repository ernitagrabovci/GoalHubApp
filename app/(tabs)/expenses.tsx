import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { IconTile } from '@/components/list-row';
import { Screen, DetailHead, SectionLabel, StatCell } from '@/components/screen';
import { StatusChip, type StatusTone } from '@/components/status-chip';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_EXPENSES, type Expense, type ExpenseStatus } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';
import { usePersistedState } from '@/lib/storage';

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

const CATEGORY_ORDER = ['travel', 'equipment', 'medical', 'facilities', 'staff'];

function amountOf(amount: string) {
  return parseInt(amount.replace('€', ''), 10);
}

export default function ExpensesScreen() {
  const { t } = useLanguage();
  const month = 'Sep';
  const [expenses, setExpenses] = usePersistedState<Expense[]>('expenses:list', ALL_EXPENSES);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(CATEGORY_ORDER[0]);
  const [amount, setAmount] = useState('');
  const [newStatus, setNewStatus] = useState<ExpenseStatus>('pending');

  const monthExpenses = expenses.filter((e) => e.month === month);
  const total = monthExpenses.reduce((sum, e) => sum + amountOf(e.amount), 0);
  const pending = monthExpenses.filter((e) => e.status === 'pending').length;

  const byCategory = Object.entries(
    monthExpenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + amountOf(e.amount);
      return acc;
    }, {}),
  );

  const add = () => {
    const value = parseInt(amount.trim(), 10);
    if (!title.trim() || !Number.isFinite(value) || value <= 0) {
      alert(t('expenses.alertName'));
      return;
    }
    setExpenses((prev) => [
      { id: `e-${Date.now()}`, title: title.trim(), category, amount: `€${value}`, month, status: newStatus, color: CATEGORY_META[category]?.color ?? Colors.textMuted },
      ...prev,
    ]);
    setTitle('');
    setAmount('');
    alert(t('expenses.alertAdded', { title: title.trim() }));
  };

  return (
    <Screen back>
      <DetailHead
        icon="receipt"
        accent="#408A71"
        title={t('expenses.title')}
        subtitle={t('expenses.subtitle', { month })}
      />

      <View style={styles.statsRow}>
        <StatCell value={`€${total}`} label={t('expenses.thisMonth')} color={Colors.emerald} />
        <StatCell value={String(monthExpenses.length)} label={t('expenses.records')} />
        <StatCell value={String(pending)} label={t('expenses.pending')} color="#f5a623" />
      </View>

      <SectionLabel>{t('expenses.byCategory', { month })}</SectionLabel>
      <View style={styles.rowsCard}>
        {byCategory.map(([cat, amount]) => {
          const meta = CATEGORY_META[cat] ?? { icon: 'receipt' as const, color: Colors.textMuted };
          return (
            <View key={cat} style={styles.row}>
              <IconTile icon={meta.icon} color={meta.color} size={34} />
              <Text style={styles.rowLabel}>{t(`expenses.category.${cat}`)}</Text>
              <Text style={styles.rowAmount}>€{amount}</Text>
            </View>
          );
        })}
      </View>

      {/* Add expense */}
      <SectionLabel>{t('expenses.addExpense')}</SectionLabel>
      <View style={styles.formCard}>
        <TextInput
          style={styles.input}
          placeholder={t('expenses.titlePlaceholder')}
          placeholderTextColor={Colors.textMuted}
          value={title}
          onChangeText={setTitle}
          autoCorrect={false}
        />
        <View style={styles.chips}>
          {CATEGORY_ORDER.map((c) => {
            const meta = CATEGORY_META[c];
            const selected = category === c;
            return (
              <Pressable
                key={c}
                onPress={() => setCategory(c)}
                style={[styles.chip, selected && { backgroundColor: meta.color, borderColor: meta.color }]}>
                <IconSymbol name={meta.icon} size={13} color={selected ? Colors.textOnPrimary : meta.color} />
                <Text style={[styles.chipText, selected && { color: Colors.textOnPrimary }]}>{t(`expenses.category.${c}`)}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.formRow}>
          <View style={styles.amountBox}>
            <Text style={styles.amountPrefix}>€</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="0"
              placeholderTextColor={Colors.textMuted}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>
          <Pressable
            style={[styles.statusBtn, newStatus === 'pending' && styles.statusBtnPending]}
            onPress={() => setNewStatus(newStatus === 'pending' ? 'paid' : 'pending')}>
            <Text style={[styles.statusBtnText, newStatus === 'pending' && { color: Colors.textOnPrimary }]}>
              {t(`expenses.status.${newStatus}`)}
            </Text>
          </Pressable>
          <Pressable style={styles.addBtn} onPress={add}>
            <IconSymbol name="plus" size={16} color={Colors.textOnPrimary} />
          </Pressable>
        </View>
      </View>

      <SectionLabel>{t('expenses.allExpenses')}</SectionLabel>
      <View style={styles.list}>
        {expenses.length === 0 ? (
          <Text style={styles.empty}>{t('expenses.empty')}</Text>
        ) : (
          expenses.map((e) => {
            const meta = CATEGORY_META[e.category] ?? { icon: 'receipt' as const, color: Colors.textMuted };
            return (
              <View key={e.id} style={styles.expenseRow}>
                <IconTile icon={meta.icon} color={meta.color} size={36} />
                <View style={styles.expenseBody}>
                  <Text style={styles.expenseTitle}>{e.title}</Text>
                  <Text style={styles.expenseMeta}>
                    {e.month} · {t(`expenses.category.${e.category}`)}
                  </Text>
                </View>
                <Text style={styles.expenseAmount}>{e.amount}</Text>
                <StatusChip label={t(`expenses.status.${e.status}`)} tone={STATUS_TONE[e.status]} />
              </View>
            );
          })
        )}
      </View>
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
  formCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  input: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    color: Colors.text,
    fontFamily: Fonts.body,
    fontSize: 14,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceAlt,
  },
  chipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'lowercase',
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  amountBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
  },
  amountPrefix: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 14,
    color: Colors.textMuted,
  },
  amountInput: {
    flex: 1,
    color: Colors.text,
    fontFamily: Fonts.body,
    fontSize: 14,
    paddingVertical: Spacing.sm + 2,
  },
  statusBtn: {
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceAlt,
  },
  statusBtnPending: {
    backgroundColor: Colors.warning,
    borderColor: Colors.warning,
  },
  statusBtnText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'lowercase',
  },
  addBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.mint,
    borderRadius: Radius.md,
  },
  list: {
    gap: Spacing.md,
  },
  empty: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
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
});
