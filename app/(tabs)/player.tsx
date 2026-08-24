import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { StatBar } from '@/components/chart';
import { EmptyState } from '@/components/empty-state';
import { InitialsTile } from '@/components/list-row';
import { Screen, SectionLabel, StatCell } from '@/components/screen';
import { StatusChip, type StatusTone } from '@/components/status-chip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import {
  ALL_INJURIES,
  ALL_PLAYERS,
  ALL_RATINGS,
  PLAYER_FORM,
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

const CRITERIA: { label: string; key: 'technique' | 'physical' | 'tactics' | 'consistency' | 'teamwork' }[] = [
  { label: 'technique', key: 'technique' },
  { label: 'physical', key: 'physical' },
  { label: 'tactics', key: 'tactics' },
  { label: 'consistency', key: 'consistency' },
  { label: 'teamwork', key: 'teamwork' },
];

const CRITERION_COLOR: Record<(typeof CRITERIA)[number]['key'], string> = {
  technique: '#f5a623',
  physical: '#E24B4A',
  tactics: '#5aa7e6',
  consistency: '#408A71',
  teamwork: '#8f86e8',
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
  const form = PLAYER_FORM[player.name] ?? [];

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
          <View style={styles.ratingHead}>
            <Text style={styles.ratingAvg}>{latestRating.average.toFixed(1)}</Text>
            <View style={styles.ratingHeadBody}>
              <Text style={styles.ratingComment}>“{latestRating.comment}”</Text>
              <Text style={styles.ratingBy}>
                {latestRating.by} · {latestRating.rated}
              </Text>
            </View>
          </View>
          <View style={styles.criteria}>
            {CRITERIA.map((c) => (
              <StatBar
                key={c.label}
                label={c.label}
                value={latestRating[c.key]}
                max={10}
                color={CRITERION_COLOR[c.key]}
                display={latestRating[c.key].toFixed(1)}
              />
            ))}
          </View>
        </View>
      ) : (
        <EmptyState
          icon="star.fill"
          title="No ratings yet"
          subtitle="A coach assessment will appear here."
        />
      )}

      {/* Form trend */}
      <SectionLabel>form</SectionLabel>
      {form.length > 0 ? (
        <View style={styles.formCard}>
          {form.map((f, i) => {
            const prev = form[i - 1]?.value;
            const color =
              prev == null
                ? Colors.mint
                : f.value > prev
                  ? Colors.emerald
                  : f.value < prev
                    ? Colors.danger
                    : Colors.textMuted;
            return (
              <StatBar
                key={f.period}
                label={f.period}
                value={f.value}
                max={10}
                color={color}
                display={f.value.toFixed(1)}
              />
            );
          })}
        </View>
      ) : (
        <EmptyState
          icon="chart.bar.fill"
          title="No form history"
          subtitle="A trend appears after a few weekly assessments."
        />
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
        <EmptyState
          icon="stethoscope"
          title="No active injuries"
          subtitle="Medical records appear here when needed."
        />
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
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  ratingHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  ratingAvg: {
    fontFamily: Fonts.heading,
    fontSize: 44,
    color: Colors.mint,
    letterSpacing: -1,
  },
  ratingHeadBody: {
    flex: 1,
    gap: 4,
  },
  criteria: {
    gap: Spacing.md,
  },
  ratingComment: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  ratingBy: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.textMuted,
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.md,
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
