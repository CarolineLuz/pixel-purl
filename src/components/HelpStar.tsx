import { useEffect, useState } from "react";

export function HelpStar() {
  const [open, setOpen] = useState(false);

  // Close the modal on Escape for keyboard users.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="star-clip group fixed top-[30px] right-[30px] z-20 flex h-[52px] w-[52px] origin-center max-[820px]:top-2 max-[820px]:right-2 cursor-pointer items-center justify-center border-none bg-brand p-0 transition-transform duration-150 ease-[ease] hover:scale-300 hover:translate-x-[-10px] hover:rotate-[-55deg] hover:outline-none focus-visible:scale-300 focus-visible:translate-x-[-10px] focus-visible:rotate-[-55deg] focus-visible:outline-none"
        aria-label="How does this work?"
        onClick={() => setOpen(true)}
      >
        <span
          className="pointer-events-none text-[1.1rem] font-bold text-black"
          aria-hidden="true"
        >
          ?
        </span>
        <span className="pointer-events-none absolute top-1/2 right-[60px] -translate-y-1/2 whitespace-nowrap rounded-[3px] bg-black px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-150 ease-[ease] group-hover:opacity-100 group-focus-visible:opacity-100">
          How does this work?
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="help-modal-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative max-h-[85vh] w-full max-w-[620px] overflow-y-auto rounded-md border-2 border-brand bg-white px-7 py-6 text-black"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute top-2 right-3 cursor-pointer border-none bg-transparent text-[1.6rem] leading-none text-black max-[820px]:scale-90"
              aria-label="Close"
              onClick={() => setOpen(false)}
            >
              ×
            </button>
            <h2 id="help-modal-title" className="mt-0 text-xl font-bold">
              How the pattern maker works
            </h2>
            <p className="text-[0.9rem] leading-normal mb-4">
              This tool turns a picture into a knitting chart for a mitten (or
              any grid-based colourwork). Here is how to use it:
            </p>
            <ol className="list-decimal pl-5">
              <li className="mb-2 text-[0.9rem] leading-normal">
                <strong>Upload an image.</strong> Pick a JPG, PNG or WebP with
                the <em>image for pattern</em> button. It gets reduced to a grid
                using the picture's own most-representative colours.
              </li>
              <li className="mb-2 text-[0.9rem] leading-normal">
                <strong>Set the grid size.</strong> Use <em>stitches</em> and{" "}
                <em>rows</em> to match your gauge — each square in the chart is
                one stitch.
              </li>
              <li className="mb-2 text-[0.9rem] leading-normal">
                <strong>Position the image.</strong> <em>start point (x, y)</em>{" "}
                (or just drag the picture on the grid),{" "}
                <em>resize small/large</em> and <em>rotate</em> let you frame the
                picture inside the grid.
              </li>
              <li className="mb-2 text-[0.9rem] leading-normal">
                <strong>Tune the colours.</strong> <em>colors</em> sets how many
                colours (2–10) are pulled from the picture — the pattern is drawn
                in exactly those. <em>brightness</em> shifts everything lighter or
                darker before the colours are matched.
              </li>
              <li className="mb-2 text-[0.9rem] leading-normal">
                <strong>Sharpen the outlines.</strong> <em>enhance edges</em>{" "}
                traces the picture's edges and draws them in (in the darkest
                palette colour), so shapes read clearly even where the colour grid
                breaks a line into dots. <em>edge sensitivity</em>{" "}
                controls how much gets traced: turn it up to catch fainter edges
                and finer detail, down to keep only the strongest outlines.
              </li>
              <li className="mb-2 text-[0.9rem] leading-normal">
                <strong>Draw by hand.</strong> Hit <em>draw!</em> to touch up the
                chart yourself. Pick any colour — the fixed swatches or the{" "}
                <em>image colors</em> pulled from your picture — and drag across
                the grid to paint stitches; <em>white</em> doubles as an eraser.
                Your edits sit on top of the picture and stay put when you tweak
                the other controls.
              </li>
              <li className="mb-2 text-[0.9rem] leading-normal">
                <strong>Fill faster.</strong> <em>fill row</em> and{" "}
                <em>fill column</em> paint a whole line in the selected colour
                with one click; <em>fill area</em> flood-fills an enclosed region.{" "}
                <em>reassign colors</em> lets you click any colour on the chart to
                overwrite every stitch of it at once. <em>revert</em> undoes your
                last drawing step and <em>clear drawing</em> removes all your edits.
              </li>
              <li className="mb-2 text-[0.9rem] leading-normal">
                <strong>Copy, paste and move.</strong> Hit <em>select!</em> to
                enter selection mode, then drag on the grid to select a rectangle
                of stitches. Drag inside a selection to move it, or use{" "}
                <em>copy</em> and <em>paste</em> (then click a stitch to drop the
                block) to duplicate it elsewhere. <em>deselect</em> clears the
                selection.
              </li>
              <li className="mb-2 text-[0.9rem] leading-normal">
                <strong>Reposition anytime.</strong> When you are not in draw or
                selection mode, dragging on the grid moves the picture and your
                drawing together, so you can reframe the whole pattern at once.
              </li>
            </ol>
            <p className="text-[0.9rem] leading-normal">
              Knit each row following the chart, one square per stitch, changing
              yarn colour where the squares change. Happy knitting! 🧤
            </p>
          </div>
        </div>
      )}
    </>
  );
}
