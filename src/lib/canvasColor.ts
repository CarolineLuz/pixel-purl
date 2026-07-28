// Resolving and comparing colours as the canvas actually renders them.

import { COLOR_MATCH_TOLERANCE } from "../config/editor";
import type { RGBA } from "../types/editor";

/** Resolve any CSS colour string to its rendered `[r, g, b, a]` bytes, so painted
 *  colours can be compared against pixels sampled from the canvas. */
export function cssToRgba(css: string): RGBA {
  const c = document.createElement("canvas");
  c.width = 1;
  c.height = 1;
  const ctx = c.getContext("2d");
  if (!ctx) return [0, 0, 0, 255];
  ctx.fillStyle = css;
  ctx.fillRect(0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  return [d[0], d[1], d[2], d[3]];
}

/** Whether two sampled colours count as the same region: every channel
 *  (including alpha) within {@link COLOR_MATCH_TOLERANCE}. */
export function colorsMatch(a: RGBA, b: RGBA): boolean {
  return (
    Math.abs(a[0] - b[0]) <= COLOR_MATCH_TOLERANCE &&
    Math.abs(a[1] - b[1]) <= COLOR_MATCH_TOLERANCE &&
    Math.abs(a[2] - b[2]) <= COLOR_MATCH_TOLERANCE &&
    Math.abs(a[3] - b[3]) <= COLOR_MATCH_TOLERANCE
  );
}
