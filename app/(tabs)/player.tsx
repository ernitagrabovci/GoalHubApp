import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { InitialsTile } from '@/components/list-row';
import { Screen, SectionLabel, StatCell } from '@/components/screen';
import { StatusChip, type StatusTone } from '@/components/status-chip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import {
  ALL_INJURIES,
  ALL_PLAYERS,
  ALL_RATINGS,
  PLAYER_PROFILES,
  PLAYER_SEASON,
  type Health,
} from '@/lib/data';

const HEALTH_TONE: Record<Health, StatusTone> = {
  active: 'emerald',
  injured: 'danger',
  rehabilitation: 'warning',
  suspended: 'muted',
};

export default function PlayerScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const player = ALL_PLAYERS.find((p) => p.id === id) ?? ALL_PLAYERS[0];
  const profile = PLAYER_PROFILES[player.name];
  const season = PLAYER_SEASON[player.name];
  const ratings = ALL_RATINGS.filter((r) => r.player === player.name);
  const injuries = ALL_INJURIES.filter((i) => i.player === player.name);
  const latestRating = ratings[0];

  const rows: { label: string; value: string }[] = [
    { label: 'birth', value: profile.birth },
    { label: 'nationality', value: profile.nationality },
    { label: 'ffk license', value: profile.license },
    { label: 'team', value: profile.team },
    { label: 'contract', value: `${profile.contract} → ${profile.contractEnd}` },
  ];

  return (
    <Screen back>
      {/* Profile card */}
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <InitialsTile initials={player.initials} color={player.color} size={64} />
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
      </View>

      {/* Season stats */}
      <SectionLabel>season stats</SectionLabel>
      <View style={styles.statsRow}>
        <StatCell value={String(season.goals)} label="goals" />
        <StatCell value={String(season.assists)} label="assists" />
        <StatCell value={String(season.matches)} label="matches" />
        <StatCell value={`${Math.round(season.minutes / 90)}h`} label="played" />
      </View>

      {/* Profile rows */}
      <SectionLabel>details</SectionLabel>
      <View style={styles.rowsCard}>
        {rows.map((r) => (
          <View key={r.label} style={styles.row}>
            <Text style={styles.rowLabel}>{r.label}</Text>
            <Text style={styles.rowValue}>{r.value}</Text>
          </View>
        ))}
      </View>

      {/* Latest rating */}
      <SectionLabel>rating</SectionLabel>
      {latestRating ? (
        <View style={styles.ratingCard}>
          <Text style={styles.ratingAvg}>{latestRating.average.toFixed(1)}</Text>
          <View style={styles.criteriaCol}>
            <View style={styles.criteriaRow}>
              <Text style={styles.criteriaName}>technique</Text>
              <Text style={styles.criteriaValue}>{latestRating.technique.toFixed(1)}</Text>
            </View>
            <View style={styles.criteriaRow}>
              <Text style={styles.criteriaName}>physical</Text>
              <Text style={styles.criteriaValue}>{latestRating.physical.toFixed(1)}</Text>
            </View>
            <View style={styles.criteriaRow}>
              <Text style={styles.criteriaName}>tactics</Text>
              <Text style={styles.criteriaValue}>{latestRating.tactics.toFixed(1)}</Text>
            </View>
            <View style={styles.criteriaRow}>
              <Text style={styles.criteriaName}>consistency</Text>
              <Text style={styles.criteriaValue}>{latestRating.consistency.toFixed(1)}</Text>
            </View>
            <View style={styles.criteriaRow}>
              <Text style={styles.criteriaName}>teamwork</Text>
              <Text style={styles.criteriaValue}>{latestRating.teamwork.toFixed(1)}</Text>
            </View>
            <Text style={styles.ratingComment}>“{latestRating.comment}”</Text>
            <Text style={styles.ratingBy}>
              {latestRating.by} · {latestRating.rated}
            </Text>
          </View>
        </View>
      ) : (
        <Text style={styles.emptyText}>No ratings yet.</Text>
      )}

      {/* Injuries */}
      <SectionLabel>medical</SectionLabel>
      {injuries.length > 0 ? (
        <View style={styles.rowsCard}>
          {injuries.map((i) => (
            <Pressable key={i.id} style={styles.row} onPress={() => router.push(`/injury?id=${i.id}`)}>
              <View>
                <Text style={styles.rowValue}>{i.type}</Text>
                <Text style={styles.rowSub}>return {i.expected}</Text>
              </View>
              <StatusChip label={i.status} tone={HEALTH_TONE[i.status as Health] ?? 'muted'} />
            </Pressable>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyText}>No active injuries.</Text>
      )}

      <Pressable style={styles.rateBtn} onPress={() => router.push(`/rate?id=${player.id}`)}>
        <IconSymbol name="star.fill" size={16} color={Colors.textOnPrimary} />
        <Text style={styles.rateBtnText}>rate player</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cardBody: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 20,
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
    marginTop: 2,
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
  statsRow: {
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
  },
  rowSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  ratingCard: {
    flexDirection: 'row',
    gap: Spacing.lg,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  ratingAvg: {
    fontFamily: Fonts.heading,
    fontSize: 44,
    color: Colors.mint,
    letterSpacing: -1,
  },
  criteriaCol: {
    flex: 1,
    gap: 6,
  },
  criteriaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  criteriaName: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'lowercase',
  },
  criteriaValue: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.text,
  },
  ratingComment: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
  ratingBy: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
  },
  rateBtn: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
  },
  rateBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.textOnPrimary,
    textTransform: 'lowercase',
  },
});
