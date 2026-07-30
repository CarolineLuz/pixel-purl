import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { ExportModal } from "./ExportModal";

function setup() {
  const onCancel = vi.fn();
  const onImageOnly = vi.fn();
  const onFullProject = vi.fn();
  render(
    <ExportModal onCancel={onCancel} onImageOnly={onImageOnly} onFullProject={onFullProject} />,
  );
  return { onCancel, onImageOnly, onFullProject };
}

describe("ExportModal", () => {
  it("renders as a labelled modal dialog with both options", () => {
    setup();
    const dialog = screen.getByRole("dialog", { name: /export pattern/i });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("button", { name: /image only/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /full project/i })).toBeInTheDocument();
  });

  it("chooses the image-only export", () => {
    const { onImageOnly } = setup();
    fireEvent.click(screen.getByRole("button", { name: /image only/i }));
    expect(onImageOnly).toHaveBeenCalledTimes(1);
  });

  it("chooses the full-project export", () => {
    const { onFullProject } = setup();
    fireEvent.click(screen.getByRole("button", { name: /full project/i }));
    expect(onFullProject).toHaveBeenCalledTimes(1);
  });

  it("cancels via the × button", () => {
    const { onCancel } = setup();
    fireEvent.click(screen.getByRole("button", { name: "cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("cancels when the backdrop is clicked", () => {
    const { onCancel } = setup();
    fireEvent.click(screen.getByRole("dialog"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("does not cancel when the card itself is clicked", () => {
    const { onCancel } = setup();
    fireEvent.click(screen.getByRole("heading", { name: /export pattern/i }));
    expect(onCancel).not.toHaveBeenCalled();
  });
});
