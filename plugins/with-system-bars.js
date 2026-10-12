const { withAndroidStyles } = require('expo/config-plugins');

/**
 * Fixes the Android edge-to-edge system bars so they are transparent overlays
 * rather than opaque strips above the app.
 *
 * - `windowDrawsSystemBarBackgrounds` — the load-bearing one. Without the
 *   FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS flag the system bar is drawn as an opaque
 *   bar pushed above app content, leaving a solid black strip across the top of
 *   the screen. `enableEdgeToEdge()` does not set it; Expo Go does, for the same
 *   reason (expo/expo#46213).
 * - `enforceStatusBarContrast` — the translucent scrim Android paints over a
 *   transparent status bar on API 29+ to keep the icons readable.
 *
 * The navigation-bar equivalents come from `expo-navigation-bar`'s
 * `enforceContrast: false`; nothing exposes these two.
 */
const ITEMS = [
  { name: 'android:windowDrawsSystemBarBackgrounds', value: 'true' },
  { name: 'android:enforceStatusBarContrast', value: 'false', targetApi: '29' },
];

module.exports = function withSystemBars(config) {
  return withAndroidStyles(config, (config) => {
    const names = new Set(ITEMS.map((item) => item.name));
    const styles = config.modResults.resources.style ?? [];

    config.modResults.resources.style = styles.map((style) => {
      if (style.$.name !== 'AppTheme') return style;
      style.item = (style.item ?? []).filter((item) => !names.has(item.$.name));
      style.item.push(
        ...ITEMS.map(({ name, value, targetApi }) => ({
          $: { name, ...(targetApi && { 'tools:targetApi': targetApi }) },
          _: value,
        }))
      );
      return style;
    });

    return config;
  });
};
