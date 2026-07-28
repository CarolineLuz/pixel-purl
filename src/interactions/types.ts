import type { PointerEvent } from "react";

export type CanvasPointerEvent = PointerEvent<HTMLCanvasElement>;

/**
 * What one tool does with the canvas pointer. Each {@link ToolMode} supplies its
 * own implementation and owns whatever gesture state it needs, so adding a tool
 * means adding an interaction rather than extending a shared event handler.
 */
export interface CanvasInteraction {
  /** Tailwind classes for the canvas while this interaction is active. */
  cursorClass: string;
  onPointerDown(e: CanvasPointerEvent): void;
  onPointerMove(e: CanvasPointerEvent): void;
  onPointerUp(e: CanvasPointerEvent): void;
}
