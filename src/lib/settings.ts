// Rules about {@link MittenSettings} values themselves: what they may hold, and
// how one control has to compensate for another.

import { OFFSET_MAX, OFFSET_MIN } from "../config/editor";
import {
  STITCH_SIZE,
  type MittenSettings,
} from "./patternGenerator";

/** Keep an image offset within the range the controls allow. */
export const clampOffset = (value: number): number =>
  Math.max(OFFSET_MIN, Math.min(OFFSET_MAX, value));

/**
 * Change the row count while keeping the image where it is.
 *
 * The grid grows from a fixed top edge, so its centre — the anchor the image is
 * drawn about (see renderImage's drawY) — drifts down by half the added height,
 * which would open the new rows above the image. Nudging offsetY the other way
 * keeps the image (and its alignment with the drawn stitches, which are indexed
 * from the top) put, so the extra rows appear at the bottom instead.
 */
export function withRowCount(
  settings: MittenSettings,
  rows: number,
): MittenSettings {
  return {
    ...settings,
    rows,
    offsetY: clampOffset(settings.offsetY - (rows - settings.rows) / 2),
  };
}

/**
 * The offsetY that starts a freshly loaded image flush with the top of the grid.
 *
 * The default offsetY of 0 centres the image, which crops the top of a tall one.
 * Since the base placement centres it, top-aligning means nudging it up by half
 * the leftover height (see renderImage's drawY).
 */
export function topAlignedOffsetY(
  img: HTMLImageElement,
  settings: MittenSettings,
): number {
  const drawHeight = (settings.size / 100) * img.height;
  const gridHeight = settings.rows * STITCH_SIZE;
  return clampOffset(Math.round((drawHeight - gridHeight) / (2 * STITCH_SIZE)));
}
