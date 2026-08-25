import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen, DetailHead, SectionLabel } from '@/components/screen';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_TEAMS, type Team } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';
import { usePersistedState } from '@/lib/storage';

const CATEGORIES = [
  { label: 'Senior', color: '#1a9e5c' },
  { label: 'Academy', color: '#185fa5' },
];

export default function TeamsScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const [teams, setTeams] = usePersistedState<Team[]>('teams:list', ALL_TEAMS);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0].label);
  const [trainer, setTrainer] = useState('');

  const addTeam = () => {
    if (!name.trim()) {
      alert(t('teams.alertName'));
      return;
    }
    const meta = CATEGORIES.find((c) => c.label === category) ?? CATEGORIES[0];
    setTeams((prev) => [
      ...prev,
      {
        id: `tm-${Date.now()}`,
        name: name.trim(),
        category,
        color: meta.color,
        trainer: trainer.trim() || 'TBA',
        season: '2026/27',
        members: [],
      },
    ]);
    setName('');
    setTrainer('');
    setShowForm(false);
    alert(t('teams.alertAdded', { name: name.trim(), category: t(`category.${category}`) }));
  };

  return (
    <Screen back>
      <DetailHead
        icon="person.2.fill"
        accent="#1a9e5c"
        title={t('teams.title')}
        subtitle={t('teams.subtitle', { count: teams.length })}
      />

      {showForm ? (
        <View style={styles.formCard}>
          <Text style={styles.fieldLabel}>{t('teams.newTeam')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('teams.namePlaceholder')}
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
            autoCorrect={false}
          />
          <View style={styles.wrap}>
            {CATEGORIES.map((c) => {
              const selected = category === c.label;
              return (
                <Pressable
                  key={c.label}
                  onPress={() => setCategory(c.label)}
                  style={[styles.chip, selected && { backgroundColor: c.color, borderColor: c.color }]}>
                  <Text style={[styles.chipText, selected && { color: Colors.textOnPrimary }]}>
                    {t(`category.${c.label}`)}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <TextInput
            style={styles.input}
            placeholder={t('teams.trainerPlaceholder')}
            placeholderTextColor={Colors.textMuted}
            value={trainer}
            onChangeText={setTrainer}
            autoCorrect={false}
          />
          <Pressable style={styles.submitBtn} onPress={addTeam}>
            <IconSymbol name="plus" size={16} color={Colors.textOnPrimary} />
            <Text style={styles.submitBtnText}>{t('teams.createTeam')}</Text>
          </Pressable>
        </View>
      ) : null}

      <SectionLabel>{t('teams.section')}</SectionLabel>
      <View style={styles.list}>
        {teams.length === 0 ? (
          <Text style={styles.empty}>{t('teams.empty')}</Text>
        ) : (
          teams.map((team) => (
            <Pressable
              key={team.id}
              style={styles.card}
              onPress={() => router.push(`/team?id=${team.id}`)}>
              <View style={[styles.teamIcon, { backgroundColor: `${team.color}22` }]}>
                <IconSymbol name="person.2.fill" size={20} color={team.color} />
              </View>
              <View style={styles.body}>
                <Text style={styles.name}>{team.name}</Text>
                <Text style={styles.meta}>
                  {t(`category.${team.category}`)} · {team.season}
                </Text>
                <Text style={styles.meta}>
                  {team.members.length}{' '}
                  {team.members.length === 1 ? t('common.player') : t('common.players')} ·{' '}
                  {team.trainer}
                </Text>
              </View>
              <IconSymbol name="chevron.right" size={18} color={Colors.textMuted} />
            </Pressable>
          ))
        )}
      </View>

      <Pressable style={styles.action} onPress={() => setShowForm((s) => !s)}>
        <IconSymbol name={showForm ? 'xmark' : 'plus'} size={18} color={Colors.textOnPrimary} />
        <Text style={styles.actionText}>{showForm ? t('common.closeForm') : t('teams.newTeam')}</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  formCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  input: {
    backgroundColor: Colors.surfaceAlt,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    color: Colors.text,
    fontFamily: Fonts.body,
    fontSize: 14,
  },
  wrap: {
    flexDirection: 'row',
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
  chipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'lowercase',
  },
  submitBtn: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
  },
  submitBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.textOnPrimary,
    textTransform: 'lowercase',
  },
  list: {
    gap: Spacing.md,
  },
  empty: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textMuted,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  teamIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.text,
  },
  meta: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textMuted,
  },
  action: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
  },
  actionText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.textOnPrimary,
    textTransform: 'lowercase',
  },
});
