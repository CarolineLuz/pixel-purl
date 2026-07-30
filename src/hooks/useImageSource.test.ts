import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { RGB } from "../lib/patternGenerator";
import { extractPalette } from "../lib/patternGenerator";
import { useImageSource } from "./useImageSource";

// Replace the pixel-scanning palette extractor with a deterministic stub so the
// tests can assert when/how it is called without a real canvas raster.
vi.mock("../lib/patternGenerator", async (importActual) => {
  const actual = await importActual<typeof import("../lib/patternGenerator")>();
  return {
    ...actual,
    extractPalette: vi.fn(
      (_img: HTMLImageElement, n: number): RGB[] =>
        Array.from({ length: n }, (_, i) => [i, i, i] as RGB),
    ),
  };
});

// Image + FileReader stubs that resolve synchronously, so a load completes
// within a single act() without real decoding.
class MockImage {
  onload: (() => void) | null = null;
  width = 120;
  height = 80;
  #src = "";
  set src(value: string) {
    this.#src = value;
    this.onload?.();
  }
  get src() {
    return this.#src;
  }
}

class MockFileReader {
  onload: (() => void) | null = null;
  result: string | null = null;
  readAsDataURL(_file: File) {
    this.result = "data:image/png;base64,LOADED";
    this.onload?.();
  }
}

beforeEach(() => {
  vi.stubGlobal("Image", MockImage);
  vi.stubGlobal("FileReader", MockFileReader);
  vi.mocked(extractPalette).mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function setup(numColors = 3) {
  const onLoaded = { current: vi.fn() };
  const view = renderHook(({ numColors }: { numColors: number }) => useImageSource(numColors, onLoaded), {
    initialProps: { numColors },
  });
  return { ...view, onLoaded };
}

const file = new File(["x"], "cat.png", { type: "image/png" });

describe("useImageSource", () => {
  it("starts with no image, data URL or palette", () => {
    const { result } = setup();
    expect(result.current.image).toBeNull();
    expect(result.current.dataUrl).toBeNull();
    expect(result.current.palette).toEqual([]);
  });

  it("loads a picked file, exposing the image, data URL and palette", () => {
    const { result } = setup(4);
    act(() => result.current.load(file));
    expect(result.current.image).not.toBeNull();
    expect(result.current.dataUrl).toBe("data:image/png;base64,LOADED");
    expect(result.current.palette).toHaveLength(4);
  });

  it("fires the onLoaded callback for a freshly picked image", () => {
    const { result, onLoaded } = setup();
    act(() => result.current.load(file));
    expect(onLoaded.current).toHaveBeenCalledTimes(1);
    expect(onLoaded.current.mock.calls[0][0]).toBeInstanceOf(MockImage);
  });

  it("clears the image when load is called with null", () => {
    const { result } = setup();
    act(() => result.current.load(file));
    act(() => result.current.load(null));
    expect(result.current.image).toBeNull();
    expect(result.current.dataUrl).toBeNull();
    expect(result.current.palette).toEqual([]);
  });

  it("restore rebuilds the image without running the new-image reset", () => {
    const { result, onLoaded } = setup();
    act(() => result.current.restore("data:image/png;base64,SAVED"));
    expect(result.current.image).not.toBeNull();
    expect(result.current.dataUrl).toBe("data:image/png;base64,SAVED");
    // Importing must not trigger onLoaded (which would reset the restored state).
    expect(onLoaded.current).not.toHaveBeenCalled();
  });

  it("restore(null) clears the image", () => {
    const { result } = setup();
    act(() => result.current.restore("data:image/png;base64,SAVED"));
    act(() => result.current.restore(null));
    expect(result.current.image).toBeNull();
  });

  it("recomputes the palette when the colour count changes", () => {
    const { result, rerender } = setup(3);
    act(() => result.current.load(file));
    expect(result.current.palette).toHaveLength(3);

    rerender({ numColors: 6 });
    expect(result.current.palette).toHaveLength(6);
    expect(vi.mocked(extractPalette)).toHaveBeenLastCalledWith(expect.anything(), 6);
  });

  it("does not extract a palette while there is no image", () => {
    setup(3);
    expect(vi.mocked(extractPalette)).not.toHaveBeenCalled();
  });
});
