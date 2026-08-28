import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { InitialsTile } from '@/components/list-row';
import { Screen, SectionLabel } from '@/components/screen';
import { StatusChip, type StatusTone } from '@/components/status-chip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { INJURY_DETAILS } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';
import { injuriesStore, useCollection } from '@/lib/store';
import { useTheme, useThemedStyles } from '@/lib/theme';

const STATUS_TONE: Record<string, StatusTone> = {
  injured: 'danger',
  rehabilitation: 'warning',
  recovered: 'emerald',
};

export default function InjuryScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const router = useRouter();
  const { t } = useLanguage();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const injuries = useCollection(injuriesStore);
  const injury = injuries.find((i) => i.id === id) ?? injuries[0];
  const detail = INJURY_DETAILS[injury.id] ?? INJURY_DETAILS.i1;
  const recovered = injury.status === 'recovered';

  const markRecovered = () => {
    injuriesStore.update(injury.id, (i) => ({ ...i, status: 'recovered', expected: '—' }));
    router.back();
  };

  const infoRows = [
    { label: t('injury.occurredDuring'), value: detail.occurredDuring },
    { label: t('injury.injuryDate'), value: detail.date },
    { label: t('injury.expectedReturn'), value: injury.expected },
    { label: t('injury.status'), value: t(`health.${injury.status}`) },
  ];

  return (
    <Screen back>
      {/* Injury card */}
      <View style={styles.card}>
        <InitialsTile initials={injury.initials} color={injury.color} size={52} />
        <View style={styles.cardBody}>
          <Text style={styles.name}>{injury.player}</Text>
          <Text style={styles.type}>{injury.type}</Text>
          <View style={styles.tagRow}>
            <StatusChip label={t(`health.${injury.status}`)} tone={STATUS_TONE[injury.status]} />
          </View>
        </View>
      </View>

      <SectionLabel>{t('injury.details')}</SectionLabel>
      <View style={styles.rowsCard}>
        {infoRows.map((r) => (
          <View key={r.label} style={styles.row}>
            <Text style={styles.rowLabel}>{r.label}</Text>
            <Text style={styles.rowValue}>{r.value}</Text>
          </View>
        ))}
      </View>

      <SectionLabel>{t('injury.description')}</SectionLabel>
      <View style={styles.textCard}>
        <Text style={styles.text}>{detail.description}</Text>
      </View>

      <SectionLabel>{t('injury.treatment')}</SectionLabel>
      <View style={styles.textCard}>
        <Text style={styles.text}>{detail.treatment}</Text>
      </View>

      <SectionLabel>{t('injury.history')}</SectionLabel>
      <View style={styles.rowsCard}>
        {detail.history.map((h) => (
          <View key={h.date} style={styles.row}>
            <Text style={styles.rowLabel}>{h.date}</Text>
            <Text style={[styles.rowValue, styles.historyText]}>{h.change}</Text>
          </View>
        ))}
      </View>

      {!recovered ? (
        <Pressable style={styles.recoverBtn} onPress={markRecovered}>
          <IconSymbol name="checkmark.circle.fill" size={18} color={colors.textOnPrimary} />
          <Text style={styles.recoverBtnText}>{t('injury.markRecovered')}</Text>
        </Pressable>
      ) : null}
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
  type: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  tagRow: {
    marginTop: 2,
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
  historyText: {
    fontFamily: Fonts.body,
    textTransform: 'none',
    color: colors.textSecondary,
    flex: 1,
  },
  textCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  text: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  recoverBtn: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
  },
  recoverBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textOnPrimary,
    textTransform: 'lowercase',
  },
});
