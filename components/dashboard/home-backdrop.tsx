import { StyleSheet, View } from 'react-native';

/** Flat mint canvas for the home tab — the same tone as the sign-in button. */
export function HomeBackdrop() {
  return <View pointerEvents="none" style={styles.fill} />;
}

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0e6f8071',
  },
});
