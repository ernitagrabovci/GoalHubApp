import { StyleSheet, Text, View } from 'react-native';

import { Screen, DetailHead } from '@/components/screen';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_RATINGS } from '@/lib/data';

const CRITERIA: { label: string; key: 'technique' | 'physical' | 'tactics' | 'consistency' | 'teamwork' }[] = [
  { label: 'technique', key: 'technique' },
  { label: 'physical', key: 'physical' },
  { label: 'tactics', key: 'tactics' },
  { label: 'consistency', key: 'consistency' },
  { label: 'teamwork', key: 'teamwork' },
];

export default function ChildRatingsScreen() {
  const rating = ALL_RATINGS.find((r) => r.player === 'Agon Gashi');

  if (!rating) {
    return (
      <Screen back>
        <DetailHead icon="star.fill" accent="#f5a623" title="ratings" subtitle="Agon Gashi" />
        <Text style={styles.empty}>No ratings yet for Agon Gashi.</Text>
      </Screen>
    );
  }

  return (
    <Screen back>
      <DetailHead
        icon="star.fill"
        accent="#f5a623"
        title="ratings"
        subtitle={`Agon Gashi · rated by ${rating.by}`}
      />

      <View style={styles.card}>
        <View style={styles.head}>
          <Text style={styles.avg}>{rating.average.toFixed(1)}</Text>
          <View style={styles.headBody}>
            <Text style={styles.headTitle}>season average</Text>
            <Text style={styles.headDate}>{rating.rated} · 5-criteria</Text>
          </View>
        </View>

        <View style={styles.criteria}>
          {CRITERIA.map((c) => (
            <View key={c.label} style={styles.criterion}>
              <Text style={styles.criterionLabel}>{c.label}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.barFill,
                    { width: `${Math.round((rating[c.key] / 10) * 100)}%` },
                  ]}
                />
              </View>
              <Text style={styles.criterionValue}>{rating[c.key].toFixed(1)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.commentRow}>
          <Text style={styles.comment}>“{rating.comment}”</Text>
        </View>
      </View>

      <Text style={styles.note}>read-only · ratings are set by the coaching staff</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  empty: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
  },
  card: {
    marginTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
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
    color: Colors.mint,
    textTransform: 'lowercase',
  },
  headDate: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
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
    color: Colors.textSecondary,
  },
  barTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.surfaceAlt,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.mint,
  },
  criterionValue: {
    width: 30,
    textAlign: 'right',
    fontFamily: Fonts.headingSemiBold,
    fontSize: 12,
    color: Colors.mint,
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
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  note: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
});
