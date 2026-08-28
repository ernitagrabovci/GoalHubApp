import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen, DetailHead, SectionLabel, StatCell } from '@/components/screen';
import { StatusChip } from '@/components/status-chip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { ALL_COMPETITIONS, type Competition, type CompetitionType } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';
import { useSession } from '@/lib/session';
import { usePersistedState } from '@/lib/storage';
import { useTheme, useThemedStyles } from '@/lib/theme';

const TYPE_META: Record<CompetitionType, { color: string }> = {
  league: { color: '#185fa5' },
  cup: { color: '#f5a623' },
  friendly: { color: '#1a9e5c' },
};

const TYPE_ORDER: CompetitionType[] = ['league', 'cup', 'friendly'];

export default function CompetitionsScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useLanguage();
  const { user } = useSession();
  const canManage = user?.role === 'administrator';

  const [comps, setComps] = usePersistedState<Competition[]>('competitions:list', ALL_COMPETITIONS);
  const [name, setName] = useState('');
  const [type, setType] = useState<CompetitionType>('league');

  const active = comps.filter((c) => c.active).length;
  const cups = comps.filter((c) => c.type === 'cup').length;

  const add = () => {
    if (!name.trim()) {
      alert(t('comp.alertName'));
      return;
    }
    setComps((prev) => [
      ...prev,
      { id: `c-${Date.now()}`, name: name.trim(), type, active: true },
    ]);
    setName('');
    alert(t('comp.alertAdded', { name: name.trim() }));
  };

  const toggle = (id: string) => {
    const target = comps.find((c) => c.id === id);
    setComps((prev) => prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c)));
    if (target) alert(t('comp.alertToggled', { name: target.name, state: t(target.active ? 'comp.deactivated' : 'comp.activated') }));
  };

  const remove = (id: string) => {
    const target = comps.find((c) => c.id === id);
    setComps((prev) => prev.filter((c) => c.id !== id));
    if (target) alert(t('comp.alertDeleted', { name: target.name }));
  };

  return (
    <Screen back>
      <DetailHead
        icon="trophy.fill"
        accent="#f5a623"
        title={t('comp.title')}
        subtitle={t('comp.subtitle')}
      />

      <View style={styles.statsRow}>
        <StatCell value={String(active)} label={t('comp.active')} color={colors.mint} />
        <StatCell value={String(comps.length)} label={t('comp.total')} />
        <StatCell value={String(cups)} label={t('comp.cups')} color="#f5a623" />
      </View>

      {canManage ? (
        <>
          <SectionLabel>{t('comp.addCompetition')}</SectionLabel>
          <View style={styles.formCard}>
            <TextInput
              style={styles.input}
              placeholder={t('comp.namePlaceholder')}
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
              autoCorrect={false}
            />
            <View style={styles.chips}>
              {TYPE_ORDER.map((ty) => {
                const meta = TYPE_META[ty];
                const selected = type === ty;
                return (
                  <Pressable
                    key={ty}
                    onPress={() => setType(ty)}
                    style={[styles.chip, selected && { backgroundColor: meta.color, borderColor: meta.color }]}>
                    <Text style={[styles.chipText, selected && { color: colors.textOnPrimary }]}>
                      {t(`comp.${ty}`)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable style={styles.addBtn} onPress={add}>
              <IconSymbol name="plus" size={16} color={colors.textOnPrimary} />
              <Text style={styles.addBtnText}>{t('comp.addCompetition')}</Text>
            </Pressable>
          </View>
        </>
      ) : null}

      <SectionLabel>{t('comp.section')}</SectionLabel>
      <View style={styles.list}>
        {comps.map((c) => {
          const meta = TYPE_META[c.type];
          return (
            <View key={c.id} style={styles.row}>
              <View style={[styles.typePill, { backgroundColor: `${meta.color}1a` }]}>
                <Text style={[styles.typePillText, { color: meta.color }]}>{t(`comp.${c.type}`)}</Text>
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowName}>{c.name}</Text>
                <StatusChip label={t(c.active ? 'comp.active' : 'users.inactive')} tone={c.active ? 'emerald' : 'muted'} />
              </View>
              {canManage ? (
                <View style={styles.rowActions}>
                  <Pressable onPress={() => toggle(c.id)} hitSlop={8}>
                    <Text style={c.active ? styles.deactText : styles.actText}>
                      {t(c.active ? 'comp.deactivate' : 'comp.activate')}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => remove(c.id)} hitSlop={8}>
                    <IconSymbol name="trash" size={16} color={colors.danger} />
                  </Pressable>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    color: colors.text,
    fontFamily: Fonts.body,
    fontSize: 14,
  },
  chips: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  chip: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    backgroundColor: colors.surfaceAlt,
  },
  chipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'lowercase',
  },
  addBtn: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
  },
  addBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: colors.textOnPrimary,
    textTransform: 'lowercase',
  },
  list: {
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  typePill: {
    borderRadius: Radius.pill,
    paddingVertical: 5,
    paddingHorizontal: Spacing.sm + 2,
  },
  typePillText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    textTransform: 'lowercase',
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  rowName: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: colors.text,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  actText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: colors.mint,
    textTransform: 'lowercase',
  },
  deactText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: colors.warning,
    textTransform: 'lowercase',
  },
});
