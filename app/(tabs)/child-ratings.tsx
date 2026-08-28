import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Screen, DetailHead } from '@/components/screen';
import { Fonts, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { ALL_RATINGS } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';
import { useThemedStyles } from '@/lib/theme';

const CRITERIA = ['technique', 'physical', 'tactics', 'consistency', 'teamwork'] as const;

export default function ChildRatingsScreen() {
  const styles = useThemedStyles(createStyles);
  const { t } = useLanguage();
  const { child = 'Agon Gashi' } = useLocalSearchParams<{ child?: string }>();
  const rating = ALL_RATINGS.find((r) => r.player === child);

  if (!rating) {
    return (
      <Screen back>
        <DetailHead icon="star.fill" accent="#f5a623" title={t('childRatings.title')} subtitle={child} />
        <Text style={styles.empty}>{t('childRatings.empty', { name: child })}</Text>
      </Screen>
    );
  }

  return (
    <Screen back>
      <DetailHead
        icon="star.fill"
        accent="#f5a623"
        title={t('childRatings.title')}
        subtitle={t('childRatings.ratedBySub', { name: child, by: rating.by })}
      />

      <View style={styles.card}>
        <View style={styles.head}>
          <Text style={styles.avg}>{rating.average.toFixed(1)}</Text>
          <View style={styles.headBody}>
            <Text style={styles.headTitle}>{t('childRatings.seasonAverage')}</Text>
            <Text style={styles.headDate}>{t('childRatings.fiveCriteria', { date: rating.rated })}</Text>
          </View>
        </View>

        <View style={styles.criteria}>
          {CRITERIA.map((c) => (
            <View key={c} style={styles.criterion}>
              <Text style={styles.criterionLabel}>{t(`rating.${c}`)}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${Math.round((rating[c] / 10) * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.criterionValue}>{rating[c].toFixed(1)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.commentRow}>
          <Text style={styles.comment}>“{rating.comment}”</Text>
        </View>
      </View>

      <Text style={styles.note}>{t('childRatings.readOnly')}</Text>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  empty: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: colors.textMuted,
  },
  card: {
    marginTop: Spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avg: {
    fontFamily: Fonts.heading,
    fontSize: 40,
    color: '#f5a623',
  },
  headBody: {
    flex: 1,
    gap: 1,
  },
  headTitle: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 16,
    color: colors.mint,
    textTransform: 'lowercase',
  },
  headDate: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  criteria: {
    gap: Spacing.sm,
  },
  criterion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  criterionLabel: {
    width: 78,
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    textTransform: 'capitalize',
    color: colors.textSecondary,
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.mint,
  },
  criterionValue: {
    width: 30,
    textAlign: 'right',
    fontFamily: Fonts.headingSemiBold,
    fontSize: 12,
    color: colors.mint,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  comment: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  note: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});
