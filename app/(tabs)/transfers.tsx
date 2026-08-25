import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { InitialsTile } from '@/components/list-row';
import { Screen, DetailHead, SectionLabel, StatCell } from '@/components/screen';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_PLAYERS, ALL_TEAMS } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';
import { usePersistedState } from '@/lib/storage';

const REASONS = ['Promotion', 'Demotion', 'Reorganization', 'Other'];

function teamOf(roster: Record<string, string>, initials: string) {
  return ALL_TEAMS.find((t) => t.id === roster[initials]) ?? null;
}

export default function TransfersScreen() {
  const { t } = useLanguage();
  const initialRoster: Record<string, string> = {};
  ALL_TEAMS.forEach((t) => {
    t.members.forEach((m) => {
      if (!initialRoster[m.initials]) initialRoster[m.initials] = t.id;
    });
  });

  const [roster, setRoster] = usePersistedState<Record<string, string>>('transfers:roster', initialRoster);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [log, setLog] = usePersistedState<string[]>('transfers:log', []);

  const player = ALL_PLAYERS.find((p) => p.id === playerId) ?? null;
  const currentTeam = player ? teamOf(roster, player.initials) : null;

  const doTransfer = () => {
    const dest = ALL_TEAMS.find((t) => t.id === teamId);
    if (!player || !dest) {
      alert(t('transfers.alertSelect'));
      return;
    }
    if (currentTeam?.id === dest.id) {
      alert(t('transfers.alertAlready', { name: player.name, team: dest.name }));
      return;
    }
    const fromName = currentTeam?.name ?? t('transfers.unassigned');
    setRoster((prev) => ({ ...prev, [player.initials]: dest.id }));
    setLog((prev) => [
      `${player.name} → ${dest.name} · ${t(`transfers.reason.${reason}`)}`,
      ...prev,
    ].slice(0, 8));
    setPlayerId(null);
    setTeamId(null);
    alert(t('transfers.alertDone', { name: player.name, from: fromName, team: dest.name }));
  };

  const teamsWithPlayers = ALL_TEAMS.map((t) => ({
    ...t,
    squad: ALL_PLAYERS.filter((p) => roster[p.initials] === t.id),
  }));
  const unassigned = ALL_PLAYERS.filter((p) => !roster[p.initials]);

  return (
    <Screen back>
      <DetailHead
        icon="arrow.right"
        accent={Colors.mint}
        title={t('transfers.title')}
        subtitle={t('transfers.subtitle')}
      />

      <View style={styles.statsRow}>
        <StatCell value={String(ALL_PLAYERS.length)} label={t('transfers.players')} color={Colors.mint} />
        <StatCell value={String(ALL_TEAMS.length)} label={t('transfers.teams')} />
        <StatCell value={String(log.length)} label={t('transfers.count')} color={Colors.warning} />
      </View>

      {/* Quick transfer */}
      <SectionLabel>{t('transfers.quickTransfer')}</SectionLabel>
      <View style={styles.formCard}>
        <Text style={styles.fieldLabel}>{t('transfers.player')}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pickerRow}>
          {ALL_PLAYERS.map((p) => {
            const selected = p.id === playerId;
            return (
              <Pressable
                key={p.id}
                onPress={() => setPlayerId(p.id)}
                style={[styles.playerChip, selected && styles.playerChipActive]}>
                <InitialsTile initials={p.initials} color={p.color} size={30} />
                <Text style={[styles.playerChipText, selected && styles.playerChipTextActive]}>
                  {p.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
        {player ? (
          <Text style={styles.hint}>
            {t('transfers.currently', { team: currentTeam?.name ?? t('transfers.unassigned') })}
          </Text>
        ) : (
          <Text style={styles.hint}>{t('transfers.tapPlayer')}</Text>
        )}

        <Text style={styles.fieldLabel}>{t('transfers.destTeam')}</Text>
        <View style={styles.wrap}>
          {ALL_TEAMS.map((t) => {
            const selected = t.id === teamId;
            return (
              <Pressable
                key={t.id}
                onPress={() => setTeamId(t.id)}
                style={[styles.teamChip, selected && { backgroundColor: t.color, borderColor: t.color }]}>
                <Text style={[styles.teamChipText, selected && { color: Colors.textOnPrimary }]}>
                  {t.name}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.fieldLabel}>{t('transfers.reason')}</Text>
        <View style={styles.wrap}>
          {REASONS.map((r) => {
            const selected = r === reason;
            return (
              <Pressable
                key={r}
                onPress={() => setReason(r)}
                style={[styles.reasonChip, selected && styles.reasonChipActive]}>
                <Text style={[styles.reasonChipText, selected && styles.reasonChipTextActive]}>{t(`transfers.reason.${r}`)}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable style={styles.transferBtn} onPress={doTransfer}>
          <IconSymbol name="arrow.right" size={16} color={Colors.textOnPrimary} />
          <Text style={styles.transferBtnText}>{t('transfers.execute')}</Text>
        </Pressable>
      </View>

      {/* Squads */}
      <SectionLabel>{t('transfers.squads')}</SectionLabel>
      <View style={styles.list}>
        {teamsWithPlayers.map((tw) => (
          <View key={tw.id} style={styles.teamCard}>
            <View style={styles.teamHead}>
              <View style={[styles.teamDot, { backgroundColor: tw.color }]} />
              <Text style={styles.teamName}>{tw.name}</Text>
              <Text style={styles.teamCount}>{tw.squad.length}</Text>
            </View>
            {tw.squad.length === 0 ? (
              <Text style={styles.emptySquad}>{t('transfers.noPlayers')}</Text>
            ) : (
              tw.squad.map((p) => (
                <View key={p.id} style={styles.memberRow}>
                  <InitialsTile initials={p.initials} color={p.color} size={30} />
                  <Text style={styles.memberName}>{p.name}</Text>
                  <Text style={styles.memberMeta}>
                    {t('transfers.memberMeta', { position: p.position, number: p.number })}
                  </Text>
                </View>
              ))
            )}
          </View>
        ))}
        {unassigned.length > 0 ? (
          <View style={styles.teamCard}>
            <View style={styles.teamHead}>
              <View style={[styles.teamDot, { backgroundColor: Colors.textMuted }]} />
              <Text style={styles.teamName}>{t('transfers.unassigned')}</Text>
              <Text style={styles.teamCount}>{unassigned.length}</Text>
            </View>
            {unassigned.map((p) => (
              <View key={p.id} style={styles.memberRow}>
                <InitialsTile initials={p.initials} color={p.color} size={30} />
                <Text style={styles.memberName}>{p.name}</Text>
                <Text style={styles.memberMeta}>{p.position}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {log.length > 0 ? (
        <>
          <SectionLabel>{t('transfers.recent')}</SectionLabel>
          <View style={styles.logCard}>
            {log.map((entry, i) => (
              <Text key={`${entry}-${i}`} style={styles.logEntry}>
                {entry}
              </Text>
            ))}
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  fieldLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textMuted,
    marginTop: 2,
  },
  pickerRow: {
    gap: Spacing.sm,
    paddingVertical: 2,
  },
  playerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm + 2,
  },
  playerChipActive: {
    backgroundColor: Colors.mint,
    borderColor: Colors.mint,
  },
  playerChipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.text,
  },
  playerChipTextActive: {
    color: Colors.textOnPrimary,
  },
  hint: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  teamChip: {
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceAlt,
  },
  teamChipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  reasonChip: {
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceAlt,
  },
  reasonChipActive: {
    backgroundColor: Colors.mint,
    borderColor: Colors.mint,
  },
  reasonChipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  reasonChipTextActive: {
    color: Colors.textOnPrimary,
  },
  transferBtn: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
  },
  transferBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.textOnPrimary,
    textTransform: 'lowercase',
  },
  list: {
    gap: Spacing.md,
  },
  teamCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  teamHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomColor: Colors.borderSoft,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  teamDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  teamName: {
    flex: 1,
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.text,
    textTransform: 'capitalize',
  },
  teamCount: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 14,
    color: Colors.mint,
  },
  emptySquad: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
    padding: Spacing.md,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomColor: Colors.borderSoft,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  memberName: {
    flex: 1,
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.text,
  },
  memberMeta: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },
  logCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: 6,
  },
  logEntry: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
