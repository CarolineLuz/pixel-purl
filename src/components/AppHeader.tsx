import { useLayoutEffect, useRef, type ChangeEvent } from "react";
import { ACCEPTED_PROJECT_TYPES } from "../config/editor";
import { useScrolledPast } from "../hooks/useScrolledPast";
import type { MittenSettings } from "../lib/patternGenerator";
import { Controls } from "./Controls";
import { Icon } from "./Icon";
import { mobileShrink } from "../styles/ui";

interface AppHeaderProps {
  settings: MittenSettings;
  onChange: (key: keyof MittenSettings, value: number | boolean) => void;
  canRevert: boolean;
  onRevert: () => void;
  canClear: boolean;
  onClear: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  /** Current display zoom, e.g. `1` for 100%. */
  zoom: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
}

/** Title, the grid controls, and the revert / clear / export / import / zoom buttons. */
export function AppHeader({ settings, onChange, canRevert, onRevert, canClear, onClear, onExport, onImport, zoom, canZoomIn, canZoomOut, onZoomIn, onZoomOut }: AppHeaderProps) {
  const importRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const collapsed = useScrolledPast(80);

  // Publish the header's rendered height so the toolbars below can stick right
  // underneath it (see the sticky `top` offset in App.tsx). Re-measures when the
  // header collapses on scroll and when the viewport resizes/wraps its buttons.
  useLayoutEffect(() => {
    const measure = () => {
      const height = headerRef.current?.offsetHeight ?? 0;
      document.documentElement.style.setProperty("--app-header-height", `${height}px`);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [collapsed]);

  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImport(file);
    // Reset so choosing the same file again still fires a change event.
    e.target.value = "";
  };

  return (
    <header ref={headerRef} className="sticky top-0 z-10 flex flex-wrap items-center gap-x-7 gap-y-4 border-b border-[rgb(224,218,218)] bg-[rgb(237,233,233)] px-5 py-[14px] shadow-[0_1px_10px_rgba(60,50,50,0.06)] max-[820px]:flex-col max-[820px]:items-stretch max-[820px]:gap-y-3 max-[820px]:px-4 max-[820px]:py-2">
      {/* On narrow screens: left-aligned and shrunk so it clears the fixed
          HelpStar in the top-right corner instead of colliding with it. */}
      <h1 className="m-0 whitespace-nowrap text-2xl font-bold text-black max-[820px]:pr-14 max-[820px]:text-left max-[820px]:text-lg">
        Make a color pattern!
      </h1>
      <div className={collapsed ? "contents max-[820px]:hidden" : "contents"}>
        <Controls settings={settings} onChange={onChange} />
      </div>
      <div className="flex items-center gap-3 self-end max-[820px]:flex-wrap max-[820px]:justify-center max-[820px]:gap-y-2 max-[820px]:self-auto">
        <button
          type="button"
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[rgb(216,210,210)] bg-white px-4 py-[10px] text-[0.9rem] font-bold text-black transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[rgb(216,210,210)] disabled:hover:text-black ${mobileShrink}`}
          disabled={!canRevert}
          aria-label="revert last step"
          data-tooltip="Revert last step (Ctrl+Z)"
          onClick={onRevert}
        >
          <Icon name="revert" size={24} className="flex-none" />
        </button>
        <button
          type="button"
          className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[rgb(216,210,210)] bg-white px-4 py-[10px] text-[0.9rem] font-bold text-black transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[rgb(216,210,210)] disabled:hover:text-black ${mobileShrink}`}
          disabled={!canClear}
          aria-label="clear canvas"
          data-tooltip="Clear canvas"
          onClick={onClear}
        >
          <Icon name="clear" size={24} className="flex-none" />
        </button>
        
        <button
          type="button"
          className={`cursor-pointer rounded-lg bg-brand px-4 py-[10px] text-[0.9rem] font-bold text-black shadow-[0_2px_10px_rgba(214,40,40,0.28)] transition-transform duration-150 ease-[ease] hover:scale-105 focus-visible:scale-105 focus-visible:outline-none ${mobileShrink}`}
          aria-label="export pattern"
          data-tooltip="Export pattern"
          onClick={onExport}
        >
          <Icon name="download" size={24} className="flex-none" />
        </button>
        <input
          id="import-pattern"
          type="file"
          className="peer sr-only"
          accept={ACCEPTED_PROJECT_TYPES}
          ref={importRef}
          onChange={handleImport}
        />
        <label
          htmlFor="import-pattern"
          className={`cursor-pointer rounded-lg border border-brand bg-transparent px-4 py-[10px] text-center text-[0.9rem] font-bold text-brand transition-transform duration-150 ease-[ease] hover:scale-105 peer-focus-visible:scale-105 peer-focus-visible:outline-none ${mobileShrink}`}
        >
          Import
        </label>
        <div className="ml-1 flex items-center gap-1 rounded-lg border border-[rgb(216,210,210)] bg-white px-1 py-1">
          <button
            type="button"
            className={`inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-2xl font-bold leading-none text-black transition-colors hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-black ${mobileShrink}`}
            aria-label="zoom out"
            data-tooltip="Zoom out"
            disabled={!canZoomOut}
            onClick={onZoomOut}
          >
            −
          </button>
          <span className="min-w-[3.25rem] text-center text-[0.9rem] font-bold tabular-nums text-black" aria-live="polite">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            className={`inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-2xl font-bold leading-none text-black transition-colors hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-black ${mobileShrink}`}
            aria-label="zoom in"
            data-tooltip="Zoom in"
            disabled={!canZoomIn}
            onClick={onZoomIn}
          >
            +
          </button>
        </div>
      </div>
    </header>
  );
}
