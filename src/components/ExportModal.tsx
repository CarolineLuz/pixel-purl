interface ExportModalProps {
  onCancel: () => void;
  /** Download just the printable PNG image. */
  onImageOnly: () => void;
  /** Download the full, re-importable project (PNG + project file, zipped). */
  onFullProject: () => void;
}

/** Asks whether an export should be just the picture or the whole editable
 *  project. Mirrors {@link ColorPickerModal}'s overlay/card styling. */
export function ExportModal({ onCancel, onImageOnly, onFullProject }: ExportModalProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="export pattern"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-[380px] rounded-md border-2 border-brand bg-white px-7 py-6 text-black"
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
        <h2 className="mt-0 text-[1.15rem] font-bold">Export pattern</h2>
        <p className="mb-5 text-[0.85rem] text-[rgb(90,85,85)]">
          What would you like to download?
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            className="flex flex-col items-start gap-0.5 rounded-md border border-[rgb(216,210,210)] bg-white px-4 py-3 text-left transition-colors hover:border-brand"
            onClick={onImageOnly}
          >
            <span className="text-[0.95rem] font-bold">Image only</span>
            <span className="text-[0.8rem] text-[rgb(110,105,105)]">
              A PNG of the pattern chart — for printing or sharing.
            </span>
          </button>
          <button
            type="button"
            className="flex flex-col items-start gap-0.5 rounded-md border border-brand bg-brand/5 px-4 py-3 text-left transition-colors hover:bg-brand/10"
            onClick={onFullProject}
          >
            <span className="text-[0.95rem] font-bold">Full project (.zip)</span>
            <span className="text-[0.8rem] text-[rgb(110,105,105)]">
              The image plus an editable file you can import again later.
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
