import { Animated, Pressable } from 'react-native';
import { useState } from 'react';
import type {
  PressableProps,
  PressableStateCallbackType,
  StyleProp,
  ViewStyle,
} from 'react-native';

import { usePressMotion } from '@/lib/motion';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

export type AnimatedPressableProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle> | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);
  /** Scale applied while pressed. */
  scale?: number;
  /** Opacity applied while pressed. */
  pressOpacity?: number;
};

/** Shared press physics for buttons, rows and nav items. */
export function AnimatedPressable({
  style,
  onPressIn,
  onPressOut,
  onHoverIn,
  onHoverOut,
  scale,
  pressOpacity,
  ...rest
}: AnimatedPressableProps) {
  const motion = usePressMotion({ scale, opacity: pressOpacity });
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);

  // The style callback is resolved here, not on the wrapped Pressable: the
  // animated wrapper drops callback styles on the new architecture.
  const resolved = typeof style === 'function' ? style({ pressed, hovered }) : style;

  // Animated interpolation values are valid at runtime but not part of
  // Pressable's static StyleProp type.
  const composedStyle = [resolved, motion.style] as unknown as StyleProp<ViewStyle>;

  return (
    <AnimatedPressableBase
      {...rest}
      onPressIn={(event) => {
        setPressed(true);
        motion.onPressIn();
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        motion.onPressOut();
        onPressOut?.(event);
      }}
      onHoverIn={(event) => {
        setHovered(true);
        onHoverIn?.(event);
      }}
      onHoverOut={(event) => {
        setHovered(false);
        onHoverOut?.(event);
      }}
      style={composedStyle}
    />
  );
}
