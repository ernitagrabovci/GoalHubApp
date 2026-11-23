import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ComponentProps } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { useLanguage } from '@/lib/i18n';
import { I, scaled } from '@/lib/responsive';
import { useSession, type Role } from '@/lib/session';
import { useTheme } from '@/lib/theme';
import { useAppColors, usePaletteStyles, type AppColorsOf } from '@/lib/app-theme';

/**
 * Settings — follows the active theme through the shared app palette.
 *
 * Root-stack screen (no bottom pill bar). Back arrow + title and the menu
 * card sit as one group, vertically centered. Rows are placeholders until
 * their destination screens exist; each row routes when `route` is set.
 */

const C_LIGHT = {
  bg: '#F7F9F8',
  line: 'rgba(0,0,0,0.025)',

  text: '#17251E',

  card: '#F1FBF5',
  cardBorder: '#CFE6D8',
  divider: '#D8ECE1',

  green: '#2E7D5B',
  greenSoft: '#E9F7EF',
  greenLine: '#BFE3CF',

  red: '#B91C1C',
};

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type SettingsRow = {
  icon: IconName;
  labelKey: string;
  /** Destination route — leave unset until the settings sub-page exists. */
  route?: string;
  /**
   * Roles that get this row. Omitted means every role does. The club-wide
   * panels are the administrator's; trainers keep the account and legal pages.
   */
  roles?: Role[];
};

const ROWS: SettingsRow[] = [
  { icon: 'account-cog-outline', labelKey: 'settings.account', route: '/account-settings' },
  {
    icon: 'account-group-outline',
    labelKey: 'settings.club',
    route: '/club-settings',
    roles: ['administrator'],
  },
  {
    icon: 'calendar-month-outline',
    labelKey: 'settings.season',
    route: '/season-settings',
    roles: ['administrator'],
  },
  {
    icon: 'bell-outline',
    labelKey: 'settings.notifications',
    route: '/notification-settings',
    roles: ['administrator'],
  },
  {
    icon: 'lock-outline',
    labelKey: 'settings.security',
    route: '/security-settings',
    roles: ['administrator'],
  },
  {
    icon: 'credit-card-outline',
    labelKey: 'settings.subscription',
    route: '/subscription-settings',
    roles: ['administrator'],
  },
  { icon: 'shield-account-outline', labelKey: 'settings.privacy', route: '/privacy-policy' },
  {
    icon: 'file-document-outline',
    labelKey: 'settings.terms',
    route: '/terms-conditions',
  },
  { icon: 'cookie-outline', labelKey: 'settings.cookies', route: '/cookies-policy' },
];

export default function SettingsScreen() {
  const C = useAppColors(C_LIGHT);
  const styles = usePaletteStyles(createStyles, C);
  const router = useRouter();
  const { t } = useLanguage();
  const { user, signOut } = useSession();
  const { isDark, setTheme } = useTheme();

  const rows = ROWS.filter((row) => !row.roles || (!!user && row.roles.includes(user.role)));

  const themeOptions = [
    { mode: 'light' as const, icon: 'white-balance-sunny' as const, labelKey: 'settings.light' },
    { mode: 'dark' as const, icon: 'weather-night' as const, labelKey: 'settings.dark' },
  ];

  const go = (route?: string) => {
    if (route) router.push(route as never);
  };

  const logOut = () => {
    signOut();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      {/* Pinned header — the shell every other page uses */}
      <View style={styles.header}>
        <View style={styles.colPad}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t('common.back')}
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons name="chevron-left" size={I(24)} color={C.textText} />
            </Pressable>
            <View style={styles.headerText}>
              <Text style={styles.title} numberOfLines={1}>
                {t('settings.title')}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.colPad}>
          {/* Menu card */}
          <View style={styles.card}>
            {rows.map((row, index) => (
              <Pressable
                key={row.labelKey}
                onPress={() => go(row.route)}
                style={({ pressed }) => [
                  styles.row,
                  index > 0 && styles.rowDivider,
                  pressed && styles.pressed,
                ]}
              >
                <MaterialCommunityIcons
                  name={row.icon}
                  size={I(21)}
                  color={C.textText}
                  style={styles.rowIcon}
                />
                <Text style={styles.rowText}>{t(row.labelKey)}</Text>
              </Pressable>
            ))}
          </View>

          {/* Appearance — light / dark for the whole app */}
          <View style={styles.appearanceCard}>
            <View style={styles.appearanceHead}>
              <MaterialCommunityIcons
                name="theme-light-dark"
                size={I(21)}
                color={C.textText}
                style={styles.rowIcon}
              />
              <Text style={styles.appearanceTitle}>{t('settings.appearance')}</Text>
            </View>

            <View style={styles.themeRow}>
              {themeOptions.map((option) => {
                const active = (option.mode === 'dark') === isDark;
                return (
                  <Pressable
                    key={option.mode}
                    onPress={() => setTheme(option.mode)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={t(option.labelKey)}
                    style={({ pressed }) => [
                      styles.themeOption,
                      active && styles.themeOptionActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={option.icon}
                      size={I(20)}
                      color={active ? C.greenText : C.textText}
                    />
                    <Text
                      style={[styles.themeOptionText, active && styles.themeOptionTextActive]}
                    >
                      {t(option.labelKey)}
                    </Text>
                    {active ? (
                      <MaterialCommunityIcons
                        name="check-circle"
                        size={I(17)}
                        color={C.greenText}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Log out — the one destructive action, pinned to the foot of the page */}
      <View style={styles.colPad}>
        <Pressable
          onPress={logOut}
          accessibilityRole="button"
          accessibilityLabel={t('settings.logOut')}
          style={({ pressed }) => [styles.logOut, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons name="logout" size={I(20)} color="#FFFFFF" />
          <Text style={styles.logOutText}>{t('settings.logOut')}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (C: AppColorsOf<typeof C_LIGHT>) => StyleSheet.create(scaled({
  safe: {
    flex: 1,
  },

  colPad: {
    alignSelf: 'center',
    width: '100%',
    paddingHorizontal: 27,
  },

  scroll: {
    paddingBottom: 18,
  },

  pressed: {
    opacity: 0.5,
  },

  header: {
    backgroundColor: 'transparent',
    paddingTop: 2,
    paddingBottom: 12,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  backBtn: {
    height: 34,
    justifyContent: 'center',
    marginLeft: -8,
    paddingRight: 10,
  },

  headerText: {
    flex: 1,
    justifyContent: 'center',
  },

  title: {
    fontFamily: Fonts.bodyBold,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.3,
    color: C.textText,
  },

  card: {
    marginTop: 6,

    backgroundColor: C.cardFill,
    borderWidth: 2,
    borderColor: C.cardBorderBorder,
    borderRadius: 5,
    overflow: 'hidden',
  },

  row: {
    minHeight: 58,
    paddingVertical: 10,
    paddingHorizontal: 20,

    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },

  rowDivider: {
    borderTopWidth: 2,
    borderTopColor: C.dividerBorder,
  },

  rowIcon: {
    width: 25,
  },

  appearanceCard: {
    marginTop: 14,
    backgroundColor: C.cardFill,
    borderWidth: 2,
    borderColor: C.cardBorderBorder,
    borderRadius: 5,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  appearanceHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },

  appearanceTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 18,
    lineHeight: 25,
    color: C.textText,
  },

  themeRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },

  themeOption: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: C.cardBorderBorder,
    borderRadius: 5,
  },

  themeOptionActive: {
    backgroundColor: C.greenSoftFill,
    borderColor: C.greenLineBorder,
  },

  themeOptionText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    lineHeight: 20,
    color: C.textText,
  },

  themeOptionTextActive: {
    color: C.greenText,
  },

  rowText: {
    flex: 2,
    fontFamily: Fonts.bodyBold,
    fontSize: 18,
    lineHeight: 25,
    color: C.textText,
  },

  logOut: {
    marginTop: 10,
    marginBottom: 6,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: C.redFill,
    borderRadius: 5,
  },

  logOutText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
    lineHeight: 21,
    color: '#FFFFFF',
  },
}));
