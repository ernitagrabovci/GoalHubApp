import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen, SectionLabel } from '@/components/screen';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { useLanguage } from '@/lib/i18n';
import { academyStore } from '@/lib/store';

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
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </Pressable>
  );
}

export default function AcademyCreateScreen() {
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
        placeholderTextColor={Colors.textMuted}
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
        placeholderTextColor={Colors.textMuted}
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
        <IconSymbol name="plus" size={18} color={Colors.textOnPrimary} />
        <Text style={styles.saveBtnText}>{t('academyCreate.addMaterial')}</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 7,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
  },
  chipActive: {
    backgroundColor: Colors.mint,
    borderColor: Colors.mint,
  },
  chipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'lowercase',
  },
  chipTextActive: {
    color: Colors.textOnPrimary,
  },
  input: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    color: Colors.text,
    fontSize: 14,
    fontFamily: Fonts.body,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.xl,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  toggle: {
    width: 46,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceAlt,
    padding: 2,
  },
  toggleOn: {
    backgroundColor: Colors.mint,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.textMuted,
  },
  toggleKnobOn: {
    backgroundColor: Colors.textOnPrimary,
    marginLeft: 18,
  },
  toggleBody: {
    flex: 1,
    gap: 2,
  },
  toggleTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.text,
    textTransform: 'lowercase',
  },
  toggleSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
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
