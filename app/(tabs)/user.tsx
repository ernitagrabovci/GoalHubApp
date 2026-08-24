import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { InitialsTile } from '@/components/list-row';
import { Screen, SectionLabel } from '@/components/screen';
import { StatusChip } from '@/components/status-chip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Fonts, Radius, Spacing } from '@/constants/theme';
import { ALL_USERS } from '@/lib/data';
import { ROLE_LABELS, ROLE_ORDER, type Role } from '@/lib/session';

const ROLE_COLOR: Record<Role, string> = {
  administrator: '#1a9e5c',
  trainer: '#2fbf71',
  player: '#f5a623',
  parent: '#534ab7',
  financier: '#185fa5',
};

export default function UserScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const source = ALL_USERS.find((u) => u.id === id) ?? ALL_USERS[0];
  const [role, setRole] = useState<Role>(source.role);
  const [active, setActive] = useState(source.active);

  const activity = [
    { when: 'today', detail: 'Signed in' },
    { when: '3d ago', detail: 'Updated profile picture' },
    { when: '1w ago', detail: 'Signed in' },
    { when: '2w ago', detail: 'Account created' },
  ];

  return (
    <Screen back>
      {/* Profile card */}
      <View style={styles.card}>
        <InitialsTile initials={source.initials} color={ROLE_COLOR[role]} size={52} />
        <View style={styles.cardBody}>
          <Text style={styles.name}>{source.name}</Text>
          <Text style={styles.email}>{source.email}</Text>
          <Text style={styles.club}>{source.club}</Text>
          <View style={styles.statusRow}>
            <StatusChip label={active ? 'active' : 'inactive'} tone={active ? 'emerald' : 'muted'} />
            <View style={[styles.roleChip, { borderColor: `${ROLE_COLOR[role]}55` }]}>
              <View style={[styles.roleDot, { backgroundColor: ROLE_COLOR[role] }]} />
              <Text style={[styles.roleText, { color: ROLE_COLOR[role] }]}>{ROLE_LABELS[role]}</Text>
            </View>
          </View>
        </View>
      </View>

      <SectionLabel>change role</SectionLabel>
      <View style={styles.chips}>
        {ROLE_ORDER.map((r) => (
          <Pressable
            key={r}
            onPress={() => {
              setRole(r);
              alert(`${source.name} reassigned to ${ROLE_LABELS[r]}.`);
            }}
            style={[styles.chip, role === r && { backgroundColor: ROLE_COLOR[r], borderColor: ROLE_COLOR[r] }]}>
            <Text style={[styles.chipText, role === r && styles.chipTextActive]}>
              {ROLE_LABELS[r]}
            </Text>
          </Pressable>
        ))}
      </View>

      <SectionLabel>account</SectionLabel>
      <Pressable style={styles.toggleRow} onPress={() => setActive((v) => !v)}>
        <View style={[styles.toggle, active && styles.toggleOn]}>
          <View style={[styles.toggleKnob, active && styles.toggleKnobOn]} />
        </View>
        <View style={styles.toggleBody}>
          <Text style={styles.toggleTitle}>active account</Text>
          <Text style={styles.toggleSub}>
            {active ? 'This user can sign in and use the app.' : 'This user is blocked from signing in.'}
          </Text>
        </View>
      </Pressable>

      <SectionLabel>activity</SectionLabel>
      <View style={styles.rowsCard}>
        {activity.map((a) => (
          <View key={a.when} style={styles.row}>
            <Text style={styles.rowLabel}>{a.when}</Text>
            <Text style={styles.rowValue}>{a.detail}</Text>
          </View>
        ))}
      </View>

      <Pressable
        style={styles.deleteBtn}
        onPress={() => {
          alert(`${source.name}'s account scheduled for deletion.`);
          router.back();
        }}>
        <IconSymbol name="trash" size={16} color={Colors.danger} />
        <Text style={styles.deleteText}>remove account</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 18,
    color: Colors.mint,
  },
  email: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  club: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textMuted,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 3,
    paddingHorizontal: 9,
  },
  roleDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  roleText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
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
  chipText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    color: Colors.textSecondary,
    textTransform: 'lowercase',
  },
  chipTextActive: {
    color: Colors.textOnPrimary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
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
  rowsCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
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
    borderBottomColor: Colors.borderSoft,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: Colors.textMuted,
  },
  rowValue: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.text,
    flexShrink: 1,
    textAlign: 'right',
  },
  deleteBtn: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderColor: Colors.danger,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
  },
  deleteText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: Colors.danger,
    textTransform: 'lowercase',
  },
});
