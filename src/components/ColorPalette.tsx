import { hint, mobileShrink, toggleBtn } from "../styles/ui";

/** Colour swatches packed tightly and wrapping to the next row as needed. */
const PALETTE_GRID = "flex flex-wrap gap-1";

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
      className={`inline-flex w-fit items-center justify-center rounded border-2 p-0 ${mobileShrink} ${
        reassigning ? "cursor-crosshair" : "cursor-pointer"
      } ${active ? "border-brand" : "border-transparent"}`}
      aria-pressed={active}
      aria-label={label}
      data-tooltip={label}
      onClick={onSelect}
    >
      <span
        className={`block aspect-square h-[22px] rounded-[2px] border border-[rgb(120,120,120)] ${
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

interface ColorPaletteProps {
  /** The active paint colour, as a CSS colour string. */
  color: string;
  /** The (effective) colours currently on the canvas — the only ones that can be
   *  reassigned, shown under "colors used in the pattern". */
  usedColors: string[];
  /** Whether "reassign colours" mode is on: clicking a pattern colour overwrites
   *  it everywhere instead of selecting it for painting. */
  reassignMode: boolean;
  onColorChange: (color: string) => void;
  /** Begin reassigning the given (effective) canvas colour. */
  onReassignColor: (color: string) => void;
  /** Open the colour picker to add a brand-new paint colour. */
  onPickColor: () => void;
  onToggleReassign: () => void;
}

/** The colour section of the draw toolbar. The currently selected colour is
 *  always shown on its own; below it, the colours already used in the pattern
 *  are offered as swatches — selectable while painting, or reassignable (that is
 *  the only thing "reassign colours" acts on). */
export function ColorPalette({
  color,
  usedColors,
  reassignMode,
  onColorChange,
  onReassignColor,
  onPickColor,
  onToggleReassign,
}: ColorPaletteProps) {
  return (
    <div className="flex flex-col gap-1.5 border-t border-[rgb(224,218,218)] pt-2 mt-1">
      <button
        type="button"
        className={`inline-flex cursor-pointer items-center gap-2 self-start rounded-md border border-transparent px-1 py-0.5 -ml-1 transition-colors hover:border-[rgb(216,210,210)] hover:text-brand ${mobileShrink}`}
        aria-label={`selected color ${color}, click to change`}
        data-tooltip="click to change colour"
        onClick={onPickColor}
      >
        <span
          className="block h-[22px] w-[22px] flex-none rounded-[3px] border border-[rgb(120,120,120)]"
          style={{ backgroundColor: color }}
          aria-hidden
        />
      </button>

      {usedColors.length > 0 ? (
        <>
        <span className={`${hint} mt-1`}>colors used in the pattern:</span>
        <div className={PALETTE_GRID}>
          {usedColors.map((css) => (
            <Swatch
            key={css}
            swatch={css}
            label={css}
            active={!reassignMode && color === css}
            reassigning={reassignMode}
            onSelect={() =>
              reassignMode ? onReassignColor(css) : onColorChange(css)
            }
            />
          ))}
        </div>
        </>
      ) : (
        <span className={`${hint} leading-[1.3]`}>
          no colours in the pattern yet
        </span>
      )}
      {reassignMode && (
        <span className={`${hint} leading-[1.3]`}>
          select a colour to overwrite it globally
        </span>
      )}
      <button
        type="button"
        className={toggleBtn(reassignMode, "px-[10px]")}
        aria-pressed={reassignMode}
        disabled={!reassignMode && usedColors.length === 0}
        onClick={onToggleReassign}
      >
        {reassignMode ? "done" : "reassign colors"}
      </button>
    </div>
  );
}
