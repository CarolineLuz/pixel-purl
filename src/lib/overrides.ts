// Pure transforms over the hand-drawn stitch map ({@link PatternOverrides}).
// Each returns a new map; none of them mutate their input.
//
// Off-grid cells are kept rather than dropped (drawOverrides simply skips them
// when painting), so panning or shrinking the grid and then coming back restores
// the stitches that went out of view.

import type { GridCell } from "../types/editor";
import { isOnGrid } from "./grid";
import {
  overrideKey,
  type MittenSettings,
  type PatternOverrides,
} from "./patternGenerator";

/** Inverse of {@link overrideKey}. */
export function parseOverrideKey(key: string): GridCell {
  const [col, row] = key.split(",").map(Number);
  return { col, row };
}

/** Translate every drawn stitch by (dcol, drow). */
export function translateOverrides(
  overrides: PatternOverrides,
  dcol: number,
  drow: number,
): PatternOverrides {
  const next: PatternOverrides = new Map();
  overrides.forEach((color, key) => {
    const { col, row } = parseOverrideKey(key);
    next.set(overrideKey(col + dcol, row + drow), color);
  });
  return next;
}

/** Stamp `color` into every on-grid cell of `cells`. */
export function paintCells(
  overrides: PatternOverrides,
  cells: GridCell[],
  color: string,
  settings: MittenSettings,
): PatternOverrides {
  const next = new Map(overrides);
  for (const cell of cells) {
    if (!isOnGrid(settings, cell)) continue;
    next.set(overrideKey(cell.col, cell.row), color);
  }
  return next;
}

/**
 * Scale the drawing by `factor` about `anchor`, so it keeps tracking an image
 * being resized about the same point.
 *
 * Resamples by *target* cell rather than source cell: for every cell in the
 * scaled drawing's bounding box, pull the colour from the nearest source stitch
 * (inverse transform). This fills the gaps a forward map would leave when
 * enlarging, and merges stitches cleanly when shrinking.
 */
export function scaleOverrides(
  overrides: PatternOverrides,
  factor: number,
  anchor: { col: number; row: number },
): PatternOverrides {
  let minCol = Infinity;
  let minRow = Infinity;
  let maxCol = -Infinity;
  let maxRow = -Infinity;
  overrides.forEach((_color, key) => {
    const { col, row } = parseOverrideKey(key);
    if (col < minCol) minCol = col;
    if (col > maxCol) maxCol = col;
    if (row < minRow) minRow = row;
    if (row > maxRow) maxRow = row;
  });

  // Bounds of the scaled drawing (padded by 1 so rounding can't clip an edge).
  const toTargetCol = (col: number) =>
    Math.round(anchor.col + (col - anchor.col) * factor);
  const toTargetRow = (row: number) =>
    Math.round(anchor.row + (row - anchor.row) * factor);
  const tMinCol = toTargetCol(minCol) - 1;
  const tMaxCol = toTargetCol(maxCol) + 1;
  const tMinRow = toTargetRow(minRow) - 1;
  const tMaxRow = toTargetRow(maxRow) + 1;

  const next: PatternOverrides = new Map();
  for (let row = tMinRow; row <= tMaxRow; row++) {
    for (let col = tMinCol; col <= tMaxCol; col++) {
      const srcCol = Math.round(anchor.col + (col - anchor.col) / factor);
      const srcRow = Math.round(anchor.row + (row - anchor.row) / factor);
      const color = overrides.get(overrideKey(srcCol, srcRow));
      if (color !== undefined) next.set(overrideKey(col, row), color);
    }
  }
  return next;
}
