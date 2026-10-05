import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';

const BACKGROUND = require('@/assets/images/background.jpg');

/** Natural width / height of the artwork. */
const TILE_RATIO = 2160 / 3049;

/* ---------------------------------------------------------------------
 * Knobs — everything that places the artwork.
 * ------------------------------------------------------------------- */

/**
 * How wide one copy of the artwork is, as a fraction of the screen width.
 *   1      the motif spans the screen exactly (no crop, no gaps)
 *   < 1    smaller motif, repeating more, with the artwork's own field
 *          colour showing either side of it
 *   > 1    bigger motif; the sides get cropped
 */
const TILE_SCALE = 1.45;

/** 1 draws the artwork exactly as it is; lower fades it into the page. */
const OPACITY = 0.06;

/** Colour behind the artwork — the artwork's own background field. */
const FIELD = '#F5F5F5';

/* ------------------------------------------------------------------- */

/**
 * App-wide wallpaper: the artwork repeated down the screen. Every screen paints
 * its own root background transparent so this shows through.
 *
 * It is tiled by hand rather than with `resizeMode`, which on iOS stretches the
 * image to the view instead of repeating it. The artwork is a vertical tile, so
 * repeating it fills any phone ratio without cropping or distorting it.
 */
export function AppBackground() {
  const { width, height } = useWindowDimensions();
  const tileWidth = width * TILE_SCALE;
  const tileHeight = tileWidth / TILE_RATIO;
  const left = (width - tileWidth) / 2;
  const tiles = Math.ceil(height / tileHeight)  + 1;

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.field]}>
      {Array.from({ length: tiles }, (_, i) => (
        <Image
          key={i}
          source={BACKGROUND}
          style={[styles.tile, { left, top: i * tileHeight, width: tileWidth, height: tileHeight }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    backgroundColor: FIELD,
  },
  tile: {
    position: 'absolute',
    opacity: OPACITY,
  },
});
