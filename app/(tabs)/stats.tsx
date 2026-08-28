import { StyleSheet, Text, View } from 'react-native';

import { InitialsTile } from '@/components/list-row';
import { Screen, SectionLabel, StatCell } from '@/components/screen';
import { StatusChip, type StatusTone } from '@/components/status-chip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { ALL_PLAYERS, ALL_RATINGS, PLAYER_PROFILES, PLAYER_SEASON, type Health } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';
import { useTheme, useThemedStyles } from '@/lib/theme';

const HEALTH_TONE: Record<Health, StatusTone> = {
  active: 'emerald',
  injured: 'danger',
  rehabilitation: 'warning',
  suspended: 'purple',
};

const CRITERIA = ['technique', 'physical', 'tactics', 'consistency', 'teamwork'] as const;

export default function StatsScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useLanguage();
  const player = ALL_PLAYERS.find((p) => p.name === 'Ardit Llapashtica') ?? ALL_PLAYERS[0];
  const season = PLAYER_SEASON[player.name];
  const profile = PLAYER_PROFILES[player.name];
  const rating = ALL_RATINGS.find((r) => r.player === player.name);

  const profileRows = [
    { label: t('stats.birth'), value: profile.birth },
    { label: t('stats.nationality'), value: profile.nationality },
    { label: t('stats.license'), value: profile.license },
    { label: t('stats.contract'), value: `${profile.contract} → ${profile.contractEnd}` },
    { label: t('stats.team'), value: profile.team },
  ];

  return (
    <Screen back>
      {/* Profile card — read-only */}
      <View style={styles.card}>
        <InitialsTile initials={player.initials} color={player.color} size={56} />
        <View style={styles.cardBody}>
          <Text style={styles.name}>{player.name}</Text>
          <Text style={styles.meta}>
            {t('common.personMeta', { position: player.position, number: player.number, age: player.age })}
          </Text>
          <View style={styles.tags}>
            <StatusChip label={t(`health.${player.health}`)} tone={HEALTH_TONE[player.health]} />
            <View style={styles.ratingChip}>
              <IconSymbol name="star.fill" size={11} color="#f5a623" />
              <Text style={styles.ratingText}>{player.rating.toFixed(1)}</Text>
            </View>
          </View>
        </View>
      </View>

      <SectionLabel>{t('stats.seasonStats')}</SectionLabel>
      <View style={styles.summary}>
        <StatCell value={String(season.matches)} label={t('stats.matches')} />
        <StatCell value={String(season.goals)} label={t('stats.goals')} color="#f5a623" />
        <StatCell value={String(season.assists)} label={t('stats.assists')} />
        <StatCell value={`${season.yellow}/${season.red}`} label={t('stats.cards')} color={colors.warning} />
        <StatCell value={`${season.minutes}`} label={t('stats.minutes')} />
      </View>

      <SectionLabel>{t('stats.profile')}</SectionLabel>
      <View style={styles.rowsCard}>
        {profileRows.map((r) => (
          <View key={r.label} style={styles.row}>
            <Text style={styles.rowLabel}>{r.label}</Text>
            <Text style={styles.rowValue}>{r.value}</Text>
          </View>
        ))}
      </View>

      {rating ? (
        <>
          <SectionLabel>{t('stats.latestRating')}</SectionLabel>
          <View style={styles.ratingCard}>
            <View style={styles.ratingHead}>
              <Text style={styles.ratingAvg}>{rating.average.toFixed(1)}</Text>
              <View style={styles.ratingHeadBody}>
                <Text style={styles.ratingBy}>{t('stats.ratedBy', { by: rating.by })}</Text>
                <Text style={styles.ratingDate}>{t('stats.ratingDate', { rated: rating.rated })}</Text>
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
            <Text style={styles.comment}>“{rating.comment}”</Text>
          </View>
        </>
      ) : null}

      <Text style={styles.note}>{t('stats.readOnly')}</Text>
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
    color: colors.textSecondary,
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  ratingText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: '#f5a623',
  },
  summary: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
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
    flexShrink: 1,
    textAlign: 'right',
  },
  ratingCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  ratingHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  ratingAvg: {
    fontFamily: Fonts.heading,
    fontSize: 32,
    color: '#f5a623',
  },
  ratingHeadBody: {
    flex: 1,
    gap: 1,
  },
  ratingBy: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: colors.text,
  },
  ratingDate: {
    fontFamily: Fonts.body,
    fontSize: 11,
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
  comment: {
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
