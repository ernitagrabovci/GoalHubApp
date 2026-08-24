import { StatusBar } from 'expo-status-bar';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DateTile, ListRow } from '@/components/list-row';
import { StatusChip } from '@/components/status-chip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_MATCHES, type Match } from '@/lib/data';

function MatchTrailing({ match }: { match: Match }) {
  if (match.status === 'played') {
    return (
      <View style={styles.resultCol}>
        <Text style={styles.score}>{match.score}</Text>
        <StatusChip label="played" tone="emerald" />
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
        <StatusChip label={match.venue === 'home' ? 'home' : 'away'} tone="info" />
      </View>
    );
  }
  return (
    <View style={styles.resultCol}>
      <Text style={[styles.score, { color: Colors.textMuted }]}>—</Text>
      <StatusChip label="cancelled" tone="danger" />
    </View>
  );
}

function MatchRow({ match }: { match: Match }) {
  return (
    <ListRow
      title={match.opponent}
      subtitle={`${match.competition} · ${match.venue === 'home' ? 'Home' : 'Away'}`}
      leading={<DateTile day={match.day} month={match.month} color={match.color} />}
      trailing={<MatchTrailing match={match} />}
    />
  );
}

export default function MatchesScreen() {
  const upcoming = ALL_MATCHES.filter((m) => m.status === 'upcoming');
  const played = ALL_MATCHES.filter((m) => m.status === 'played');
  const cancelled = ALL_MATCHES.filter((m) => m.status === 'cancelled');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Brand header */}
        <View style={styles.header}>
          <View style={styles.brand}>
            <Image
              source={require('@/assets/images/goalhub-logo.png')}
              style={styles.brandLogo}
              resizeMode="contain"
            />
            <Text style={styles.brandText}>goalhub</Text>
          </View>
        </View>

        {/* Screen head */}
        <View style={styles.head}>
          <View style={[styles.headIcon, { backgroundColor: `${Colors.warning}22` }]}>
            <IconSymbol name="figure.soccer" size={26} color={Colors.warning} />
          </View>
          <View style={styles.headBody}>
            <Text style={styles.title}>matches</Text>
            <Text style={styles.subtitle}>fixtures & results for FC Prishtina</Text>
          </View>
        </View>

        {upcoming.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>upcoming</Text>
            <View style={styles.list}>
              {upcoming.map((m) => (
                <MatchRow key={m.id} match={m} />
              ))}
            </View>
          </>
        ) : null}

        {played.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>results</Text>
            <View style={styles.list}>
              {played.map((m) => (
                <MatchRow key={m.id} match={m} />
              ))}
            </View>
          </>
        ) : null}

        {cancelled.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>cancelled</Text>
            <View style={styles.list}>
              {cancelled.map((m) => (
                <MatchRow key={m.id} match={m} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  brandLogo: {
    width: 28,
    height: 28,
  },
  brandText: {
    fontFamily: Fonts.heading,
    fontSize: 20,
    letterSpacing: -0.5,
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
