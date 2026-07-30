import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { makeSettings } from "../test/helpers";
import { ImageToolbar } from "./ImageToolbar";

function renderToolbar(props: Partial<Parameters<typeof ImageToolbar>[0]> = {}) {
  const onToggleOpen = vi.fn();
  const onChange = vi.fn();
  const onImageChange = vi.fn();
  render(
    <ImageToolbar
      settings={makeSettings()}
      hasImage={props.hasImage ?? false}
      open={props.open ?? false}
      onToggleOpen={onToggleOpen}
      onChange={onChange}
      onImageChange={onImageChange}
    />,
  );
  return { onToggleOpen, onChange, onImageChange };
}

describe("ImageToolbar", () => {
  it("shows only the collapsed toggle when closed", () => {
    renderToolbar({ open: false });
    expect(screen.getByRole("button", { name: "grab image" })).toBeInTheDocument();
    expect(screen.queryByText("image for pattern")).not.toBeInTheDocument();
  });

  it("expands the toggle and reveals the controls when open", () => {
    renderToolbar({ open: true });
    expect(screen.getByRole("button", { name: "hide image tools" })).toBeInTheDocument();
    expect(screen.getByText("image for pattern")).toBeInTheDocument();
    // A representative image control renders.
    expect(screen.getByRole("slider", { name: "resize small/large" })).toBeInTheDocument();
  });

  it("toggles open state", () => {
    const { onToggleOpen } = renderToolbar({ open: false });
    fireEvent.click(screen.getByRole("button", { name: "grab image" }));
    expect(onToggleOpen).toHaveBeenCalledTimes(1);
  });

  it("disables the image controls until an image is loaded", () => {
    renderToolbar({ open: true, hasImage: false });
    expect(screen.getByRole("slider", { name: "resize small/large" })).toBeDisabled();
  });

  it("enables the image controls once an image is loaded", () => {
    renderToolbar({ open: true, hasImage: true });
    expect(screen.getByRole("slider", { name: "resize small/large" })).toBeEnabled();
  });

  it("forwards a settings change from a control", () => {
    const { onChange } = renderToolbar({ open: true, hasImage: true });
    fireEvent.change(screen.getByRole("slider", { name: "resize small/large" }), {
      target: { value: "150" },
    });
    expect(onChange).toHaveBeenCalledWith("size", 150);
  });
});
