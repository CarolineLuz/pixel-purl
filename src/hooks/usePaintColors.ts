import { useMemo, useState } from "react";
import { isOnGrid } from "../lib/grid";
import { parseOverrideKey } from "../lib/overrides";
import {
  INK_COLORS,
  rgbCss,
  type ColorRemap,
  type MittenSettings,
  type PatternOverrides,
  type RGB,
} from "../lib/patternGenerator";

export interface PaintColors {
  /** Active paint colour as a CSS colour string — either a named ink from
   *  INK_COLORS or an "rgb(r, g, b)" swatch taken from the image's palette. */
  color: string;
  setColor(color: string): void;
  /** Colour reassignments (original CSS colour → replacement), applied at draw
   *  time to both the image fills and the hand-drawn overrides. */
  colorRemap: ColorRemap;
  /** The distinct colours currently shown on the canvas, each as its effective
   *  (post-reassignment) CSS string. */
  usedColors: string[];
  /** Overwrite every canvas colour currently displayed as `from` with `to`. */
  reassign(from: string, to: string): void;
  /** Forget every reassignment (a new image starts clean). */
  reset(): void;
  /** Restore the active colour and reassignments from an imported pattern. */
  load(colorRemap: ColorRemap, color: string): void;
}

interface PaintColorsInput {
  palette: RGB[];
  overrides: PatternOverrides;
  settings: MittenSettings;
  hasImage: boolean;
}

export function usePaintColors({
  palette,
  overrides,
  settings,
  hasImage,
}: PaintColorsInput): PaintColors {
  const [color, setColor] = useState<string>(INK_COLORS.black);
  const [colorRemap, setColorRemap] = useState<ColorRemap>(new Map());

  // The image palette (when the image is visible) plus every on-grid hand-drawn
  // stitch. These are the only swatches the draw toolbar offers and the only
  // colours "reassign colours" can target.
  const usedColors = useMemo(() => {
    const effective = (css: string) => colorRemap.get(css) ?? css;
    const set = new Set<string>();
    if (hasImage && settings.size > 0) {
      palette.forEach((rgb) => set.add(effective(rgbCss(rgb))));
    }
    overrides.forEach((css, key) => {
      // Off-grid overrides (panned out of view) aren't drawn, so they don't count.
      if (!isOnGrid(settings, parseOverrideKey(key))) return;
      set.add(effective(css));
    });
    return [...set];
  }, [hasImage, settings, palette, overrides, colorRemap]);

  // Reassignment is non-destructive — it edits the render-time remap, not the
  // palette or the stored overrides — so the image quantisation and the drawing
  // history are left untouched.
  const reassign = (from: string, to: string) => {
    if (from === to) return;
    setColorRemap((prev) => {
      const next = new Map(prev);
      // Every original colour the canvas could be showing: palette entries, ink
      // presets, painted overrides, and any colour already remapped.
      const universe = new Set<string>(prev.keys());
      palette.forEach((rgb) => universe.add(rgbCss(rgb)));
      Object.values(INK_COLORS).forEach((css) => universe.add(css));
      overrides.forEach((css) => universe.add(css));
      // Point every original whose effective colour is currently `from` at the
      // new colour, so all matching stitches recolour together.
      universe.forEach((original) => {
        if ((next.get(original) ?? original) === from) next.set(original, to);
      });
      return next;
    });
  };

  return {
    color,
    setColor,
    colorRemap,
    usedColors,
    reassign,
    reset: () => setColorRemap(new Map()),
    load: (remap, next) => {
      setColorRemap(remap);
      setColor(next);
    },
  };
}
