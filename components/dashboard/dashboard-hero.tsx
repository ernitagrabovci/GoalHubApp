import { StyleSheet, View, type ViewProps } from 'react-native';

/**
 * Hero area of the dashboard. Transparent on purpose so the app wallpaper runs
 * behind the header and the orange-rimmed stat cards.
 */
export function DashboardHero({ children }: ViewProps) {
  return <View style={styles.hero}>{children}</View>;
}

const styles = StyleSheet.create({
  hero: {
    paddingBottom: 12,
  },
});
