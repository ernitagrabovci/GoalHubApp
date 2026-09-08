import type { ComponentProps } from 'react';
import { Text as RNText } from 'react-native';

/**
 * Dashboard <Text> that pins maxFontSizeMultiplier so Android system font-size
 * can't inflate the fixed-height dashboard canvas on top of the width scale.
 * (Text.defaultProps is not honored in RN 0.86, so a wrapper is required.)
 */
export function Text(props: ComponentProps<typeof RNText>) {
  return <RNText {...props} maxFontSizeMultiplier={1.0} />;
}
