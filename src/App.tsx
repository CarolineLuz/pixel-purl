import { useState } from "react";
import { ZOOM_MAX, ZOOM_MIN, ZOOM_STEP } from "./config/editor";
import { AppHeader } from "./components/AppHeader";
import { ColorPickerModal } from "./components/ColorPickerModal";
import { DrawTools } from "./components/DrawTools";
import { ExportModal } from "./components/ExportModal";
import { HelpStar } from "./components/HelpStar";
import { ImageToolbar } from "./components/ImageToolbar";
import { PatternCanvas } from "./components/PatternCanvas";
import { SelectTools } from "./components/SelectTools";
import { TooltipLayer } from "./components/TooltipLayer";
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
  const [zoom, setZoom] = useState(1);

  // Round after each step so repeated clicks don't drift off the 0.25 grid.
  const stepZoom = (delta: number) =>
    setZoom((z) => {
      const next = Math.round((z + delta) / ZOOM_STEP) * ZOOM_STEP;
      return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next));
    });

  useUndoHotkey(drawing.revert);

  return (
    <>
      <TooltipLayer />
      <HelpStar />
      <AppHeader
        settings={settings}
        onChange={editor.changeSetting}
        canRevert={drawing.canRevert}
        onRevert={drawing.revert}
        canClear={drawing.hasDrawing}
        onClear={drawing.clear}
        onExport={() => setExportOpen(true)}
        onImport={(file) => {
          editor.importPattern(file).catch((err) => {
            alert(err instanceof Error ? err.message : "Could not import that pattern.");
          });
        }}
        zoom={zoom}
        canZoomIn={zoom < ZOOM_MAX}
        canZoomOut={zoom > ZOOM_MIN}
        onZoomIn={() => stepZoom(ZOOM_STEP)}
        onZoomOut={() => stepZoom(-ZOOM_STEP)}
      />
      <div className="contents max-[820px]:sticky max-[820px]:top-[var(--app-header-height,0px)] max-[820px]:z-[9] max-[820px]:flex max-[820px]:flex-wrap max-[820px]:items-center max-[820px]:gap-x-5 max-[820px]:gap-y-2 max-[820px]:border-b max-[820px]:border-[rgb(224,218,218)] max-[820px]:bg-[rgb(237,233,233)] max-[820px]:px-4 max-[820px]:py-2">
        <DrawTools
          drawMode={tool.mode === "draw"}
          color={colors.color}
          usedColors={colors.usedColors}
          reassignMode={tool.reassignMode}
          fillMode={tool.fillMode}
          onToggleMode={() => toolActions.toggleMode("draw")}
          onToggleReassign={toolActions.toggleReassign}
          onToggleFill={toolActions.toggleFill}
          onFreehand={toolActions.freehand}
          onColorChange={colors.setColor}
          onReassignColor={toolActions.startReassign}
          onPickColor={toolActions.openColorPicker}
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
          moveMode={selection.moveMode}
          onToggleMode={() => toolActions.toggleMode("select")}
          onCopy={selection.copy}
          onPaste={selection.togglePaste}
          onToggleMove={selection.toggleMove}
          onDeselect={selection.deselect}
        />
      </div>
      <PatternCanvas
        canvasRef={editor.canvasRef}
        interaction={editor.interaction}
        zoom={zoom}
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
