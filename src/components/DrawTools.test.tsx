import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DrawTools } from "./DrawTools";

type Props = Parameters<typeof DrawTools>[0];

function renderTools(props: Partial<Props> = {}) {
  const handlers = {
    onToggleMode: vi.fn(),
    onToggleReassign: vi.fn(),
    onToggleFill: vi.fn(),
    onColorChange: vi.fn(),
    onReassignColor: vi.fn(),
    onPickColor: vi.fn(),
    onRevert: vi.fn(),
    onClear: vi.fn(),
  };
  render(
    <DrawTools
      drawMode={props.drawMode ?? true}
      color={props.color ?? "black"}
      usedColors={props.usedColors ?? []}
      reassignMode={props.reassignMode ?? false}
      fillMode={props.fillMode ?? "off"}
      hasDrawing={props.hasDrawing ?? false}
      canRevert={props.canRevert ?? false}
      {...handlers}
    />,
  );
  return handlers;
}

describe("DrawTools", () => {
  it("shows only the collapsed toggle when not in draw mode", () => {
    renderTools({ drawMode: false });
    expect(screen.getByRole("button", { name: "draw" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /reassign colors/i })).not.toBeInTheDocument();
  });

  it("reveals the tools when in draw mode", () => {
    renderTools({ drawMode: true });
    expect(screen.getByRole("button", { name: "exit draw mode" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "reassign colors" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "fill row" })).toBeInTheDocument();
  });

  it("enters draw mode from the collapsed tab", () => {
    const { onToggleMode } = renderTools({ drawMode: false });
    fireEvent.click(screen.getByRole("button", { name: "draw" }));
    expect(onToggleMode).toHaveBeenCalledTimes(1);
  });

  describe("swatches", () => {
    it("renders a swatch per used colour and marks the active one", () => {
      renderTools({ usedColors: ["red", "blue"], color: "red" });
      expect(screen.getByRole("button", { name: "red" })).toHaveAttribute("aria-pressed", "true");
      expect(screen.getByRole("button", { name: "blue" })).toHaveAttribute("aria-pressed", "false");
    });

    it("appends the active colour when it is not among the used colours", () => {
      renderTools({ usedColors: ["red"], color: "green" });
      // The active green is still shown so the selection stays visible.
      expect(screen.getByRole("button", { name: "green" })).toBeInTheDocument();
    });

    it("selects a colour when a swatch is clicked while painting", () => {
      const { onColorChange, onReassignColor } = renderTools({ usedColors: ["red"] });
      fireEvent.click(screen.getByRole("button", { name: "red" }));
      expect(onColorChange).toHaveBeenCalledWith("red");
      expect(onReassignColor).not.toHaveBeenCalled();
    });

    it("reassigns a colour when a swatch is clicked in reassign mode", () => {
      const { onReassignColor, onColorChange } = renderTools({
        usedColors: ["red"],
        reassignMode: true,
      });
      fireEvent.click(screen.getByRole("button", { name: "red" }));
      expect(onReassignColor).toHaveBeenCalledWith("red");
      expect(onColorChange).not.toHaveBeenCalled();
    });

    it("shows an empty hint when there are no colours to reassign", () => {
      // In reassign mode the active colour is not appended, so an empty palette
      // really is empty and the hint shows.
      renderTools({ usedColors: [], reassignMode: true });
      expect(screen.getByText(/no colours on the canvas yet/i)).toBeInTheDocument();
    });
  });

  describe("reassign mode", () => {
    it("disables the reassign toggle when there is nothing to reassign", () => {
      renderTools({ usedColors: [], reassignMode: false });
      expect(screen.getByRole("button", { name: "reassign colors" })).toBeDisabled();
    });

    it("labels the toggle 'done reassigning' and shows a hint while active", () => {
      renderTools({ reassignMode: true, usedColors: ["red"] });
      expect(screen.getByRole("button", { name: "done reassigning" })).toBeEnabled();
      expect(screen.getByText(/click a colour to overwrite it/i)).toBeInTheDocument();
    });

    it("hides the '+ select color' button in reassign mode", () => {
      renderTools({ reassignMode: true, usedColors: ["red"] });
      expect(screen.queryByRole("button", { name: /select color/i })).not.toBeInTheDocument();
    });

    it("toggles reassign mode", () => {
      const { onToggleReassign } = renderTools({ usedColors: ["red"] });
      fireEvent.click(screen.getByRole("button", { name: "reassign colors" }));
      expect(onToggleReassign).toHaveBeenCalledTimes(1);
    });
  });

  describe("fill modes", () => {
    it.each([
      ["fill row", "row"],
      ["fill column", "column"],
      ["fill area", "bucket"],
    ] as const)("toggles the %s fill", (label, mode) => {
      const { onToggleFill } = renderTools();
      fireEvent.click(screen.getByRole("button", { name: label }));
      expect(onToggleFill).toHaveBeenCalledWith(mode);
    });

    it("marks the active fill button as pressed", () => {
      renderTools({ fillMode: "bucket" });
      expect(screen.getByRole("button", { name: "fill area" })).toHaveAttribute("aria-pressed", "true");
    });

    it("shows the bucket hint when the bucket fill is active", () => {
      renderTools({ fillMode: "bucket" });
      expect(screen.getByText(/click an enclosed area/i)).toBeInTheDocument();
    });

    it("shows the row hint when a row fill is active", () => {
      renderTools({ fillMode: "row" });
      expect(screen.getByText(/fill a row in the selected colour/i)).toBeInTheDocument();
    });
  });

  describe("add colour / revert / clear", () => {
    it("opens the colour picker", () => {
      const { onPickColor } = renderTools();
      fireEvent.click(screen.getByRole("button", { name: /select color/i }));
      expect(onPickColor).toHaveBeenCalledTimes(1);
    });

    it("disables revert until there is a step to undo", () => {
      renderTools({ canRevert: false });
      expect(screen.getByRole("button", { name: "revert last step" })).toBeDisabled();
    });

    it("fires revert when enabled", () => {
      const { onRevert } = renderTools({ canRevert: true });
      fireEvent.click(screen.getByRole("button", { name: "revert last step" }));
      expect(onRevert).toHaveBeenCalledTimes(1);
    });

    it("disables clear until there is a drawing", () => {
      renderTools({ hasDrawing: false });
      expect(screen.getByRole("button", { name: "clear drawing" })).toBeDisabled();
    });

    it("fires clear when there is a drawing", () => {
      const { onClear } = renderTools({ hasDrawing: true });
      fireEvent.click(screen.getByRole("button", { name: "clear drawing" }));
      expect(onClear).toHaveBeenCalledTimes(1);
    });
  });
});
