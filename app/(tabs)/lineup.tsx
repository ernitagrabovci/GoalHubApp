import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { InitialsTile } from '@/components/list-row';
import { DetailHead, Screen, SectionLabel } from '@/components/screen';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_MATCHES, FORMATION_SLOTS, MATCH_DETAILS, TACTICAL_ROSTER, type MatchLineup } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';
import { usePersistedState } from '@/lib/storage';

const GRASS = '#0E2A1E';
const LINE = '#3A7A58';
const MARKER = 34;

/** Tap-to-assign starting eleven editor for a match. Trainer only, saved per match. */
export default function LineupScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const match = ALL_MATCHES.find((m) => m.id === matchId) ?? ALL_MATCHES[0];

  const [lineups, setLineups] = usePersistedState<Record<string, MatchLineup>>('matches:lineups', {});
  const saved = lineups[matchId];

  const defaultLineup = useMemo(
    () => MATCH_DETAILS[matchId]?.lineup ?? TACTICAL_ROSTER.map((r) => r.initials),
    [matchId]
  );

  const [formation, setFormation] = useState<string>(saved?.formation ?? '4-3-3');
  const [lineup, setLineup] = useState<string[]>(saved?.lineup ?? defaultLineup);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [pitchW, setPitchW] = useState(0);

  // Re-sync local state once the persisted lineup hydrates.
  useEffect(() => {
    if (saved) {
      setFormation(saved.formation);
      setLineup(saved.lineup);
    }
  }, [saved]);

  const pitchH = pitchW * 1.5;
  const slots = FORMATION_SLOTS[formation] ?? FORMATION_SLOTS['4-3-3'];
  const boxH = (r: number) => r * pitchH;

  const onPitchLayout = (e: LayoutChangeEvent) => setPitchW(e.nativeEvent.layout.width);

  const handleFormation = (f: string) => {
    setFormation(f);
    setSelectedSlot(null);
  };

  const handleAssign = (initials: string) => {
    if (selectedSlot === null) return;
    setLineup((prev) =>
      prev.map((ini, i) => {
        if (i === selectedSlot) return initials;
        if (ini === initials) return prev[selectedSlot];
        return ini;
      })
    );
    setSelectedSlot(null);
  };

  const handleAutoFill = () => {
    setLineup(TACTICAL_ROSTER.map((r) => r.initials));
    setSelectedSlot(null);
  };

  const handleSave = () => {
    setLineups({ ...lineups, [matchId]: { formation, lineup } });
    alert(t('lineup.alertSaved'));
    router.back();
  };

  return (
    <Screen back>
      <DetailHead
        icon="figure.soccer"
        accent={Colors.mint}
        title={t('lineup.title')}
        subtitle={`${t('lineup.subtitle')} · ${match.opponent}`}
      />

      <SectionLabel>{t('lineup.formation')}</SectionLabel>
      <View style={styles.wrap}>
        {Object.keys(FORMATION_SLOTS).map((f) => {
          const active = f === formation;
          return (
            <Pressable
              key={f}
              onPress={() => handleFormation(f)}
              style={[styles.chip, active && styles.chipActive]}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{f}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Pitch with tappable slots */}
      <View style={styles.pitchOuter} onLayout={onPitchLayout}>
        {pitchW > 0 ? (
          <View style={[styles.pitch, { height: pitchH }]}>
            <View style={styles.outline} />
            <View style={[styles.midline, { top: pitchH / 2 }]} />
            <View
              style={[
                styles.centerCircle,
                {
                  width: pitchW * 0.24,
                  height: pitchW * 0.24,
                  borderRadius: pitchW * 0.12,
                  left: pitchW * 0.38,
                  top: pitchH / 2 - pitchW * 0.12,
                },
              ]}
            />
            <View style={[styles.penBox, { height: boxH(0.16), width: pitchW * 0.62, left: pitchW * 0.19, top: 0 }]} />
            <View style={[styles.penBox, { height: boxH(0.16), width: pitchW * 0.62, left: pitchW * 0.19, bottom: 0 }]} />
            <View style={[styles.goalBox, { height: boxH(0.07), width: pitchW * 0.3, left: pitchW * 0.35, top: 0 }]} />
            <View style={[styles.goalBox, { height: boxH(0.07), width: pitchW * 0.3, left: pitchW * 0.35, bottom: 0 }]} />

            {slots.map((slot, i) => {
              const player = TACTICAL_ROSTER.find((r) => r.initials === lineup[i]);
              const active = i === selectedSlot;
              return (
                <Pressable
                  key={i}
                  onPress={() => setSelectedSlot(active ? null : i)}
                  style={[
                    styles.slot,
                    {
                      left: slot.x * pitchW - MARKER / 2,
                      top: slot.y * pitchH - MARKER / 2,
                      borderColor: active ? Colors.mint : LINE,
                    },
                  ]}>
                  <Text style={[styles.slotNum, active && styles.slotNumActive]}>
                    {player ? player.number : i + 1}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>

      {selectedSlot !== null ? (
        <Text style={styles.hint}>{t('lineup.tapPlayer')}</Text>
      ) : null}

      {/* Squad strip */}
      <SectionLabel>{t('lineup.squad')}</SectionLabel>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.squadRow}>
        {TACTICAL_ROSTER.map((p) => {
          const picked = lineup.includes(p.initials);
          return (
            <Pressable
              key={p.initials}
              onPress={() => handleAssign(p.initials)}
              style={[styles.squadChip, picked && styles.squadChipPicked]}>
              <InitialsTile initials={p.initials} color={p.color} size={34} />
              <Text style={styles.squadName} numberOfLines={1}>
                {p.name}
              </Text>
              <Text style={styles.squadNum}>#{p.number}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Pressable style={styles.autoBtn} onPress={handleAutoFill}>
        <IconSymbol name="bolt.fill" size={16} color={Colors.textOnPrimary} />
        <Text style={styles.autoBtnText}>{t('lineup.autoFill')}</Text>
      </Pressable>

      <Pressable style={styles.saveBtn} onPress={handleSave}>
        <IconSymbol name="checkmark.circle.fill" size={16} color={Colors.textOnPrimary} />
        <Text style={styles.saveBtnText}>{t('lineup.save')}</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
  pitchOuter: {
    marginTop: Spacing.md,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pitch: {
    width: '100%',
    backgroundColor: GRASS,
    position: 'relative',
  },
  outline: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 1,
    borderColor: LINE,
  },
  midline: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: LINE,
  },
  centerCircle: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: LINE,
  },
  penBox: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: LINE,
  },
  goalBox: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: LINE,
  },
  slot: {
    position: 'absolute',
    width: MARKER,
    height: MARKER,
    borderRadius: MARKER / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: `${GRASS}E6`,
  },
  slotNum: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 13,
    color: Colors.textOnPrimary,
  },
  slotNumActive: {
    color: Colors.textOnPrimary,
  },
  hint: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
  },
  squadRow: {
    gap: Spacing.sm,
    paddingVertical: 2,
  },
  squadChip: {
    alignItems: 'center',
    gap: 4,
    width: 76,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  squadChipPicked: {
    borderColor: Colors.mint,
    backgroundColor: Colors.surfaceAlt,
  },
  squadName: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    color: Colors.text,
    textAlign: 'center',
  },
  squadNum: {
    fontFamily: Fonts.body,
    fontSize: 9,
    color: Colors.textMuted,
  },
  autoBtn: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
  },
  autoBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.text,
    textTransform: 'lowercase',
  },
  saveBtn: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
  },
  saveBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.textOnPrimary,
    textTransform: 'lowercase',
  },
});
