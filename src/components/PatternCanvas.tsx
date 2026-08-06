import type { RefObject } from "react";
import { CANVAS_INITIAL_SIZE } from "../config/editor";
import type { CanvasInteraction } from "../interactions/types";

interface PatternCanvasProps {
  canvasRef: RefObject<HTMLCanvasElement>;
  /** Whatever the active tool wants to do with the pointer, including the
   *  cursor it should show. */
  interaction: CanvasInteraction;
  /** Display-only scale factor. `1` fits the available width; larger enlarges
   *  the grid (overflowing to a horizontal scroll), smaller shrinks it. */
  zoom: number;
}

/** The pattern grid itself. Drawing onto it is the renderer's job; this only
 *  places the element and forwards pointer events to the active tool. */
export function PatternCanvas({ canvasRef, interaction, zoom }: PatternCanvasProps) {
  return (
    <main className="overflow-x-auto py-6 pr-4 pl-[200px] max-[820px]:pl-4">
      <canvas
        ref={canvasRef}
        width={CANVAS_INITIAL_SIZE}
        height={CANVAS_INITIAL_SIZE}
        // Zoom scales the CSS display width only; the pointer→cell maths reads
        // the rendered size back, so drawing stays accurate at any zoom.
        style={{ width: `${zoom * 100}%` }}
        className={`mx-auto block h-auto ${interaction.cursorClass}`}
        onPointerDown={interaction.onPointerDown}
        onPointerMove={interaction.onPointerMove}
        onPointerUp={interaction.onPointerUp}
        onPointerCancel={interaction.onPointerUp}
      >
        A simple canvas to display a grid
      </canvas>
    </main>
  );
}
