import { StyleSheet, Text, View } from 'react-native';

import { InitialsTile } from '@/components/list-row';
import { Screen, SectionLabel, StatCell } from '@/components/screen';
import { StatusChip, type StatusTone } from '@/components/status-chip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_PLAYERS, ALL_RATINGS, PLAYER_PROFILES, PLAYER_SEASON, type Health } from '@/lib/data';

const HEALTH_TONE: Record<Health, StatusTone> = {
  active: 'emerald',
  injured: 'danger',
  rehabilitation: 'warning',
  suspended: 'purple',
};

const CRITERIA: { label: string; key: 'technique' | 'physical' | 'tactics' | 'consistency' | 'teamwork' }[] = [
  { label: 'technique', key: 'technique' },
  { label: 'physical', key: 'physical' },
  { label: 'tactics', key: 'tactics' },
  { label: 'consistency', key: 'consistency' },
  { label: 'teamwork', key: 'teamwork' },
];

export default function StatsScreen() {
  const player = ALL_PLAYERS.find((p) => p.name === 'Ardit Llapashtica') ?? ALL_PLAYERS[0];
  const season = PLAYER_SEASON[player.name];
  const profile = PLAYER_PROFILES[player.name];
  const rating = ALL_RATINGS.find((r) => r.player === player.name);

  const profileRows = [
    { label: 'birth', value: profile.birth },
    { label: 'nationality', value: profile.nationality },
    { label: 'license', value: profile.license },
    { label: 'contract', value: `${profile.contract} → ${profile.contractEnd}` },
    { label: 'team', value: profile.team },
  ];

  return (
    <Screen back>
      {/* Profile card — read-only */}
      <View style={styles.card}>
        <InitialsTile initials={player.initials} color={player.color} size={56} />
        <View style={styles.cardBody}>
          <Text style={styles.name}>{player.name}</Text>
          <Text style={styles.meta}>
            {player.position} · No. {player.number} · age {player.age}
          </Text>
          <View style={styles.tags}>
            <StatusChip label={player.health} tone={HEALTH_TONE[player.health]} />
            <View style={styles.ratingChip}>
              <IconSymbol name="star.fill" size={11} color="#f5a623" />
              <Text style={styles.ratingText}>{player.rating.toFixed(1)}</Text>
            </View>
          </View>
        </View>
      </View>

      <SectionLabel>season stats</SectionLabel>
      <View style={styles.summary}>
        <StatCell value={String(season.matches)} label="matches" />
        <StatCell value={String(season.goals)} label="goals" color="#f5a623" />
        <StatCell value={String(season.assists)} label="assists" />
        <StatCell value={`${season.yellow}/${season.red}`} label="cards" color={Colors.warning} />
        <StatCell value={`${season.minutes}`} label="minutes" />
      </View>

      <SectionLabel>profile</SectionLabel>
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
          <SectionLabel>latest rating</SectionLabel>
          <View style={styles.ratingCard}>
            <View style={styles.ratingHead}>
              <Text style={styles.ratingAvg}>{rating.average.toFixed(1)}</Text>
              <View style={styles.ratingHeadBody}>
                <Text style={styles.ratingBy}>rated by {rating.by}</Text>
                <Text style={styles.ratingDate}>{rating.rated} · 5-criteria</Text>
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
            <Text style={styles.comment}>“{rating.comment}”</Text>
          </View>
        </>
      ) : null}

      <Text style={styles.note}>read-only · your profile is managed by the club</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
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
    color: Colors.mint,
  },
  meta: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textSecondary,
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
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
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
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
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
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomColor: Colors.borderSoft,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  rowValue: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.text,
    flexShrink: 1,
    textAlign: 'right',
  },
  ratingCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
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
    color: Colors.text,
  },
  ratingDate: {
    fontFamily: Fonts.body,
    fontSize: 11,
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
  comment: {
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
