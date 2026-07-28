import { useEffect, useMemo, type RefObject } from "react";
import { EXPORT_FILENAME } from "../config/editor";
import {
  drawPattern,
  type ColorRemap,
  type MittenSettings,
  type PatternOverrides,
  type RGB,
  type SelectionRect,
} from "../lib/patternGenerator";
import { blockRect, mergeBlock } from "../lib/stitchBlock";
import type { PastePreview } from "./useSelectionState";

interface RendererInput {
  canvasRef: RefObject<HTMLCanvasElement>;
  settings: MittenSettings;
  image: HTMLImageElement | null;
  overrides: PatternOverrides;
  palette: RGB[];
  colorRemap: ColorRemap;
  /** The marquee to outline, or null when nothing is selected / not selecting. */
  selection: SelectionRect | null;
  /** An uncommitted block hovering under the cursor while a paste is armed. */
  preview: PastePreview | null;
}

/** What actually gets painted: the committed drawing, plus any paste preview
 *  overlaid on top of it. */
interface Scene {
  overrides: PatternOverrides;
  selection: SelectionRect | null;
}

export interface PatternRenderer {
  /** Save the current pattern as a downloadable PNG. */
  exportPng(): void;
  /** The current pattern as a PNG data URL (marquee excluded), or null when
   *  there is no canvas. Used to bundle the image into an export. */
  pngDataUrl(): string | null;
}

export function usePatternRenderer({
  canvasRef,
  settings,
  image,
  overrides,
  palette,
  colorRemap,
  selection,
  preview,
}: RendererInput): PatternRenderer {
  // While arming a paste, the clipboard block is drawn at the hovered cell and
  // outlined instead of the marquee — a preview, never committed to the drawing.
  const scene = useMemo<Scene>(
    () =>
      preview
        ? {
            overrides: mergeBlock(overrides, preview.block, preview.origin),
            selection: blockRect(preview.block, preview.origin),
          }
        : { overrides, selection },
    [preview, overrides, selection],
  );

  const render = (canvas: HTMLCanvasElement, marquee: SelectionRect | null) =>
    drawPattern(
      canvas,
      settings,
      image,
      scene.overrides,
      palette,
      colorRemap,
      marquee,
    );

  // Redraw whenever the settings, the image, the palette, the drawing or the
  // selection change.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!canvas.getContext) {
      alert(
        "Your browser does not support canvas and can therefore not display this app.",
      );
      return;
    }
    render(canvas, scene.selection);
    // `render` is rebuilt every render; these are exactly the values it closes over.
  }, [canvasRef, settings, image, palette, colorRemap, scene]);

  // Render without the marquee so the dashed outline never lands in the exported
  // image, grab the PNG, then restore the on-screen marquee.
  const pngDataUrl = (): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    if (scene.selection) render(canvas, null);
    const url = canvas.toDataURL("image/png");
    if (scene.selection) render(canvas, scene.selection);
    return url;
  };

  return {
    pngDataUrl,
    exportPng: () => {
      const url = pngDataUrl();
      if (!url) return;
      const link = document.createElement("a");
      link.download = EXPORT_FILENAME;
      link.href = url;
      link.click();
    },
  };
}
