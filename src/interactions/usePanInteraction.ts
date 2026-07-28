import { useRef, type Dispatch, type SetStateAction } from "react";
import type { DrawingState } from "../hooks/useDrawingState";
import { canvasScale, stitchDelta } from "../lib/grid";
import type { MittenSettings } from "../lib/patternGenerator";
import { clampOffset } from "../lib/settings";
import type { CanvasInteraction } from "./types";

interface DragState {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startOffsetX: number;
  startOffsetY: number;
  /** Canvas pixels per CSS pixel (the canvas is scaled to fit the screen). */
  scale: number;
  /** Net whole-stitch shift already applied to the drawn overrides this drag, so
   *  each move only translates them by the incremental change. */
  appliedDx: number;
  appliedDy: number;
}

interface PanInput {
  settings: MittenSettings;
  setSettings: Dispatch<SetStateAction<MittenSettings>>;
  hasImage: boolean;
  drawing: DrawingState;
}

/** The resting tool: drag the canvas to reposition the image and the drawing
 *  together. Also what the image-config tool leaves the canvas doing. */
export function usePanInteraction({
  settings,
  setSettings,
  hasImage,
  drawing,
}: PanInput): CanvasInteraction {
  const dragRef = useRef<DragState | null>(null);

  return {
    cursorClass:
      hasImage || drawing.hasDrawing
        ? "cursor-grab touch-none active:cursor-grabbing"
        : "",

    onPointerDown: (e) => {
      // Nothing to reposition unless there's an image and/or a drawing.
      if (!hasImage && !drawing.hasDrawing) return;
      dragRef.current = {
        pointerId: e.pointerId,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startOffsetX: settings.offsetX,
        startOffsetY: settings.offsetY,
        scale: canvasScale(e.currentTarget),
        appliedDx: 0,
        appliedDy: 0,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    },

    onPointerMove: (e) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      const dx = stitchDelta(e.clientX - drag.startClientX, drag.scale);
      const dy = stitchDelta(e.clientY - drag.startClientY, drag.scale);

      // Move the image via its offset (clamped to the allowed range).
      if (hasImage) {
        setSettings((prev) => ({
          ...prev,
          offsetX: clampOffset(drag.startOffsetX + dx),
          offsetY: clampOffset(drag.startOffsetY + dy),
        }));
      }

      // Pan the drawn stitches in lockstep, by only the change since last move.
      drawing.translate(dx - drag.appliedDx, dy - drag.appliedDy);
      drag.appliedDx = dx;
      drag.appliedDy = dy;
    },

    onPointerUp: (e) => {
      if (dragRef.current?.pointerId !== e.pointerId) return;
      e.currentTarget.releasePointerCapture(e.pointerId);
      dragRef.current = null;
    },
  };
}
