import { useRef, useState, type RefObject } from "react";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import {
  EXPORT_FILENAME,
  PROJECT_FILENAME,
  PROJECT_ZIP_FILENAME,
} from "../config/editor";
import { useCanvasInteraction } from "../interactions/useCanvasInteraction";
import type { CanvasInteraction } from "../interactions/types";
import {
  defaultSettings,
  type MittenSettings,
} from "../lib/patternGenerator";
import { dataUrlToBytes, downloadBlob } from "../lib/download";
import {
  deserializeProject,
  serializeProject,
} from "../lib/patternFile";
import { topAlignedOffsetY, withRowCount } from "../lib/settings";
import type { DrawingState } from "./useDrawingState";
import { useDrawingState } from "./useDrawingState";
import { useImageSource, type ImageSource } from "./useImageSource";
import { usePaintColors, type PaintColors } from "./usePaintColors";
import { usePatternRenderer, type PatternRenderer } from "./usePatternRenderer";
import { useSelectionState, type SelectionState } from "./useSelectionState";
import { useToolMode, type ToolModeActions, type ToolModeState } from "./useToolMode";

/** Read the project JSON out of an imported file: unzip it when given the
 *  exported `.zip`, or read it directly when given a bare `.pattern`. Throws a
 *  user-facing message when a zip has no project entry inside it. */
async function readProjectText(file: File): Promise<string> {
  const isZip =
    file.name.toLowerCase().endsWith(".zip") || file.type === "application/zip";
  if (!isZip) return file.text();

  const entries = unzipSync(new Uint8Array(await file.arrayBuffer()));
  const name = Object.keys(entries).find((n) => n.toLowerCase().endsWith(".pattern"));
  if (!name) throw new Error("That zip doesn't contain a Mitten Maker pattern.");
  return strFromU8(entries[name]);
}

/**
 * The whole editor, assembled from one hook per concern. Each slice below owns
 * its own state and knows nothing about the others; this hook is the only place
 * that wires them together, and the App component only renders what it returns.
 */
export interface PatternEditor {
  canvasRef: RefObject<HTMLCanvasElement>;
  settings: MittenSettings;
  tool: ToolModeState;
  toolActions: ToolModeActions;
  image: ImageSource;
  drawing: DrawingState;
  colors: PaintColors;
  selection: SelectionState;
  interaction: CanvasInteraction;
  renderer: PatternRenderer;
  /** Apply a change from any of the numeric/boolean controls. */
  changeSetting(key: keyof MittenSettings, value: number | boolean): void;
  /** Finish the reassignment the colour-picker modal was opened for. */
  confirmReassign(toColor: string): void;
  /** Download just the printable PNG image of the pattern. */
  exportImage(): void;
  /** Download the full project — the PNG plus a re-importable project file,
   *  compressed together into a single zip. */
  exportProject(): void;
  /** Restore a pattern from a project file (or the zip it was exported in),
   *  previously written by {@link exportProject}. Rejects with a user-facing
   *  message on a bad file. */
  importPattern(file: File): Promise<void>;
}

export function usePatternEditor(): PatternEditor {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [settings, setSettings] = useState<MittenSettings>(defaultSettings);
  const [tool, toolActions] = useToolMode();
  const drawing = useDrawingState();

  // Fires once a newly picked image has decoded. Held in a ref because the reset
  // it performs reaches slices created further down this hook.
  const onImageLoaded = useRef<(img: HTMLImageElement) => void>(() => {});
  const image = useImageSource(settings.numColors, onImageLoaded);

  const colors = usePaintColors({
    palette: image.palette,
    overrides: drawing.overrides,
    settings,
    hasImage: image.image !== null,
  });

  const selection = useSelectionState({
    canvasRef,
    drawing,
    active: tool.mode === "select",
  });

  // A new image starts from a clean slate: default controls, no drawing, no
  // colour reassignments. Only the vertical offset differs, so the image starts
  // flush with the top of the grid rather than vertically centred.
  onImageLoaded.current = (img) => {
    setSettings({
      ...defaultSettings,
      offsetY: topAlignedOffsetY(img, defaultSettings),
    });
    drawing.reset();
    colors.reset();
  };

  const changeSetting = (
    key: keyof MittenSettings,
    value: number | boolean,
  ) => {
    if (key === "size") {
      // Scale the hand-drawn stitches in lockstep, so the drawing keeps tracking
      // the image it was drawn over.
      drawing.rescale(value as number, settings);
      setSettings((prev) => ({ ...prev, size: value as number }));
      return;
    }
    // Any other control (offset, rows, …) can move the scaling anchor, so the
    // resize baseline must be re-snapshotted on the next size change.
    drawing.invalidateResizeBase();
    if (key === "rows") {
      setSettings((prev) => withRowCount(prev, value as number));
      return;
    }
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const interaction = useCanvasInteraction({
    tool,
    settings,
    setSettings,
    hasImage: image.image !== null,
    drawing,
    colors,
    selection,
  });

  const renderer = usePatternRenderer({
    canvasRef,
    settings,
    image: image.image,
    overrides: drawing.overrides,
    palette: image.palette,
    colorRemap: colors.colorRemap,
    selection: tool.mode === "select" ? selection.selection : null,
    preview: selection.preview,
  });

  return {
    canvasRef,
    settings,
    tool,
    toolActions,
    image,
    drawing,
    colors,
    selection,
    interaction,
    renderer,
    changeSetting,
    confirmReassign: (toColor) => {
      const from = tool.reassignFrom;
      toolActions.cancelReassign();
      if (from !== null) colors.reassign(from, toColor);
    },

    exportImage: () => renderer.exportPng(),

    exportProject: () => {
      const json = serializeProject({
        settings,
        overrides: drawing.overrides,
        colorRemap: colors.colorRemap,
        color: colors.color,
        image: image.dataUrl,
      });
      // Bundle the re-importable project file with the printable PNG, compressed
      // into one zip. The PNG is already a compressed format, so it is stored
      // uncompressed (level 0); the JSON — dominated by the base64 image — packs
      // down well at the default level.
      const files: Record<string, [Uint8Array, { level: 0 | 6 }]> = {
        [PROJECT_FILENAME]: [strToU8(json), { level: 6 }],
      };
      const png = renderer.pngDataUrl();
      if (png) files[EXPORT_FILENAME] = [dataUrlToBytes(png), { level: 0 }];
      downloadBlob(zipSync(files), PROJECT_ZIP_FILENAME, "application/zip");
    },

    importPattern: async (file) => {
      const project = deserializeProject(await readProjectText(file));
      // Restore every slice from the file. `image.restore` deliberately skips the
      // new-image reset, so the settings/drawing/colours set here survive; the
      // palette then recomputes from the restored image and colour count.
      setSettings(project.settings);
      drawing.load(project.overrides);
      colors.load(project.colorRemap, project.color);
      image.restore(project.image);
    },
  };
}
