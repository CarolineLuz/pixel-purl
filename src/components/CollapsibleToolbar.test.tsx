import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TOOLBAR_LAYOUTS } from "../config/toolbars";
import { CollapsibleToolbar } from "./CollapsibleToolbar";

function renderShell(props: Partial<Parameters<typeof CollapsibleToolbar>[0]> = {}) {
  const onToggle = vi.fn();
  render(
    <CollapsibleToolbar
      open={props.open ?? false}
      onToggle={onToggle}
      as={props.as}
      label={props.label ?? "test tools"}
      layout={props.layout ?? TOOLBAR_LAYOUTS.draw}
      collapsedIcon="draw"
      collapsedLabel="open"
      expandedLabel="close"
    >
      <span>child content</span>
    </CollapsibleToolbar>,
  );
  return { onToggle };
}

describe("CollapsibleToolbar", () => {
  it("hides its children while collapsed", () => {
    renderShell({ open: false });
    expect(screen.getByRole("button", { name: "open" })).toBeInTheDocument();
    expect(screen.queryByText("child content")).not.toBeInTheDocument();
  });

  it("reveals its children once expanded", () => {
    renderShell({ open: true });
    expect(screen.getByRole("button", { name: "close" })).toBeInTheDocument();
    expect(screen.getByText("child content")).toBeInTheDocument();
  });

  it("fires onToggle when the tab is clicked", () => {
    const { onToggle } = renderShell({ open: false });
    fireEvent.click(screen.getByRole("button", { name: "open" }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("renders as a form that swallows submits when asked", () => {
    renderShell({ as: "form", open: true });
    const form = screen.getByRole("form", { name: "test tools" });
    const submit = vi.fn();
    form.addEventListener("submit", submit);
    fireEvent.submit(form);
    // The default-prevented submit still bubbles; assert the handler ran and
    // the event was cancelled rather than triggering a navigation.
    expect(submit).toHaveBeenCalledTimes(1);
    expect(submit.mock.calls[0][0].defaultPrevented).toBe(true);
  });
});
