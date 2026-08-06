import type { RefObject } from "react";
import { CANVAS_INITIAL_SIZE } from "../config/editor";
import type { CanvasInteraction } from "../interactions/types";

interface PatternCanvasProps {
  canvasRef: RefObject<HTMLCanvasElement>;
  /** Whatever the active tool wants to do with the pointer, including the
   *  cursor it should show. */
  interaction: CanvasInteraction;
  /** Display-only scale factor. `1` renders the grid at its intrinsic pixel
   *  size, so a stitch stays the same size on screen no matter how many
   *  stitches/rows there are; larger enlarges it (overflowing to a horizontal
   *  scroll), smaller shrinks it. */
  zoom: number;
  /** The canvas's intrinsic pixel width at the current stitch/row count, i.e.
   *  the on-screen width when {@link zoom} is `1`. */
  baseWidth: number;
}

/** The pattern grid itself. Drawing onto it is the renderer's job; this only
 *  places the element and forwards pointer events to the active tool. */
export function PatternCanvas({ canvasRef, interaction, zoom, baseWidth }: PatternCanvasProps) {
  return (
    <main className="overflow-x-auto py-6 pr-4 pl-[20px] max-[820px]:pl-4">
      <canvas
        ref={canvasRef}
        width={CANVAS_INITIAL_SIZE}
        height={CANVAS_INITIAL_SIZE}
        // Display the canvas at its intrinsic pixel size times zoom, so 100%
        // always means the same stitch size. The pointer→cell maths reads the
        // rendered size back, so drawing stays accurate at any zoom.
        style={{ width: `${baseWidth * zoom}px` }}
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
