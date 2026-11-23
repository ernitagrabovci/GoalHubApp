import { useCallback, useEffect, useMemo, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';

/** Motion durations in milliseconds. */
export const Motion = {
  fast: 140,
  standard: 200,
  complex: 300,
} as const;

/** Entrances ease out, exits ease in, state changes ease in/out. */
export const Easings = {
  enter: Easing.bezier(0.22, 1, 0.36, 1),
  exit: Easing.bezier(0.4, 0, 1, 1),
  standard: Easing.bezier(0.65, 0, 0.35, 1),
} as const;

/**
 * Tracks the OS reduced-motion setting. Starts as `false` so the first frame
 * renders, then adopts the real value and follows later changes.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setReduced(value);
      })
      .catch(() => {});

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      if (active) setReduced(value);
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}

type PressMotionOptions = {
  /** Scale at full press. */
  scale?: number;
  /** Opacity at full press. */
  opacity?: number;
};

/**
 * Press feedback shared by every tappable surface. Only opacity and transform
 * animate (native driver). Under reduced motion the scale is dropped and the
 * opacity change is instant; the final visual state is unchanged.
 */
export function usePressMotion({ scale = 0.97, opacity = 0.86 }: PressMotionOptions = {}) {
  const reduced = useReducedMotion();
  const [progress] = useState(() => new Animated.Value(0));

  const animateTo = useCallback(
    (to: 0 | 1) => {
      Animated.timing(progress, {
        toValue: to,
        duration: reduced ? 0 : Motion.fast,
        easing: Easings.enter,
        useNativeDriver: true,
      }).start();
    },
    [progress, reduced]
  );

  const style = useMemo(
    () => ({
      transform: [
        {
          scale: reduced
            ? 1
            : progress.interpolate({ inputRange: [0, 1], outputRange: [1, scale] }),
        },
      ],
      opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [1, opacity] }),
    }),
    [progress, reduced, scale, opacity]
  );

  return {
    style,
    onPressIn: () => animateTo(1),
    onPressOut: () => animateTo(0),
  };
}

/**
 * Selection feedback for nav items: the active icon settles to scale 1 while
 * its capsule fades in. Reduced motion snaps straight to the final state.
 */
export function useNavFocus(active: boolean) {
  const reduced = useReducedMotion();
  const [value] = useState(() => new Animated.Value(active ? 1 : 0.9));

  useEffect(() => {
    Animated.timing(value, {
      toValue: active ? 1 : 0.9,
      duration: reduced ? 0 : Motion.standard,
      easing: Easings.enter,
      useNativeDriver: true,
    }).start();
  }, [active, reduced, value]);

  return {
    iconStyle: { transform: [{ scale: value }] },
    capsuleStyle: {
      opacity: value.interpolate({
        inputRange: [0.9, 1],
        outputRange: [0, 1],
        extrapolate: 'clamp' as const,
      }),
    },
  };
}
