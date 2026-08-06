import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import type { RGBA } from "../types/editor";
import type { SelectionRect } from "../lib/patternGenerator";
import { clientX, clientY, makeCanvas, makeSettings, pointerEvent } from "../test/helpers";
import { setCanvasPixels } from "../test/canvas";
import { fakeDrawing, fakeSelection } from "../test/doubles";
import { useSelectInteraction } from "./useSelectInteraction";

function setup(sel: Parameters<typeof fakeSelection>[0] = {}) {
  const drawing = fakeDrawing();
  const selection = fakeSelection(sel);
  const settings = makeSettings({ stitches: 5, rows: 5 });
  const { result } = renderHook(() =>
    useSelectInteraction({ settings, drawing, selection }),
  );
  return { interaction: result.current, drawing, selection };
}

/** A canvas whose stitches are all opaque, so captured blocks carry cells. */
function opaqueCanvas() {
  const canvas = makeCanvas();
  setCanvasPixels(canvas, (): RGBA => [12, 34, 56, 255]);
  return canvas;
}

describe("useSelectInteraction", () => {
  it("uses a crosshair cursor", () => {
    const { interaction } = setup();
    expect(interaction.cursorClass).toBe("cursor-crosshair touch-none");
  });

  describe("marquee", () => {
    it("starts a marquee from the pressed (clamped) cell", () => {
      const { interaction, selection } = setup();
      const canvas = makeCanvas();
      interaction.onPointerDown(pointerEvent(canvas, { clientX: clientX(1), clientY: clientY(2) }));
      expect(canvas.setPointerCapture).toHaveBeenCalledWith(1);
      expect(selection.setSelection).toHaveBeenCalledWith({ c0: 1, r0: 2, c1: 1, r1: 2 });
    });

    it("drags out the opposite corner, clamped to the grid", () => {
      const { interaction, selection } = setup();
      const canvas = makeCanvas();
      interaction.onPointerDown(pointerEvent(canvas, { clientX: clientX(0), clientY: clientY(0) }));
      selection.setSelection.mockClear();
      // Drag well past the 5×5 grid — the far corner clamps to (4, 4).
      interaction.onPointerMove(pointerEvent(canvas, { clientX: clientX(99), clientY: clientY(99) }));
      expect(selection.setSelection).toHaveBeenLastCalledWith({ c0: 0, r0: 0, c1: 4, r1: 4 });
    });
  });

  describe("move", () => {
    const rect: SelectionRect = { c0: 1, r0: 1, c1: 2, r1: 2 };

    it("grabs the selection for a move when pressed inside it", () => {
      const { interaction, drawing } = setup({ selection: rect, moveMode: true });
      const canvas = opaqueCanvas();
      interaction.onPointerDown(pointerEvent(canvas, { clientX: clientX(1), clientY: clientY(1) }));
      // The move is snapshotted and the lifted block re-stamped at its origin.
      expect(drawing.beginStep).toHaveBeenCalledTimes(1);
      expect(drawing.set).toHaveBeenCalled();
      expect(canvas.setPointerCapture).toHaveBeenCalledWith(1);
    });

    it("does not move but starts a marquee when move mode is off", () => {
      const { interaction, drawing, selection } = setup({ selection: rect });
      const canvas = opaqueCanvas();
      interaction.onPointerDown(pointerEvent(canvas, { clientX: clientX(1), clientY: clientY(1) }));
      // No lift/snapshot; the press begins a fresh marquee from the clamped cell.
      expect(drawing.beginStep).not.toHaveBeenCalled();
      expect(selection.setSelection).toHaveBeenLastCalledWith({ c0: 1, r0: 1, c1: 1, r1: 1 });
    });

    it("translates the block and moves the marquee with it while dragging", () => {
      const { interaction, drawing, selection } = setup({ selection: rect, moveMode: true });
      const canvas = opaqueCanvas();
      interaction.onPointerDown(pointerEvent(canvas, { clientX: clientX(1), clientY: clientY(1) }));
      drawing.set.mockClear();
      selection.setSelection.mockClear();

      // Drag two stitches right, one down.
      interaction.onPointerMove(
        pointerEvent(canvas, { clientX: clientX(1) + 20, clientY: clientY(1) + 10 }),
      );
      expect(drawing.set).toHaveBeenCalled();
      // The marquee follows to the shifted origin (1,1) + (2,1) = (3,2).
      expect(selection.setSelection).toHaveBeenLastCalledWith({ c0: 3, r0: 2, c1: 4, r1: 3 });
    });
  });

  describe("paste placement", () => {
    it("commits the paste at the clicked (clamped) cell on pointer down", () => {
      const { interaction, selection } = setup({ pasting: true });
      const canvas = makeCanvas();
      interaction.onPointerDown(pointerEvent(canvas, { clientX: clientX(3), clientY: clientY(4) }));
      expect(selection.commitPaste).toHaveBeenCalledWith({ col: 3, row: 4 });
    });

    it("previews under the cursor as it moves", () => {
      const { interaction, selection } = setup({ pasting: true });
      const canvas = makeCanvas();
      interaction.onPointerMove(pointerEvent(canvas, { clientX: clientX(2), clientY: clientY(2) }));
      expect(selection.hoverPaste).toHaveBeenCalledWith({ col: 2, row: 2 });
    });

    it("does not start a marquee while a paste is armed", () => {
      const { interaction, selection } = setup({ pasting: true });
      const canvas = makeCanvas();
      interaction.onPointerDown(pointerEvent(canvas, { clientX: clientX(1), clientY: clientY(1) }));
      expect(selection.setSelection).not.toHaveBeenCalled();
    });
  });

  it("releases the pointer capture on pointer up", () => {
    const { interaction } = setup();
    const canvas = makeCanvas();
    interaction.onPointerDown(pointerEvent(canvas, { clientX: clientX(0), clientY: clientY(0) }));
    interaction.onPointerUp(pointerEvent(canvas, {}));
    expect(canvas.releasePointerCapture).toHaveBeenCalledWith(1);
  });
});
