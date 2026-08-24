import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { InitialsTile } from '@/components/list-row';
import { Screen, SectionLabel } from '@/components/screen';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_PLAYERS } from '@/lib/data';

const CRITERIA = [
  { key: 'technique', label: 'technique' },
  { key: 'physical', label: 'physical' },
  { key: 'tactics', label: 'tactics' },
  { key: 'consistency', label: 'consistency' },
  { key: 'teamwork', label: 'teamwork' },
] as const;

type CriteriaKey = (typeof CRITERIA)[number]['key'];

const clamp = (v: number) => Math.min(10, Math.max(1, v));

export default function RateScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const player = ALL_PLAYERS.find((p) => p.id === id) ?? ALL_PLAYERS[0];
  const [scores, setScores] = useState<Record<CriteriaKey, number>>({
    technique: 7,
    physical: 7,
    tactics: 7,
    consistency: 7,
    teamwork: 7,
  });

  const average = CRITERIA.reduce((sum, c) => sum + scores[c.key], 0) / CRITERIA.length;

  const bump = (key: CriteriaKey, delta: number) => {
    setScores((prev) => ({ ...prev, [key]: clamp(prev[key] + delta) }));
  };

  return (
    <Screen back>
      <View style={styles.headRow}>
        <InitialsTile initials={player.initials} color={player.color} size={52} />
        <View style={styles.headBody}>
          <Text style={styles.name}>{player.name}</Text>
          <Text style={styles.meta}>
            {player.position} · No. {player.number} · scale 1.0 – 10.0
          </Text>
        </View>
      </View>

      <SectionLabel>5 criteria</SectionLabel>
      <View style={styles.card}>
        {CRITERIA.map((c, i) => (
          <View
            key={c.key}
            style={[styles.criterion, i < CRITERIA.length - 1 && styles.criterionBorder]}>
            <Text style={styles.criterionLabel}>{c.label}</Text>
            <View style={styles.stepper}>
              <Pressable style={styles.stepBtn} onPress={() => bump(c.key, -0.5)} hitSlop={6}>
                <IconSymbol name="xmark" size={16} color={Colors.mint} />
              </Pressable>
              <Text style={styles.stepValue}>{scores[c.key].toFixed(1)}</Text>
              <Pressable style={styles.stepBtn} onPress={() => bump(c.key, 0.5)} hitSlop={6}>
                <IconSymbol name="plus" size={16} color={Colors.mint} />
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      {/* Live average */}
      <SectionLabel>average</SectionLabel>
      <View style={styles.avgCard}>
        <Text style={styles.avgValue}>{average.toFixed(1)}</Text>
        <Text style={styles.avgHint}>
          {average >= 8
            ? 'Outstanding — inform the player.'
            : average >= 7
              ? 'Solid performance level.'
              : average >= 6
                ? 'Developing — needs consistency.'
                : 'Below expectations — follow up with a plan.'}
        </Text>
      </View>

      <Pressable
        style={styles.saveBtn}
        onPress={() => {
          alert(`${player.name} rated ${average.toFixed(1)} — saved.`);
          router.back();
        }}>
        <IconSymbol name="checkmark.circle.fill" size={18} color={Colors.textOnPrimary} />
        <Text style={styles.saveBtnText}>save rating</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  headBody: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 18,
    color: Colors.mint,
  },
  meta: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },
  card: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
  },
  criterion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  criterionBorder: {
    borderBottomColor: Colors.borderSoft,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  criterionLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.text,
    textTransform: 'lowercase',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  stepBtn: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
    borderWidth: 1,
  },
  stepValue: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 16,
    color: Colors.mint,
    minWidth: 40,
    textAlign: 'center',
  },
  avgCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  avgValue: {
    fontFamily: Fonts.heading,
    fontSize: 44,
    color: Colors.mint,
    letterSpacing: -1,
  },
  avgHint: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  saveBtn: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
  },
  saveBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.textOnPrimary,
    textTransform: 'lowercase',
  },
});
