// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];
export type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'square.grid.2x2.fill': 'grid-view',
  'person.2.fill': 'groups',
  'person.fill': 'person',
  'figure.soccer': 'sports-soccer',
  calendar: 'calendar-month',
  'graduationcap.fill': 'school',
  stethoscope: 'medical-services',
  'dollarsign.circle.fill': 'payments',
  'bubble.left.fill': 'chat',
  'chart.bar.fill': 'bar-chart',
  'gearshape.fill': 'settings',
  'trophy.fill': 'emoji-events',
  'arrow.right': 'arrow-forward',
  'bolt.fill': 'bolt',
  'doc.text.fill': 'description',
  'checkmark.circle.fill': 'check-circle',
  'clock.fill': 'schedule',
  'star.fill': 'star',
  'map.fill': 'map',
  'hammer.fill': 'build',
  xmark: 'close',
  pencil: 'edit',
  link: 'link',
  ellipsis: 'more-vert',
  'square.and.arrow.up': 'share',
  trash: 'delete',
  notifications: 'notifications',
  warning: 'warning',
  receipt: 'receipt',
  mail: 'mail',
  lock: 'lock',
  visibility: 'visibility',
  'visibility-off': 'visibility-off',
  'verified-user': 'verified-user',
  logout: 'logout',
  plus: 'add',
  'arrow-left': 'arrow-back',
  'chevron-left': 'chevron-left',
  search: 'search',
  'ellipsis.horizontal': 'more-horiz',
  'info': 'info',
  'plus.circle.fill': 'add-circle',
  'checkmark.shield.fill': 'verified',
  'trending-up': 'trending-up',
  speed: 'speed',
  'fitness-center': 'fitness-center',
  event: 'event',
  'date-range': 'date-range',
  flag: 'flag',
  'monitor-heart': 'monitor-heart',
  'query-stats': 'query-stats',
  assignment: 'assignment',
} as const satisfies Record<string, MaterialIconName>;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
