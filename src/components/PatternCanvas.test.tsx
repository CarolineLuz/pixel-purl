import { describe, expect, it, vi } from "vitest";
import { createRef } from "react";
import { fireEvent, render } from "@testing-library/react";
import type { CanvasInteraction } from "../interactions/types";
import { PatternCanvas } from "./PatternCanvas";

function makeInteraction(): CanvasInteraction {
  return {
    cursorClass: "cursor-grab touch-none",
    onPointerDown: vi.fn(),
    onPointerMove: vi.fn(),
    onPointerUp: vi.fn(),
  };
}

describe("PatternCanvas", () => {
  it("renders a canvas wired to the ref with the interaction's cursor class", () => {
    const ref = createRef<HTMLCanvasElement>();
    const { container } = render(<PatternCanvas canvasRef={ref} interaction={makeInteraction()} zoom={1} />);
    const canvas = container.querySelector("canvas")!;
    expect(ref.current).toBe(canvas);
    expect(canvas.className).toContain("cursor-grab");
  });

  it("forwards pointer events to the active interaction", () => {
    const interaction = makeInteraction();
    const { container } = render(<PatternCanvas canvasRef={createRef()} interaction={interaction} zoom={1} />);
    const canvas = container.querySelector("canvas")!;

    fireEvent.pointerDown(canvas);
    fireEvent.pointerMove(canvas);
    fireEvent.pointerUp(canvas);
    expect(interaction.onPointerDown).toHaveBeenCalledTimes(1);
    expect(interaction.onPointerMove).toHaveBeenCalledTimes(1);
    expect(interaction.onPointerUp).toHaveBeenCalledTimes(1);
  });

  it("treats a pointer cancel as a pointer up", () => {
    const interaction = makeInteraction();
    const { container } = render(<PatternCanvas canvasRef={createRef()} interaction={interaction} zoom={1} />);
    fireEvent.pointerCancel(container.querySelector("canvas")!);
    expect(interaction.onPointerUp).toHaveBeenCalledTimes(1);
  });
});
