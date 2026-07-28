// Reading stitches back off the rendered canvas.
//
// Everything here samples the *centre pixel* of a cell (see `cellCentrePx`),
// which is clear of the grid lines and marquee drawn at cell edges. Sampling the
// render rather than the stored overrides is what lets these tools treat
// image-derived and hand-drawn stitches alike.

import { OPAQUE_ALPHA } from "../config/editor";
import type { GridCell, RGBA, StitchBlock } from "../types/editor";
import { colorsMatch, cssToRgba } from "./canvasColor";
import { cellCentrePx } from "./grid";
import {
  overrideKey,
  type MittenSettings,
  type SelectionRect,
} from "./patternGenerator";

/** Reads cell colours from a single snapshot of the canvas pixels. */
export type CellSampler = (cell: GridCell) => RGBA;

/** Snapshot the canvas once and return a sampler over it. Returns null if the
 *  canvas has no 2D context. */
export function createCellSampler(
  canvas: HTMLCanvasElement,
): CellSampler | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const width = canvas.width;
  const { data } = ctx.getImageData(0, 0, width, canvas.height);
  return ({ col, row }) => {
    const i = (cellCentrePx(row) * width + cellCentrePx(col)) * 4;
    return [data[i], data[i + 1], data[i + 2], data[i + 3]];
  };
}

/** Sample the rendered colour of every cell in `rect`, returning the opaque ones
 *  as a {@link StitchBlock}. Transparent cells are omitted so stamping the block
 *  back down never paints blank squares over what's underneath. */
export function captureRect(
  canvas: HTMLCanvasElement,
  rect: SelectionRect,
): StitchBlock {
  const cells = new Map<string, string>();
  const w = rect.c1 - rect.c0 + 1;
  const h = rect.r1 - rect.r0 + 1;
  const sample = createCellSampler(canvas);
  if (!sample) return { w, h, cells };

  for (let row = rect.r0; row <= rect.r1; row++) {
    for (let col = rect.c0; col <= rect.c1; col++) {
      const [r, g, b, a] = sample({ col, row });
      if (a < OPAQUE_ALPHA) continue;
      cells.set(overrideKey(col - rect.c0, row - rect.r0), `rgb(${r}, ${g}, ${b})`);
    }
  }
  return { w, h, cells };
}

/**
 * The connected region of same-coloured cells containing `start`, bounded by
 * differently-coloured stitches (the drawn paths) and the grid edges.
 *
 * `fillColor` is the colour a fill would actually paint (after any active
 * reassignment); if the region already shows it, nothing is returned.
 */
export function floodFillRegion(
  canvas: HTMLCanvasElement,
  settings: MittenSettings,
  start: GridCell,
  fillColor: string,
): GridCell[] {
  const sample = createCellSampler(canvas);
  if (!sample) return [];

  const target = sample(start);
  if (colorsMatch(target, cssToRgba(fillColor))) return [];

  const { stitches, rows } = settings;
  const seen = new Set<string>();
  const filled: GridCell[] = [];
  const stack: GridCell[] = [start];
  while (stack.length) {
    const cell = stack.pop()!;
    const { col, row } = cell;
    if (col < 0 || row < 0 || col >= stitches || row >= rows) continue;
    const key = overrideKey(col, row);
    if (seen.has(key)) continue;
    seen.add(key);
    if (!colorsMatch(sample(cell), target)) continue;
    filled.push(cell);
    stack.push(
      { col: col + 1, row },
      { col: col - 1, row },
      { col, row: row + 1 },
      { col, row: row - 1 },
    );
  }
  return filled;
}
