// Pattern generation for the mitten knit-pattern grid.
//
// This module composes the full render (image + hand-drawn edits + grid) and
// re-exports the supporting pieces so `../lib/patternGenerator` stays the single
// import surface for the rest of the app. The implementation is split across:
//   • ../types/pattern    — shared types (MittenSettings, RGB, SelectionRect, …)
//   • ../config/pattern   — constants and defaults (STITCH_SIZE, INK_COLORS, …)
//   • ./patternKeys       — canonical map keys (overrideKey, rgbCss)
//   • ./palette           — colour analysis and median-cut extraction
//   • ./edgeDetection     — Sobel edge detection
//   • ./patternGrid       — grid/label scaffolding
//   • ./imageRender       — image → stitch-grid rendering

import { LABEL_MARGIN, STITCH_SIZE } from "../config/pattern";
import type {
  ColorRemap,
  MittenSettings,
  PatternOverrides,
  RGB,
  SelectionRect,
} from "../types/pattern";
import { renderImage } from "./imageRender";
import {
  derive,
  drawFacilityGrid,
  drawGridLabels,
  drawStitchGrid,
} from "./patternGrid";

export * from "../types/pattern";
export * from "../config/pattern";
export * from "./patternKeys";
export * from "./palette";
export * from "./edgeDetection";
export * from "./patternGrid";
export * from "./imageRender";

// Paint the user's hand-drawn stitches over the image-derived grid. Runs before
// the grid lines are stroked so those stay visible on top of a filled stitch.
// Overrides outside the current stitch/row bounds are ignored (not deleted), so
// shrinking then re-growing the grid brings earlier edits back.
function drawOverrides(
  context: CanvasRenderingContext2D,
  settings: MittenSettings,
  overrides: PatternOverrides,
  colorRemap: ColorRemap,
): void {
  const size = STITCH_SIZE;
  overrides.forEach((color, key) => {
    const [col, row] = key.split(",").map(Number);
    if (col < 0 || row < 0 || col >= settings.stitches || row >= settings.rows) {
      return;
    }
    context.fillStyle = colorRemap.get(color) ?? color;
    context.fillRect(
      LABEL_MARGIN + col * size,
      LABEL_MARGIN + row * size,
      size,
      size,
    );
  });
}

// Stroke a dashed rectangle around the selected block of stitches, drawn last so
// it sits above the pattern and grid. Bounds are inclusive cells, so the width
// spans `c1 - c0 + 1` stitches.
function drawSelectionOutline(
  context: CanvasRenderingContext2D,
  selection: SelectionRect,
): void {
  const size = STITCH_SIZE;
  const x = LABEL_MARGIN + selection.c0 * size;
  const y = LABEL_MARGIN + selection.r0 * size;
  const w = (selection.c1 - selection.c0 + 1) * size;
  const h = (selection.r1 - selection.r0 + 1) * size;
  context.save();
  context.setLineDash([6, 4]);
  context.lineWidth = 2;
  context.strokeStyle = "rgb(214, 40, 40)";
  context.strokeRect(x, y, w, h);
  context.restore();
}

/**
 * Render the full pattern (optional image + hand-drawn edits + grid) onto the
 * supplied canvas. Resizes the canvas to match the current stitch/row count.
 * `colorRemap` recolours matching palette/override colours at draw time (see
 * {@link ColorRemap}). When `selection` is given, a dashed marquee is drawn
 * around that block of stitches on top of everything else.
 */
export function drawPattern(
  canvas: HTMLCanvasElement,
  settings: MittenSettings,
  img?: HTMLImageElement | null,
  overrides?: PatternOverrides,
  palette: RGB[] = [],
  colorRemap: ColorRemap = new Map(),
  selection: SelectionRect | null = null,
): void {
  const context = canvas.getContext("2d");
  if (!context) return;

  const dims = derive(settings);

  canvas.width = dims.width + LABEL_MARGIN;
  canvas.height = dims.height + LABEL_MARGIN;
  context.clearRect(0, 0, canvas.width, canvas.height);

  if (img) renderImage(context, img, settings, dims, palette, colorRemap);
  if (overrides && overrides.size > 0)
    drawOverrides(context, settings, overrides, colorRemap);
  drawStitchGrid(context, settings, dims);
  drawFacilityGrid(context, settings);
  drawGridLabels(context, settings);
  if (selection) drawSelectionOutline(context, selection);
}
