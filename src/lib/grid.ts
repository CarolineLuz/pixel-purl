// Geometry of the stitch grid: converting pointer positions to cells, walking
// between cells, and bounds-checking them. Pure functions — no React, no state.

import type { GridCell } from "../types/editor";
import {
  LABEL_MARGIN,
  STITCH_SIZE,
  type MittenSettings,
  type SelectionRect,
} from "./patternGenerator";

/** Canvas pixels per CSS pixel (the canvas is scaled to fit the screen). */
export function canvasScale(canvas: HTMLCanvasElement): number {
  return canvas.width / canvas.getBoundingClientRect().width;
}

/** Grid cell under a pointer position. May be off-grid; callers bounds-check. */
export function cellFromPoint(
  canvas: HTMLCanvasElement,
  clientX: number,
  clientY: number,
): GridCell {
  const rect = canvas.getBoundingClientRect();
  const scale = canvas.width / rect.width;
  const cx = (clientX - rect.left) * scale - LABEL_MARGIN;
  const cy = (clientY - rect.top) * scale - LABEL_MARGIN;
  return {
    col: Math.floor(cx / STITCH_SIZE),
    row: Math.floor(cy / STITCH_SIZE),
  };
}

/** Convert a pointer travel distance in CSS pixels to whole stitches, given the
 *  canvas scale the gesture started with. */
export function stitchDelta(cssDistance: number, scale: number): number {
  return Math.round((cssDistance * scale) / STITCH_SIZE);
}

/** Centre pixel of the cell at `index` along either axis. Centres are clear of
 *  the grid lines and marquee drawn at cell edges, so they're the safe place to
 *  sample a stitch's rendered colour. */
export function cellCentrePx(index: number): number {
  return LABEL_MARGIN + index * STITCH_SIZE + Math.floor(STITCH_SIZE / 2);
}

// Every grid cell on the straight line between two cells (Bresenham). Pointer
// events arrive sparsely, so a quick stroke would otherwise leave gaps.
export function cellsBetween(from: GridCell, to: GridCell): GridCell[] {
  const cells: GridCell[] = [];
  const dx = Math.abs(to.col - from.col);
  const dy = Math.abs(to.row - from.row);
  const sx = from.col < to.col ? 1 : -1;
  const sy = from.row < to.row ? 1 : -1;
  let err = dx - dy;
  let col = from.col;
  let row = from.row;
  for (;;) {
    cells.push({ col, row });
    if (col === to.col && row === to.row) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      col += sx;
    }
    if (e2 < dx) {
      err += dx;
      row += sy;
    }
  }
  return cells;
}

/** Whether a cell lies inside the current stitch/row bounds. */
export function isOnGrid(settings: MittenSettings, cell: GridCell): boolean {
  return (
    cell.col >= 0 &&
    cell.row >= 0 &&
    cell.col < settings.stitches &&
    cell.row < settings.rows
  );
}

/** Nearest on-grid cell to `cell`. */
export function clampToGrid(
  settings: MittenSettings,
  cell: GridCell,
): GridCell {
  return {
    col: Math.max(0, Math.min(settings.stitches - 1, cell.col)),
    row: Math.max(0, Math.min(settings.rows - 1, cell.row)),
  };
}

/** Normalise two corner cells into an ordered {@link SelectionRect}. */
export function normalizeRect(a: GridCell, b: GridCell): SelectionRect {
  return {
    c0: Math.min(a.col, b.col),
    r0: Math.min(a.row, b.row),
    c1: Math.max(a.col, b.col),
    r1: Math.max(a.row, b.row),
  };
}

/** Whether a cell lies within the selection rectangle. */
export function cellInside(sel: SelectionRect, cell: GridCell): boolean {
  return (
    cell.col >= sel.c0 &&
    cell.col <= sel.c1 &&
    cell.row >= sel.r0 &&
    cell.row <= sel.r1
  );
}

/** Every cell of a whole row or column, for the line-fill tools. */
export function lineCells(
  settings: MittenSettings,
  axis: "row" | "column",
  cell: GridCell,
): GridCell[] {
  if (axis === "row") {
    return Array.from({ length: settings.stitches }, (_, col) => ({
      col,
      row: cell.row,
    }));
  }
  return Array.from({ length: settings.rows }, (_, row) => ({
    col: cell.col,
    row,
  }));
}
