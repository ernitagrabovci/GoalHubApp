import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DateTile, ListRow } from '@/components/list-row';
import { StatusChip } from '@/components/status-chip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_MATCHES, type Match } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';

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
  const upcoming = ALL_MATCHES.filter((m) => m.status === 'upcoming');
  const played = ALL_MATCHES.filter((m) => m.status === 'played');
  const cancelled = ALL_MATCHES.filter((m) => m.status === 'cancelled');

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
});
