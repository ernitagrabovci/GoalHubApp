import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Fixed chrome heights used to budget the pitch in portrait. */
export const TOOLBAR_H = 46;
export const TOOLBAR_GAP = 6;
export const PHASE_H = 70;
export const TOOLS_H = 74;

export type BoardLayout = {
  width: number;
  height: number;
  insets: { top: number; bottom: number; left: number; right: number };
  landscape: boolean;
  wide: boolean;
};

/**
 * The app is portrait-locked today, but the board is written against live
 * dimensions so it also works on a tablet or if orientation is unlocked later.
 */
export function useBoardLayout(): BoardLayout {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  return {
    width,
    height,
    insets,
    landscape: width > height,
    wide: width >= 700,
  };
}
