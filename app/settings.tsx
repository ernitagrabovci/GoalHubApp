import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import type { ComponentProps } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/dashboard/dashboard-text';
import { Fonts } from '@/constants/theme';
import { I, scaled } from '@/lib/responsive';
import { useSession, type Role } from '@/lib/session';

/**
 * Settings — light-only, matches the pill dashboards' #FAFBFA canvas.
 *
 * Root-stack screen (no bottom pill bar). Back arrow + title and the menu
 * card sit as one group, vertically centered. Rows are placeholders until
 * their destination screens exist; each row routes when `route` is set.
 */

const C = {
  bg: '#FAFBFA',
  line: 'rgba(0,0,0,0.025)',

  text: '#111111',

  card: '#F1FBF5',
  cardBorder: '#CFE6D8',
  divider: '#D8ECE1',

  red: '#E03131',
};

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type SettingsRow = {
  icon: IconName;
  label: string;
  /** Destination route — leave unset until the settings sub-page exists. */
  route?: string;
  /**
   * Roles that get this row. Omitted means every role does. The club-wide
   * panels are the administrator's; trainers keep the account and legal pages.
   */
  roles?: Role[];
};

const ROWS: SettingsRow[] = [
  { icon: 'account-cog-outline', label: 'Cilësimet e llogarisë', route: '/account-settings' },
  {
    icon: 'account-group-outline',
    label: 'Cilësimet e klubit',
    route: '/club-settings',
    roles: ['administrator'],
  },
  {
    icon: 'calendar-month-outline',
    label: 'Cilësimet e sezonit',
    route: '/season-settings',
    roles: ['administrator'],
  },
  {
    icon: 'bell-outline',
    label: 'Cilësimet e njoftimeve',
    route: '/notification-settings',
    roles: ['administrator'],
  },
  {
    icon: 'lock-outline',
    label: 'Siguria',
    route: '/security-settings',
    roles: ['administrator'],
  },
  {
    icon: 'credit-card-outline',
    label: 'Abonimi',
    route: '/subscription-settings',
    roles: ['administrator'],
  },
  { icon: 'shield-account-outline', label: 'Privacy Policy', route: '/privacy-policy' },
  {
    icon: 'file-document-outline',
    label: 'Terms and Conditions',
    route: '/terms-conditions',
  },
  { icon: 'cookie-outline', label: 'Cookies Policy', route: '/cookies-policy' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useSession();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const rows = ROWS.filter((row) => !row.roles || (!!user && row.roles.includes(user.role)));

  const go = (route?: string) => {
    if (route) router.push(route as never);
  };

  const logOut = () => {
    signOut();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      {/* Faint vertical lines — same canvas texture as the dashboards */}
      <View pointerEvents="none" style={styles.lines}>
        {Array.from({ length: lineCount }).map((_, index) => (
          <View key={index} style={[styles.line, { left: index * 9 }]} />
        ))}
      </View>

      {/* Pinned header — the shell every other page uses */}
      <View style={styles.header}>
        <View style={styles.colPad}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Kthehu prapa"
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons name="chevron-left" size={I(24)} color={C.text} />
            </Pressable>
            <View style={styles.headerText}>
              <Text style={styles.title} numberOfLines={1}>
                Settings
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
                key={row.label}
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
                  color={C.text}
                  style={styles.rowIcon}
                />
                <Text style={styles.rowText}>{row.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Log out — the one destructive action, pinned to the foot of the page */}
      <View style={styles.colPad}>
        <Pressable
          onPress={logOut}
          accessibilityRole="button"
          accessibilityLabel="Log out"
          style={({ pressed }) => [styles.logOut, pressed && styles.pressed]}
        >
          <MaterialCommunityIcons name="logout" size={I(20)} color="#FFFFFF" />
          <Text style={styles.logOutText}>Log out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create(scaled({
  safe: {
    flex: 1,
    backgroundColor: C.bg,
  },

  lines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },

  line: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: C.line,
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
    backgroundColor: C.bg,
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
    color: C.text,
  },

  card: {
    marginTop: 6,

    backgroundColor: C.card,
    borderWidth: 2,
    borderColor: C.cardBorder,
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
    borderTopColor: C.divider,
  },

  rowIcon: {
    width: 25,
  },

  rowText: {
    flex: 2,
    fontFamily: Fonts.bodyBold,
    fontSize: 18,
    lineHeight: 25,
    color: C.text,
  },

  logOut: {
    marginTop: 10,
    marginBottom: 6,
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: C.red,
    borderRadius: 5,
  },

  logOutText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
    lineHeight: 21,
    color: '#FFFFFF',
  },
}));
