import { useState } from "react";
import { AppHeader } from "./components/AppHeader";
import { ColorPickerModal } from "./components/ColorPickerModal";
import { DrawTools } from "./components/DrawTools";
import { ExportModal } from "./components/ExportModal";
import { HelpStar } from "./components/HelpStar";
import { ImageToolbar } from "./components/ImageToolbar";
import { PatternCanvas } from "./components/PatternCanvas";
import { SelectTools } from "./components/SelectTools";
import { usePatternEditor } from "./hooks/usePatternEditor";
import { useUndoHotkey } from "./hooks/useUndoHotkey";

/**
 * Composition root. All of the editor's state and behaviour lives in
 * {@link usePatternEditor}; this only lays the pieces out and connects them.
 */
export default function App() {
  const editor = usePatternEditor();
  const { tool, toolActions, settings, drawing, colors, image, selection } =
    editor;
  const [exportOpen, setExportOpen] = useState(false);

  useUndoHotkey(drawing.revert);

  return (
    <>
      <HelpStar />
      <AppHeader
        settings={settings}
        onChange={editor.changeSetting}
        canRevert={drawing.canRevert}
        onRevert={drawing.revert}
        onExport={() => setExportOpen(true)}
        onImport={(file) => {
          editor.importPattern(file).catch((err) => {
            alert(err instanceof Error ? err.message : "Could not import that pattern.");
          });
        }}
      />
      <div className="contents max-[600px]:flex max-[600px]:flex-wrap max-[600px]:items-center max-[600px]:gap-x-5 max-[600px]:gap-y-2 max-[600px]:bg-[rgb(237,233,233)] max-[600px]:px-4 max-[600px]:py-2">
        <DrawTools
          drawMode={tool.mode === "draw"}
          color={colors.color}
          usedColors={colors.usedColors}
          reassignMode={tool.reassignMode}
          fillMode={tool.fillMode}
          hasDrawing={drawing.hasDrawing}
          canRevert={drawing.canRevert}
          onToggleMode={() => toolActions.toggleMode("draw")}
          onToggleReassign={toolActions.toggleReassign}
          onToggleFill={toolActions.toggleFill}
          onColorChange={colors.setColor}
          onReassignColor={toolActions.startReassign}
          onPickColor={toolActions.openColorPicker}
          onRevert={drawing.revert}
          onClear={drawing.clear}
        />
        <ImageToolbar
          settings={settings}
          hasImage={image.image !== null}
          open={tool.mode === "image"}
          onToggleOpen={() => toolActions.toggleMode("image")}
          onChange={editor.changeSetting}
          onImageChange={image.load}
        />
        <SelectTools
          selectMode={tool.mode === "select"}
          hasSelection={selection.selection !== null}
          hasClipboard={selection.hasClipboard}
          pasting={selection.pasting}
          onToggleMode={() => toolActions.toggleMode("select")}
          onCopy={selection.copy}
          onPaste={selection.togglePaste}
          onDeselect={selection.deselect}
        />
      </div>
      <PatternCanvas
        canvasRef={editor.canvasRef}
        interaction={editor.interaction}
      />
      {exportOpen && (
        <ExportModal
          onCancel={() => setExportOpen(false)}
          onImageOnly={() => {
            editor.exportImage();
            setExportOpen(false);
          }}
          onFullProject={() => {
            editor.exportProject();
            setExportOpen(false);
          }}
        />
      )}
      {tool.reassignFrom !== null && (
        <ColorPickerModal
          fromColor={tool.reassignFrom}
          onCancel={toolActions.cancelReassign}
          onConfirm={editor.confirmReassign}
        />
      )}
      {tool.colorPickerOpen && (
        <ColorPickerModal
          onCancel={toolActions.closeColorPicker}
          onConfirm={(picked) => {
            colors.setColor(picked);
            toolActions.closeColorPicker();
          }}
        />
      )}
    </>
  );
}
