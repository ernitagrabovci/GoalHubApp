import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Screen, DetailHead, SectionLabel, StatCell } from '@/components/screen';
import { StatusChip } from '@/components/status-chip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_COMPETITIONS, type Competition, type CompetitionType } from '@/lib/data';
import { useSession } from '@/lib/session';
import { usePersistedState } from '@/lib/storage';

const TYPE_META: Record<CompetitionType, { label: string; color: string }> = {
  league: { label: 'league', color: '#185fa5' },
  cup: { label: 'cup', color: '#f5a623' },
  friendly: { label: 'friendly', color: '#1a9e5c' },
};

const TYPE_ORDER: CompetitionType[] = ['league', 'cup', 'friendly'];

export default function CompetitionsScreen() {
  const { user } = useSession();
  const canManage = user?.role === 'administrator';

  const [comps, setComps] = usePersistedState<Competition[]>('competitions:list', ALL_COMPETITIONS);
  const [name, setName] = useState('');
  const [type, setType] = useState<CompetitionType>('league');

  const active = comps.filter((c) => c.active).length;
  const cups = comps.filter((c) => c.type === 'cup').length;

  const add = () => {
    if (!name.trim()) {
      alert('Enter a competition name first.');
      return;
    }
    setComps((prev) => [
      ...prev,
      { id: `c-${Date.now()}`, name: name.trim(), type, active: true },
    ]);
    setName('');
    alert(`"${name.trim()}" added to competitions.`);
  };

  const toggle = (id: string) => {
    const target = comps.find((c) => c.id === id);
    setComps((prev) => prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c)));
    if (target) alert(`"${target.name}" ${target.active ? 'deactivated' : 'activated'}.`);
  };

  const remove = (id: string) => {
    const target = comps.find((c) => c.id === id);
    setComps((prev) => prev.filter((c) => c.id !== id));
    if (target) alert(`"${target.name}" deleted.`);
  };

  return (
    <Screen back>
      <DetailHead
        icon="trophy.fill"
        accent="#f5a623"
        title="competitions"
        subtitle="managed leagues & cups · FC Prishtina"
      />

      <View style={styles.statsRow}>
        <StatCell value={String(active)} label="active" color={Colors.mint} />
        <StatCell value={String(comps.length)} label="total" />
        <StatCell value={String(cups)} label="cups" color="#f5a623" />
      </View>

      {canManage ? (
        <>
          <SectionLabel>add competition</SectionLabel>
          <View style={styles.formCard}>
            <TextInput
              style={styles.input}
              placeholder="e.g. Superliga e Kosovës"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
              autoCorrect={false}
            />
            <View style={styles.chips}>
              {TYPE_ORDER.map((t) => {
                const meta = TYPE_META[t];
                const selected = type === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => setType(t)}
                    style={[styles.chip, selected && { backgroundColor: meta.color, borderColor: meta.color }]}>
                    <Text style={[styles.chipText, selected && { color: Colors.textOnPrimary }]}>
                      {meta.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable style={styles.addBtn} onPress={add}>
              <IconSymbol name="plus" size={16} color={Colors.textOnPrimary} />
              <Text style={styles.addBtnText}>add competition</Text>
            </Pressable>
          </View>
        </>
      ) : null}

      <SectionLabel>competitions</SectionLabel>
      <View style={styles.list}>
        {comps.map((c) => {
          const meta = TYPE_META[c.type];
          return (
            <View key={c.id} style={styles.row}>
              <View style={[styles.typePill, { backgroundColor: `${meta.color}1a` }]}>
                <Text style={[styles.typePillText, { color: meta.color }]}>{meta.label}</Text>
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowName}>{c.name}</Text>
                <StatusChip label={c.active ? 'active' : 'inactive'} tone={c.active ? 'emerald' : 'muted'} />
              </View>
              {canManage ? (
                <View style={styles.rowActions}>
                  <Pressable onPress={() => toggle(c.id)} hitSlop={8}>
                    <Text style={c.active ? styles.deactText : styles.actText}>
                      {c.active ? 'deactivate' : 'activate'}
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => remove(c.id)} hitSlop={8}>
                    <IconSymbol name="trash" size={16} color={Colors.danger} />
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

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
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
  chips: {
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
  addBtn: {
    marginTop: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.mint,
    borderRadius: Radius.md,
    paddingVertical: Spacing.sm + 2,
  },
  addBtnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.textOnPrimary,
    textTransform: 'lowercase',
  },
  list: {
    gap: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
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
    color: Colors.text,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  actText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.mint,
    textTransform: 'lowercase',
  },
  deactText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    color: Colors.warning,
    textTransform: 'lowercase',
  },
});
