import {
  actionBtn,
  actionBtnSquare,
  hint,
  toolbarBase,
  toolbarCloseBtn,
  toolbarModeBtn,
  toolbarPanel,
} from "../styles/ui";
import { Icon } from "./Icon";

interface SelectToolsProps {
  /** Whether the canvas is in selection mode (marquee / move) rather than
   *  configure or draw mode. */
  selectMode: boolean;
  /** Whether a block of stitches is currently selected. */
  hasSelection: boolean;
  /** Whether something has been copied and can be pasted. */
  hasClipboard: boolean;
  /** Whether a paste is armed and waiting for a target stitch to be clicked. */
  pasting: boolean;
  /** Whether "move" mode is on: dragging inside the selection relocates it. */
  moveMode: boolean;
  onToggleMode: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onToggleMove: () => void;
  onDeselect: () => void;
}

export function SelectTools({
  selectMode,
  hasSelection,
  hasClipboard,
  pasting,
  moveMode,
  onToggleMode,
  onCopy,
  onPaste,
  onToggleMove,
  onDeselect,
}: SelectToolsProps) {
  return (
    <div
      className={`${toolbarBase} top-[260px] max-h-[calc(100vh_-_276px)] gap-2 ${
        selectMode ? `${toolbarPanel} min-[821px]:z-[16] w-[140px]` : ""
      }`}
      role="toolbar"
      aria-label="selection tools"
    >
      <button
        type="button"
        className={
          selectMode
            ? `${toolbarCloseBtn} min-[821px]:fixed min-[821px]:left-[140px] min-[821px]:top-[260px] min-[821px]:z-[17] min-[821px]:-translate-x-1/2 min-[821px]:-translate-y-1/2`
            : toolbarModeBtn
        }
        aria-pressed={selectMode}
        aria-label={selectMode ? "exit select mode" : "select"}
        onClick={onToggleMode}
      >
        {selectMode ? <Icon name="close" /> : <Icon size={18} name="select" />}
      </button>

      {selectMode && (
        <>
          <span className={hint}>
            drag on the grid to select a rectangle of stitches. 
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`${actionBtnSquare} ${
                moveMode ? "border-brand text-brand font-bold" : ""
              }`}
              aria-label="move"
              aria-pressed={moveMode}
              disabled={!hasSelection}
              onClick={onToggleMove}
            >
              <Icon size={18} name="move" />
            </button>
            <button
              type="button"
              className={actionBtnSquare}
              aria-label="copy"
              disabled={!hasSelection}
              onClick={onCopy}
            >
              <Icon size={18} name="copy" />
            </button>
            <button
              type="button"
              className={`${
                pasting ? actionBtn : actionBtnSquare
              } ${pasting ? "border-brand text-brand font-bold" : ""}`}
              aria-label={pasting ? undefined : "paste"}
              aria-pressed={pasting}
              disabled={!hasClipboard}
              onClick={onPaste}
            >
              {pasting ? "placing… (cancel)" : <Icon size={18} name="paste" />}
            </button>
            <button
              type="button"
              className={actionBtnSquare}
              aria-label="deselect"
              data-tooltip="deselect"
              disabled={!hasSelection && !pasting}
              onClick={onDeselect}
            >
              <Icon size={18} name="close" />
            </button>
          </div>
          {pasting && (
            <span className={hint}>
              click a stitch on the grid to drop the copied block there.
            </span>
          )}
        </>
      )}
    </div>
  );
}
