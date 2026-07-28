import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { captureRect } from "../lib/canvasSampling";
import type { SelectionRect } from "../lib/patternGenerator";
import { blockRect, mergeBlock } from "../lib/stitchBlock";
import type { GridCell, StitchBlock } from "../types/editor";
import type { DrawingState } from "./useDrawingState";

/** The block hovering under the cursor while a paste is armed. */
export interface PastePreview {
  block: StitchBlock;
  origin: GridCell;
}

export interface SelectionState {
  /** The currently marked block of stitches, or null when nothing is selected. */
  selection: SelectionRect | null;
  setSelection(rect: SelectionRect | null): void;
  hasClipboard: boolean;
  /** Whether a paste is armed and waiting for the user to click a target stitch. */
  pasting: boolean;
  preview: PastePreview | null;
  /** Copy the selected block's rendered stitches to the clipboard. */
  copy(): void;
  /** Arm a paste, or cancel one already armed. */
  togglePaste(): void;
  /** While arming a paste: track the cell the block's top-left hovers over. */
  hoverPaste(origin: GridCell): void;
  /** Drop the clipboard's stitches with their top-left at `origin`. */
  commitPaste(origin: GridCell): void;
  deselect(): void;
}

interface SelectionInput {
  canvasRef: RefObject<HTMLCanvasElement>;
  drawing: DrawingState;
  /** Whether the selection tool is the active one. */
  active: boolean;
}

export function useSelectionState({
  canvasRef,
  drawing,
  active,
}: SelectionInput): SelectionState {
  const [selection, setSelection] = useState<SelectionRect | null>(null);
  // The last copied block, available to paste until another copy replaces it.
  const [clipboard, setClipboard] = useState<StitchBlock | null>(null);
  const [pasting, setPasting] = useState(false);
  // The cell the pasted block's top-left currently hovers over, or null before
  // the pointer has moved onto the grid.
  const [pasteOrigin, setPasteOrigin] = useState<GridCell | null>(null);

  const cancelPaste = () => {
    setPasting(false);
    setPasteOrigin(null);
  };

  // Leaving the selection tool drops the marquee but keeps the clipboard, so a
  // copied block can still be pasted after coming back.
  useEffect(() => {
    if (!active) {
      setSelection(null);
      setPasting(false);
      setPasteOrigin(null);
    }
  }, [active]);

  const preview = useMemo<PastePreview | null>(
    () =>
      pasting && pasteOrigin && clipboard
        ? { block: clipboard, origin: pasteOrigin }
        : null,
    [pasting, pasteOrigin, clipboard],
  );

  const copy = () => {
    const canvas = canvasRef.current;
    if (!canvas || !selection) return;
    setClipboard(captureRect(canvas, selection));
    // Copying supersedes any paste armed with the previous clipboard.
    cancelPaste();
  };

  const togglePaste = () => {
    if (!clipboard) return;
    setPasting((prev) => !prev);
    setPasteOrigin(null);
    setSelection(null);
  };

  // Bind ⌘/Ctrl+C and ⌘/Ctrl+V to copy and paste while the selection tool is
  // active. A ref keeps the listener seeing the latest state without having to
  // re-subscribe on every render.
  const shortcuts = useRef({ active, selection, clipboard, copy, togglePaste });
  shortcuts.current = { active, selection, clipboard, copy, togglePaste };
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const { active, selection, clipboard, copy, togglePaste } =
        shortcuts.current;
      // Only the plain platform copy/paste chord, and not while typing in a
      // control, where the browser's own copy/paste must win.
      if (!active || !(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target?.isContentEditable
      ) {
        return;
      }
      const key = e.key.toLowerCase();
      if (key === "c" && selection) {
        e.preventDefault();
        copy();
      } else if (key === "v" && clipboard) {
        e.preventDefault();
        togglePaste();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return {
    selection,
    setSelection,
    hasClipboard: clipboard !== null,
    pasting,
    preview,
    copy,
    togglePaste,

    // Pointer moves arrive far more often than the hovered cell changes, and each
    // change re-renders the preview, so only take a genuinely new cell.
    hoverPaste: (origin) =>
      setPasteOrigin((prev) =>
        prev && prev.col === origin.col && prev.row === origin.row
          ? prev
          : origin,
      ),

    commitPaste: (origin) => {
      if (!clipboard) return;
      drawing.beginStep();
      drawing.set((prev) => mergeBlock(prev, clipboard, origin));
      // Select the pasted block so it can be nudged straight away.
      setSelection(blockRect(clipboard, origin));
      cancelPaste();
    },

    deselect: () => {
      setSelection(null);
      cancelPaste();
    },
  };
}
