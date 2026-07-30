import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useToolMode } from "./useToolMode";

describe("useToolMode", () => {
  it("starts panning with every sub-mode idle", () => {
    const { result } = renderHook(() => useToolMode());
    const [state] = result.current;
    expect(state).toEqual({
      mode: "pan",
      fillMode: "off",
      reassignMode: false,
      reassignFrom: null,
      colorPickerOpen: false,
    });
  });

  it("switches to a tool and back to pan when its toggle is pressed again", () => {
    const { result } = renderHook(() => useToolMode());

    act(() => result.current[1].toggleMode("draw"));
    expect(result.current[0].mode).toBe("draw");

    act(() => result.current[1].toggleMode("draw"));
    expect(result.current[0].mode).toBe("pan");
  });

  it("switches directly between two tools", () => {
    const { result } = renderHook(() => useToolMode());
    act(() => result.current[1].toggleMode("draw"));
    act(() => result.current[1].toggleMode("select"));
    expect(result.current[0].mode).toBe("select");
  });

  it("resets every sub-mode and dialog when the tool changes", () => {
    const { result } = renderHook(() => useToolMode());
    const [, actions] = result.current;

    act(() => actions.toggleMode("draw"));
    act(() => actions.toggleFill("bucket"));
    act(() => actions.startReassign("black"));
    act(() => actions.openColorPicker());
    // Leaving draw mode wipes the fill / reassign / picker state.
    act(() => actions.toggleMode("select"));

    expect(result.current[0]).toEqual({
      mode: "select",
      fillMode: "off",
      reassignMode: false,
      reassignFrom: null,
      colorPickerOpen: false,
    });
  });

  it("toggles reassign mode and clears the picked colour when turned off", () => {
    const { result } = renderHook(() => useToolMode());
    const [, actions] = result.current;

    act(() => actions.toggleReassign());
    expect(result.current[0].reassignMode).toBe(true);

    act(() => actions.startReassign("red"));
    expect(result.current[0].reassignFrom).toBe("red");

    act(() => actions.toggleReassign());
    expect(result.current[0].reassignMode).toBe(false);
    expect(result.current[0].reassignFrom).toBeNull();
  });

  it("makes reassign and fill mutually exclusive", () => {
    const { result } = renderHook(() => useToolMode());
    const [, actions] = result.current;

    act(() => actions.toggleFill("row"));
    expect(result.current[0].fillMode).toBe("row");

    // Turning on reassign switches fill off.
    act(() => actions.toggleReassign());
    expect(result.current[0].reassignMode).toBe(true);
    expect(result.current[0].fillMode).toBe("off");

    // Turning on a fill switches reassign off.
    act(() => actions.toggleFill("column"));
    expect(result.current[0].fillMode).toBe("column");
    expect(result.current[0].reassignMode).toBe(false);
  });

  it("toggles a fill mode off when the same fill is chosen twice", () => {
    const { result } = renderHook(() => useToolMode());
    const [, actions] = result.current;

    act(() => actions.toggleFill("bucket"));
    expect(result.current[0].fillMode).toBe("bucket");
    act(() => actions.toggleFill("bucket"));
    expect(result.current[0].fillMode).toBe("off");
  });

  it("switches between fill modes without turning off", () => {
    const { result } = renderHook(() => useToolMode());
    const [, actions] = result.current;
    act(() => actions.toggleFill("row"));
    act(() => actions.toggleFill("column"));
    expect(result.current[0].fillMode).toBe("column");
  });

  it("cancels an in-progress reassignment without leaving reassign mode", () => {
    const { result } = renderHook(() => useToolMode());
    const [, actions] = result.current;
    act(() => actions.toggleReassign());
    act(() => actions.startReassign("green"));
    act(() => actions.cancelReassign());
    expect(result.current[0].reassignFrom).toBeNull();
    expect(result.current[0].reassignMode).toBe(true);
  });

  it("opens and closes the colour picker", () => {
    const { result } = renderHook(() => useToolMode());
    const [, actions] = result.current;
    act(() => actions.openColorPicker());
    expect(result.current[0].colorPickerOpen).toBe(true);
    act(() => actions.closeColorPicker());
    expect(result.current[0].colorPickerOpen).toBe(false);
  });

  it("keeps a stable actions object across renders", () => {
    const { result, rerender } = renderHook(() => useToolMode());
    const first = result.current[1];
    act(() => result.current[1].toggleMode("draw"));
    rerender();
    expect(result.current[1]).toBe(first);
  });
});
