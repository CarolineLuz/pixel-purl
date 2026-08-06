// Shared types for the mitten knit-pattern grid.

/** An sRGB colour as a `[r, g, b]` triple, each channel 0–255. */
export type RGB = [number, number, number];

export interface MittenSettings {
  /** Number of stitches across (canvas width in stitches). */
  stitches: number;
  /** Number of rows down (canvas height in stitches). */
  rows: number;
  /** Horizontal image offset, in stitches (-100–100). */
  offsetX: number;
  /** Vertical image offset, in stitches (-100–100). */
  offsetY: number;
  /** Image scale as a percentage (0–200). */
  size: number;
  /** Image rotation in degrees (-180–180). */
  rotation: number;
  /** Brightness adjustment applied before thresholding (-200–200). */
  brightness: number;
  /** Width of detected edges, in stitches (0 = edge detection off). */
  edgeThickness: number;
  /** Edge-detection sensitivity (0–100); higher finds weaker/noisier edges. */
  edgeSensitivity: number;
  /**
   * Number of colours in the extracted palette (2–10). The image is reduced to
   * its {@link extractPalette} most-representative colours and every block is
   * mapped to the nearest one, instead of the old black/white(/grey) greyscale.
   */
  numColors: number;
}

/**
 * Manual stitch edits drawn by the user on top of the image-derived pattern.
 * Keyed by {@link overrideKey}; the value is the stitch's CSS colour (see
 * {@link INK_COLORS}). Overrides are applied after the image render, so a
 * hand-drawn stitch always wins over whatever the image produced there and
 * survives changes to the image controls.
 */
export type PatternOverrides = Map<string, string>;

/**
 * A rectangular block of stitches, given as inclusive grid-cell bounds with
 * `c0 <= c1` and `r0 <= r1`. Used by the selection tool to mark, copy and move a
 * region; drawn as a dashed marquee by {@link drawPattern}.
 */
export interface SelectionRect {
  c0: number;
  r0: number;
  c1: number;
  r1: number;
}

/**
 * Colour reassignments made in the toolbar's "reassign colours" mode. Maps an
 * original canvas colour (a palette entry's {@link rgbCss} or an override's CSS
 * string) to the colour it should be drawn as instead. Applied at render time to
 * both the image-derived fills and the hand-drawn overrides, so recolouring never
 * disturbs the palette used to quantise the image.
 */
export type ColorRemap = Map<string, string>;
