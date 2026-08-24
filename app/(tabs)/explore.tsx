import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { ThemedText } from '@/components/themed-text';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';

const MODULES = [
  { icon: 'person.2.fill', label: 'Players', color: Colors.mint },
  { icon: 'graduationcap.fill', label: 'Trainers', color: Colors.emerald },
  { icon: 'person.fill', label: 'Parents', color: Colors.purple },
  { icon: 'figure.soccer', label: 'Matches', color: Colors.warning },
  { icon: 'calendar', label: 'Trainings', color: Colors.info },
  { icon: 'trophy.fill', label: 'Academy', color: Colors.mintDim },
  { icon: 'stethoscope', label: 'Medical', color: Colors.danger },
  { icon: 'dollarsign.circle.fill', label: 'Payments', color: Colors.emerald },
  { icon: 'bubble.left.fill', label: 'Messages', color: Colors.info },
  { icon: 'chart.bar.fill', label: 'Reports', color: Colors.warning },
  { icon: 'gearshape.fill', label: 'Settings', color: Colors.textMuted },
] as const;

export default function ModulesScreen() {
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
        </View>

        <View style={styles.hero}>
          <ThemedText type="label">GoalHub · Modules</ThemedText>
          <Text style={styles.heroTitle}>everything for your club</Text>
          <Text style={styles.heroSub}>
            Each role gets its own view — players, trainers, parents and finance.
          </Text>
        </View>

        {/* Module grid */}
        <View style={styles.grid}>
          {MODULES.map((module) => (
            <Pressable
              key={module.label}
              style={styles.cell}
              onPress={() => alert(`${module.label} — coming soon`)}>
              <View style={[styles.cellIcon, { backgroundColor: `${module.color}1F` }]}>
                <IconSymbol name={module.icon} size={24} color={module.color} />
              </View>
              <Text style={styles.cellLabel}>{module.label}</Text>
            </Pressable>
          ))}
        </View>
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
  hero: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  heroTitle: {
    fontFamily: Fonts.heading,
    fontSize: 30,
    lineHeight: 34,
    letterSpacing: -1,
    color: Colors.mint,
    textTransform: 'lowercase',
  },
  heroSub: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textMuted,
    maxWidth: 320,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: Spacing.lg,
  },
  cell: {
    width: '31%',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
  },
  cellIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.text,
    textTransform: 'lowercase',
  },
});
