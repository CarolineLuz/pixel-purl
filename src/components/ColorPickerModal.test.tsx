import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ColorPickerModal } from "./ColorPickerModal";

describe("ColorPickerModal", () => {
  describe("adding a new colour (no fromColor)", () => {
    it("shows the select-colour title and confirm label", () => {
      render(<ColorPickerModal onCancel={() => {}} onConfirm={() => {}} />);
      expect(screen.getByRole("dialog", { name: "select colour" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Select colour" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Select" })).toBeInTheDocument();
    });

    it("confirms with the chosen preset colour", () => {
      const onConfirm = vi.fn();
      render(<ColorPickerModal onCancel={() => {}} onConfirm={onConfirm} />);
      fireEvent.click(screen.getByRole("button", { name: "red" }));
      fireEvent.click(screen.getByRole("button", { name: "Select" }));
      expect(onConfirm).toHaveBeenCalledWith("red");
    });

    it("confirms with a colour chosen from the native picker", () => {
      const onConfirm = vi.fn();
      const { container } = render(<ColorPickerModal onCancel={() => {}} onConfirm={onConfirm} />);
      const colorInput = container.querySelector('input[type="color"]') as HTMLInputElement;
      fireEvent.change(colorInput, { target: { value: "#123456" } });
      fireEvent.click(screen.getByRole("button", { name: "Select" }));
      expect(onConfirm).toHaveBeenCalledWith("#123456");
    });

    it("does not render a 'from' swatch", () => {
      render(<ColorPickerModal onCancel={() => {}} onConfirm={() => {}} />);
      expect(screen.queryByText("from")).not.toBeInTheDocument();
    });
  });

  describe("reassigning an existing colour (fromColor set)", () => {
    it("shows the reassign title, the from/to swatches and confirm label", () => {
      render(<ColorPickerModal fromColor="red" onCancel={() => {}} onConfirm={() => {}} />);
      expect(screen.getByRole("dialog", { name: "reassign colour" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Reassign colour" })).toBeInTheDocument();
      expect(screen.getByText("from")).toBeInTheDocument();
      expect(screen.getByText("to")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Reassign" })).toBeInTheDocument();
    });

    it("confirms the reassignment with the newly picked colour", () => {
      const onConfirm = vi.fn();
      render(<ColorPickerModal fromColor="red" onCancel={() => {}} onConfirm={onConfirm} />);
      fireEvent.click(screen.getByRole("button", { name: "blue" }));
      fireEvent.click(screen.getByRole("button", { name: "Reassign" }));
      expect(onConfirm).toHaveBeenCalledWith("blue");
    });
  });

  it("cancels via the × button, the backdrop, and leaves the card clickable", () => {
    const onCancel = vi.fn();
    render(<ColorPickerModal onCancel={onCancel} onConfirm={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: "cancel" }));
    fireEvent.click(screen.getByRole("dialog"));
    expect(onCancel).toHaveBeenCalledTimes(2);

    // Clicking inside the card must not bubble up to a cancel.
    fireEvent.click(screen.getByRole("heading", { name: "Select colour" }));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });
});
