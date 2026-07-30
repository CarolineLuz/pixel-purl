import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { makeSettings } from "../test/helpers";
import { AppHeader } from "./AppHeader";

function renderHeader(props: Partial<Parameters<typeof AppHeader>[0]> = {}) {
  const onChange = vi.fn();
  const onRevert = vi.fn();
  const onExport = vi.fn();
  const onImport = vi.fn();
  render(
    <AppHeader
      settings={makeSettings()}
      onChange={onChange}
      canRevert={props.canRevert ?? false}
      onRevert={onRevert}
      onExport={onExport}
      onImport={onImport}
    />,
  );
  return { onChange, onRevert, onExport, onImport };
}

describe("AppHeader", () => {
  it("renders the title and the grid controls", () => {
    renderHeader();
    expect(screen.getByRole("heading", { name: /make a color pattern/i })).toBeInTheDocument();
    expect(screen.getByRole("spinbutton", { name: "stitches" })).toBeInTheDocument();
  });

  it("disables revert when there is nothing to revert", () => {
    renderHeader({ canRevert: false });
    expect(screen.getByRole("button", { name: "revert last step" })).toBeDisabled();
  });

  it("enables revert and calls back when clicked", () => {
    const { onRevert } = renderHeader({ canRevert: true });
    const button = screen.getByRole("button", { name: "revert last step" });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(onRevert).toHaveBeenCalledTimes(1);
  });

  it("triggers export", () => {
    const { onExport } = renderHeader();
    fireEvent.click(screen.getByRole("button", { name: /export pattern/i }));
    expect(onExport).toHaveBeenCalledTimes(1);
  });

  it("imports the chosen file and resets the input", () => {
    const { onImport } = renderHeader();
    const input = document.getElementById("import-pattern") as HTMLInputElement;
    const file = new File(["x"], "pattern.zip", { type: "application/zip" });
    fireEvent.change(input, { target: { files: [file] } });
    expect(onImport).toHaveBeenCalledWith(file);
    // Cleared so re-picking the same file still fires a change.
    expect(input.value).toBe("");
  });

  it("does nothing when the import picker is dismissed with no file", () => {
    const { onImport } = renderHeader();
    const input = document.getElementById("import-pattern") as HTMLInputElement;
    fireEvent.change(input, { target: { files: [] } });
    expect(onImport).not.toHaveBeenCalled();
  });
});
