import type { Dispatch, SetStateAction } from "react";
import type { DrawingState } from "../hooks/useDrawingState";
import type { PaintColors } from "../hooks/usePaintColors";
import type { SelectionState } from "../hooks/useSelectionState";
import type { ToolModeState } from "../hooks/useToolMode";
import type { MittenSettings } from "../lib/patternGenerator";
import type { CanvasInteraction } from "./types";
import { useDrawInteraction } from "./useDrawInteraction";
import { usePanInteraction } from "./usePanInteraction";
import { useSelectInteraction } from "./useSelectInteraction";

interface CanvasInteractionInput {
  tool: ToolModeState;
  settings: MittenSettings;
  setSettings: Dispatch<SetStateAction<MittenSettings>>;
  hasImage: boolean;
  drawing: DrawingState;
  colors: PaintColors;
  selection: SelectionState;
}

/**
 * The interaction the canvas should currently use. Every tool's interaction is
 * built each render (they are cheap and hold their gesture state in refs); this
 * only decides which one is wired up. The image tool leaves the canvas panning.
 */
export function useCanvasInteraction({
  tool,
  settings,
  setSettings,
  hasImage,
  drawing,
  colors,
  selection,
}: CanvasInteractionInput): CanvasInteraction {
  const pan = usePanInteraction({ settings, setSettings, hasImage, drawing });
  const draw = useDrawInteraction({
    settings,
    drawing,
    color: colors.color,
    colorRemap: colors.colorRemap,
    fillMode: tool.fillMode,
    reassignMode: tool.reassignMode,
  });
  const select = useSelectInteraction({ settings, drawing, selection });

  switch (tool.mode) {
    case "draw":
      return draw;
    case "select":
      return select;
    default:
      return pan;
  }
}
