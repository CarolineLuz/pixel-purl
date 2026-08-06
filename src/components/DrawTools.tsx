import type { FillMode } from "../types/editor";
import { Icon } from "./Icon";
import { ColorPalette } from "./ColorPalette";
import { FillModeTools } from "./FillModeTools";
import {
  toolbarBase,
  toolbarCloseBtn,
  toolbarModeBtn,
  toolbarPanel,
} from "../styles/ui";

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
    <div
      className={`${toolbarBase} top-[150px] max-h-[calc(100vh_-_166px)] gap-2 ${
        drawMode ? `${toolbarPanel} min-[821px]:z-[16] min-[821px]:w-[120px]` : ""
      }`}
      role="toolbar"
      aria-label="drawing tools"
    >
      <button
        type="button"
        className={
          drawMode
            ? `${toolbarCloseBtn} min-[821px]:fixed min-[821px]:left-[120px] min-[821px]:top-[150px] min-[821px]:z-[17] min-[821px]:-translate-x-1/2 min-[821px]:-translate-y-1/2`
            : toolbarModeBtn
        }
        aria-pressed={drawMode}
        aria-label={drawMode ? "exit draw mode" : "draw"}
        onClick={onToggleMode}
      >
        {drawMode ? <Icon name="close" size={22} /> : <Icon name="draw" />}
      </button>

      {drawMode && (
        <>
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
        </>
      )}
    </div>
  );
}
