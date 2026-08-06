// Canonical string keys for the pattern's maps: stitch positions and colours.

import type { RGB } from "../types/pattern";

/** Stable map key for a stitch at grid column `col`, row `row`. */
export const overrideKey = (col: number, row: number): string => `${col},${row}`;

/** CSS colour string for an {@link RGB} triple, in the canonical form used as a
 *  {@link ColorRemap} key (matches the swatch strings offered in the draw tools). */
export const rgbCss = ([r, g, b]: RGB): string => `rgb(${r}, ${g}, ${b})`;
