import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DateTile, ListRow } from '@/components/list-row';
import { StatusChip } from '@/components/status-chip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_MATCHES, ALL_TEAMS, type Match, type Team } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { usePersistedState } from '@/lib/storage';

const COMPETITIONS = [
  { code: 'Superliga', labelKey: 'competition.superliga' },
  { code: 'Cup', labelKey: 'competition.cup' },
  { code: 'Friendly', labelKey: 'competition.friendly' },
];
const MONTHS = ['AUG', 'SEP'];

function NewMatchForm({ teams, onDone }: { teams: Team[]; onDone: (m: Match) => void }) {
  const { t } = useLanguage();
  const [opponent, setOpponent] = useState('');
  const [teamId, setTeamId] = useState<string>(teams[0]?.id ?? '');
  const [competition, setCompetition] = useState<string>(COMPETITIONS[0].code);
  const [venue, setVenue] = useState<'home' | 'away'>('home');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState<string>(MONTHS[0]);
  const [time, setTime] = useState('');

  const submit = () => {
    if (!opponent.trim()) {
      alert(t('matches.alertName'));
      return;
    }
    const d = parseInt(day.trim(), 10);
    if (!Number.isFinite(d) || d < 1 || d > 31) {
      alert(t('matches.alertDay'));
      return;
    }
    onDone({
      id: `ma-${Date.now()}`,
      teamId,
      day: day.trim(),
      month,
      opponent: opponent.trim(),
      competition,
      venue,
      status: 'upcoming',
      time: time.trim(),
      color: '#B0E4CC',
    });
    setOpponent('');
    setDay('');
    setTime('');
    setVenue('home');
  };

  return (
    <View style={styles.formCard}>
      <Text style={styles.fieldLabel}>{t('matches.create')}</Text>
      <TextInput
        style={styles.input}
        placeholder={t('matches.opponent')}
        placeholderTextColor={Colors.textMuted}
        value={opponent}
        onChangeText={setOpponent}
        autoCorrect={false}
      />
      <Text style={styles.fieldLabel}>{t('matches.team')}</Text>
      <View style={styles.wrap}>
        {teams.map((tm) => {
          const selected = teamId === tm.id;
          return (
            <Pressable
              key={tm.id}
              onPress={() => setTeamId(tm.id)}
              style={[styles.chip, selected && styles.chipActive]}>
              <Text style={[styles.chipText, selected && styles.chipTextActive]}>{tm.name}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.fieldLabel}>{t('matches.competition')}</Text>
      <View style={styles.wrap}>
        {COMPETITIONS.map((c) => {
          const selected = competition === c.code;
          return (
            <Pressable
              key={c.code}
              onPress={() => setCompetition(c.code)}
              style={[styles.chip, selected && styles.chipActive]}>
              <Text style={[styles.chipText, selected && styles.chipTextActive]}>{t(c.labelKey)}</Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.fieldLabel}>{t('matches.venue')}</Text>
      <View style={styles.wrap}>
        {(['home', 'away'] as const).map((v) => {
          const selected = venue === v;
          return (
            <Pressable
              key={v}
              onPress={() => setVenue(v)}
              style={[styles.chip, selected && styles.chipActive]}>
              <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                {t(v === 'home' ? 'matches.venueHome' : 'matches.venueAway')}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.fieldLabel}>{t('matches.upcoming')}</Text>
      <View style={styles.formRow}>
        <View style={[styles.inputBox, styles.dayBox]}>
          <TextInput
            style={styles.input}
            placeholder={t('trainings.formDay')}
            placeholderTextColor={Colors.textMuted}
            value={day}
            onChangeText={setDay}
            keyboardType="numeric"
          />
        </View>
        <View style={styles.wrap}>
          {MONTHS.map((m) => {
            const selected = month === m;
            return (
              <Pressable
                key={m}
                onPress={() => setMonth(m)}
                style={[styles.chip, selected && styles.chipActive]}>
                <Text style={[styles.chipText, selected && styles.chipTextActive]}>
                  {t(`month.${m}`)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <View style={[styles.inputBox, styles.timeBox]}>
        <TextInput
          style={styles.input}
          placeholder={t('trainings.formTime')}
          placeholderTextColor={Colors.textMuted}
          value={time}
          onChangeText={setTime}
          autoCorrect={false}
        />
      </View>
      <Pressable style={styles.submitBtn} onPress={submit}>
        <IconSymbol name="plus" size={16} color={Colors.textOnPrimary} />
        <Text style={styles.submitBtnText}>{t('matches.create')}</Text>
      </Pressable>
    </View>
  );
}

function MatchTrailing({ match }: { match: Match }) {
  const { t } = useLanguage();
  if (match.status === 'played') {
    return (
      <View style={styles.resultCol}>
        <Text style={styles.score}>{match.score}</Text>
        <StatusChip label={t('match.played')} tone="emerald" />
      </View>
    );
  }
  if (match.status === 'upcoming') {
    return (
      <View style={styles.resultCol}>
        <View style={styles.timeRow}>
          <IconSymbol name="clock.fill" size={13} color={Colors.textMuted} />
          <Text style={styles.time}>{match.time}</Text>
        </View>
        <StatusChip label={t(`venue.${match.venue}`)} tone="info" />
      </View>
    );
  }
  return (
    <View style={styles.resultCol}>
      <Text style={[styles.score, { color: Colors.textMuted }]}>—</Text>
      <StatusChip label={t('match.cancelled')} tone="danger" />
    </View>
  );
}

function MatchRow({ match, onPress }: { match: Match; onPress: () => void }) {
  const { t } = useLanguage();
  return (
    <ListRow
      title={match.opponent}
      subtitle={`${match.competition} · ${t(`venue.${match.venue}`)}`}
      leading={<DateTile day={match.day} month={match.month} color={match.color} />}
      trailing={<MatchTrailing match={match} />}
      onPress={onPress}
    />
  );
}

export default function MatchesScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { user } = useSession();
  const canManage = user?.role === 'administrator' || user?.role === 'trainer';
  const [matches, setMatches] = usePersistedState<Match[]>('matches:list', ALL_MATCHES);
  const [teams] = usePersistedState<Team[]>('teams:list', ALL_TEAMS);
  const [showForm, setShowForm] = useState(false);

  const upcoming = matches.filter((m) => m.status === 'upcoming');
  const played = matches.filter((m) => m.status === 'played');
  const cancelled = matches.filter((m) => m.status === 'cancelled');

  const addMatch = (m: Match) => {
    setMatches((prev) => [m, ...prev]);
    setShowForm(false);
    alert(t('matches.alertAdded', { opponent: m.opponent }));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Back */}
        <Pressable style={styles.backRow} onPress={() => router.back()} hitSlop={8}>
          <IconSymbol name="chevron-left" size={22} color={Colors.mint} />
          <Text style={styles.backText}>{t('common.back')}</Text>
        </Pressable>

        {/* Screen head */}
        <View style={styles.head}>
          <View style={[styles.headIcon, { backgroundColor: `${Colors.warning}22` }]}>
            <IconSymbol name="figure.soccer" size={26} color={Colors.warning} />
          </View>
          <View style={styles.headBody}>
            <Text style={styles.title}>{t('matches.title')}</Text>
            <Text style={styles.subtitle}>{t('matches.subtitle')}</Text>
          </View>
        </View>

        {canManage && showForm ? <NewMatchForm teams={teams} onDone={addMatch} /> : null}

        {upcoming.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>{t('matches.upcoming')}</Text>
            <View style={styles.list}>
              {upcoming.map((m) => (
                <MatchRow key={m.id} match={m} onPress={() => router.push(`/match?id=${m.id}`)} />
              ))}
            </View>
          </>
        ) : null}

        {played.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>{t('matches.results')}</Text>
            <View style={styles.list}>
              {played.map((m) => (
                <MatchRow key={m.id} match={m} onPress={() => router.push(`/match?id=${m.id}`)} />
              ))}
            </View>
          </>
        ) : null}

        {cancelled.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>{t('matches.cancelled')}</Text>
            <View style={styles.list}>
              {cancelled.map((m) => (
                <MatchRow key={m.id} match={m} onPress={() => router.push(`/match?id=${m.id}`)} />
              ))}
            </View>
          </>
        ) : null}

        {canManage ? (
          <Pressable style={styles.action} onPress={() => setShowForm((s) => !s)}>
            <IconSymbol name={showForm ? 'xmark' : 'plus'} size={18} color={Colors.textOnPrimary} />
            <Text style={styles.actionText}>
              {showForm ? t('common.closeForm') : t('matches.create')}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingVertical: Spacing.xs,
  },
  backText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.mint,
    textTransform: 'lowercase',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  headIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headBody: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 26,
    letterSpacing: -0.5,
    color: Colors.mint,
    textTransform: 'lowercase',
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
  },
  sectionLabel: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 16,
    color: Colors.mint,
    textTransform: 'lowercase',
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  list: {
    gap: Spacing.md,
  },
  resultCol: {
    alignItems: 'flex-end',
    gap: 6,
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
  formCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  input: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    color: Colors.text,
    fontFamily: Fonts.body,
    fontSize: 14,
  },
  inputBox: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
  },
  formRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dayBox: {
    width: 72,
  },
  timeBox: {
    paddingHorizontal: Spacing.md,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surfaceAlt,
  },
  chipActive: {
    backgroundColor: Colors.mint,
    borderColor: Colors.mint,
  },
  chipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.textOnPrimary,
  },
  submitBtn: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
  },
  submitBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.textOnPrimary,
    textTransform: 'lowercase',
  },
  action: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
  },
  actionText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.textOnPrimary,
    textTransform: 'lowercase',
  },
});
