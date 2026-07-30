import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ToolMode } from "../types/editor";
import type { ToolModeState } from "../hooks/useToolMode";
import { clientX, clientY, makeCanvas, makeSettings, pointerEvent } from "../test/helpers";
import { fakeColors, fakeDrawing, fakeSelection } from "../test/doubles";
import { useCanvasInteraction } from "./useCanvasInteraction";

function toolState(mode: ToolMode): ToolModeState {
  return {
    mode,
    fillMode: "off",
    reassignMode: false,
    reassignFrom: null,
    colorPickerOpen: false,
  };
}

function setup(mode: ToolMode, drawn = false) {
  const setSettings = vi.fn();
  const drawing = fakeDrawing(drawn ? new Map([["0,0", "red"]]) : new Map());
  const colors = fakeColors("red");
  const selection = fakeSelection();
  const { result } = renderHook(() =>
    useCanvasInteraction({
      tool: toolState(mode),
      settings: makeSettings({ stitches: 5, rows: 5 }),
      setSettings,
      hasImage: true,
      drawing,
      colors,
      selection,
    }),
  );
  return { interaction: result.current, setSettings, drawing, selection };
}

describe("useCanvasInteraction", () => {
  it("routes draw mode to the draw interaction (a press paints)", () => {
    const { interaction, drawing } = setup("draw");
    const canvas = makeCanvas();
    interaction.onPointerDown(pointerEvent(canvas, { clientX: clientX(1), clientY: clientY(1) }));
    expect(drawing.paint).toHaveBeenCalled();
    expect(drawing.beginStep).toHaveBeenCalled();
  });

  it("routes select mode to the select interaction (a press starts a marquee)", () => {
    const { interaction, selection, drawing } = setup("select");
    const canvas = makeCanvas();
    interaction.onPointerDown(pointerEvent(canvas, { clientX: clientX(1), clientY: clientY(1) }));
    expect(selection.setSelection).toHaveBeenCalled();
    expect(drawing.paint).not.toHaveBeenCalled();
  });

  it("routes pan mode to the pan interaction (a drag pans the image)", () => {
    const { interaction, setSettings } = setup("pan");
    const canvas = makeCanvas();
    interaction.onPointerDown(pointerEvent(canvas, { clientX: clientX(0), clientY: clientY(0) }));
    interaction.onPointerMove(pointerEvent(canvas, { clientX: clientX(0) + 20, clientY: clientY(0) }));
    expect(setSettings).toHaveBeenCalled();
  });

  it("leaves the canvas panning in image mode", () => {
    const { interaction, setSettings } = setup("image");
    const canvas = makeCanvas();
    interaction.onPointerDown(pointerEvent(canvas, { clientX: clientX(0), clientY: clientY(0) }));
    interaction.onPointerMove(pointerEvent(canvas, { clientX: clientX(0) + 30, clientY: clientY(0) }));
    expect(setSettings).toHaveBeenCalled();
  });
});
