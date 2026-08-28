import { useRouter, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Screen, DetailHead } from '@/components/screen';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';
import { Fonts, Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useLanguage } from '@/lib/i18n';
import { useTheme, useThemedStyles } from '@/lib/theme';

type AdminItem = {
  key: string;
  icon: IconSymbolName;
  labelKey: string;
  /** Route to a live screen; undefined means the feature is coming soon. */
  route?: Href;
};

type AdminSection = {
  key: string;
  icon: IconSymbolName;
  labelKey: string;
  items: AdminItem[];
};

/** Mirrors the webapp admin sidebar (Klubi, Ekipet, Lojtarët, …). */
const SECTIONS: AdminSection[] = [
  {
    key: 'klubi',
    icon: 'trophy.fill',
    labelKey: 'admin.section.klubi',
    items: [
      { key: 'clubProfile', icon: 'trophy.fill', labelKey: 'module.Club', route: '/club' },
      { key: 'competitions', icon: 'trophy.fill', labelKey: 'module.Competitions', route: '/competitions' },
      { key: 'season', icon: 'calendar', labelKey: 'admin.item.season', route: '/club' },
      { key: 'fields', icon: 'flag', labelKey: 'admin.item.fields', route: '/club' },
    ],
  },
  {
    key: 'ekipet',
    icon: 'person.2.fill',
    labelKey: 'admin.section.ekipet',
    items: [
      { key: 'teams', icon: 'person.2.fill', labelKey: 'module.Teams', route: '/teams' },
      { key: 'statistics', icon: 'chart.bar.fill', labelKey: 'admin.item.statistics' },
      { key: 'transfers', icon: 'arrow.right', labelKey: 'admin.item.transfers', route: '/transfers' },
    ],
  },
  {
    key: 'lojtaret',
    icon: 'person.2.fill',
    labelKey: 'admin.section.lojtaret',
    items: [
      { key: 'registerPlayer', icon: 'plus', labelKey: 'admin.item.registerPlayer', route: '/players' },
      { key: 'players', icon: 'person.2.fill', labelKey: 'module.Players', route: '/players' },
      { key: 'statistics', icon: 'chart.bar.fill', labelKey: 'admin.item.statistics' },
      { key: 'ratings', icon: 'star.fill', labelKey: 'admin.item.ratings', route: '/ratings' },
    ],
  },
  {
    key: 'ndeshjet',
    icon: 'figure.soccer',
    labelKey: 'admin.section.ndeshjet',
    items: [
      { key: 'matches', icon: 'figure.soccer', labelKey: 'module.Matches', route: '/matches' },
      { key: 'createMatch', icon: 'plus', labelKey: 'admin.item.createMatch', route: '/matches' },
    ],
  },
  {
    key: 'medical',
    icon: 'stethoscope',
    labelKey: 'admin.section.medical',
    items: [{ key: 'medical', icon: 'stethoscope', labelKey: 'module.Medical', route: '/medical' }],
  },
  {
    key: 'pagesat',
    icon: 'dollarsign.circle.fill',
    labelKey: 'admin.section.pagesat',
    items: [
      { key: 'paymentList', icon: 'receipt', labelKey: 'module.Payments', route: '/fees' },
      { key: 'paymentReport', icon: 'chart.bar.fill', labelKey: 'admin.item.paymentReport', route: '/reports' },
    ],
  },
  {
    key: 'komunikimet',
    icon: 'bubble.left.fill',
    labelKey: 'admin.section.komunikimet',
    items: [
      { key: 'notifications', icon: 'notifications', labelKey: 'admin.item.notifications', route: '/notifications' },
      { key: 'messages', icon: 'bubble.left.fill', labelKey: 'module.Messages', route: '/chat' },
      { key: 'emails', icon: 'mail', labelKey: 'admin.item.emails' },
    ],
  },
  {
    key: 'raportet',
    icon: 'chart.bar.fill',
    labelKey: 'admin.section.raportet',
    items: [
      { key: 'playerReports', icon: 'person.2.fill', labelKey: 'module.Reports', route: '/reports' },
      { key: 'matchReports', icon: 'figure.soccer', labelKey: 'module.Reports', route: '/reports' },
      { key: 'paymentReports', icon: 'dollarsign.circle.fill', labelKey: 'module.Reports', route: '/reports' },
    ],
  },
  {
    key: 'perdoruesit',
    icon: 'person.fill',
    labelKey: 'admin.section.perdoruesit',
    items: [
      { key: 'createAccount', icon: 'plus', labelKey: 'admin.item.createAccount', route: '/users' },
      { key: 'roles', icon: 'verified-user', labelKey: 'admin.item.roles' },
      { key: 'userList', icon: 'person.fill', labelKey: 'admin.item.userList', route: '/users' },
      { key: 'activity', icon: 'clock.fill', labelKey: 'admin.item.activity' },
    ],
  },
  {
    key: 'cilesimet',
    icon: 'gearshape.fill',
    labelKey: 'admin.section.cilesimet',
    items: [
      { key: 'accountSettings', icon: 'person.fill', labelKey: 'module.Settings', route: '/profile' },
      { key: 'clubSettings', icon: 'trophy.fill', labelKey: 'admin.item.clubSettings', route: '/club' },
      { key: 'notifSettings', icon: 'notifications', labelKey: 'admin.item.notifSettings' },
      { key: 'security', icon: 'lock', labelKey: 'admin.item.security', route: '/profile' },
      { key: 'subscription', icon: 'dollarsign.circle.fill', labelKey: 'admin.item.subscription', route: '/profile' },
    ],
  },
];

export default function AdminScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useLanguage();
  const [open, setOpen] = useState<string | null>('lojtaret');

  const toggle = (key: string) => setOpen((prev) => (prev === key ? null : key));

  const handleItem = (item: AdminItem) => {
    if (item.route) router.push(item.route);
    else alert(t('admin.comingSoon'));
  };

  return (
    <Screen back>
      <DetailHead
        icon="gearshape.fill"
        accent={colors.mint}
        title={t('admin.title')}
        subtitle={t('admin.subtitle')}
      />

      <View style={styles.list}>
        {SECTIONS.map((section) => {
          const expanded = open === section.key;
          return (
            <View key={section.key} style={styles.card}>
              <Pressable style={styles.head} onPress={() => toggle(section.key)}>
                <View style={[styles.headIcon, { backgroundColor: `${colors.mint}1f` }]}>
                  <IconSymbol name={section.icon} size={18} color={colors.mint} />
                </View>
                <Text style={styles.headLabel}>{t(section.labelKey)}</Text>
                <IconSymbol
                  name="chevron.right"
                  size={16}
                  color={colors.textMuted}
                  style={expanded ? styles.chevronOpen : undefined}
                />
              </Pressable>
              {expanded ? (
                <View style={styles.items}>
                  {section.items.map((item) => (
                    <Pressable key={item.key} style={styles.item} onPress={() => handleItem(item)}>
                      <View style={[styles.itemIcon, { backgroundColor: `${colors.mint}14` }]}>
                        <IconSymbol name={item.icon} size={15} color={colors.textSecondary} />
                      </View>
                      <Text style={styles.itemLabel}>{t(item.labelKey)}</Text>
                      <IconSymbol name="chevron.right" size={14} color={colors.textMuted} />
                    </Pressable>
                  ))}
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
  list: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  headIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headLabel: {
    flex: 1,
    fontFamily: Fonts.headingSemiBold,
    fontSize: 15,
    color: colors.text,
    textTransform: 'lowercase',
  },
  chevronOpen: {
    transform: [{ rotate: '90deg' }],
  },
  items: {
    borderTopColor: colors.borderSoft,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingLeft: Spacing.xl,
    paddingRight: Spacing.lg,
  },
  itemIcon: {
    width: 30,
    height: 30,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLabel: {
    flex: 1,
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: colors.textSecondary,
    textTransform: 'lowercase',
  },
});
