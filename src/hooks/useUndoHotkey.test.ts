import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useUndoHotkey } from "./useUndoHotkey";

/** Dispatch a keydown on `target` (defaults to document.body) and return whether
 *  the default was prevented. */
function press(
  key: string,
  mods: Partial<Pick<KeyboardEvent, "metaKey" | "ctrlKey" | "shiftKey" | "altKey">> = {},
  target: EventTarget = document.body,
): boolean {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...mods,
  });
  target.dispatchEvent(event);
  return event.defaultPrevented;
}

describe("useUndoHotkey", () => {
  it("calls revert on Ctrl+Z and prevents the default", () => {
    const revert = vi.fn();
    renderHook(() => useUndoHotkey(revert));
    const prevented = press("z", { ctrlKey: true });
    expect(revert).toHaveBeenCalledTimes(1);
    expect(prevented).toBe(true);
  });

  it("calls revert on Meta+Z (macOS)", () => {
    const revert = vi.fn();
    renderHook(() => useUndoHotkey(revert));
    press("z", { metaKey: true });
    expect(revert).toHaveBeenCalledTimes(1);
  });

  it("is case-insensitive on the key", () => {
    const revert = vi.fn();
    renderHook(() => useUndoHotkey(revert));
    press("Z", { metaKey: true });
    expect(revert).toHaveBeenCalledTimes(1);
  });

  it("ignores redo (Shift) and Alt combinations", () => {
    const revert = vi.fn();
    renderHook(() => useUndoHotkey(revert));
    press("z", { metaKey: true, shiftKey: true });
    press("z", { metaKey: true, altKey: true });
    expect(revert).not.toHaveBeenCalled();
  });

  it("ignores a plain Z with no modifier", () => {
    const revert = vi.fn();
    renderHook(() => useUndoHotkey(revert));
    press("z");
    expect(revert).not.toHaveBeenCalled();
  });

  it.each(["input", "textarea", "select"])(
    "does not fire while typing in a %s",
    (tag) => {
      const revert = vi.fn();
      renderHook(() => useUndoHotkey(revert));
      const el = document.createElement(tag);
      document.body.appendChild(el);
      press("z", { metaKey: true }, el);
      expect(revert).not.toHaveBeenCalled();
      el.remove();
    },
  );

  it("does not fire from a contentEditable element", () => {
    const revert = vi.fn();
    renderHook(() => useUndoHotkey(revert));
    const el = document.createElement("div");
    el.contentEditable = "true";
    // jsdom doesn't derive isContentEditable from the attribute; force it.
    Object.defineProperty(el, "isContentEditable", { value: true });
    document.body.appendChild(el);
    press("z", { metaKey: true }, el);
    expect(revert).not.toHaveBeenCalled();
    el.remove();
  });

  it("removes its listener on unmount", () => {
    const revert = vi.fn();
    const { unmount } = renderHook(() => useUndoHotkey(revert));
    unmount();
    press("z", { metaKey: true });
    expect(revert).not.toHaveBeenCalled();
  });

  it("uses the latest revert callback after a re-render", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = renderHook(({ cb }) => useUndoHotkey(cb), {
      initialProps: { cb: first },
    });
    rerender({ cb: second });
    press("z", { metaKey: true });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });
});
