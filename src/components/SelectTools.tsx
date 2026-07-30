import {
  actionBtn,
  hint,
  toolbarBase,
  toolbarCloseBtn,
  toolbarModeBtn,
  toolbarPanel,
} from "../styles/ui";

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
  onToggleMode: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDeselect: () => void;
}

export function SelectTools({
  selectMode,
  hasSelection,
  hasClipboard,
  pasting,
  onToggleMode,
  onCopy,
  onPaste,
  onDeselect,
}: SelectToolsProps) {
  return (
    <div
      className={`${toolbarBase} top-[260px] max-h-[calc(100vh_-_276px)] gap-2 ${
        selectMode ? `${toolbarPanel} z-[16] w-[210px]` : ""
      }`}
      role="toolbar"
      aria-label="selection tools"
    >
      <button
        type="button"
        className={selectMode ? toolbarCloseBtn : toolbarModeBtn}
        aria-pressed={selectMode}
        aria-label={selectMode ? "exit select mode" : "select"}
        onClick={onToggleMode}
      >
        {selectMode ? (
          "×"
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              fill="currentColor"
              d="M5 21H3v-2h2zm4 0H7v-2h2zm4 0h-2v-2h2zm4 0h-2v-2h2zm4 0h-2v-2h2zM5 17H3v-2h2zm16 0h-2v-2h2zM5 13H3v-2h2zm16 0h-2v-2h2zM5 9H3V7h2zm16 0h-2V7h2zM5 5H3V3h2zm4 0H7V3h2zm4 0h-2V3h2zm4 0h-2V3h2zm4 0h-2V3h2z"
            />
          </svg>
        )}
      </button>

      {selectMode && (
        <>
          <span className={hint}>
            drag on the grid to select a rectangle of stitches. drag inside a
            selection to move it.
          </span>
          <button
            type="button"
            className={actionBtn}
            disabled={!hasSelection}
            onClick={onCopy}
          >
            copy
          </button>
          <button
            type="button"
            className={`${actionBtn} ${
              pasting ? "border-brand text-brand font-bold" : ""
            }`}
            aria-pressed={pasting}
            disabled={!hasClipboard}
            onClick={onPaste}
          >
            {pasting ? "placing… (cancel)" : "paste"}
          </button>
          {pasting && (
            <span className={hint}>
              click a stitch on the grid to drop the copied block there.
            </span>
          )}
          <button
            type="button"
            className={actionBtn}
            disabled={!hasSelection && !pasting}
            onClick={onDeselect}
          >
            deselect
          </button>
        </>
      )}
    </div>
  );
}
