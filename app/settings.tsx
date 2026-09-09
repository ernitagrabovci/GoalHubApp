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
};

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

type SettingsRow = {
  icon: IconName;
  label: string;
  /** Destination route — leave unset until the settings sub-page exists. */
  route?: string;
};

const ROWS: SettingsRow[] = [
  { icon: 'account-cog-outline', label: 'Cilësimet e llogarisë' },
  { icon: 'account-group-outline', label: 'Cilësimet e klubit' },
  { icon: 'calendar-month-outline', label: 'Cilësimet e sezonit' },
  { icon: 'bell-outline', label: 'Cilësimet e njoftimeve' },
  { icon: 'lock-outline', label: 'Siguria' },
  { icon: 'credit-card-outline', label: 'Abonimi' },
  { icon: 'shield-account-outline', label: 'Privacy Policy' },
  { icon: 'file-document-outline', label: 'Terms and Conditions' },
  { icon: 'cookie-outline', label: 'Cookies Policy' },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const lineCount = Math.ceil(width / 9);

  const go = (route?: string) => {
    if (route) router.push(route as never);
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

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.page}>
          {/* Header — back arrow + title */}
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Back"
              style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={I(30)}
                color={C.text}
              />
            </Pressable>
            <Text style={styles.title}>Settings</Text>
          </View>

          {/* Menu card */}
          <View style={styles.card}>
            {ROWS.map((row, index) => (
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

  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },

  page: {
    paddingHorizontal: 30,

    marginBottom: 110,
  },

  pressed: {
    opacity: 0.5,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',

    height: 70,
  },

  backBtn: {
    height: 70,

    justifyContent: 'center',

    marginLeft: -1,
    paddingRight: 10,
  },

  title: {
    fontFamily: Fonts.bodyBold,
    fontSize: 25,
    lineHeight: 28,
    letterSpacing: -0.4,
    color: C.text,
  },

  card: {
    marginTop: 30,

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
}));
