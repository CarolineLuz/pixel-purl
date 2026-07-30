// A lightweight 2D-canvas mock for jsdom, which ships no canvas implementation.
//
// The app never needs real rasterisation in tests — it needs `getContext("2d")`
// to return something whose drawing calls are harmless no-ops and whose
// `getImageData` returns plausible bytes. Two things are modelled with real
// behaviour because the code under test depends on them:
//   • `cssToRgba` paints one pixel and reads it back, so the mock resolves CSS
//     colour strings to bytes (named colours, #hex and rgb()/rgba()).
//   • sampling helpers read cell colours out of `getImageData`, so tests can
//     install an explicit pixel provider per canvas via {@link setCanvasPixels}.

import { vi } from "vitest";
import type { RGBA } from "../types/editor";

/** A handful of the CSS named colours the app actually stamps (INK_COLORS). */
const NAMED: Record<string, RGBA> = {
  transparent: [0, 0, 0, 0],
  black: [0, 0, 0, 255],
  white: [255, 255, 255, 255],
  grey: [128, 128, 128, 255],
  gray: [128, 128, 128, 255],
  red: [255, 0, 0, 255],
  crimson: [220, 20, 60, 255],
  coral: [255, 127, 80, 255],
  orange: [255, 165, 0, 255],
  gold: [255, 215, 0, 255],
  yellow: [255, 255, 0, 255],
  olive: [128, 128, 0, 255],
  green: [0, 128, 0, 255],
  limegreen: [50, 205, 50, 255],
  teal: [0, 128, 128, 255],
  darkcyan: [0, 139, 139, 255],
  aqua: [0, 255, 255, 255],
  skyblue: [135, 206, 235, 255],
  royalblue: [65, 105, 225, 255],
  blue: [0, 0, 255, 255],
  navy: [0, 0, 128, 255],
  indigo: [75, 0, 130, 255],
  purple: [128, 0, 128, 255],
  violet: [238, 130, 238, 255],
  magenta: [255, 0, 255, 255],
  hotpink: [255, 105, 180, 255],
  pink: [255, 192, 203, 255],
  saddlebrown: [139, 69, 19, 255],
  tan: [210, 180, 140, 255],
};

/** Resolve a CSS colour string to `[r, g, b, a]` bytes, covering the forms the
 *  app produces. Unknown strings fall back to opaque black. */
export function parseCssColor(css: string): RGBA {
  const s = css.trim().toLowerCase();
  if (s in NAMED) return NAMED[s];

  if (s.startsWith("#")) {
    const hex = s.slice(1);
    const full =
      hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex;
    return [
      parseInt(full.slice(0, 2), 16),
      parseInt(full.slice(2, 4), 16),
      parseInt(full.slice(4, 6), 16),
      255,
    ];
  }

  const m = s.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const parts = m[1].split(",").map((p) => parseFloat(p.trim()));
    const [r, g, b, a = 1] = parts;
    return [Math.round(r), Math.round(g), Math.round(b), Math.round(a * 255)];
  }

  return [0, 0, 0, 255];
}

/** Sample a rectangle of a canvas as `[r,g,b,a]` bytes. */
type PixelProvider = (sx: number, sy: number, sw: number, sh: number) => Uint8ClampedArray;

const pixelProviders = new WeakMap<HTMLCanvasElement, PixelProvider>();

/** Install an explicit pixel source for a canvas, so sampling helpers read known
 *  bytes. `at(col, row)` returns the colour of the cell whose centre sits in the
 *  sampled region; convenient for building flood-fill / capture fixtures. */
export function setCanvasPixels(
  canvas: HTMLCanvasElement,
  at: (x: number, y: number) => RGBA,
): void {
  pixelProviders.set(canvas, (sx, sy, sw, sh) => {
    const data = new Uint8ClampedArray(sw * sh * 4);
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const [r, g, b, a] = at(sx + x, sy + y);
        const i = (y * sw + x) * 4;
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = a;
      }
    }
    return data;
  });
}

function makeContext(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  // The last colour a fillRect painted, so a 1×1 paint-and-read (cssToRgba)
  // returns the right bytes without a pixel provider.
  let lastFill: RGBA = [0, 0, 0, 0];
  const noop = () => {};

  const ctx = {
    canvas,
    fillStyle: "#000000",
    strokeStyle: "#000000",
    lineWidth: 1,
    font: "",
    textAlign: "start",
    textBaseline: "alphabetic",
    save: noop,
    restore: noop,
    beginPath: noop,
    closePath: noop,
    rect: noop,
    clip: noop,
    translate: noop,
    rotate: noop,
    scale: noop,
    drawImage: noop,
    fillRect: () => {
      lastFill = parseCssColor(String(ctx.fillStyle));
    },
    strokeRect: noop,
    clearRect: noop,
    moveTo: noop,
    lineTo: noop,
    stroke: noop,
    fill: noop,
    setLineDash: noop,
    fillText: noop,
    getImageData: (sx: number, sy: number, sw: number, sh: number) => {
      const provider = pixelProviders.get(canvas);
      if (provider) return { data: provider(sx, sy, sw, sh), width: sw, height: sh };
      const data = new Uint8ClampedArray(sw * sh * 4);
      for (let i = 0; i < data.length; i += 4) {
        data[i] = lastFill[0];
        data[i + 1] = lastFill[1];
        data[i + 2] = lastFill[2];
        data[i + 3] = lastFill[3];
      }
      return { data, width: sw, height: sh };
    },
    putImageData: noop,
  };
  return ctx as unknown as CanvasRenderingContext2D;
}

/** Replace the (unimplemented) jsdom canvas APIs with the mock. Called once from
 *  the global test setup. */
export function installCanvasMock(): void {
  const contexts = new WeakMap<HTMLCanvasElement, CanvasRenderingContext2D>();
  HTMLCanvasElement.prototype.getContext = vi.fn(function (
    this: HTMLCanvasElement,
    kind: string,
  ) {
    if (kind !== "2d") return null;
    let ctx = contexts.get(this);
    if (!ctx) {
      ctx = makeContext(this);
      contexts.set(this, ctx);
    }
    return ctx;
  }) as typeof HTMLCanvasElement.prototype.getContext;

  HTMLCanvasElement.prototype.toDataURL = vi.fn(
    () => "data:image/png;base64,TEST",
  );
}
