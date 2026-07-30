import type { FillMode } from "../types/editor";
import { Icon } from "./Icon";
import {
  actionBtn,
  hint,
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
  /** Whether any hand-drawn edits exist (enables the clear button). */
  hasDrawing: boolean;
  /** Whether there is a previous drawing step to revert to. */
  canRevert: boolean;
  onToggleMode: () => void;
  onToggleReassign: () => void;
  /** Toggle filling a whole row/column, or flood-filling an area, on click. */
  onToggleFill: (mode: Exclude<FillMode, "off">) => void;
  onColorChange: (color: string) => void;
  /** Begin reassigning the given (effective) canvas colour. */
  onReassignColor: (color: string) => void;
  /** Open the colour picker to add a brand-new paint colour. */
  onPickColor: () => void;
  onRevert: () => void;
  onClear: () => void;
}

/** A 3-column grid of colour swatches. */
const PALETTE_GRID = "grid grid-cols-3 gap-1.5";

function Swatch({
  swatch,
  label,
  active,
  reassigning,
  onSelect,
}: {
  swatch: string;
  label: string;
  active: boolean;
  reassigning: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded border-2 bg-white p-[3px] ${
        reassigning ? "cursor-crosshair" : "cursor-pointer"
      } ${active ? "border-brand" : "border-transparent"}`}
      aria-pressed={active}
      aria-label={label}
      title={label}
      onClick={onSelect}
    >
      <span
        className={`block h-[18px] w-[18px] rounded-[2px] border border-[rgb(120,120,120)] ${
          reassigning
            ? "animate-swatch-pulse motion-reduce:animate-none motion-reduce:shadow-[0_0_0_2px_rgba(214,40,40,0.6)]"
            : ""
        }`}
        style={{ backgroundColor: swatch }}
        aria-hidden
      />
    </button>
  );
}

export function DrawTools({
  drawMode,
  color,
  usedColors,
  reassignMode,
  fillMode,
  hasDrawing,
  canRevert,
  onToggleMode,
  onToggleReassign,
  onToggleFill,
  onColorChange,
  onReassignColor,
  onPickColor,
  onRevert,
  onClear,
}: DrawToolsProps) {
  // In reassign mode a swatch overwrites its colour; otherwise it selects it.
  const handleSwatch = (css: string) =>
    reassignMode ? onReassignColor(css) : onColorChange(css);

  // Swatches offered while painting: the colours on the canvas, plus the active
  // colour if it isn't among them yet (e.g. one just picked but not yet drawn),
  // so the current selection is always visible. When reassigning, only the
  // colours actually on the canvas can be targeted.
  const swatches =
    reassignMode || usedColors.includes(color)
      ? usedColors
      : [...usedColors, color];

  // A toggle button (reassign / fill) — brand-filled when active.
  const toggleBtn = (active: boolean, extra = "") =>
    `cursor-pointer rounded-md border py-1.5 text-[0.8rem] font-bold transition-colors ${extra} ${
      active
        ? "border-brand bg-brand text-white"
        : "border-[rgb(216,210,210)] bg-white hover:border-brand hover:text-brand"
    }`;

  return (
    <div
      className={`${toolbarBase} top-[150px] max-h-[calc(100vh_-_166px)] gap-2 ${
        drawMode ? `${toolbarPanel} z-[16]` : ""
      }`}
      role="toolbar"
      aria-label="drawing tools"
    >
      <button
        type="button"
        className={drawMode ? toolbarCloseBtn : toolbarModeBtn}
        aria-pressed={drawMode}
        aria-label={drawMode ? "exit draw mode" : "draw"}
        onClick={onToggleMode}
      >
        {drawMode ? "×" : <Icon name="draw" />}
      </button>

      {drawMode && (
        <>
          <button
            type="button"
            className={toggleBtn(reassignMode, "px-[10px]")}
            aria-pressed={reassignMode}
            disabled={!reassignMode && usedColors.length === 0}
            onClick={onToggleReassign}
          >
            {reassignMode ? "done reassigning" : "reassign colors"}
          </button>
          {reassignMode && (
            <span className={`${hint} leading-[1.3]`}>
              click a colour to overwrite it everywhere
            </span>
          )}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              className={toggleBtn(fillMode === "row", "flex-[1_1_40%] px-2")}
              aria-pressed={fillMode === "row"}
              onClick={() => onToggleFill("row")}
            >
              fill row
            </button>
            <button
              type="button"
              className={toggleBtn(fillMode === "column", "flex-[1_1_40%] px-2")}
              aria-pressed={fillMode === "column"}
              onClick={() => onToggleFill("column")}
            >
              fill column
            </button>
            <button
              type="button"
              className={toggleBtn(fillMode === "bucket", "flex-[1_1_40%] px-2")}
              aria-pressed={fillMode === "bucket"}
              onClick={() => onToggleFill("bucket")}
            >
              fill area
            </button>
          </div>
          {fillMode !== "off" && (
            <span className={`${hint} leading-[1.3]`}>
              {fillMode === "bucket"
                ? "click an enclosed area to fill it in the selected colour"
                : `click the grid to fill a ${fillMode} in the selected colour`}
            </span>
          )}
          <div className="flex flex-col gap-1.5 border-t border-[rgb(224,218,218)] pt-2 mt-1">
            <span className={hint}>
              {reassignMode ? "canvas colors" : "colors"}
            </span>
            {swatches.length > 0 ? (
              <div className={PALETTE_GRID}>
                {swatches.map((css) => (
                  <Swatch
                    key={css}
                    swatch={css}
                    label={css}
                    active={!reassignMode && color === css}
                    reassigning={reassignMode}
                    onSelect={() => handleSwatch(css)}
                  />
                ))}
              </div>
            ) : (
              <span className={`${hint} leading-[1.3]`}>
                no colours on the canvas yet
              </span>
            )}
            {!reassignMode && (
              <button
                type="button"
                className={actionBtn}
                onClick={onPickColor}
              >
                + select color
              </button>
            )}
          </div>
          <button
            type="button"
            className={`${actionBtn} mt-auto max-[600px]:mt-0`}
            disabled={!canRevert}
            aria-label="revert last step"
            title="revert last step"
            onClick={onRevert}
          >
            <Icon name="revert" size={16} className="flex-none" />
            revert
          </button>
          <button
            type="button"
            className={actionBtn}
            disabled={!hasDrawing}
            onClick={onClear}
          >
            clear drawing
          </button>
        </>
      )}
    </div>
  );
}
