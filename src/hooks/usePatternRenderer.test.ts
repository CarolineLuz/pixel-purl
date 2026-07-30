import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { createRef } from "react";
import { EXPORT_FILENAME } from "../config/editor";
import {
  drawPattern,
  overrideKey,
  type ColorRemap,
  type PatternOverrides,
  type SelectionRect,
} from "../lib/patternGenerator";
import type { StitchBlock } from "../types/editor";
import { makeCanvas, makeSettings } from "../test/helpers";
import type { PastePreview } from "./useSelectionState";
import { usePatternRenderer } from "./usePatternRenderer";

// Spy on the actual paint so the tests can assert redraws and their arguments
// without inspecting canvas bytes.
vi.mock("../lib/patternGenerator", async (importActual) => {
  const actual = await importActual<typeof import("../lib/patternGenerator")>();
  return { ...actual, drawPattern: vi.fn() };
});

type Props = Parameters<typeof usePatternRenderer>[0];

function refTo(canvas: HTMLCanvasElement | null) {
  const ref = createRef<HTMLCanvasElement>();
  (ref as { current: HTMLCanvasElement | null }).current = canvas;
  return ref;
}

function setup(overrides: Partial<Props> = {}) {
  const base: Props = {
    canvasRef: refTo(makeCanvas()),
    settings: makeSettings(),
    image: null,
    overrides: new Map(),
    palette: [],
    colorRemap: new Map() as ColorRemap,
    selection: null,
    preview: null,
  };
  return renderHook((props: Props) => usePatternRenderer(props), {
    initialProps: { ...base, ...overrides },
  });
}

/** Marquee argument (7th positional) of the most recent drawPattern call. */
function lastMarquee(): SelectionRect | null {
  const calls = vi.mocked(drawPattern).mock.calls;
  return calls[calls.length - 1][6] ?? null;
}

/** Overrides argument (4th positional) of the most recent drawPattern call. */
function lastOverrides(): PatternOverrides {
  const calls = vi.mocked(drawPattern).mock.calls;
  return calls[calls.length - 1][3] as PatternOverrides;
}

beforeEach(() => vi.mocked(drawPattern).mockClear());

describe("usePatternRenderer", () => {
  it("draws the pattern on mount", () => {
    setup();
    expect(drawPattern).toHaveBeenCalledTimes(1);
  });

  it("redraws when the settings change", () => {
    const { rerender } = setup();
    vi.mocked(drawPattern).mockClear();
    rerender(propsWith({ settings: makeSettings({ stitches: 42 }) }));
    expect(drawPattern).toHaveBeenCalled();
  });

  it("passes the marquee only when a selection exists", () => {
    const selection: SelectionRect = { c0: 0, r0: 0, c1: 2, r1: 2 };
    setup({ selection });
    expect(lastMarquee()).toEqual(selection);
  });

  it("overlays the paste preview and outlines it instead of the marquee", () => {
    const block: StitchBlock = {
      w: 2,
      h: 1,
      cells: new Map([[overrideKey(0, 0), "red"]]),
    };
    const preview: PastePreview = { block, origin: { col: 3, row: 4 } };
    setup({ preview, overrides: new Map() });
    // The preview block is merged into the drawn overrides…
    expect(lastOverrides().get(overrideKey(3, 4))).toBe("red");
    // …and the outline tracks the block, not the (null) selection.
    expect(lastMarquee()).toEqual({ c0: 3, r0: 4, c1: 4, r1: 4 });
  });

  it("exports a PNG via a synthesized download link", () => {
    const anchor = document.createElement("a");
    const clickSpy = vi.spyOn(anchor, "click").mockImplementation(() => {});
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) =>
      tag === "a" ? anchor : realCreate(tag),
    );

    const { result } = setup();
    act(() => result.current.exportPng());

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(anchor.download).toBe(EXPORT_FILENAME);
    expect(anchor.href).toContain("data:image/png;base64,TEST");
  });

  it("pngDataUrl returns the canvas data URL", () => {
    const { result } = setup();
    expect(result.current.pngDataUrl()).toBe("data:image/png;base64,TEST");
  });

  it("pngDataUrl returns null when there is no canvas", () => {
    const { result } = setup({ canvasRef: refTo(null) });
    expect(result.current.pngDataUrl()).toBeNull();
  });

  it("excludes the marquee from the exported image, then restores it", () => {
    const selection: SelectionRect = { c0: 1, r0: 1, c1: 2, r1: 2 };
    const { result } = setup({ selection });
    vi.mocked(drawPattern).mockClear();

    act(() => {
      result.current.pngDataUrl();
    });

    const calls = vi.mocked(drawPattern).mock.calls;
    // Two extra draws: one without the marquee (for the snapshot), one to restore.
    expect(calls[0][6]).toBeNull();
    expect(calls[1][6]).toEqual(selection);
  });
});

// Helper so the settings-change rerender keeps a full, valid props object.
function propsWith(overrides: Partial<Props>): Props {
  return {
    canvasRef: refTo(makeCanvas()),
    settings: makeSettings(),
    image: null,
    overrides: new Map(),
    palette: [],
    colorRemap: new Map(),
    selection: null,
    preview: null,
    ...overrides,
  };
}
