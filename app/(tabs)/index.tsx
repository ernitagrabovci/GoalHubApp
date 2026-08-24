import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

const STATS = [
  { label: 'Players', value: '24' },
  { label: 'Trainings', value: '12' },
  { label: 'Matches', value: '8' },
  { label: 'Attendance', value: '87%' },
];

const QUICK = [
  { icon: 'figure.soccer', label: 'Matches', color: Colors.warning },
  { icon: 'calendar', label: 'Trainings', color: Colors.info },
  { icon: 'person.2.fill', label: 'Team', color: Colors.emerald },
  { icon: 'stethoscope', label: 'Medical', color: Colors.danger },
  { icon: 'bubble.left.fill', label: 'Messages', color: Colors.info },
  { icon: 'chart.bar.fill', label: 'Reports', color: Colors.mint },
] as const;

const UPCOMING = [
  {
    day: 'TUE',
    date: '25',
    title: 'Tactical training',
    time: '18:00',
    meta: 'Fusha Prishtina A',
    tone: Colors.info,
  },
  {
    day: 'THU',
    date: '27',
    title: 'Match · U21',
    time: '16:30',
    meta: 'FC Drita · Home',
    tone: Colors.warning,
  },
  {
    day: 'SAT',
    date: '29',
    title: 'Recovery session',
    time: '09:00',
    meta: 'Akademia B',
    tone: Colors.emerald,
  },
] as const;

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.brandMark}>
              <Text style={styles.brandLetter}>G</Text>
            </View>
            <Text style={styles.brandText}>goalhub</Text>
          </View>
          <View style={styles.clubChip}>
            <View style={styles.liveDot} />
            <Text style={styles.clubChipText}>FC Prishtina</Text>
          </View>
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <ThemedText type="label">GoalHub · Overview</ThemedText>
          <Text style={styles.heroTitle}>your club,{'\n'}one place</Text>
          <Text style={styles.heroSub}>
            Everything for FC Prishtina — players, trainings, matches and medical.
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {STATS.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick actions */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionLabel}>quick actions</Text>
          <Text style={styles.sectionLink}>view all</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickRow}>
          {QUICK.map((action) => (
            <Pressable
              key={action.label}
              style={styles.quickItem}
              onPress={() => alert(`${action.label} — coming soon`)}>
              <View style={[styles.quickIcon, { backgroundColor: `${action.color}22` }]}>
                <IconSymbol name={action.icon} size={22} color={action.color} />
              </View>
              <Text style={styles.quickLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Upcoming */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionLabel}>upcoming</Text>
          <Text style={styles.sectionLink}>calendar</Text>
        </View>
        {UPCOMING.map((event) => (
          <Pressable
            key={`${event.date}-${event.title}`}
            style={styles.eventCard}
            onPress={() => alert('coming soon')}>
            <View style={[styles.dateBox, { borderColor: `${event.tone}55` }]}>
              <Text style={[styles.dateDay, { color: event.tone }]}>{event.day}</Text>
              <Text style={styles.dateNum}>{event.date}</Text>
            </View>
            <View style={styles.eventBody}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventMeta}>{event.meta}</Text>
            </View>
            <View style={styles.eventTime}>
              <IconSymbol name="clock.fill" size={14} color={Colors.textMuted} />
              <Text style={styles.eventTimeText}>{event.time}</Text>
            </View>
          </Pressable>
        ))}
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
    justifyContent: 'space-between',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    backgroundColor: Colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLetter: {
    fontFamily: Fonts.heading,
    fontSize: 17,
    color: Colors.textOnPrimary,
  },
  brandText: {
    fontFamily: Fonts.heading,
    fontSize: 22,
    letterSpacing: -0.5,
    color: Colors.mint,
    textTransform: 'lowercase',
  },
  clubChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.emerald,
  },
  clubChipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  hero: {
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  heroTitle: {
    fontFamily: Fonts.heading,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -1,
    color: Colors.mint,
    textTransform: 'lowercase',
  },
  heroSub: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textMuted,
    maxWidth: 300,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: '45%',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    minHeight: 96,
    justifyContent: 'space-between',
  },
  statValue: {
    fontFamily: Fonts.heading,
    fontSize: 30,
    letterSpacing: -0.5,
    color: Colors.mint,
  },
  statLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginTop: Spacing.xxl,
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 18,
    color: Colors.mint,
    textTransform: 'lowercase',
  },
  sectionLink: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.emerald,
  },
  quickRow: {
    gap: Spacing.lg,
  },
  quickItem: {
    alignItems: 'center',
    gap: Spacing.sm,
    width: 64,
  },
  quickIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: Colors.textMuted,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  dateBox: {
    width: 48,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
  },
  dateDay: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: 1,
  },
  dateNum: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    color: Colors.mint,
  },
  eventBody: {
    flex: 1,
    gap: 2,
  },
  eventTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.text,
  },
  eventMeta: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },
  eventTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  eventTimeText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.textMuted,
  },
});
