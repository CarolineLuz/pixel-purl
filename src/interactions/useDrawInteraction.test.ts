import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import type { RGBA } from "../types/editor";
import type { ColorRemap } from "../lib/patternGenerator";
import type { FillMode } from "../types/editor";
import { clientX, clientY, makeCanvas, makeSettings, pointerEvent } from "../test/helpers";
import { setCanvasPixels } from "../test/canvas";
import { fakeDrawing, type FakeDrawing } from "../test/doubles";
import { useDrawInteraction } from "./useDrawInteraction";

function setup(opts: {
  fillMode?: FillMode;
  reassignMode?: boolean;
  color?: string;
  colorRemap?: ColorRemap;
} = {}) {
  const drawing = fakeDrawing();
  const settings = makeSettings({ stitches: 5, rows: 5 });
  const { result } = renderHook(() =>
    useDrawInteraction({
      settings,
      drawing,
      color: opts.color ?? "red",
      colorRemap: opts.colorRemap ?? new Map(),
      fillMode: opts.fillMode ?? "off",
      reassignMode: opts.reassignMode ?? false,
    }),
  );
  return { interaction: result.current, drawing };
}

/** Union of the cells painted across all paint() calls. */
function paintedCells(drawing: FakeDrawing) {
  return drawing.paint.mock.calls.flatMap((c) => c[0] as { col: number; row: number }[]);
}

describe("useDrawInteraction", () => {
  it("uses a crosshair cursor while painting", () => {
    const { interaction } = setup();
    expect(interaction.cursorClass).toBe("cursor-crosshair touch-none");
  });

  it("is inert (no cursor, no painting) in reassign mode", () => {
    const { interaction, drawing } = setup({ reassignMode: true });
    expect(interaction.cursorClass).toBe("");
    const canvas = makeCanvas();
    interaction.onPointerDown(pointerEvent(canvas, { clientX: clientX(1), clientY: clientY(1) }));
    expect(drawing.beginStep).not.toHaveBeenCalled();
    expect(drawing.paint).not.toHaveBeenCalled();
  });

  describe("freehand", () => {
    it("captures the pointer, records a step and paints the pressed cell", () => {
      const { interaction, drawing } = setup();
      const canvas = makeCanvas();
      interaction.onPointerDown(pointerEvent(canvas, { clientX: clientX(2), clientY: clientY(3) }));
      expect(canvas.setPointerCapture).toHaveBeenCalledWith(1);
      expect(drawing.beginStep).toHaveBeenCalledTimes(1);
      expect(drawing.paint).toHaveBeenCalledWith([{ col: 2, row: 3 }], "red", expect.anything());
    });

    it("paints a joined line across a fast drag", () => {
      const { interaction, drawing } = setup();
      const canvas = makeCanvas();
      interaction.onPointerDown(pointerEvent(canvas, { clientX: clientX(0), clientY: clientY(0) }));
      interaction.onPointerMove(pointerEvent(canvas, { clientX: clientX(3), clientY: clientY(0) }));
      // Bresenham fills the intermediate cells 1 and 2.
      const cells = paintedCells(drawing);
      expect(cells).toContainEqual({ col: 1, row: 0 });
      expect(cells).toContainEqual({ col: 2, row: 0 });
      expect(cells).toContainEqual({ col: 3, row: 0 });
    });

    it("does not repaint when the pointer stays in the same cell", () => {
      const { interaction, drawing } = setup();
      const canvas = makeCanvas();
      interaction.onPointerDown(pointerEvent(canvas, { clientX: clientX(1), clientY: clientY(1) }));
      drawing.paint.mockClear();
      interaction.onPointerMove(pointerEvent(canvas, { clientX: clientX(1) + 1, clientY: clientY(1) + 1 }));
      expect(drawing.paint).not.toHaveBeenCalled();
    });

    it("ignores moves before a pointer down", () => {
      const { interaction, drawing } = setup();
      const canvas = makeCanvas();
      interaction.onPointerMove(pointerEvent(canvas, { clientX: clientX(1), clientY: clientY(1) }));
      expect(drawing.paint).not.toHaveBeenCalled();
    });

    it("releases the pointer capture on pointer up", () => {
      const { interaction } = setup();
      const canvas = makeCanvas();
      interaction.onPointerDown(pointerEvent(canvas, { clientX: clientX(0), clientY: clientY(0) }));
      interaction.onPointerUp(pointerEvent(canvas, {}));
      expect(canvas.releasePointerCapture).toHaveBeenCalledWith(1);
    });
  });

  describe("row/column fill", () => {
    it("fills a whole row on click", () => {
      const { interaction, drawing } = setup({ fillMode: "row" });
      const canvas = makeCanvas();
      interaction.onPointerDown(pointerEvent(canvas, { clientX: clientX(2), clientY: clientY(1) }));
      expect(drawing.beginStep).toHaveBeenCalledTimes(1);
      // A 5-stitch grid → the whole row is 5 cells.
      expect(drawing.paint.mock.calls[0][0]).toHaveLength(5);
    });

    it("ignores a row-fill click outside the grid rows", () => {
      const { interaction, drawing } = setup({ fillMode: "row" });
      const canvas = makeCanvas();
      // Row -1 (above the grid).
      interaction.onPointerDown(pointerEvent(canvas, { clientX: clientX(0), clientY: 0 }));
      expect(drawing.paint).not.toHaveBeenCalled();
    });

    it("fills a whole column on click", () => {
      const { interaction, drawing } = setup({ fillMode: "column" });
      const canvas = makeCanvas();
      interaction.onPointerDown(pointerEvent(canvas, { clientX: clientX(3), clientY: clientY(2) }));
      expect(drawing.paint.mock.calls[0][0]).toHaveLength(5);
    });

    it("does not start a freehand stroke in fill mode", () => {
      const { interaction } = setup({ fillMode: "row" });
      const canvas = makeCanvas();
      interaction.onPointerDown(pointerEvent(canvas, { clientX: clientX(0), clientY: clientY(0) }));
      expect(canvas.setPointerCapture).not.toHaveBeenCalled();
    });
  });

  describe("bucket fill", () => {
    it("flood-fills a uniform region with the active colour", () => {
      const { interaction, drawing } = setup({ fillMode: "bucket", color: "red" });
      const canvas = makeCanvas();
      // Whole grid a uniform white — different from the red that would be painted.
      setCanvasPixels(canvas, (): RGBA => [255, 255, 255, 255]);
      interaction.onPointerDown(pointerEvent(canvas, { clientX: clientX(1), clientY: clientY(1) }));
      expect(drawing.beginStep).toHaveBeenCalledTimes(1);
      expect(drawing.paint.mock.calls[0][0]).toHaveLength(25); // all 5×5 cells
    });

    it("does nothing when the region already shows the fill colour", () => {
      const { interaction, drawing } = setup({ fillMode: "bucket", color: "red" });
      const canvas = makeCanvas();
      setCanvasPixels(canvas, (): RGBA => [255, 0, 0, 255]); // already red
      interaction.onPointerDown(pointerEvent(canvas, { clientX: clientX(1), clientY: clientY(1) }));
      expect(drawing.paint).not.toHaveBeenCalled();
    });

    it("respects an active reassignment when choosing the fill colour", () => {
      // color "red" is remapped to red, region already red → no fill.
      const remap: ColorRemap = new Map([["blue", "red"]]);
      const { interaction, drawing } = setup({ fillMode: "bucket", color: "blue", colorRemap: remap });
      const canvas = makeCanvas();
      setCanvasPixels(canvas, (): RGBA => [255, 0, 0, 255]);
      interaction.onPointerDown(pointerEvent(canvas, { clientX: clientX(1), clientY: clientY(1) }));
      expect(drawing.paint).not.toHaveBeenCalled();
    });

    it("ignores a bucket click outside the grid", () => {
      const { interaction, drawing } = setup({ fillMode: "bucket" });
      const canvas = makeCanvas();
      setCanvasPixels(canvas, (): RGBA => [255, 255, 255, 255]);
      interaction.onPointerDown(pointerEvent(canvas, { clientX: 0, clientY: 0 })); // off-grid
      expect(drawing.paint).not.toHaveBeenCalled();
    });
  });
});
