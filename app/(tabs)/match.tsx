import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { DateTile, InitialsTile } from '@/components/list-row';
import { Screen, SectionLabel, StatCell } from '@/components/screen';
import { StatusChip, type StatusTone } from '@/components/status-chip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_MATCHES, MATCH_DETAILS, TACTICAL_ROSTER } from '@/lib/data';

const STATUS_TONE: Record<string, StatusTone> = {
  upcoming: 'info',
  played: 'emerald',
  cancelled: 'danger',
};

function nameFor(initials: string) {
  return TACTICAL_ROSTER.find((r) => r.initials === initials)?.name ?? initials;
}

export default function MatchScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const match = ALL_MATCHES.find((m) => m.id === id) ?? ALL_MATCHES[0];
  const detail = MATCH_DETAILS[match.id] ?? MATCH_DETAILS.ma1;
  const played = match.status === 'played';

  return (
    <Screen back>
      {/* Match info */}
      <View style={styles.infoCard}>
        <DateTile day={match.day} month={match.month} color={match.color} />
        <View style={styles.infoBody}>
          <Text style={styles.opponent}>{match.opponent}</Text>
          <Text style={styles.meta}>
            {match.competition} · {match.venue === 'home' ? 'Home' : 'Away'}
          </Text>
          <View style={styles.infoRow}>
            {played ? (
              <Text style={styles.score}>{match.score}</Text>
            ) : (
              <View style={styles.timeRow}>
                <IconSymbol name="clock.fill" size={13} color={Colors.textMuted} />
                <Text style={styles.time}>{match.time}</Text>
              </View>
            )}
            <StatusChip label={match.status} tone={STATUS_TONE[match.status]} />
          </View>
        </View>
      </View>

      {detail.transport ? (
        <View style={styles.transportCard}>
          <IconSymbol name="map.fill" size={16} color={Colors.info} />
          <Text style={styles.transportText}>{detail.transport}</Text>
        </View>
      ) : null}

      {/* Summary for played */}
      {played ? (
        <>
          <SectionLabel>match summary</SectionLabel>
          <View style={styles.summary}>
            <StatCell value={match.score ?? '—'} label="score" />
            <StatCell value={String(detail.stats.length)} label="players" />
            <StatCell
              value={String(detail.stats.reduce((s, p) => s + p.goals, 0))}
              label="goals"
              color="#f5a623"
            />
            <StatCell
              value={String(detail.stats.reduce((s, p) => s + p.assists, 0))}
              label="assists"
            />
          </View>

          <SectionLabel>player stats</SectionLabel>
          <View style={styles.table}>
            <View style={styles.tableHead}>
              <Text style={styles.headPlayer}>player</Text>
              <Text style={styles.headCol}>G</Text>
              <Text style={styles.headCol}>A</Text>
              <Text style={styles.headCol}>MIN</Text>
              <Text style={styles.headCol}>Y/R</Text>
              <Text style={styles.headCol}>RTG</Text>
            </View>
            {detail.stats.map((s) => (
              <View key={s.initials} style={styles.tableRow}>
                <View style={styles.playerCell}>
                  <InitialsTile initials={s.initials} color={s.color} size={30} />
                  <Text style={styles.playerName} numberOfLines={1}>
                    {s.player}
                  </Text>
                </View>
                <Text style={styles.col}>{s.goals}</Text>
                <Text style={styles.col}>{s.assists}</Text>
                <Text style={styles.col}>{s.minutes}</Text>
                <Text style={styles.col}>
                  {s.yellow > 0 || s.red > 0 ? `${s.yellow}/${s.red}` : '—'}
                </Text>
                <Text style={[styles.col, styles.rtg]}>{s.rating.toFixed(1)}</Text>
              </View>
            ))}
          </View>
        </>
      ) : (
        <>
          <SectionLabel>starting lineup</SectionLabel>
          <View style={styles.lineup}>
            {detail.lineup.map((initials, i) => (
              <View key={initials} style={styles.lineupRow}>
                <Text style={styles.lineupNum}>{i + 1}</Text>
                <InitialsTile initials={initials} color={Colors.mint} size={34} />
                <Text style={styles.lineupName}>{nameFor(initials)}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  infoCard: {
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
  infoBody: {
    flex: 1,
    gap: 3,
  },
  opponent: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 18,
    color: Colors.mint,
  },
  meta: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: 2,
  },
  score: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 16,
    color: Colors.mint,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.textMuted,
  },
  transportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  transportText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text,
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
  table: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  headPlayer: {
    flex: 1,
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  headCol: {
    width: 44,
    textAlign: 'center',
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1,
    color: Colors.textMuted,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopColor: Colors.borderSoft,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  playerCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  playerName: {
    flex: 1,
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.text,
  },
  col: {
    width: 44,
    textAlign: 'center',
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  rtg: {
    fontFamily: Fonts.headingSemiBold,
    color: Colors.mint,
  },
  lineup: {
    gap: Spacing.sm,
  },
  lineupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  lineupNum: {
    width: 22,
    textAlign: 'center',
    fontFamily: Fonts.headingSemiBold,
    fontSize: 13,
    color: Colors.textMuted,
  },
  lineupName: {
    flex: 1,
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.text,
  },
});
