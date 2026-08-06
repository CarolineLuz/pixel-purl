// Grid scaffolding for the pattern canvas: derived dimensions plus the stitch
// grid, five-stitch facility lines, and the numeric row/stitch labels.

import { LABEL_MARGIN, STITCH_SIZE } from "../config/pattern";
import type { MittenSettings } from "../types/pattern";

export interface DerivedDimensions {
  width: number;
  height: number;
  offsetXpx: number;
  offsetYpx: number;
}

export function derive(settings: MittenSettings): DerivedDimensions {
  return {
    width: STITCH_SIZE * settings.stitches,
    height: STITCH_SIZE * settings.rows,
    offsetXpx: settings.offsetX * STITCH_SIZE,
    offsetYpx: settings.offsetY * STITCH_SIZE,
  };
}

function drawSingleStitch(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  fill = false,
): void {
  context.lineWidth = 0.25;
  context.fillStyle = "rgba(0,0,0,0)";

  if (fill) {
    context.fillStyle = "white";
    context.fillRect(x, y, size, size);
  } else {
    context.strokeStyle = "red";
    context.strokeRect(x, y, size, size);
  }
}

export function drawStitchGrid(
  context: CanvasRenderingContext2D,
  settings: MittenSettings,
  dims: DerivedDimensions,
): void {
  const size = STITCH_SIZE;
  const { width } = dims;

  const totalStitches = Math.ceil(settings.stitches * settings.rows);

  Array(totalStitches)
    .fill(0)
    .forEach((_, i) => {
      const stitchX = (i * size) % width;
      const rowY = size * Math.floor((i * size) / width);

      drawSingleStitch(context, LABEL_MARGIN + stitchX, LABEL_MARGIN + rowY, size);
    });
}

export function drawFacilityGrid(
  context: CanvasRenderingContext2D,
  settings: MittenSettings,
): void {
  const size = STITCH_SIZE;
  context.lineWidth = 0.8;
  context.strokeStyle = "black";

  const gridHeight = settings.rows * size;
  const gridWidth = settings.stitches * size;

  // Vertical grid lines every five stitches (excluding the first).
  Array(Math.ceil(settings.stitches / 5))
    .fill(0)
    .forEach((_, i) => {
      if (i === 0) return;
      const x = LABEL_MARGIN + size * i * 5;
      context.beginPath();
      context.moveTo(x, LABEL_MARGIN);
      context.lineTo(x, LABEL_MARGIN + gridHeight);
      context.stroke();
    });

  // Horizontal grid lines every five rows (excluding the first).
  Array(Math.ceil(settings.rows / 5))
    .fill(0)
    .forEach((_, i) => {
      if (i === 0) return;
      const y = LABEL_MARGIN + size * i * 5;
      context.beginPath();
      context.moveTo(LABEL_MARGIN, y);
      context.lineTo(LABEL_MARGIN + gridWidth, y);
      context.stroke();
    });
}

export function drawGridLabels(
  context: CanvasRenderingContext2D,
  settings: MittenSettings,
): void {
  const size = STITCH_SIZE;
  context.fillStyle = "black";
  context.font = "10px sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";

  // Stitch numbers across the top.
  for (let n = 0; n <= settings.stitches; n += 5) {
    context.fillText(String(n), LABEL_MARGIN + n * size, LABEL_MARGIN / 2);
  }

  // Row numbers down the left side, counting up from the bottom.
  for (let n = 0; n <= settings.rows; n += 5) {
    context.fillText(
      String(n),
      LABEL_MARGIN / 2,
      LABEL_MARGIN + (settings.rows - n) * size,
    );
  }
}
