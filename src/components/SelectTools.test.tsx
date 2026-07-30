import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { SelectTools } from "./SelectTools";

function renderTools(props: Partial<Parameters<typeof SelectTools>[0]> = {}) {
  const handlers = {
    onToggleMode: vi.fn(),
    onCopy: vi.fn(),
    onPaste: vi.fn(),
    onDeselect: vi.fn(),
  };
  render(
    <SelectTools
      selectMode={props.selectMode ?? true}
      hasSelection={props.hasSelection ?? false}
      hasClipboard={props.hasClipboard ?? false}
      pasting={props.pasting ?? false}
      {...handlers}
    />,
  );
  return handlers;
}

describe("SelectTools", () => {
  it("shows only the collapsed toggle when not in select mode", () => {
    renderTools({ selectMode: false });
    expect(screen.getByRole("button", { name: "select" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "copy" })).not.toBeInTheDocument();
  });

  it("reveals the actions when in select mode", () => {
    renderTools({ selectMode: true });
    expect(screen.getByRole("button", { name: "exit select mode" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "copy" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "paste" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "deselect" })).toBeInTheDocument();
  });

  it("disables copy until something is selected", () => {
    renderTools({ hasSelection: false });
    expect(screen.getByRole("button", { name: "copy" })).toBeDisabled();
  });

  it("enables and fires copy when a selection exists", () => {
    const { onCopy } = renderTools({ hasSelection: true });
    const copy = screen.getByRole("button", { name: "copy" });
    expect(copy).toBeEnabled();
    fireEvent.click(copy);
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it("disables paste until something is on the clipboard", () => {
    renderTools({ hasClipboard: false });
    expect(screen.getByRole("button", { name: "paste" })).toBeDisabled();
  });

  it("shows the placing label and a hint while a paste is armed", () => {
    renderTools({ hasClipboard: true, pasting: true });
    const paste = screen.getByRole("button", { name: /placing/i });
    expect(paste).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/click a stitch on the grid/i)).toBeInTheDocument();
  });

  it("fires paste toggle", () => {
    const { onPaste } = renderTools({ hasClipboard: true });
    fireEvent.click(screen.getByRole("button", { name: "paste" }));
    expect(onPaste).toHaveBeenCalledTimes(1);
  });

  it("disables deselect when there is nothing to clear", () => {
    renderTools({ hasSelection: false, pasting: false });
    expect(screen.getByRole("button", { name: "deselect" })).toBeDisabled();
  });

  it("enables deselect while a paste is armed even with no selection", () => {
    renderTools({ hasSelection: false, pasting: true, hasClipboard: true });
    expect(screen.getByRole("button", { name: "deselect" })).toBeEnabled();
  });

  it("enables and fires deselect when a selection exists", () => {
    const { onDeselect } = renderTools({ hasSelection: true });
    const deselect = screen.getByRole("button", { name: "deselect" });
    expect(deselect).toBeEnabled();
    fireEvent.click(deselect);
    expect(onDeselect).toHaveBeenCalledTimes(1);
  });

  it("toggles select mode from the collapsed tab", () => {
    const { onToggleMode } = renderTools({ selectMode: false });
    fireEvent.click(screen.getByRole("button", { name: "select" }));
    expect(onToggleMode).toHaveBeenCalledTimes(1);
  });
});
