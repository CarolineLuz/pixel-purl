import { useRef } from "react";
import type { DrawingState } from "../hooks/useDrawingState";
import { floodFillRegion } from "../lib/canvasSampling";
import { cellFromPoint, cellsBetween, isOnGrid, lineCells } from "../lib/grid";
import type { ColorRemap, MittenSettings } from "../lib/patternGenerator";
import type { FillMode, GridCell } from "../types/editor";
import type { CanvasInteraction, CanvasPointerEvent } from "./types";

interface PaintState {
  pointerId: number;
  /** Last grid cell painted, so a fast drag can be joined into a line. */
  last: GridCell;
}

interface DrawInput {
  settings: MittenSettings;
  drawing: DrawingState;
  color: string;
  colorRemap: ColorRemap;
  fillMode: FillMode;
  reassignMode: boolean;
}

/** Painting stitches: freehand strokes, whole-row/column fills, and the bucket. */
export function useDrawInteraction({
  settings,
  drawing,
  color,
  colorRemap,
  fillMode,
  reassignMode,
}: DrawInput): CanvasInteraction {
  const paintRef = useRef<PaintState | null>(null);

  // Fill modes act on a single click rather than a drag: a whole row/column, or
  // a flood-filled enclosed area. Returns whether the click was handled.
  const handleFillClick = (
    e: CanvasPointerEvent,
    cell: GridCell,
    mode: Exclude<FillMode, "off">,
  ): void => {
    if (mode === "bucket") {
      if (!isOnGrid(settings, cell)) return;
      // Fill with the colour that would actually be painted, i.e. after any
      // active reassignment, so a region already showing it is left alone.
      const filled = floodFillRegion(
        e.currentTarget,
        settings,
        cell,
        colorRemap.get(color) ?? color,
      );
      if (filled.length === 0) return;
      drawing.beginStep();
      drawing.paint(filled, color, settings);
      return;
    }

    // Ignore clicks outside the axis being filled.
    const onAxis =
      mode === "row"
        ? cell.row >= 0 && cell.row < settings.rows
        : cell.col >= 0 && cell.col < settings.stitches;
    if (!onAxis) return;
    drawing.beginStep();
    drawing.paint(lineCells(settings, mode, cell), color, settings);
  };

  return {
    // In reassign mode the canvas is inert — recolouring happens via the toolbar
    // swatches, not by painting.
    cursorClass: reassignMode ? "" : "cursor-crosshair touch-none",

    onPointerDown: (e) => {
      if (reassignMode) return;
      const cell = cellFromPoint(e.currentTarget, e.clientX, e.clientY);
      if (fillMode !== "off") {
        handleFillClick(e, cell, fillMode);
        return;
      }
      e.currentTarget.setPointerCapture(e.pointerId);
      // Snapshot the pre-stroke state so this whole stroke can be reverted.
      drawing.beginStep();
      paintRef.current = { pointerId: e.pointerId, last: cell };
      drawing.paint([cell], color, settings);
    },

    onPointerMove: (e) => {
      const paint = paintRef.current;
      if (!paint || paint.pointerId !== e.pointerId) return;
      const cell = cellFromPoint(e.currentTarget, e.clientX, e.clientY);
      if (cell.col === paint.last.col && cell.row === paint.last.row) return;
      drawing.paint(cellsBetween(paint.last, cell), color, settings);
      paint.last = cell;
    },

    onPointerUp: (e) => {
      if (paintRef.current?.pointerId !== e.pointerId) return;
      e.currentTarget.releasePointerCapture(e.pointerId);
      paintRef.current = null;
    },
  };
}
