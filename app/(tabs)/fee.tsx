import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { InitialsTile } from '@/components/list-row';
import { Screen, SectionLabel } from '@/components/screen';
import { StatusChip, type StatusTone } from '@/components/status-chip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { feesForRole, type FeeStatus } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { usePersistedState } from '@/lib/storage';
import { useTheme, useThemedStyles } from '@/lib/theme';

const STATUS_TONE: Record<FeeStatus, StatusTone> = {
  paid: 'emerald',
  unpaid: 'warning',
  delayed: 'purple',
  critical: 'danger',
};

const METHODS = ['cash', 'bank transfer', 'card'] as const;

const REF_KEY: Record<string, string> = {
  cash: 'fee.ref.invoice number',
  'bank transfer': 'fee.ref.transaction number',
  card: 'fee.ref.authorization number',
};

export default function FeeScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useSession();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const source = feesForRole('administrator').find((f) => f.id === id) ?? feesForRole('administrator')[0];
  const [status, setStatus] = usePersistedState<FeeStatus>(`fee:${source.id}:status`, source.status);
  const [method, setMethod] = usePersistedState<string>(`fee:${source.id}:method`, METHODS[0]);
  const [ref, setRef] = usePersistedState<string>(`fee:${source.id}:ref`, '');
  const [receipt, setReceipt] = usePersistedState<boolean>(`fee:${source.id}:receipt`, false);
  const refLabel = t(REF_KEY[method] ?? 'fee.ref.reference');

  const paid = status === 'paid';
  const canManage = user?.role === 'administrator' || user?.role === 'financier';

  const infoRows = [
    { label: t('fee.member'), value: source.name },
    { label: t('fee.month'), value: source.month },
    { label: t('fee.amount'), value: source.amount },
    { label: t('fee.status'), value: t(`status.${status}`) },
  ];

  return (
    <Screen back>
      {/* Fee card */}
      <View style={styles.card}>
        <InitialsTile initials={source.initials} color={source.color} size={52} />
        <View style={styles.cardBody}>
          <Text style={styles.name}>{source.name}</Text>
          <Text style={styles.meta}>
            {t('fee.membershipMeta', { month: source.month, amount: source.amount })}
          </Text>
          <View style={styles.statusRow}>
            <StatusChip label={t(`status.${status}`)} tone={STATUS_TONE[status]} />
            {paid ? <Text style={styles.paidText}>{t('fee.received')}</Text> : null}
          </View>
        </View>
      </View>

      <SectionLabel>{t('fee.details')}</SectionLabel>
      <View style={styles.rowsCard}>
        {infoRows.map((r) => (
          <View key={r.label} style={styles.row}>
            <Text style={styles.rowLabel}>{r.label}</Text>
            <Text style={styles.rowValue}>{r.value}</Text>
          </View>
        ))}
      </View>

      {canManage && !paid ? (
        <>
          <SectionLabel>{t('fee.registerPayment')}</SectionLabel>
          <View style={styles.chips}>
            {METHODS.map((m) => (
              <Pressable
                key={m}
                onPress={() => setMethod(m)}
                style={[styles.chip, method === m && styles.chipActive]}>
                <Text style={[styles.chipText, method === m && styles.chipTextActive]}>{t(`fee.method.${m}`)}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.proofBox}>
            <Text style={styles.proofLabel}>{refLabel}</Text>
            <TextInput
              style={styles.proofInput}
              placeholder={t('fee.refPlaceholder', { label: refLabel })}
              placeholderTextColor={colors.textMuted}
              value={ref}
              onChangeText={setRef}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable style={styles.attachRow} onPress={() => setReceipt((r) => !r)}>
              <IconSymbol
                name="doc.text.fill"
                size={16}
                color={receipt ? colors.emerald : colors.textMuted}
              />
              <Text style={[styles.attachText, receipt && { color: colors.emerald }]}>
                {t(receipt ? 'fee.receiptAttached' : 'fee.attachReceipt')}
              </Text>
              {receipt ? (
                <IconSymbol name="checkmark.circle.fill" size={16} color={colors.emerald} />
              ) : null}
            </Pressable>
          </View>
          <Pressable
            style={styles.payBtn}
            onPress={() => {
              if (!ref.trim()) {
                alert(t('fee.alertRef', { label: refLabel }));
                return;
              }
              setStatus('paid');
              alert(
                t('fee.alertPaid', {
                  amount: source.amount,
                  method: t(`fee.method.${method}`),
                  label: refLabel,
                  ref: ref.trim(),
                }),
              );
            }}>
            <IconSymbol name="checkmark.circle.fill" size={18} color={colors.textOnPrimary} />
            <Text style={styles.payBtnText}>{t('fee.markAsPaid')}</Text>
          </Pressable>
        </>
      ) : (
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}>
          <Text style={styles.backBtnText}>{t('fee.backToFees')}</Text>
        </Pressable>
      )}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
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
  cardBody: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 18,
    color: colors.mint,
  },
  meta: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  paidText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: colors.emerald,
    textTransform: 'lowercase',
  },
  rowsCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
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
    borderBottomColor: colors.borderSoft,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  rowValue: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: colors.text,
    textTransform: 'capitalize',
    flexShrink: 1,
    textAlign: 'right',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 7,
    paddingHorizontal: Spacing.md,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.mint,
    borderColor: colors.mint,
  },
  chipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'lowercase',
  },
  chipTextActive: {
    color: colors.textOnPrimary,
  },
  proofBox: {
    marginTop: Spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  proofLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  proofInput: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    color: colors.text,
    fontFamily: Fonts.body,
    fontSize: 14,
  },
  attachRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 2,
  },
  attachText: {
    flex: 1,
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'lowercase',
  },
  payBtn: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
  },
  payBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textOnPrimary,
    textTransform: 'lowercase',
  },
  backBtn: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
  },
  backBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: colors.mint,
    textTransform: 'lowercase',
  },
});
