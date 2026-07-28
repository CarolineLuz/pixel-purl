import { useRef, useState } from "react";
import type { GridCell } from "../types/editor";
import {
  paintCells,
  scaleOverrides,
  translateOverrides,
} from "../lib/overrides";
import type { MittenSettings, PatternOverrides } from "../lib/patternGenerator";

/** The hand-drawn stitches, their undo history, and every way to change them. */
export interface DrawingState {
  overrides: PatternOverrides;
  hasDrawing: boolean;
  canRevert: boolean;
  /** Replace the drawing without recording a step — for the live frames of a
   *  drag, where the step was already recorded when the gesture began. */
  set(next: PatternOverrides | ((prev: PatternOverrides) => PatternOverrides)): void;
  /** Record the current drawing so the change about to be made can be reverted. */
  beginStep(): void;
  /** Stamp `color` into `cells` (bounds-checked against the grid). */
  paint(cells: GridCell[], color: string, settings: MittenSettings): void;
  /** Pan the drawing by whole stitches. */
  translate(dcol: number, drow: number): void;
  /** Scale the drawing to track an image being resized from `settings.size` to
   *  `newSize`, about the same anchor the image scales about. */
  rescale(newSize: number, settings: MittenSettings): void;
  revert(): void;
  clear(): void;
  /** Drop the drawing and its history (a new image starts from scratch). */
  reset(): void;
  /** Replace the drawing with an imported one, discarding the undo history. */
  load(next: PatternOverrides): void;
  /** Tell the next resize to re-snapshot its baseline, because something other
   *  than a resize moved the drawing or the scaling anchor. */
  invalidateResizeBase(): void;
}

export function useDrawingState(): DrawingState {
  const [overrides, setOverrides] = useState<PatternOverrides>(new Map());
  // Snapshots taken before each drawing step (stroke, fill, move, clear), so the
  // most recent step can be reverted. Oldest first, newest last.
  const [history, setHistory] = useState<PatternOverrides[]>([]);
  // Pristine snapshot of the drawing at the size it currently matches. A size
  // change rescales from this baseline rather than from the last-scaled state, so
  // dragging the slider (which fires many size events) telescopes to one clean
  // transform instead of compounding rounding error. Cleared whenever the drawing
  // changes for any other reason, so the next resize re-snapshots.
  const resizeBase = useRef<{
    size: number;
    overrides: PatternOverrides;
  } | null>(null);

  const invalidateResizeBase = () => {
    resizeBase.current = null;
  };

  const set: DrawingState["set"] = (next) => {
    invalidateResizeBase();
    setOverrides(next);
  };

  return {
    overrides,
    hasDrawing: overrides.size > 0,
    canRevert: history.length > 0,
    set,
    invalidateResizeBase,

    beginStep: () => setHistory((prev) => [...prev, overrides]),

    paint: (cells, color, settings) =>
      set((prev) => paintCells(prev, cells, color, settings)),

    translate: (dcol, drow) => {
      if (dcol === 0 && drow === 0) return;
      invalidateResizeBase();
      setOverrides((prev) =>
        prev.size === 0 ? prev : translateOverrides(prev, dcol, drow),
      );
    },

    rescale: (newSize, settings) => {
      if (overrides.size === 0) return;
      // Snapshot the drawing at its current (pre-change) size the first time a
      // gesture touches the slider; every event in the gesture then rescales from
      // this baseline, so rounding never compounds.
      const base = resizeBase.current ?? { size: settings.size, overrides };
      resizeBase.current = base;
      if (base.size <= 0) return;
      const factor = newSize / base.size;
      // Size 0 hides the image entirely; collapse the drawing to nothing too. The
      // baseline is untouched, so scaling back up restores it.
      if (factor === 0) {
        setOverrides(new Map());
        return;
      }
      setOverrides(
        scaleOverrides(base.overrides, factor, {
          col: settings.offsetX,
          row: settings.offsetY + settings.rows / 2,
        }),
      );
    },

    revert: () => {
      if (history.length === 0) return;
      set(history[history.length - 1]);
      setHistory(history.slice(0, -1));
    },

    clear: () => {
      if (overrides.size === 0) return;
      // Record the pre-clear state so the clear itself can be reverted.
      setHistory((prev) => [...prev, overrides]);
      set(new Map());
    },

    reset: () => {
      set(new Map());
      setHistory([]);
    },

    load: (next) => {
      set(next);
      setHistory([]);
    },
  };
}
