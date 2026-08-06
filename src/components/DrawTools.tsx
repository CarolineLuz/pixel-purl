import type { FillMode } from "../types/editor";
import { TOOLBAR_LAYOUTS } from "../config/toolbars";
import { CollapsibleToolbar } from "./CollapsibleToolbar";
import { ColorPalette } from "./ColorPalette";
import { FillModeTools } from "./FillModeTools";

interface DrawToolsProps {
  /** Whether the canvas is in draw mode (paint) rather than configure mode (drag). */
  drawMode: boolean;
  /** The active paint colour, as a CSS colour string. */
  color: string;
  /** The (effective) colours currently shown on the canvas — the image palette
   *  after any reassignment plus the hand-drawn stitches. These are the only
   *  colours offered as swatches and the only ones that can be reassigned. */
  usedColors: string[];
  /** Whether "reassign colours" mode is on: clicking a swatch overwrites its
   *  colour instead of selecting it for painting. */
  reassignMode: boolean;
  /** Active fill sub-mode: a canvas click fills a whole row/column, flood-fills
   *  an enclosed area ("bucket"), or "off" for freehand painting. */
  fillMode: FillMode;
  onToggleMode: () => void;
  onToggleReassign: () => void;
  /** Toggle filling a whole row/column, or flood-filling an area, on click. */
  onToggleFill: (mode: Exclude<FillMode, "off">) => void;
  /** Return to plain freehand painting (clears any active fill mode). */
  onFreehand: () => void;
  onColorChange: (color: string) => void;
  /** Begin reassigning the given (effective) canvas colour. */
  onReassignColor: (color: string) => void;
  /** Open the colour picker to add a brand-new paint colour. */
  onPickColor: () => void;
}

export function DrawTools({
  drawMode,
  color,
  usedColors,
  reassignMode,
  fillMode,
  onToggleMode,
  onToggleReassign,
  onToggleFill,
  onFreehand,
  onColorChange,
  onReassignColor,
  onPickColor,
}: DrawToolsProps) {
  return (
    <CollapsibleToolbar
      open={drawMode}
      onToggle={onToggleMode}
      label="drawing tools"
      layout={TOOLBAR_LAYOUTS.draw}
      collapsedIcon="draw"
      collapsedLabel="draw"
      expandedLabel="exit draw mode"
    >
      <FillModeTools
        fillMode={fillMode}
        onFreehand={onFreehand}
        onToggleFill={onToggleFill}
      />
      <ColorPalette
        color={color}
        usedColors={usedColors}
        reassignMode={reassignMode}
        onColorChange={onColorChange}
        onReassignColor={onReassignColor}
        onPickColor={onPickColor}
        onToggleReassign={onToggleReassign}
      />
    </CollapsibleToolbar>
  );
}
