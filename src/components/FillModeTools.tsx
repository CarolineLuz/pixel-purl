import type { FillMode } from "../types/editor";
import type { IconName } from "./Icon";
import { IconToggleButton } from "./IconToggleButton";
import { hint } from "../styles/ui";

/** The selectable drawing sub-modes, in display order. "off" is plain freehand
 *  painting; the others change what a single canvas click does. Kept as data so
 *  adding a mode is one row here rather than another copy-pasted button. */
const FILL_MODES: { mode: FillMode; icon: IconName; label: string }[] = [
  { mode: "off", icon: "draw", label: "draw" },
  { mode: "bucket", icon: "fill", label: "fill area" },
  { mode: "row", icon: "row", label: "draw row" },
  { mode: "column", icon: "column", label: "draw column" },
];

/** The instructional hint shown while a (non-freehand) fill mode is active. */
function fillHint(mode: Exclude<FillMode, "off">) {
  return mode === "bucket"
    ? "click an enclosed area to fill it in the selected colour"
    : `click the grid to fill a ${mode} in the selected colour`;
}

interface FillModeToolsProps {
  fillMode: FillMode;
  /** Return to plain freehand painting (clears any active fill mode). */
  onFreehand: () => void;
  /** Toggle filling a whole row/column, or flood-filling an area, on click. */
  onToggleFill: (mode: Exclude<FillMode, "off">) => void;
}

/** The 2×2 grid of drawing-mode toggles plus the hint for the active mode. */
export function FillModeTools({
  fillMode,
  onFreehand,
  onToggleFill,
}: FillModeToolsProps) {
  return (
    <>
      <div className="grid w-fit grid-cols-2 gap-1.5 max-[820px]:grid-cols-4">
        {FILL_MODES.map(({ mode, icon, label }) => (
          <IconToggleButton
            key={mode}
            icon={icon}
            label={label}
            active={fillMode === mode}
            onClick={mode === "off" ? onFreehand : () => onToggleFill(mode)}
          />
        ))}
      </div>
      {fillMode !== "off" && (
        <span className={`${hint} leading-[1.3]`}>{fillHint(fillMode)}</span>
      )}
    </>
  );
}
