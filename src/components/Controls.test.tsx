import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { makeSettings } from "../test/helpers";
import { Controls } from "./Controls";

describe("Controls", () => {
  it("renders the always-visible grid controls (stitches + rows)", () => {
    render(<Controls settings={makeSettings({ stitches: 100, rows: 50 })} onChange={() => {}} />);
    expect(screen.getByRole("spinbutton", { name: "stitches" })).toHaveValue(100);
    expect(screen.getByRole("spinbutton", { name: "rows" })).toHaveValue(50);
  });

  it("forwards edits to onChange", () => {
    const onChange = vi.fn();
    render(<Controls settings={makeSettings()} onChange={onChange} />);
    fireEvent.change(screen.getByRole("spinbutton", { name: "rows" }), {
      target: { value: "80" },
    });
    expect(onChange).toHaveBeenCalledWith("rows", 80);
  });
});
