import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { DateTile, InitialsTile } from '@/components/list-row';
import { Screen, SectionLabel, StatCell } from '@/components/screen';
import { StatusChip, type StatusTone } from '@/components/status-chip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { ALL_MATCHES, MATCH_DETAILS, TACTICAL_ROSTER, type MatchLineup } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { usePersistedState } from '@/lib/storage';
import { useTheme, useThemedStyles } from '@/lib/theme';

const STATUS_TONE: Record<string, StatusTone> = {
  upcoming: 'info',
  played: 'emerald',
  cancelled: 'danger',
};

function nameFor(initials: string) {
  return TACTICAL_ROSTER.find((r) => r.initials === initials)?.name ?? initials;
}

export default function MatchScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useSession();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const match = ALL_MATCHES.find((m) => m.id === id) ?? ALL_MATCHES[0];
  const detail = MATCH_DETAILS[match.id] ?? MATCH_DETAILS.ma1;
  const played = match.status === 'played';
  const [lineups] = usePersistedState<Record<string, MatchLineup>>('matches:lineups', {});
  const savedLineup = lineups[match.id];
  const canEdit = user?.role === 'trainer' && !played;
  const displayLineup = savedLineup?.lineup ?? detail.lineup;

  return (
    <Screen back>
      {/* Match info */}
      <View style={styles.infoCard}>
        <DateTile day={match.day} month={match.month} color={match.color} />
        <View style={styles.infoBody}>
          <Text style={styles.opponent}>{match.opponent}</Text>
          <Text style={styles.meta}>
            {match.competition} · {t(`venue.${match.venue}`)}
          </Text>
          <View style={styles.infoRow}>
            {played ? (
              <Text style={styles.score}>{match.score}</Text>
            ) : (
              <View style={styles.timeRow}>
                <IconSymbol name="clock.fill" size={13} color={colors.textMuted} />
                <Text style={styles.time}>{match.time}</Text>
              </View>
            )}
            <StatusChip label={t(`match.${match.status}`)} tone={STATUS_TONE[match.status]} />
          </View>
        </View>
      </View>

      {detail.transport ? (
        <View style={styles.transportCard}>
          <IconSymbol name="map.fill" size={16} color={colors.info} />
          <Text style={styles.transportText}>{detail.transport}</Text>
        </View>
      ) : null}

      {/* Summary for played */}
      {played ? (
        <>
          <SectionLabel>{t('match.summary')}</SectionLabel>
          <View style={styles.summary}>
            <StatCell value={match.score ?? '—'} label={t('match.score')} />
            <StatCell value={String(detail.stats.length)} label={t('match.players')} />
            <StatCell
              value={String(detail.stats.reduce((s, p) => s + p.goals, 0))}
              label={t('match.goals')}
              color="#f5a623"
            />
            <StatCell
              value={String(detail.stats.reduce((s, p) => s + p.assists, 0))}
              label={t('match.assists')}
            />
          </View>

          <SectionLabel>{t('match.playerStats')}</SectionLabel>
          <View style={styles.table}>
            <View style={styles.tableHead}>
              <Text style={styles.headPlayer}>{t('match.player')}</Text>
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
          {canEdit ? (
            <Pressable style={styles.editBtn} onPress={() => router.push(`/lineup?matchId=${match.id}`)}>
              <IconSymbol name="pencil" size={15} color={colors.textOnPrimary} />
              <Text style={styles.editBtnText}>{t('lineup.editLineup')}</Text>
            </Pressable>
          ) : null}
          <SectionLabel>{t('match.startingLineup')}</SectionLabel>
          {savedLineup ? (
            <Text style={styles.lineupFormation}>
              {t('lineup.formation')} · {savedLineup.formation}
            </Text>
          ) : null}
          <View style={styles.lineup}>
            {displayLineup.map((initials, i) => (
              <View key={initials} style={styles.lineupRow}>
                <Text style={styles.lineupNum}>{i + 1}</Text>
                <InitialsTile initials={initials} color={colors.mint} size={34} />
                <Text style={styles.lineupName}>{nameFor(initials)}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  infoCard: {
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
  infoBody: {
    flex: 1,
    gap: 3,
  },
  opponent: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 18,
    color: colors.mint,
  },
  meta: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
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
    color: colors.mint,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: colors.textMuted,
  },
  transportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  transportText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: colors.text,
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
  table: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  headPlayer: {
    flex: 1,
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  headCol: {
    width: 44,
    textAlign: 'center',
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1,
    color: colors.textMuted,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopColor: colors.borderSoft,
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
    color: colors.text,
  },
  col: {
    width: 44,
    textAlign: 'center',
    fontFamily: Fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  rtg: {
    fontFamily: Fonts.headingSemiBold,
    color: colors.mint,
  },
  editBtn: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
  },
  editBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textOnPrimary,
    textTransform: 'lowercase',
  },
  lineupFormation: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: colors.mint,
    marginBottom: Spacing.sm,
    textTransform: 'lowercase',
  },
  lineup: {
    gap: Spacing.sm,
  },
  lineupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  lineupNum: {
    width: 22,
    textAlign: 'center',
    fontFamily: Fonts.headingSemiBold,
    fontSize: 13,
    color: colors.textMuted,
  },
  lineupName: {
    flex: 1,
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: colors.text,
  },
});
