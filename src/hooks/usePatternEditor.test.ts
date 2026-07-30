import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { strToU8, zipSync } from "fflate";
import { PROJECT_FILENAME, PROJECT_ZIP_FILENAME } from "../config/editor";
import {
  defaultSettings,
  overrideKey,
  type MittenSettings,
} from "../lib/patternGenerator";
import { serializeProject } from "../lib/patternFile";
import { makeSettings } from "../test/helpers";
import { usePatternEditor } from "./usePatternEditor";

// Synchronous Image/FileReader so image.load and image.restore resolve inside
// act() rather than waiting on a real decode that never fires in jsdom.
class MockImage {
  onload: (() => void) | null = null;
  width = 100;
  height = 60;
  #src = "";
  set src(v: string) {
    this.#src = v;
    this.onload?.();
  }
  get src() {
    return this.#src;
  }
}
class MockFileReader {
  onload: (() => void) | null = null;
  result: string | null = null;
  readAsDataURL() {
    this.result = "data:image/png;base64,IMG";
    this.onload?.();
  }
}

beforeEach(() => {
  vi.stubGlobal("Image", MockImage);
  vi.stubGlobal("FileReader", MockFileReader);
});
afterEach(() => vi.unstubAllGlobals());

const imageFile = new File(["x"], "pic.png", { type: "image/png" });

/** A File-like object with the async readers readProjectText needs; this jsdom
 *  build's File implements neither text() nor arrayBuffer(). */
function fileLike(content: string | Uint8Array, name: string, type = ""): File {
  const bytes =
    typeof content === "string" ? new TextEncoder().encode(content) : content;
  return {
    name,
    type,
    text: async () =>
      typeof content === "string" ? content : new TextDecoder().decode(content),
    arrayBuffer: async () =>
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  } as unknown as File;
}

describe("usePatternEditor", () => {
  it("starts with the default settings and a pan tool", () => {
    const { result } = renderHook(() => usePatternEditor());
    expect(result.current.settings).toEqual(defaultSettings);
    expect(result.current.tool.mode).toBe("pan");
  });

  describe("changeSetting", () => {
    it("updates a plain numeric control", () => {
      const { result } = renderHook(() => usePatternEditor());
      act(() => result.current.changeSetting("stitches", 120));
      expect(result.current.settings.stitches).toBe(120);
    });

    it("compensates offsetY when the row count changes", () => {
      const { result } = renderHook(() => usePatternEditor());
      const startRows = result.current.settings.rows;
      const startOffsetY = result.current.settings.offsetY;
      act(() => result.current.changeSetting("rows", startRows + 10));
      // withRowCount nudges offsetY by -(added rows)/2 to keep the image put.
      expect(result.current.settings.offsetY).toBe(startOffsetY - 5);
    });

    it("updates the size and keeps the drawing while rescaling it", () => {
      const { result } = renderHook(() => usePatternEditor());
      act(() =>
        result.current.drawing.paint(
          [{ col: 5, row: 5 }],
          "red",
          result.current.settings,
        ),
      );
      act(() => result.current.changeSetting("size", 150));
      expect(result.current.settings.size).toBe(150);
      expect(result.current.drawing.hasDrawing).toBe(true);
    });

    it("accepts boolean toggles (edge thickness)", () => {
      const { result } = renderHook(() => usePatternEditor());
      act(() => result.current.changeSetting("edgeThickness", 1));
      expect(result.current.settings.edgeThickness).toBe(1);
    });
  });

  describe("loading an image", () => {
    it("resets settings, drawing and colours for a fresh image", () => {
      const { result } = renderHook(() => usePatternEditor());
      // Dirty the state first.
      act(() => result.current.changeSetting("stitches", 200));
      act(() =>
        result.current.drawing.paint(
          [{ col: 1, row: 1 }],
          "red",
          result.current.settings,
        ),
      );

      act(() => result.current.image.load(imageFile));

      expect(result.current.image.image).not.toBeNull();
      // Controls snap back to defaults (only offsetY may differ for top-align).
      expect(result.current.settings.stitches).toBe(defaultSettings.stitches);
      expect(result.current.drawing.hasDrawing).toBe(false);
      expect(result.current.colors.colorRemap.size).toBe(0);
    });
  });

  describe("confirmReassign", () => {
    it("recolours the picked source colour and closes the picker", () => {
      const { result } = renderHook(() => usePatternEditor());
      act(() => result.current.toolActions.toggleMode("draw"));
      act(() => result.current.toolActions.toggleReassign());
      act(() => result.current.toolActions.startReassign("red"));

      act(() => result.current.confirmReassign("blue"));

      expect(result.current.tool.reassignFrom).toBeNull();
      expect(result.current.colors.colorRemap.get("red")).toBe("blue");
    });

    it("is a no-op when no colour is being reassigned", () => {
      const { result } = renderHook(() => usePatternEditor());
      act(() => result.current.confirmReassign("blue"));
      expect(result.current.colors.colorRemap.size).toBe(0);
    });
  });

  describe("importPattern", () => {
    function patternFile(settings: Partial<MittenSettings>, overrides: [string, string][]) {
      const json = serializeProject({
        settings: makeSettings(settings),
        overrides: new Map(overrides),
        colorRemap: new Map([["red", "green"]]),
        color: "purple",
        image: null,
      });
      return fileLike(json, "project.pattern", "application/json");
    }

    it("restores settings, drawing and colours from a project file", async () => {
      const { result } = renderHook(() => usePatternEditor());
      const file = patternFile({ stitches: 77, rows: 90 }, [[overrideKey(2, 3), "red"]]);

      await act(async () => {
        await result.current.importPattern(file);
      });

      expect(result.current.settings.stitches).toBe(77);
      expect(result.current.settings.rows).toBe(90);
      expect(result.current.drawing.overrides.get(overrideKey(2, 3))).toBe("red");
      expect(result.current.colors.color).toBe("purple");
      expect(result.current.colors.colorRemap.get("red")).toBe("green");
    });

    it("rejects a file that is not a Mitten Maker pattern", async () => {
      const { result } = renderHook(() => usePatternEditor());
      const bad = fileLike('{"format":"nope"}', "x.pattern");
      await expect(result.current.importPattern(bad)).rejects.toThrow();
    });

    it("reads the project out of an exported zip", async () => {
      const { result } = renderHook(() => usePatternEditor());
      const json = serializeProject({
        settings: makeSettings({ stitches: 33 }),
        overrides: new Map(),
        colorRemap: new Map(),
        color: "black",
        image: null,
      });
      const zip = zipSync({ [PROJECT_FILENAME]: [strToU8(json), { level: 6 }] });
      const file = fileLike(zip, "project.zip", "application/zip");

      await act(async () => {
        await result.current.importPattern(file);
      });
      expect(result.current.settings.stitches).toBe(33);
    });

    it("rejects a zip with no pattern entry", async () => {
      const { result } = renderHook(() => usePatternEditor());
      const zip = zipSync({ "readme.txt": strToU8("hello") });
      const file = fileLike(zip, "empty.zip", "application/zip");
      await expect(result.current.importPattern(file)).rejects.toThrow(/zip/i);
    });
  });

  describe("exportProject", () => {
    it("triggers a zip download", () => {
      vi.stubGlobal("URL", {
        ...URL,
        createObjectURL: vi.fn(() => "blob:project"),
        revokeObjectURL: vi.fn(),
      });
      const anchor = document.createElement("a");
      const clickSpy = vi.spyOn(anchor, "click").mockImplementation(() => {});
      const realCreate = document.createElement.bind(document);
      vi.spyOn(document, "createElement").mockImplementation((tag: string) =>
        tag === "a" ? anchor : realCreate(tag),
      );

      const { result } = renderHook(() => usePatternEditor());
      act(() => result.current.exportProject());

      expect(clickSpy).toHaveBeenCalledTimes(1);
      expect(anchor.download).toBe(PROJECT_ZIP_FILENAME);
    });
  });

  describe("exportImage", () => {
    it("does not throw when there is no rendered canvas", () => {
      const { result } = renderHook(() => usePatternEditor());
      expect(() => act(() => result.current.exportImage())).not.toThrow();
    });
  });
});
