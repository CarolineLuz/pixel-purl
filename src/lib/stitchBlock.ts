// Stamping and lifting {@link StitchBlock}s — the shared machinery behind copy,
// paste and move.

import { ERASE_COLOR } from "../config/editor";
import type { GridCell, StitchBlock } from "../types/editor";
import { parseOverrideKey } from "./overrides";
import {
  overrideKey,
  type PatternOverrides,
  type SelectionRect,
} from "./patternGenerator";

/** Stamp a block's cells onto a copy of `base` with its top-left at `origin`.
 *  Off-grid cells are kept (they're simply not drawn), mirroring the panning
 *  behaviour, so nudging a block back into view restores it. */
export function mergeBlock(
  base: PatternOverrides,
  block: StitchBlock,
  origin: GridCell,
): PatternOverrides {
  const next = new Map(base);
  block.cells.forEach((color, relKey) => {
    const { col, row } = parseOverrideKey(relKey);
    next.set(overrideKey(origin.col + col, origin.row + row), color);
  });
  return next;
}

/**
 * Clear the region a block was lifted from, so moving it leaves an empty gap
 * behind. Cells the block actually carried are covered with {@link ERASE_COLOR}
 * (hiding any image underneath); the rest are simply dropped.
 */
export function cutRegion(
  base: PatternOverrides,
  rect: SelectionRect,
  block: StitchBlock,
): PatternOverrides {
  const next = new Map(base);
  for (let row = rect.r0; row <= rect.r1; row++) {
    for (let col = rect.c0; col <= rect.c1; col++) {
      const key = overrideKey(col, row);
      if (block.cells.has(overrideKey(col - rect.c0, row - rect.r0))) {
        next.set(key, ERASE_COLOR);
      } else {
        next.delete(key);
      }
    }
  }
  return next;
}

/** The rectangle a block covers when its top-left sits at `origin`. */
export function blockRect(block: StitchBlock, origin: GridCell): SelectionRect {
  return {
    c0: origin.col,
    r0: origin.row,
    c1: origin.col + block.w - 1,
    r1: origin.row + block.h - 1,
  };
}
