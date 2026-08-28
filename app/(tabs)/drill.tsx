import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { IconTile } from '@/components/list-row';
import { Screen, SectionLabel } from '@/components/screen';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { ALL_DRILLS } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';
import { useTheme, useThemedStyles } from '@/lib/theme';

const LEVEL_COLOR: Record<string, string> = {
  beginner: '#2fbf71',
  intermediate: '#5aa7e6',
  advanced: '#f5a623',
};

export default function DrillScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { t } = useLanguage();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const drill = ALL_DRILLS.find((d) => d.id === id) ?? ALL_DRILLS[0];

  const phases = [
    {
      time: '5 min',
      title: t('drill.warmup'),
      detail: `Light jog and progressive movement patterns to prepare the legs before the ${drill.category.toLowerCase()} work.`,
    },
    {
      time: drill.duration,
      title: t('drill.phaseMain', { title: drill.title }),
      detail: `${drill.focus}. Organise ${drill.players} players, keep the tempo high and correct the details on the fly.`,
    },
    {
      time: '5 min',
      title: t('drill.coolDown'),
      detail: 'Slow jog and static stretching. Recap the two or three coaching points that mattered most today.',
    },
  ];

  const coaching = [
    `Keep the spacing tight — no more than 10m between players during ${drill.focus.toLowerCase()}.`,
    'Encourage first-time touches; the goal is speed of decision, not perfection.',
    'Rotate positions every few minutes so every player gets a turn in the key role.',
  ];

  const infoRows = [
    { label: t('drill.duration'), value: drill.duration },
    { label: t('drill.players'), value: drill.players },
    { label: t('drill.focus'), value: drill.focus },
    { label: t('drill.level'), value: t(`level.${drill.level}`) },
  ];

  return (
    <Screen back>
      {/* Drill card */}
      <View style={styles.card}>
        <IconTile icon="fitness-center" color={drill.color} size={52} />
        <View style={styles.cardBody}>
          <Text style={styles.title}>{drill.title}</Text>
          <Text style={styles.subtitle}>
            {t(`category.${drill.category}`)} · {drill.focus}
          </Text>
          <View style={[styles.levelChip, { backgroundColor: `${LEVEL_COLOR[drill.level]}1a`, borderColor: `${LEVEL_COLOR[drill.level]}45` }]}>
            <Text style={[styles.levelText, { color: LEVEL_COLOR[drill.level] }]}>{t(`level.${drill.level}`)}</Text>
          </View>
        </View>
      </View>

      <SectionLabel>{t('drill.details')}</SectionLabel>
      <View style={styles.rowsCard}>
        {infoRows.map((r) => (
          <View key={r.label} style={styles.row}>
            <Text style={styles.rowLabel}>{r.label}</Text>
            <Text style={styles.rowValue}>{r.value}</Text>
          </View>
        ))}
      </View>

      <SectionLabel>{t('drill.sessionPlan')}</SectionLabel>
      <View style={styles.phasesCard}>
        {phases.map((p, i) => (
          <View key={p.title} style={[styles.phase, i < phases.length - 1 && styles.phaseBorder]}>
            <View style={styles.phaseHead}>
              <Text style={styles.phaseTitle}>{p.title}</Text>
              <Text style={styles.phaseTime}>{p.time}</Text>
            </View>
            <Text style={styles.phaseDetail}>{p.detail}</Text>
          </View>
        ))}
      </View>

      <SectionLabel>{t('drill.coachingPoints')}</SectionLabel>
      <View style={styles.pointsCard}>
        {coaching.map((c, i) => (
          <View key={i} style={styles.pointRow}>
            <IconSymbol name="checkmark.circle.fill" size={15} color={colors.mint} />
            <Text style={styles.pointText}>{c}</Text>
          </View>
        ))}
      </View>

      <Pressable
        style={styles.runBtn}
        onPress={() => {
          alert(t('drill.alertAdded', { title: drill.title }));
          router.back();
        }}>
        <IconSymbol name="plus" size={18} color={colors.textOnPrimary} />
        <Text style={styles.runBtnText}>{t('drill.addToSession')}</Text>
      </Pressable>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
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
  cardBody: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 18,
    color: colors.mint,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  levelChip: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginTop: 2,
  },
  levelText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  rowsCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomColor: colors.borderSoft,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  rowValue: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: colors.text,
    textTransform: 'capitalize',
    flexShrink: 1,
    textAlign: 'right',
  },
  phasesCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  phase: {
    padding: Spacing.lg,
  },
  phaseBorder: {
    borderBottomColor: colors.borderSoft,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  phaseHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  phaseTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: colors.text,
  },
  phaseTime: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    color: colors.mint,
  },
  phaseDetail: {
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 4,
  },
  pointsCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  pointText: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  runBtn: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
  },
  runBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textOnPrimary,
    textTransform: 'lowercase',
  },
});
