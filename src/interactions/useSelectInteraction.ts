import { useRef } from "react";
import type { DrawingState } from "../hooks/useDrawingState";
import type { SelectionState } from "../hooks/useSelectionState";
import { captureRect } from "../lib/canvasSampling";
import {
  canvasScale,
  cellFromPoint,
  cellInside,
  clampToGrid,
  normalizeRect,
  stitchDelta,
} from "../lib/grid";
import type { MittenSettings, PatternOverrides } from "../lib/patternGenerator";
import { blockRect, cutRegion, mergeBlock } from "../lib/stitchBlock";
import type { GridCell, StitchBlock } from "../types/editor";
import type { CanvasInteraction } from "./types";

/** One in-progress selection gesture: drawing a new marquee, or moving (cutting
 *  and dropping) the current selection. */
type SelectGesture =
  | {
      kind: "marquee";
      pointerId: number;
      /** The fixed corner the marquee is dragged out from. */
      anchor: GridCell;
    }
  | {
      kind: "move";
      pointerId: number;
      /** The lifted content being dragged. */
      block: StitchBlock;
      /** Overrides with the source region already cleared; the block is merged
       *  onto this at its current position each move. */
      base: PatternOverrides;
      /** The block's origin (top-left) at the moment it was grabbed. */
      origin: GridCell;
      startClientX: number;
      startClientY: number;
      /** Canvas pixels per CSS pixel, to convert the drag to whole stitches. */
      scale: number;
    };

interface SelectInput {
  settings: MittenSettings;
  drawing: DrawingState;
  selection: SelectionState;
}

/** Marquee, move and paste-placement on the canvas. */
export function useSelectInteraction({
  settings,
  drawing,
  selection,
}: SelectInput): CanvasInteraction {
  const gestureRef = useRef<SelectGesture | null>(null);

  // Lift the selected stitches off the canvas and clear the region they came
  // from, leaving an empty gap that follows the block as it is dragged.
  const beginMove = (
    canvas: HTMLCanvasElement,
    pointerId: number,
    clientX: number,
    clientY: number,
    rect: NonNullable<SelectionState["selection"]>,
  ) => {
    const block = captureRect(canvas, rect);
    const base = cutRegion(drawing.overrides, rect, block);
    const origin: GridCell = { col: rect.c0, row: rect.r0 };
    // Snapshot the pre-move state so the whole move can be reverted.
    drawing.beginStep();
    gestureRef.current = {
      kind: "move",
      pointerId,
      block,
      base,
      origin,
      startClientX: clientX,
      startClientY: clientY,
      scale: canvasScale(canvas),
    };
    canvas.setPointerCapture(pointerId);
    // Initial render: source cleared, block back at its origin — no net change.
    drawing.set(mergeBlock(base, block, origin));
  };

  return {
    cursorClass: "cursor-crosshair touch-none",

    onPointerDown: (e) => {
      const canvas = e.currentTarget;
      const cell = cellFromPoint(canvas, e.clientX, e.clientY);

      // Arming a paste: this click drops the block with its top-left at the
      // clicked stitch. Takes priority over starting a marquee/move.
      if (selection.pasting) {
        selection.commitPaste(clampToGrid(settings, cell));
        return;
      }

      // Pressing inside the current selection grabs it for a move.
      if (selection.selection && cellInside(selection.selection, cell)) {
        beginMove(canvas, e.pointerId, e.clientX, e.clientY, selection.selection);
        return;
      }

      // Otherwise start dragging out a new marquee from the pressed cell.
      const anchor = clampToGrid(settings, cell);
      gestureRef.current = { kind: "marquee", pointerId: e.pointerId, anchor };
      selection.setSelection(normalizeRect(anchor, anchor));
      canvas.setPointerCapture(e.pointerId);
    },

    onPointerMove: (e) => {
      // Arming a paste: track the hovered cell so the block previews under the
      // cursor. No button is held during this phase, so it runs before the
      // active-gesture check below.
      if (selection.pasting) {
        const cell = cellFromPoint(e.currentTarget, e.clientX, e.clientY);
        selection.hoverPaste(clampToGrid(settings, cell));
        return;
      }

      const gesture = gestureRef.current;
      if (!gesture || gesture.pointerId !== e.pointerId) return;
      const cell = cellFromPoint(e.currentTarget, e.clientX, e.clientY);

      if (gesture.kind === "marquee") {
        // Drag out the opposite corner, clamped to the grid.
        selection.setSelection(
          normalizeRect(gesture.anchor, clampToGrid(settings, cell)),
        );
        return;
      }

      // Moving: translate the lifted block by whole stitches and re-stamp it onto
      // the cleared base, and move the marquee with it.
      const origin: GridCell = {
        col:
          gesture.origin.col +
          stitchDelta(e.clientX - gesture.startClientX, gesture.scale),
        row:
          gesture.origin.row +
          stitchDelta(e.clientY - gesture.startClientY, gesture.scale),
      };
      drawing.set(mergeBlock(gesture.base, gesture.block, origin));
      selection.setSelection(blockRect(gesture.block, origin));
    },

    onPointerUp: (e) => {
      const gesture = gestureRef.current;
      if (!gesture || gesture.pointerId !== e.pointerId) return;
      e.currentTarget.releasePointerCapture(e.pointerId);
      gestureRef.current = null;
      // A move has already committed to the drawing live; a marquee leaves the
      // finished selection in place. Nothing more to do here.
    },
  };
}
