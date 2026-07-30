import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { overrideKey, type PatternOverrides } from "../lib/patternGenerator";
import { makeSettings } from "../test/helpers";
import { useDrawingState } from "./useDrawingState";

const settings = makeSettings({ stitches: 10, rows: 10 });

describe("useDrawingState", () => {
  it("starts empty with nothing to revert", () => {
    const { result } = renderHook(() => useDrawingState());
    expect(result.current.overrides.size).toBe(0);
    expect(result.current.hasDrawing).toBe(false);
    expect(result.current.canRevert).toBe(false);
  });

  it("paints on-grid cells and reports a drawing", () => {
    const { result } = renderHook(() => useDrawingState());
    act(() =>
      result.current.paint([{ col: 1, row: 2 }], "red", settings),
    );
    expect(result.current.hasDrawing).toBe(true);
    expect(result.current.overrides.get(overrideKey(1, 2))).toBe("red");
  });

  it("bounds-checks painted cells against the grid", () => {
    const { result } = renderHook(() => useDrawingState());
    act(() =>
      result.current.paint(
        [
          { col: -1, row: 0 },
          { col: 5, row: 5 },
          { col: 99, row: 0 },
        ],
        "blue",
        settings,
      ),
    );
    expect(result.current.overrides.size).toBe(1);
    expect(result.current.overrides.get(overrideKey(5, 5))).toBe("blue");
  });

  it("reverts to the snapshot taken by beginStep", () => {
    const { result } = renderHook(() => useDrawingState());

    act(() => result.current.paint([{ col: 0, row: 0 }], "red", settings));
    act(() => result.current.beginStep());
    act(() => result.current.paint([{ col: 1, row: 1 }], "blue", settings));

    expect(result.current.overrides.size).toBe(2);
    expect(result.current.canRevert).toBe(true);

    act(() => result.current.revert());
    expect(result.current.overrides.size).toBe(1);
    expect(result.current.overrides.get(overrideKey(0, 0))).toBe("red");
    expect(result.current.canRevert).toBe(false);
  });

  it("reverts multiple steps in LIFO order", () => {
    const { result } = renderHook(() => useDrawingState());
    act(() => result.current.beginStep());
    act(() => result.current.paint([{ col: 0, row: 0 }], "a", settings));
    act(() => result.current.beginStep());
    act(() => result.current.paint([{ col: 1, row: 0 }], "b", settings));

    act(() => result.current.revert());
    expect(result.current.overrides.has(overrideKey(1, 0))).toBe(false);
    act(() => result.current.revert());
    expect(result.current.overrides.size).toBe(0);
  });

  it("does nothing when reverting with no history", () => {
    const { result } = renderHook(() => useDrawingState());
    act(() => result.current.paint([{ col: 0, row: 0 }], "red", settings));
    act(() => result.current.revert());
    expect(result.current.overrides.size).toBe(1);
  });

  it("translates every stitch, ignoring a zero move", () => {
    const { result } = renderHook(() => useDrawingState());
    act(() => result.current.paint([{ col: 2, row: 3 }], "red", settings));

    act(() => result.current.translate(0, 0));
    expect(result.current.overrides.has(overrideKey(2, 3))).toBe(true);

    act(() => result.current.translate(1, -1));
    expect(result.current.overrides.has(overrideKey(2, 3))).toBe(false);
    expect(result.current.overrides.get(overrideKey(3, 2))).toBe("red");
  });

  it("clears the drawing but records a revertible step", () => {
    const { result } = renderHook(() => useDrawingState());
    act(() => result.current.paint([{ col: 0, row: 0 }], "red", settings));

    act(() => result.current.clear());
    expect(result.current.hasDrawing).toBe(false);
    expect(result.current.canRevert).toBe(true);

    act(() => result.current.revert());
    expect(result.current.overrides.get(overrideKey(0, 0))).toBe("red");
  });

  it("does not record a step when clearing an already-empty drawing", () => {
    const { result } = renderHook(() => useDrawingState());
    act(() => result.current.clear());
    expect(result.current.canRevert).toBe(false);
  });

  it("reset drops the drawing and its history", () => {
    const { result } = renderHook(() => useDrawingState());
    act(() => result.current.beginStep());
    act(() => result.current.paint([{ col: 0, row: 0 }], "red", settings));

    act(() => result.current.reset());
    expect(result.current.overrides.size).toBe(0);
    expect(result.current.canRevert).toBe(false);
  });

  it("loads imported overrides and discards history", () => {
    const { result } = renderHook(() => useDrawingState());
    act(() => result.current.beginStep());
    act(() => result.current.paint([{ col: 0, row: 0 }], "red", settings));

    const imported: PatternOverrides = new Map([[overrideKey(9, 9), "green"]]);
    act(() => result.current.load(imported));
    expect(result.current.overrides.get(overrideKey(9, 9))).toBe("green");
    expect(result.current.overrides.has(overrideKey(0, 0))).toBe(false);
    expect(result.current.canRevert).toBe(false);
  });

  describe("rescale", () => {
    it("does nothing when there is no drawing", () => {
      const { result } = renderHook(() => useDrawingState());
      act(() => result.current.rescale(200, settings));
      expect(result.current.overrides.size).toBe(0);
    });

    it("collapses the drawing to nothing at size 0", () => {
      const { result } = renderHook(() => useDrawingState());
      const s = makeSettings({ stitches: 40, rows: 40, size: 100 });
      act(() => result.current.paint([{ col: 10, row: 10 }], "red", s));

      act(() => result.current.rescale(0, s));
      expect(result.current.overrides.size).toBe(0);
    });

    it("stays empty once collapsed (the empty-overrides guard short-circuits)", () => {
      const { result } = renderHook(() => useDrawingState());
      const s = makeSettings({ stitches: 40, rows: 40, size: 100 });
      act(() => result.current.paint([{ col: 10, row: 10 }], "red", s));
      act(() => result.current.rescale(0, s));
      // Once the drawing is empty, rescale returns early, so scaling back up
      // through rescale alone does not bring the stitches back.
      act(() => result.current.rescale(100, s));
      expect(result.current.overrides.size).toBe(0);
    });

    it("scales the drawing up about the image anchor", () => {
      const { result } = renderHook(() => useDrawingState());
      const s = makeSettings({ stitches: 60, rows: 20, size: 100, offsetX: 0, offsetY: 0 });
      // Two stitches a few cells apart.
      act(() => result.current.paint([{ col: 10, row: 10 }, { col: 14, row: 10 }], "red", s));
      const before = result.current.overrides.size;

      act(() => result.current.rescale(200, s));
      // Doubling spreads the stitches over more cells (nearest-neighbour fill).
      expect(result.current.overrides.size).toBeGreaterThan(before);
    });
  });

  it("invalidateResizeBase lets a later resize re-snapshot", () => {
    // A plain `set` invalidates the base; the next rescale then reads the current
    // size as its baseline. Exercised indirectly: paint (via set) between rescales.
    const { result } = renderHook(() => useDrawingState());
    const s = makeSettings({ stitches: 40, rows: 40, size: 100 });
    act(() => result.current.paint([{ col: 10, row: 10 }], "red", s));
    act(() => result.current.invalidateResizeBase());
    act(() => result.current.rescale(100, s));
    expect(result.current.overrides.size).toBeGreaterThan(0);
  });
});
