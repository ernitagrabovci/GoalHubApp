import { StyleSheet, View } from 'react-native';

import { DashboardC } from '@/constants/dashboard-theme';
import { useAppColors, usePaletteStyles, type AppColorsOf } from '@/lib/app-theme';

/** Flat brand canvas shared by every role dashboard and its pill bar. */
export function HomeBackdrop() {
  const C = useAppColors(DashboardC);
  const styles = usePaletteStyles(createStyles, C);
  return <View pointerEvents="none" style={styles.fill} />;
}

const createStyles = (C: AppColorsOf<typeof DashboardC>) => StyleSheet.create({
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: C.bgFill,
  },
});
