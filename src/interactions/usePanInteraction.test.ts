import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { OFFSET_MAX } from "../config/editor";
import type { MittenSettings } from "../lib/patternGenerator";
import { clientX, clientY, makeCanvas, makeSettings, pointerEvent } from "../test/helpers";
import { fakeDrawing } from "../test/doubles";
import { usePanInteraction } from "./usePanInteraction";

function setup(opts: { hasImage?: boolean; drawn?: boolean; settings?: Partial<MittenSettings> } = {}) {
  const setSettings = vi.fn();
  const drawing = fakeDrawing(
    opts.drawn ? new Map([["5,5", "red"]]) : new Map(),
  );
  const settings = makeSettings(opts.settings);
  const { result } = renderHook(() =>
    usePanInteraction({
      settings,
      setSettings,
      hasImage: opts.hasImage ?? false,
      drawing,
    }),
  );
  return { interaction: result.current, setSettings, drawing };
}

describe("usePanInteraction", () => {
  it("shows no grab cursor when there is nothing to move", () => {
    const { interaction } = setup();
    expect(interaction.cursorClass).toBe("");
  });

  it("shows a grab cursor when an image is loaded", () => {
    const { interaction } = setup({ hasImage: true });
    expect(interaction.cursorClass).toContain("cursor-grab");
  });

  it("shows a grab cursor when only a drawing exists", () => {
    const { interaction } = setup({ drawn: true });
    expect(interaction.cursorClass).toContain("cursor-grab");
  });

  it("ignores a drag when there is neither image nor drawing", () => {
    const { interaction, setSettings } = setup();
    const canvas = makeCanvas();
    interaction.onPointerDown(pointerEvent(canvas, { clientX: 0, clientY: 0 }));
    interaction.onPointerMove(pointerEvent(canvas, { clientX: 100, clientY: 0 }));
    expect(setSettings).not.toHaveBeenCalled();
    expect(canvas.setPointerCapture).not.toHaveBeenCalled();
  });

  it("pans the image offset by whole stitches while dragging", () => {
    const { interaction, setSettings } = setup({ hasImage: true, settings: { offsetX: 0, offsetY: 0 } });
    const canvas = makeCanvas();

    interaction.onPointerDown(pointerEvent(canvas, { clientX: clientX(0), clientY: clientY(0) }));
    expect(canvas.setPointerCapture).toHaveBeenCalledWith(1);

    // Drag three stitches to the right, two down (canvas scale is 1).
    interaction.onPointerMove(
      pointerEvent(canvas, { clientX: clientX(0) + 30, clientY: clientY(0) + 20 }),
    );

    const updater = setSettings.mock.calls[0][0] as (p: MittenSettings) => MittenSettings;
    const next = updater(makeSettings({ offsetX: 0, offsetY: 0 }));
    expect(next.offsetX).toBe(3);
    expect(next.offsetY).toBe(2);
  });

  it("clamps the offset to the allowed range", () => {
    const { interaction, setSettings } = setup({
      hasImage: true,
      settings: { offsetX: OFFSET_MAX },
    });
    const canvas = makeCanvas();
    interaction.onPointerDown(pointerEvent(canvas, { clientX: 0, clientY: 0 }));
    interaction.onPointerMove(pointerEvent(canvas, { clientX: 1000, clientY: 0 }));
    const updater = setSettings.mock.calls[0][0] as (p: MittenSettings) => MittenSettings;
    const next = updater(makeSettings({ offsetX: OFFSET_MAX }));
    expect(next.offsetX).toBe(OFFSET_MAX);
  });

  it("translates the drawing in lockstep, only by the incremental change", () => {
    const { interaction, drawing } = setup({ drawn: true });
    const canvas = makeCanvas();
    interaction.onPointerDown(pointerEvent(canvas, { clientX: clientX(0), clientY: clientY(0) }));
    interaction.onPointerMove(pointerEvent(canvas, { clientX: clientX(0) + 20, clientY: clientY(0) }));
    interaction.onPointerMove(pointerEvent(canvas, { clientX: clientX(0) + 50, clientY: clientY(0) }));

    // First move: +2, second move: +5 total so incremental +3.
    expect(drawing.translate).toHaveBeenNthCalledWith(1, 2, 0);
    expect(drawing.translate).toHaveBeenNthCalledWith(2, 3, 0);
  });

  it("ignores pointer moves from a different pointer id", () => {
    const { interaction, setSettings } = setup({ hasImage: true });
    const canvas = makeCanvas();
    interaction.onPointerDown(pointerEvent(canvas, { pointerId: 1, clientX: 0, clientY: 0 }));
    interaction.onPointerMove(pointerEvent(canvas, { pointerId: 2, clientX: 100, clientY: 0 }));
    expect(setSettings).not.toHaveBeenCalled();
  });

  it("releases the pointer capture on pointer up", () => {
    const { interaction } = setup({ hasImage: true });
    const canvas = makeCanvas();
    interaction.onPointerDown(pointerEvent(canvas, { clientX: 0, clientY: 0 }));
    interaction.onPointerUp(pointerEvent(canvas, {}));
    expect(canvas.releasePointerCapture).toHaveBeenCalledWith(1);
  });
});
