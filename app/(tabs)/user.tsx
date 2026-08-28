import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { InitialsTile } from '@/components/list-row';
import { Screen, SectionLabel } from '@/components/screen';
import { StatusChip } from '@/components/status-chip';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { ALL_USERS } from '@/lib/data';
import { useLanguage } from '@/lib/i18n';
import { ROLE_ORDER, type Role } from '@/lib/session';
import { useTheme, useThemedStyles } from '@/lib/theme';

const ROLE_COLOR: Record<Role, string> = {
  administrator: '#1a9e5c',
  trainer: '#2fbf71',
  player: '#f5a623',
  parent: '#534ab7',
  financier: '#185fa5',
};

export default function UserScreen() {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();
  const { t } = useLanguage();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const source = ALL_USERS.find((u) => u.id === id) ?? ALL_USERS[0];
  const [role, setRole] = useState<Role>(source.role);
  const [active, setActive] = useState(source.active);

  const activity = [
    { when: t('user.actToday'), detail: t('user.actSignedIn') },
    { when: t('user.act3d'), detail: t('user.actProfile') },
    { when: t('user.act1w'), detail: t('user.actSignedIn') },
    { when: t('user.act2w'), detail: t('user.actCreated') },
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
            <StatusChip label={t(active ? 'users.active' : 'users.inactive')} tone={active ? 'emerald' : 'muted'} />
            <View style={[styles.roleChip, { borderColor: `${ROLE_COLOR[role]}55` }]}>
              <View style={[styles.roleDot, { backgroundColor: ROLE_COLOR[role] }]} />
              <Text style={[styles.roleText, { color: ROLE_COLOR[role] }]}>{t(`role.${role}`)}</Text>
            </View>
          </View>
        </View>
      </View>

      <SectionLabel>{t('user.changeRole')}</SectionLabel>
      <View style={styles.chips}>
        {ROLE_ORDER.map((r) => (
          <Pressable
            key={r}
            onPress={() => {
              setRole(r);
              alert(t('user.alertReassign', { name: source.name, role: t(`role.${r}`) }));
            }}
            style={[styles.chip, role === r && { backgroundColor: ROLE_COLOR[r], borderColor: ROLE_COLOR[r] }]}>
            <Text style={[styles.chipText, role === r && styles.chipTextActive]}>
              {t(`role.${r}`)}
            </Text>
          </Pressable>
        ))}
      </View>

      <SectionLabel>{t('user.account')}</SectionLabel>
      <Pressable style={styles.toggleRow} onPress={() => setActive((v) => !v)}>
        <View style={[styles.toggle, active && styles.toggleOn]}>
          <View style={[styles.toggleKnob, active && styles.toggleKnobOn]} />
        </View>
        <View style={styles.toggleBody}>
          <Text style={styles.toggleTitle}>{t('user.activeAccount')}</Text>
          <Text style={styles.toggleSub}>
            {t(active ? 'user.activeSub' : 'user.inactiveSub')}
          </Text>
        </View>
      </Pressable>

      <SectionLabel>{t('user.activity')}</SectionLabel>
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
          alert(t('user.alertDelete', { name: source.name }));
          router.back();
        }}>
        <IconSymbol name="trash" size={16} color={colors.danger} />
        <Text style={styles.deleteText}>{t('user.removeAccount')}</Text>
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
    gap: 2,
  },
  name: {
    fontFamily: Fonts.headingSemiBold,
    fontSize: 18,
    color: colors.mint,
  },
  email: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  club: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: colors.textMuted,
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
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingVertical: 7,
    paddingHorizontal: Spacing.md,
    backgroundColor: colors.surface,
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
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
    flexShrink: 1,
    textAlign: 'right',
  },
  deleteBtn: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: colors.surface,
    borderColor: colors.danger,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
  },
  deleteText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    color: colors.danger,
    textTransform: 'lowercase',
  },
});
