import { TOOLBAR_LAYOUTS } from "../config/toolbars";
import { actionBtn, actionBtnSquare, hint } from "../styles/ui";
import { CollapsibleToolbar } from "./CollapsibleToolbar";
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
    <CollapsibleToolbar
      open={selectMode}
      onToggle={onToggleMode}
      label="selection tools"
      layout={TOOLBAR_LAYOUTS.select}
      collapsedIcon="select"
      collapsedLabel="select"
      expandedLabel="exit select mode"
    >
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
    </CollapsibleToolbar>
  );
}
