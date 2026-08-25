import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Ring } from '@/components/chart';
import { EmptyState } from '@/components/empty-state';
import { InitialsTile, ListRow } from '@/components/list-row';
import { Screen, SectionLabel, StatCell } from '@/components/screen';
import { StatusChip } from '@/components/status-chip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_MATCHES, ALL_PLAYERS, ALL_TEAMS, MATCH_DETAILS } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';

function playerId(name: string) {
  return ALL_PLAYERS.find((p) => p.name === name)?.id ?? '';
}

function resultOf(score: string): 'W' | 'D' | 'L' {
  const [a, b] = score.split('–').map((s) => parseInt(s.trim(), 10));
  if (a > b) return 'W';
  if (a < b) return 'L';
  return 'D';
}

export default function TeamScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const team = ALL_TEAMS.find((t) => t.id === id) ?? ALL_TEAMS[0];

  const infoRows = [
    { label: t('team.category'), value: team.category },
    { label: t('team.season'), value: team.season },
    { label: t('team.trainer'), value: team.trainer },
    { label: t('team.squadSize'), value: String(team.members.length) },
  ];

  const playedMatches = ALL_MATCHES.filter((m) => m.status === 'played' && m.teamId === team.id);
  const results = playedMatches.map((m) => resultOf(m.score ?? '0 – 0'));
  const wins = results.filter((r) => r === 'W').length;
  const draws = results.filter((r) => r === 'D').length;
  const losses = results.filter((r) => r === 'L').length;
  let goalsFor = 0;
  let goalsAgainst = 0;
  playedMatches.forEach((m) => {
    const [a, b] = (m.score ?? '0 – 0').split('–').map((s) => parseInt(s.trim(), 10));
    goalsFor += a;
    goalsAgainst += b;
  });

  const teamMatchIds = new Set(playedMatches.map((m) => m.id));
  const scorerTotals = new Map<string, { name: string; initials: string; color: string; goals: number; assists: number }>();
  Object.entries(MATCH_DETAILS)
    .filter(([mid]) => teamMatchIds.has(mid))
    .forEach(([, d]) =>
    d.stats.forEach((s) => {
      const cur = scorerTotals.get(s.player) ?? { name: s.player, initials: s.initials, color: s.color, goals: 0, assists: 0 };
      cur.goals += s.goals;
      cur.assists += s.assists;
      scorerTotals.set(s.player, cur);
    }),
  );
  const scorers = [...scorerTotals.values()]
    .filter((s) => s.goals + s.assists > 0)
    .sort((a, b) => b.goals + b.assists - (a.goals + a.assists))
    .slice(0, 4);

  return (
    <Screen back>
      {/* Team card */}
      <View style={styles.card}>
        <View style={[styles.teamIcon, { backgroundColor: `${team.color}22` }]}>
          <IconSymbol name="person.2.fill" size={24} color={team.color} />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.name}>{team.name}</Text>
          <Text style={styles.subtitle}>
            {team.category} · {team.season}
          </Text>
          <View style={styles.tagRow}>
            <StatusChip label={t(`category.${team.category}`)} tone={team.category === 'Senior' ? 'emerald' : 'info'} />
          </View>
        </View>
      </View>

      <SectionLabel>{t('team.details')}</SectionLabel>
      <View style={styles.rowsCard}>
        {infoRows.map((r) => (
          <View key={r.label} style={styles.row}>
            <Text style={styles.rowLabel}>{r.label}</Text>
            <Text style={styles.rowValue}>{r.value}</Text>
          </View>
        ))}
      </View>

      <SectionLabel>{t('team.players')}</SectionLabel>
      <View style={styles.list}>
        {team.members.length === 0 ? (
          <EmptyState
            icon="person.2.fill"
            title={t('team.emptyPlayersTitle')}
            subtitle={t('team.emptyPlayersSub')}
          />
        ) : (
          team.members.map((m) => {
            const pid = playerId(m.name);
            return (
              <ListRow
                key={`${m.initials}-${m.number}`}
                title={m.name}
                subtitle={`${m.position} · No. ${m.number}`}
                leading={<InitialsTile initials={m.initials} color={m.color} />}
                onPress={() =>
                  pid
                    ? router.push(`/player?id=${pid}`)
                    : alert(t('team.alertNotSynced', { name: m.name }))
                }
              />
            );
          })
        )}
      </View>

      <SectionLabel>{t('team.statistics')}</SectionLabel>
      <View style={styles.statsCard}>
        <Ring
          size={88}
          stroke={7}
          progress={playedMatches.length ? wins / playedMatches.length : 0}
          color={Colors.emerald}
          label={playedMatches.length ? `${Math.round((wins / playedMatches.length) * 100)}%` : '–'}
          sublabel={t('team.winRate')}
        />
        <View style={styles.statsCol}>
          <StatCell value={String(goalsFor)} label={t('team.goalsFor')} color={Colors.emerald} />
          <StatCell value={String(goalsAgainst)} label={t('team.goalsAgainst')} color={Colors.danger} />
          <StatCell value={String(goalsFor - goalsAgainst)} label={t('team.goalDiff')} color={Colors.mint} />
        </View>
      </View>
      <View style={styles.recordRow}>
        <StatCell value={String(wins)} label={t('team.won')} color={Colors.emerald} />
        <StatCell value={String(draws)} label={t('team.drawn')} color={Colors.info} />
        <StatCell value={String(losses)} label={t('team.lost')} color={Colors.danger} />
      </View>

      <SectionLabel>{t('team.topScorers')}</SectionLabel>
      <View style={styles.list}>
        {scorers.length === 0 ? (
          <EmptyState
            icon="chart.bar.fill"
            title={t('team.emptyScorersTitle')}
            subtitle={t('team.emptyScorersSub')}
          />
        ) : (
          scorers.map((s) => (
            <View key={s.name} style={styles.scorerRow}>
              <InitialsTile initials={s.initials} color={s.color} />
              <Text style={styles.scorerName}>{s.name}</Text>
              <Text style={styles.scorerStat}>
                {s.goals} {s.goals === 1 ? t('team.goal') : t('team.goals')} · {s.assists}{' '}
                {s.assists === 1 ? t('team.assist') : t('team.assists')}
              </Text>
            </View>
          ))
        )}
      </View>

      <SectionLabel>{t('team.management')}</SectionLabel>
      <Pressable style={styles.mgmtBtn} onPress={() => router.push('/transfers')}>
        <IconSymbol name="arrow.right" size={16} color={Colors.mint} />
        <Text style={styles.mgmtBtnText}>{t('team.transfers')}</Text>
      </Pressable>
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
  teamIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 18,
    color: Colors.mint,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  tagRow: {
    marginTop: 2,
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
    textTransform: 'capitalize',
    flexShrink: 1,
    textAlign: 'right',
  },
  list: {
    gap: Spacing.md,
  },
  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  statsCol: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recordRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  scorerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  scorerName: {
    flex: 1,
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.text,
  },
  scorerStat: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.textMuted,
  },
  mgmtBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  mgmtBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.text,
    textTransform: 'lowercase',
  },
});
