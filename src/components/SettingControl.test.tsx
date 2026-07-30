import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type {
  DuoControl,
  PairedControl,
  SliderControl,
  ToggleControl,
} from "../config/controls";
import { makeSettings } from "../test/helpers";
import { SettingControl } from "./SettingControl";

const paired: PairedControl = { kind: "paired", key: "stitches", label: "stitches", min: 15, max: 300 };
const slider: SliderControl = { kind: "slider", key: "size", label: "resize", min: 0, max: 200 };
const toggle: ToggleControl = { kind: "toggle", key: "edgeThickness", label: "enhance edges", on: 1, off: 0 };
const duo: DuoControl = {
  kind: "duo",
  label: "start point",
  min: -100,
  max: 100,
  fields: [
    { key: "offsetX", ariaLabel: "start point x" },
    { key: "offsetY", ariaLabel: "start point y" },
  ],
};

describe("SettingControl", () => {
  it("renders a paired number + slider bound to the setting", () => {
    render(<SettingControl spec={paired} settings={makeSettings({ stitches: 100 })} onChange={() => {}} />);
    expect(screen.getByRole("spinbutton", { name: "stitches" })).toHaveValue(100);
    expect(screen.getByRole("slider", { name: "stitches slider" })).toHaveValue("100");
  });

  it("emits the parsed number when the input changes", () => {
    const onChange = vi.fn();
    render(<SettingControl spec={paired} settings={makeSettings()} onChange={onChange} />);
    fireEvent.change(screen.getByRole("spinbutton", { name: "stitches" }), {
      target: { value: "42" },
    });
    expect(onChange).toHaveBeenCalledWith("stitches", 42);
  });

  it("falls back to 0 when the input is cleared to a non-number", () => {
    const onChange = vi.fn();
    render(<SettingControl spec={paired} settings={makeSettings()} onChange={onChange} />);
    fireEvent.change(screen.getByRole("spinbutton", { name: "stitches" }), {
      target: { value: "" },
    });
    expect(onChange).toHaveBeenCalledWith("stitches", 0);
  });

  it("renders a standalone slider", () => {
    render(<SettingControl spec={slider} settings={makeSettings({ size: 120 })} onChange={() => {}} />);
    const range = screen.getByRole("slider");
    expect(range).toHaveValue("120");
  });

  it("renders a toggle checked when the setting is above its off value", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <SettingControl spec={toggle} settings={makeSettings({ edgeThickness: 0 })} onChange={onChange} />,
    );
    const box = screen.getByRole("checkbox");
    expect(box).not.toBeChecked();

    fireEvent.click(box);
    expect(onChange).toHaveBeenCalledWith("edgeThickness", 1);

    rerender(<SettingControl spec={toggle} settings={makeSettings({ edgeThickness: 1 })} onChange={onChange} />);
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("emits the off value when a checked toggle is cleared", () => {
    const onChange = vi.fn();
    render(<SettingControl spec={toggle} settings={makeSettings({ edgeThickness: 1 })} onChange={onChange} />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalledWith("edgeThickness", 0);
  });

  it("renders a duo as two labelled number inputs", () => {
    render(<SettingControl spec={duo} settings={makeSettings({ offsetX: 3, offsetY: -4 })} onChange={() => {}} />);
    expect(screen.getByRole("spinbutton", { name: "start point x" })).toHaveValue(3);
    expect(screen.getByRole("spinbutton", { name: "start point y" })).toHaveValue(-4);
  });

  it("disables every input when disabled", () => {
    render(<SettingControl spec={paired} settings={makeSettings()} disabled onChange={() => {}} />);
    expect(screen.getByRole("spinbutton", { name: "stitches" })).toBeDisabled();
    expect(screen.getByRole("slider", { name: "stitches slider" })).toBeDisabled();
  });

  it("honours a spec's enabledWhen predicate", () => {
    const gated: SliderControl & { enabledWhen: (s: ReturnType<typeof makeSettings>) => boolean } = {
      kind: "slider",
      key: "edgeSensitivity",
      label: "edge sensitivity",
      min: 0,
      max: 100,
      enabledWhen: (s) => s.edgeThickness > 0,
    };
    const { rerender } = render(
      <SettingControl spec={gated} settings={makeSettings({ edgeThickness: 0 })} onChange={() => {}} />,
    );
    expect(screen.getByRole("slider")).toBeDisabled();
    rerender(<SettingControl spec={gated} settings={makeSettings({ edgeThickness: 1 })} onChange={() => {}} />);
    expect(screen.getByRole("slider")).toBeEnabled();
  });
});
