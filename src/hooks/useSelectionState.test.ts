import { describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { createRef } from "react";
import type { RGBA } from "../types/editor";
import type { PatternOverrides, SelectionRect } from "../lib/patternGenerator";
import { makeCanvas } from "../test/helpers";
import { setCanvasPixels } from "../test/canvas";
import { useSelectionState } from "./useSelectionState";
import type { DrawingState } from "./useDrawingState";

/** A drawing double that records steps and applies `set` so overrides can be
 *  inspected. Only the members useSelectionState touches are implemented. */
function fakeDrawing() {
  let overrides: PatternOverrides = new Map();
  const beginStep = vi.fn();
  const set = vi.fn((next: PatternOverrides | ((p: PatternOverrides) => PatternOverrides)) => {
    overrides = typeof next === "function" ? next(overrides) : next;
  });
  const drawing = {
    beginStep,
    set,
    get overrides() {
      return overrides;
    },
  } as unknown as DrawingState;
  return { drawing, beginStep, set, get: () => overrides };
}

/** Render the hook against a real (mocked) canvas whose pixels are all opaque, so
 *  a captured block actually contains stitches. */
function setup(active = true) {
  const canvas = makeCanvas(200, 200);
  setCanvasPixels(canvas, (): RGBA => [10, 20, 30, 255]);
  const canvasRef = createRef<HTMLCanvasElement>();
  (canvasRef as { current: HTMLCanvasElement }).current = canvas;
  const dbl = fakeDrawing();
  const view = renderHook(
    ({ active }: { active: boolean }) =>
      useSelectionState({ canvasRef, drawing: dbl.drawing, active }),
    { initialProps: { active } },
  );
  return { ...view, canvas, ...dbl };
}

const rect: SelectionRect = { c0: 1, r0: 1, c1: 3, r1: 2 };

describe("useSelectionState", () => {
  it("starts with no selection, clipboard or paste", () => {
    const { result } = setup();
    expect(result.current.selection).toBeNull();
    expect(result.current.hasClipboard).toBe(false);
    expect(result.current.pasting).toBe(false);
    expect(result.current.preview).toBeNull();
  });

  it("stores and clears the selection rectangle", () => {
    const { result } = setup();
    act(() => result.current.setSelection(rect));
    expect(result.current.selection).toEqual(rect);
  });

  it("drops the selection when the tool is deactivated but keeps the clipboard", () => {
    const { result, rerender } = setup(true);
    act(() => result.current.setSelection(rect));
    act(() => result.current.copy());
    expect(result.current.hasClipboard).toBe(true);

    rerender({ active: false });
    expect(result.current.selection).toBeNull();
    expect(result.current.pasting).toBe(false);
    expect(result.current.hasClipboard).toBe(true);
  });

  it("copies the selected block to the clipboard", () => {
    const { result } = setup();
    act(() => result.current.setSelection(rect));
    act(() => result.current.copy());
    expect(result.current.hasClipboard).toBe(true);
  });

  it("does nothing when copying with no selection", () => {
    const { result } = setup();
    act(() => result.current.copy());
    expect(result.current.hasClipboard).toBe(false);
  });

  it("only arms a paste once something is on the clipboard", () => {
    const { result } = setup();
    act(() => result.current.togglePaste());
    expect(result.current.pasting).toBe(false);

    act(() => result.current.setSelection(rect));
    act(() => result.current.copy());
    act(() => result.current.togglePaste());
    expect(result.current.pasting).toBe(true);
    // Arming a paste drops the marquee.
    expect(result.current.selection).toBeNull();

    act(() => result.current.togglePaste());
    expect(result.current.pasting).toBe(false);
  });

  it("builds a paste preview only when armed, hovered and holding a clipboard", () => {
    const { result } = setup();
    act(() => result.current.setSelection(rect));
    act(() => result.current.copy());
    act(() => result.current.togglePaste());
    expect(result.current.preview).toBeNull(); // no hover yet

    act(() => result.current.hoverPaste({ col: 5, row: 5 }));
    expect(result.current.preview).not.toBeNull();
    expect(result.current.preview?.origin).toEqual({ col: 5, row: 5 });
  });

  it("ignores a hover onto the same cell (keeps the same preview object)", () => {
    const { result } = setup();
    act(() => result.current.setSelection(rect));
    act(() => result.current.copy());
    act(() => result.current.togglePaste());
    act(() => result.current.hoverPaste({ col: 5, row: 5 }));
    const first = result.current.preview;
    act(() => result.current.hoverPaste({ col: 5, row: 5 }));
    expect(result.current.preview).toBe(first);
  });

  it("commitPaste stamps the block, records a step and selects the drop", () => {
    const { result, beginStep, set } = setup();
    act(() => result.current.setSelection(rect));
    act(() => result.current.copy());
    act(() => result.current.togglePaste());

    act(() => result.current.commitPaste({ col: 7, row: 8 }));
    expect(beginStep).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalled();
    // The pasted block is left selected at its drop origin.
    expect(result.current.selection).toEqual({ c0: 7, r0: 8, c1: 9, r1: 9 });
    expect(result.current.pasting).toBe(false);
  });

  it("commitPaste does nothing with an empty clipboard", () => {
    const { result, beginStep } = setup();
    act(() => result.current.commitPaste({ col: 0, row: 0 }));
    expect(beginStep).not.toHaveBeenCalled();
  });

  it("deselect clears the selection and any armed paste", () => {
    const { result } = setup();
    act(() => result.current.setSelection(rect));
    act(() => result.current.copy());
    act(() => result.current.togglePaste());
    act(() => result.current.deselect());
    expect(result.current.selection).toBeNull();
    expect(result.current.pasting).toBe(false);
  });

  describe("keyboard shortcuts", () => {
    const chord = (key: string, target: EventTarget = document.body) =>
      target.dispatchEvent(
        new KeyboardEvent("keydown", { key, metaKey: true, bubbles: true, cancelable: true }),
      );

    it("Cmd+C copies when a selection exists and the tool is active", () => {
      const { result } = setup(true);
      act(() => result.current.setSelection(rect));
      act(() => chord("c"));
      expect(result.current.hasClipboard).toBe(true);
    });

    it("Cmd+V toggles a paste when a clipboard exists", () => {
      const { result } = setup(true);
      act(() => result.current.setSelection(rect));
      act(() => result.current.copy());
      act(() => chord("v"));
      expect(result.current.pasting).toBe(true);
    });

    it("ignores the chord when the tool is inactive", () => {
      const { result } = setup(false);
      act(() => result.current.setSelection(rect));
      act(() => chord("c"));
      expect(result.current.hasClipboard).toBe(false);
    });

    it("ignores the chord while focus is in a text field", () => {
      const { result } = setup(true);
      act(() => result.current.setSelection(rect));
      const input = document.createElement("input");
      document.body.appendChild(input);
      act(() => chord("c", input));
      expect(result.current.hasClipboard).toBe(false);
      input.remove();
    });
  });
});
