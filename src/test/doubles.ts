// Lightweight test doubles for the editor state slices, so the interaction hooks
// can be exercised in isolation. Each records the calls the interactions make and
// applies the pure override transforms for real, so assertions can look at either
// the recorded calls or the resulting overrides.

import { vi } from "vitest";
import { paintCells, translateOverrides } from "../lib/overrides";
import type { MittenSettings, PatternOverrides, SelectionRect } from "../lib/patternGenerator";
import type { GridCell } from "../types/editor";
import type { DrawingState } from "../hooks/useDrawingState";
import type { PaintColors } from "../hooks/usePaintColors";
import type { PastePreview, SelectionState } from "../hooks/useSelectionState";

export interface FakeDrawing extends DrawingState {
  beginStep: ReturnType<typeof vi.fn>;
  paint: ReturnType<typeof vi.fn>;
  translate: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
}

export function fakeDrawing(initial: PatternOverrides = new Map()): FakeDrawing {
  let overrides = new Map(initial);
  const api = {
    get overrides() {
      return overrides;
    },
    get hasDrawing() {
      return overrides.size > 0;
    },
    canRevert: false,
    beginStep: vi.fn(),
    set: vi.fn((next: PatternOverrides | ((p: PatternOverrides) => PatternOverrides)) => {
      overrides = typeof next === "function" ? next(overrides) : next;
    }),
    paint: vi.fn((cells: GridCell[], color: string, settings: MittenSettings) => {
      overrides = paintCells(overrides, cells, color, settings);
    }),
    translate: vi.fn((dcol: number, drow: number) => {
      if (dcol === 0 && drow === 0) return;
      overrides = translateOverrides(overrides, dcol, drow);
    }),
    rescale: vi.fn(),
    revert: vi.fn(),
    clear: vi.fn(),
    reset: vi.fn(),
    load: vi.fn(),
    invalidateResizeBase: vi.fn(),
  };
  return api as unknown as FakeDrawing;
}

export interface FakeSelection extends SelectionState {
  setSelection: ReturnType<typeof vi.fn>;
  commitPaste: ReturnType<typeof vi.fn>;
  hoverPaste: ReturnType<typeof vi.fn>;
}

export function fakeSelection(
  overrides: Partial<{ selection: SelectionRect | null; pasting: boolean; preview: PastePreview | null }> = {},
): FakeSelection {
  let selection = overrides.selection ?? null;
  const api = {
    get selection() {
      return selection;
    },
    setSelection: vi.fn((rect: SelectionRect | null) => {
      selection = rect;
    }),
    hasClipboard: false,
    pasting: overrides.pasting ?? false,
    preview: overrides.preview ?? null,
    copy: vi.fn(),
    togglePaste: vi.fn(),
    hoverPaste: vi.fn(),
    commitPaste: vi.fn(),
    deselect: vi.fn(),
  };
  return api as unknown as FakeSelection;
}

export function fakeColors(color = "black"): PaintColors {
  return {
    color,
    setColor: vi.fn(),
    colorRemap: new Map(),
    usedColors: [],
    reassign: vi.fn(),
    reset: vi.fn(),
    load: vi.fn(),
  };
}
