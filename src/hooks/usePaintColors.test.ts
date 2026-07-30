import { describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import {
  INK_COLORS,
  overrideKey,
  rgbCss,
  type ColorRemap,
  type PatternOverrides,
  type RGB,
} from "../lib/patternGenerator";
import { makeSettings } from "../test/helpers";
import { usePaintColors } from "./usePaintColors";

const palette: RGB[] = [
  [0, 0, 0],
  [255, 255, 255],
];

function setup(
  input: {
    palette?: RGB[];
    overrides?: PatternOverrides;
    hasImage?: boolean;
    size?: number;
  } = {},
) {
  const settings = makeSettings({ stitches: 10, rows: 10, size: input.size ?? 100 });
  return renderHook((props: Parameters<typeof usePaintColors>[0]) => usePaintColors(props), {
    initialProps: {
      palette: input.palette ?? [],
      overrides: input.overrides ?? new Map(),
      settings,
      hasImage: input.hasImage ?? false,
    },
  });
}

describe("usePaintColors", () => {
  it("defaults the active colour to black", () => {
    const { result } = setup();
    expect(result.current.color).toBe(INK_COLORS.black);
  });

  it("changes the active colour", () => {
    const { result } = setup();
    act(() => result.current.setColor("red"));
    expect(result.current.color).toBe("red");
  });

  it("lists the image palette among used colours only when the image is visible", () => {
    const hidden = setup({ palette, hasImage: true, size: 0 });
    expect(hidden.result.current.usedColors).toEqual([]);

    const shown = setup({ palette, hasImage: true, size: 100 });
    expect(shown.result.current.usedColors).toEqual(
      expect.arrayContaining([rgbCss([0, 0, 0]), rgbCss([255, 255, 255])]),
    );
  });

  it("includes on-grid overrides and excludes off-grid ones", () => {
    const overrides: PatternOverrides = new Map([
      [overrideKey(1, 1), "red"],
      [overrideKey(99, 99), "green"], // off-grid (grid is 10×10)
    ]);
    const { result } = setup({ overrides });
    expect(result.current.usedColors).toContain("red");
    expect(result.current.usedColors).not.toContain("green");
  });

  it("deduplicates colours shared by the palette and overrides", () => {
    const overrides: PatternOverrides = new Map([[overrideKey(0, 0), rgbCss([0, 0, 0])]]);
    const { result } = setup({ palette, overrides, hasImage: true });
    const black = rgbCss([0, 0, 0]);
    expect(result.current.usedColors.filter((c) => c === black)).toHaveLength(1);
  });

  it("reassign recolours every stitch showing the source colour", () => {
    const overrides: PatternOverrides = new Map([[overrideKey(0, 0), "red"]]);
    const { result } = setup({ overrides });
    act(() => result.current.reassign("red", "blue"));
    // The override colour is remapped, so the effective used colour becomes blue.
    expect(result.current.colorRemap.get("red")).toBe("blue");
    expect(result.current.usedColors).toContain("blue");
    expect(result.current.usedColors).not.toContain("red");
  });

  it("ignores a reassignment to the same colour", () => {
    const { result } = setup();
    act(() => result.current.reassign("red", "red"));
    expect(result.current.colorRemap.size).toBe(0);
  });

  it("chains reassignments so an already-remapped colour moves again", () => {
    const overrides: PatternOverrides = new Map([[overrideKey(0, 0), "red"]]);
    const { result } = setup({ overrides });
    act(() => result.current.reassign("red", "blue"));
    act(() => result.current.reassign("blue", "green"));
    // The original red now resolves through to green.
    expect(result.current.colorRemap.get("red")).toBe("green");
    expect(result.current.usedColors).toContain("green");
  });

  it("reset clears every reassignment", () => {
    const overrides: PatternOverrides = new Map([[overrideKey(0, 0), "red"]]);
    const { result } = setup({ overrides });
    act(() => result.current.reassign("red", "blue"));
    act(() => result.current.reset());
    expect(result.current.colorRemap.size).toBe(0);
  });

  it("load restores the active colour and remap from an import", () => {
    const { result } = setup();
    const remap: ColorRemap = new Map([["red", "blue"]]);
    act(() => result.current.load(remap, "green"));
    expect(result.current.color).toBe("green");
    expect(result.current.colorRemap.get("red")).toBe("blue");
  });
});
