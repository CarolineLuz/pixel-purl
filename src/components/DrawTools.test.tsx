import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { DrawTools } from "./DrawTools";

type Props = Parameters<typeof DrawTools>[0];

function renderTools(props: Partial<Props> = {}) {
  const handlers = {
    onToggleMode: vi.fn(),
    onToggleReassign: vi.fn(),
    onToggleFill: vi.fn(),
    onFreehand: vi.fn(),
    onColorChange: vi.fn(),
    onReassignColor: vi.fn(),
    onPickColor: vi.fn(),
  };
  render(
    <DrawTools
      drawMode={props.drawMode ?? true}
      color={props.color ?? "black"}
      usedColors={props.usedColors ?? []}
      reassignMode={props.reassignMode ?? false}
      fillMode={props.fillMode ?? "off"}
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
    expect(screen.getByRole("button", { name: "draw row" })).toBeInTheDocument();
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

    it("always shows the selected colour in its own section", () => {
      renderTools({ usedColors: ["red"], color: "green" });
      // Green is the active colour but not used in the pattern, so it appears
      // only in the "selected color" section, never as a pattern swatch.
      expect(
        screen.getByRole("button", { name: /selected color green/i }),
      ).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "green" })).not.toBeInTheDocument();
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

    it("shows an empty hint when no colours are used in the pattern", () => {
      renderTools({ usedColors: [] });
      expect(screen.getByText(/no colours in the pattern yet/i)).toBeInTheDocument();
    });
  });

  describe("reassign mode", () => {
    it("disables the reassign toggle when there is nothing to reassign", () => {
      renderTools({ usedColors: [], reassignMode: false });
      expect(screen.getByRole("button", { name: "reassign colors" })).toBeDisabled();
    });

    it("labels the toggle 'done reassigning' and shows a hint while active", () => {
      renderTools({ reassignMode: true, usedColors: ["red"] });
      expect(screen.getByRole("button", { name: "done" })).toBeEnabled();
      expect(screen.getByText(/select a colour to overwrite it globally/i)).toBeInTheDocument();
    });

    it("keeps the selected-colour picker available in reassign mode", () => {
      // The selected-colour section is independent of reassigning, so picking a
      // new paint colour stays available.
      renderTools({ reassignMode: true, usedColors: ["red"] });
      expect(
        screen.getByRole("button", { name: /selected color .*click to change/i }),
      ).toBeInTheDocument();
    });

    it("toggles reassign mode", () => {
      const { onToggleReassign } = renderTools({ usedColors: ["red"] });
      fireEvent.click(screen.getByRole("button", { name: "reassign colors" }));
      expect(onToggleReassign).toHaveBeenCalledTimes(1);
    });
  });

  describe("fill modes", () => {
    it.each([
      ["draw row", "row"],
      ["draw column", "column"],
      ["fill area", "bucket"],
    ] as const)("toggles the %s fill", (label, mode) => {
      const { onToggleFill } = renderTools();
      fireEvent.click(screen.getByRole("button", { name: label }));
      expect(onToggleFill).toHaveBeenCalledWith(mode);
    });

    it("returns to freehand drawing", () => {
      const { onFreehand } = renderTools({ fillMode: "bucket" });
      fireEvent.click(screen.getByRole("button", { name: "draw" }));
      expect(onFreehand).toHaveBeenCalledTimes(1);
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

  describe("add colour", () => {
    it("opens the colour picker when the selected colour is clicked", () => {
      const { onPickColor } = renderTools({ color: "black" });
      fireEvent.click(screen.getByRole("button", { name: /selected color black/i }));
      expect(onPickColor).toHaveBeenCalledTimes(1);
    });
  });
});
