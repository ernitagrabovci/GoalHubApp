import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen, SectionLabel } from '@/components/screen';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_PLAYERS } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';
import { injuriesStore } from '@/lib/store';

const OCCURRED = ['training', 'match', 'other'] as const;
const INITIAL_STATUS = ['injured', 'rehabilitation'] as const;

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

export default function InjuryCreateScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [player, setPlayer] = useState(ALL_PLAYERS[0].name);
  const [type, setType] = useState('');
  const [occurred, setOccurred] = useState<string>('training');
  const [status, setStatus] = useState<string>('injured');
  const [date, setDate] = useState('');
  const [expected, setExpected] = useState('');
  const [description, setDescription] = useState('');
  const [treatment, setTreatment] = useState('');
  const [notifyAdmin, setNotifyAdmin] = useState(true);

  const save = () => {
    if (!type.trim()) {
      alert(t('injuryCreate.alertType'));
      return;
    }
    const p = ALL_PLAYERS.find((pl) => pl.name === player) ?? ALL_PLAYERS[0];
    injuriesStore.prepend({
      id: `i-${Date.now()}`,
      player,
      initials: p.initials,
      type: type.trim(),
      status: status as 'injured' | 'rehabilitation',
      expected: expected.trim() || '—',
      color: p.color,
    });
    router.back();
  };

  return (
    <Screen back>
      <SectionLabel>{t('injuryCreate.player')}</SectionLabel>
      <View style={styles.chips}>
        {ALL_PLAYERS.map((p) => (
          <Chip
            key={p.id}
            label={p.initials}
            active={player === p.name}
            onPress={() => setPlayer(p.name)}
          />
        ))}
      </View>
      <Text style={styles.selected}>{player}</Text>

      <SectionLabel>{t('injuryCreate.injuryType')}</SectionLabel>
      <TextInput
        style={styles.input}
        placeholder={t('injuryCreate.typePlaceholder')}
        placeholderTextColor={Colors.textMuted}
        value={type}
        onChangeText={setType}
      />

      <SectionLabel>{t('injuryCreate.occurredDuring')}</SectionLabel>
      <View style={styles.chips}>
        {OCCURRED.map((o) => (
          <Chip key={o} label={t(`injuryCreate.occurred.${o}`)} active={occurred === o} onPress={() => setOccurred(o)} />
        ))}
      </View>

      <SectionLabel>{t('injuryCreate.initialStatus')}</SectionLabel>
      <View style={styles.chips}>
        {INITIAL_STATUS.map((s) => (
          <Chip key={s} label={t(`injuryCreate.status.${s}`)} active={status === s} onPress={() => setStatus(s)} />
        ))}
      </View>

      <SectionLabel>{t('injuryCreate.dates')}</SectionLabel>
      <View style={styles.dateRow}>
        <TextInput
          style={[styles.input, styles.flex]}
          placeholder={t('injuryCreate.datePlaceholder')}
          placeholderTextColor={Colors.textMuted}
          value={date}
          onChangeText={setDate}
        />
        <TextInput
          style={[styles.input, styles.flex]}
          placeholder={t('injuryCreate.expectedPlaceholder')}
          placeholderTextColor={Colors.textMuted}
          value={expected}
          onChangeText={setExpected}
        />
      </View>

      <SectionLabel>{t('injuryCreate.description')}</SectionLabel>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder={t('injuryCreate.descPlaceholder')}
        placeholderTextColor={Colors.textMuted}
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <SectionLabel>{t('injuryCreate.treatment')}</SectionLabel>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder={t('injuryCreate.treatmentPlaceholder')}
        placeholderTextColor={Colors.textMuted}
        value={treatment}
        onChangeText={setTreatment}
        multiline
      />

      <Pressable style={styles.toggleRow} onPress={() => setNotifyAdmin((v) => !v)}>
        <View style={[styles.toggle, notifyAdmin && styles.toggleOn]}>
          <View style={[styles.toggleKnob, notifyAdmin && styles.toggleKnobOn]} />
        </View>
        <View style={styles.toggleBody}>
          <Text style={styles.toggleTitle}>{t('injuryCreate.notifyAdmin')}</Text>
          <Text style={styles.toggleSub}>{t('injuryCreate.notifySub', { name: player })}</Text>
        </View>
      </Pressable>

      <Pressable style={styles.saveBtn} onPress={save}>
        <IconSymbol name="plus" size={18} color={Colors.textOnPrimary} />
        <Text style={styles.saveBtnText}>{t('injuryCreate.save')}</Text>
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
  selected: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.mint,
    marginTop: Spacing.sm,
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
  multiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  dateRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  flex: {
    flex: 1,
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
