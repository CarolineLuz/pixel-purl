import { useState } from "react";
import { cssToRgba } from "../lib/canvasColor";
import { INK_COLORS } from "../lib/patternGenerator";

interface ColorPickerModalProps {
  /** When set, the modal is overwriting this existing canvas colour (a
   *  reassignment): the "from" swatch is shown and the confirm button reassigns.
   *  When omitted, the modal is picking a brand-new paint colour to add. */
  fromColor?: string;
  onCancel: () => void;
  onConfirm: (newColor: string) => void;
}

/** Named ink presets offered as quick picks alongside the free colour picker. */
const PRESET_COLORS = Object.values(INK_COLORS);

/** Normalise any CSS colour string to a `#rrggbb` hex the native colour input
 *  accepts, via the colour the canvas would actually render it as. */
function cssToHex(css: string): string {
  const [r, g, b] = cssToRgba(css);
  const hex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

export function ColorPickerModal({
  fromColor,
  onCancel,
  onConfirm,
}: ColorPickerModalProps) {
  // Reassigning starts from the colour being overwritten; a fresh pick starts
  // from black.
  const [picked, setPicked] = useState<string>(() =>
    fromColor ? cssToHex(fromColor) : "#000000",
  );
  const reassigning = fromColor !== undefined;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={reassigning ? "reassign colour" : "select colour"}
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-[360px] rounded-md border-2 border-brand bg-white px-7 py-6 text-black"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="absolute top-2 right-3 cursor-pointer border-none bg-transparent text-[1.6rem] leading-none text-black"
          aria-label="cancel"
          onClick={onCancel}
        >
          ×
        </button>
        <h2 className="mt-0 text-[1.15rem] font-bold">
          {reassigning ? "Reassign colour" : "Select colour"}
        </h2>

        <div className="mb-5 flex items-center justify-center gap-4">
          {reassigning && (
            <>
              <span className="flex flex-col items-center gap-1 text-xs">
                <span
                  className="h-10 w-10 rounded border border-[rgb(120,120,120)]"
                  style={{ backgroundColor: fromColor }}
                  aria-hidden
                />
                <span>from</span>
              </span>
              <span className="text-[1.4rem]" aria-hidden>
                →
              </span>
            </>
          )}
          <span className="flex flex-col items-center gap-1 text-xs">
            <span
              className="h-10 w-10 rounded border border-[rgb(120,120,120)]"
              style={{ backgroundColor: picked }}
              aria-hidden
            />
            <span>{reassigning ? "to" : "colour"}</span>
          </span>
        </div>

        <label className="mb-4 flex items-center justify-between gap-3 text-[0.85rem]">
          pick a colour
          <input
            type="color"
            className="h-8 w-14 cursor-pointer rounded-md border border-[rgb(216,210,210)] p-0"
            value={cssToHex(picked)}
            onChange={(e) => setPicked(e.target.value)}
          />
        </label>

        <span className="mb-1.5 block text-xs text-[rgb(110,105,105)]">
          or a preset
        </span>
        <div className="mb-5 grid grid-cols-9 gap-1">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`aspect-square cursor-pointer rounded border-2 p-0 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.2)] ${
                picked === c ? "border-brand" : "border-transparent"
              }`}
              style={{ backgroundColor: c }}
              aria-label={c}
              title={c}
              onClick={() => setPicked(c)}
            />
          ))}
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            className="cursor-pointer rounded-md border border-[rgb(216,210,210)] bg-white px-[14px] py-[6px] text-[0.85rem] transition-colors hover:border-brand hover:text-brand"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="cursor-pointer rounded-md border border-brand bg-brand px-[14px] py-[6px] text-[0.85rem] text-white transition-transform duration-150 hover:scale-105"
            onClick={() => onConfirm(picked)}
          >
            {reassigning ? "Reassign" : "Select"}
          </button>
        </div>
      </div>
    </div>
  );
}
