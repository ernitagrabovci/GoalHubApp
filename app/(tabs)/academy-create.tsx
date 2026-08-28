import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen, SectionLabel } from '@/components/screen';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useLanguage } from '@/lib/i18n';
import { academyStore } from '@/lib/store';
import { useTheme, useThemedStyles } from '@/lib/theme';

const CATEGORIES = ['Tactical', 'Possession', 'Fitness', 'Shooting'] as const;
const TYPES = ['video', 'session'] as const;
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'All'] as const;

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export default function AcademyCreateScreen() {
  const styles = useThemedStyles(createStyles);
  const { colors } = useTheme();
  const router = useRouter();
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [type, setType] = useState<string>('video');
  const [level, setLevel] = useState<string>(LEVELS[0]);
  const [duration, setDuration] = useState('');
  const [shared, setShared] = useState(true);

  const save = () => {
    if (!title.trim()) {
      alert(t('academyCreate.alertTitle'));
      return;
    }
    academyStore.prepend({
      id: `a-${Date.now()}`,
      title: title.trim(),
      category,
      level,
      duration: duration.trim() || (type === 'video' ? '10:00' : '45 min'),
      type: type as 'video' | 'session',
      isShared: shared,
      color: '#B0E4CC',
    });
    router.back();
  };

  return (
    <Screen back>
      <SectionLabel>{t('academyCreate.title')}</SectionLabel>
      <TextInput
        style={styles.input}
        placeholder={t('academyCreate.titlePlaceholder')}
        placeholderTextColor={colors.textMuted}
        value={title}
        onChangeText={setTitle}
      />

      <SectionLabel>{t('academyCreate.category')}</SectionLabel>
      <View style={styles.chips}>
        {CATEGORIES.map((c) => (
          <Chip key={c} label={t(`category.${c}`)} active={category === c} onPress={() => setCategory(c)} />
        ))}
      </View>

      <SectionLabel>{t('academyCreate.type')}</SectionLabel>
      <View style={styles.chips}>
        {TYPES.map((ty) => (
          <Chip key={ty} label={t(`academyCreate.type.${ty}`)} active={type === ty} onPress={() => setType(ty)} />
        ))}
      </View>

      <SectionLabel>{t('academyCreate.level')}</SectionLabel>
      <View style={styles.chips}>
        {LEVELS.map((l) => (
          <Chip key={l} label={t(`level.${l.toLowerCase()}`)} active={level === l} onPress={() => setLevel(l)} />
        ))}
      </View>

      <SectionLabel>{t('academyCreate.duration')}</SectionLabel>
      <TextInput
        style={styles.input}
        placeholder={type === 'video' ? t('academyCreate.durationVideo') : t('academyCreate.durationSession')}
        placeholderTextColor={colors.textMuted}
        value={duration}
        onChangeText={setDuration}
      />

      <Pressable style={styles.toggleRow} onPress={() => setShared((v) => !v)}>
        <View style={[styles.toggle, shared && styles.toggleOn]}>
          <View style={[styles.toggleKnob, shared && styles.toggleKnobOn]} />
        </View>
        <View style={styles.toggleBody}>
          <Text style={styles.toggleTitle}>{t('academyCreate.shareWithSquad')}</Text>
          <Text style={styles.toggleSub}>{t('academyCreate.shareSub')}</Text>
        </View>
      </Pressable>

      <Pressable style={styles.saveBtn} onPress={save}>
        <IconSymbol name="plus" size={18} color={colors.textOnPrimary} />
        <Text style={styles.saveBtnText}>{t('academyCreate.addMaterial')}</Text>
      </Pressable>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 7,
    paddingHorizontal: Spacing.md,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.mint,
    borderColor: colors.mint,
  },
  chipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'lowercase',
  },
  chipTextActive: {
    color: colors.textOnPrimary,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    color: colors.text,
    fontSize: 14,
    fontFamily: Fonts.body,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xl,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  toggle: {
    width: 46,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    padding: 2,
  },
  toggleOn: {
    backgroundColor: colors.mint,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.textMuted,
  },
  toggleKnobOn: {
    backgroundColor: colors.textOnPrimary,
    marginLeft: 18,
  },
  toggleBody: {
    flex: 1,
    gap: 2,
  },
  toggleTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: colors.text,
    textTransform: 'lowercase',
  },
  toggleSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: colors.textMuted,
  },
  saveBtn: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
  },
  saveBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: colors.textOnPrimary,
    textTransform: 'lowercase',
  },
});
