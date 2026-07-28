import type { RefObject } from "react";
import { CANVAS_INITIAL_SIZE } from "../config/editor";
import type { CanvasInteraction } from "../interactions/types";

interface PatternCanvasProps {
  canvasRef: RefObject<HTMLCanvasElement>;
  /** Whatever the active tool wants to do with the pointer, including the
   *  cursor it should show. */
  interaction: CanvasInteraction;
}

/** The pattern grid itself. Drawing onto it is the renderer's job; this only
 *  places the element and forwards pointer events to the active tool. */
export function PatternCanvas({ canvasRef, interaction }: PatternCanvasProps) {
  return (
    <main className="flex items-start justify-center py-6 pr-4 pl-[200px] max-[600px]:pl-4">
      <canvas
        ref={canvasRef}
        width={CANVAS_INITIAL_SIZE}
        height={CANVAS_INITIAL_SIZE}
        className={`h-auto max-w-full ${interaction.cursorClass}`}
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
