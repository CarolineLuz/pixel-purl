// Shared vocabulary for the pattern editor. These types are deliberately free of
// React and of any canvas API, so the pure grid/override helpers in `lib/` and
// the hooks in `hooks/` can both speak them without depending on each other.

/**
 * A grid cell address. May be off-grid (negative, or past the stitch/row count):
 * callers bounds-check with {@link isOnGrid} before painting.
 */
export interface GridCell {
  col: number;
  row: number;
}

/** A rendered pixel as its `[r, g, b, a]` bytes. */
export type RGBA = [number, number, number, number];

/**
 * Which tool owns the canvas. Exactly one is active at a time, so opening a
 * toolbar always closes the others.
 *
 * - `pan` — the resting state: drag to reposition the image and drawing.
 * - `draw` — paint stitches (see {@link FillMode} for its sub-modes).
 * - `select` — marquee / copy / move a block of stitches.
 * - `image` — the image controls are open; the canvas still pans.
 */
export type ToolMode = "pan" | "draw" | "select" | "image";

/** Draw sub-mode: freehand painting, fill a whole row/column, or flood-fill an
 *  enclosed area ("bucket") on click. */
export type FillMode = "off" | "row" | "column" | "bucket";

/**
 * A rectangular block of stitches lifted off the canvas: its dimensions in
 * stitches plus the opaque cells it contains, keyed by `overrideKey`
 * *relative to the block's top-left* so it can be stamped down anywhere. Empty
 * (transparent) cells are omitted, so pasting a block never paints blank squares
 * over what's underneath.
 */
export interface StitchBlock {
  w: number;
  h: number;
  cells: Map<string, string>;
}
