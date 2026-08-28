import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { InitialsTile } from '@/components/list-row';
import { Screen, SectionLabel } from '@/components/screen';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { ALL_PLAYERS } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';
import { ratingsStore } from '@/lib/store';
import { useTheme, useThemedStyles } from '@/lib/theme';

const CRITERIA = ['technique', 'physical', 'tactics', 'consistency', 'teamwork'] as const;

type CriteriaKey = (typeof CRITERIA)[number];

const clamp = (v: number) => Math.min(10, Math.max(1, v));

export default function RateScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const router = useRouter();
  const { t } = useLanguage();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const player = ALL_PLAYERS.find((p) => p.id === id) ?? ALL_PLAYERS[0];
  const [scores, setScores] = useState<Record<CriteriaKey, number>>({
    technique: 7,
    physical: 7,
    tactics: 7,
    consistency: 7,
    teamwork: 7,
  });

  const average = CRITERIA.reduce((sum, c) => sum + scores[c], 0) / CRITERIA.length;

  const avgHint = t(
    average >= 8
      ? 'rate.hint.outstanding'
      : average >= 7
        ? 'rate.hint.solid'
        : average >= 6
          ? 'rate.hint.developing'
          : 'rate.hint.below',
  );

  const bump = (key: CriteriaKey, delta: number) => {
    setScores((prev) => ({ ...prev, [key]: clamp(prev[key] + delta) }));
  };

  const save = () => {
    ratingsStore.prepend({
      id: `r-${Date.now()}`,
      player: player.name,
      initials: player.initials,
      color: player.color,
      technique: scores.technique,
      physical: scores.physical,
      tactics: scores.tactics,
      consistency: scores.consistency,
      teamwork: scores.teamwork,
      average,
      comment: avgHint,
      by: 'Rexhep Hyseni',
      rated: `${new Date().getDate()} ${new Date().toLocaleString('en', { month: 'short' })}`,
    });
    router.back();
  };

  return (
    <Screen back>
      <View style={styles.headRow}>
        <InitialsTile initials={player.initials} color={player.color} size={52} />
        <View style={styles.headBody}>
          <Text style={styles.name}>{player.name}</Text>
          <Text style={styles.meta}>
            {player.position} · No. {player.number} · {t('rate.scale')}
          </Text>
        </View>
      </View>

      <SectionLabel>{t('rate.criteria')}</SectionLabel>
      <View style={styles.card}>
        {CRITERIA.map((c, i) => (
          <View
            key={c}
            style={[styles.criterion, i < CRITERIA.length - 1 && styles.criterionBorder]}>
            <Text style={styles.criterionLabel}>{t(`rating.${c}`)}</Text>
            <View style={styles.stepper}>
              <Pressable style={styles.stepBtn} onPress={() => bump(c, -0.5)} hitSlop={6}>
                <IconSymbol name="xmark" size={16} color={colors.mint} />
              </Pressable>
              <Text style={styles.stepValue}>{scores[c].toFixed(1)}</Text>
              <Pressable style={styles.stepBtn} onPress={() => bump(c, 0.5)} hitSlop={6}>
                <IconSymbol name="plus" size={16} color={colors.mint} />
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      {/* Live average */}
      <SectionLabel>{t('rate.average')}</SectionLabel>
      <View style={styles.avgCard}>
        <Text style={styles.avgValue}>{average.toFixed(1)}</Text>
        <Text style={styles.avgHint}>{avgHint}</Text>
      </View>

      <Pressable style={styles.saveBtn} onPress={save}>
        <IconSymbol name="checkmark.circle.fill" size={18} color={colors.textOnPrimary} />
        <Text style={styles.saveBtnText}>{t('rate.saveRating')}</Text>
      </Pressable>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  headBody: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 18,
    color: colors.mint,
  },
  meta: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
  },
  criterion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  criterionBorder: {
    borderBottomColor: colors.borderSoft,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  criterionLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: colors.text,
    textTransform: 'lowercase',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
  },
  stepValue: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 16,
    color: colors.mint,
    minWidth: 40,
    textAlign: 'center',
  },
  avgCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  avgValue: {
    fontFamily: Fonts.heading,
    fontSize: 44,
    color: colors.mint,
    letterSpacing: -1,
  },
  avgHint: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  saveBtn: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
  },
  saveBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textOnPrimary,
    textTransform: 'lowercase',
  },
});
