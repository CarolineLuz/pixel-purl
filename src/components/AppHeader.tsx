import { useLayoutEffect, useRef, type ChangeEvent, type RefObject } from "react";
import { ACCEPTED_PROJECT_TYPES } from "../config/editor";
import { useScrolledPast } from "../hooks/useScrolledPast";
import type { MittenSettings } from "../lib/patternGenerator";
import { Controls } from "./Controls";
import { Icon } from "./Icon";
import {
  collapsibleControls,
  headerExportButton,
  headerImportButton,
  headerToolButton,
  headerZoomButton,
} from "../styles/ui";

/** Keeps `--app-header-height` in sync with the header's rendered height (even mid collapse-animation) so the sticky toolbars in App.tsx can offset their `top` right underneath it. */
function useStickyHeaderHeightVar(headerRef: RefObject<HTMLElement | null>) {
  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const observer = new ResizeObserver(() => {
      document.documentElement.style.setProperty("--app-header-height", `${header.offsetHeight}px`);
    });
    observer.observe(header);
    return () => observer.disconnect();
  }, [headerRef]);
}

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
  useStickyHeaderHeightVar(headerRef);

  const handleImportThenClearSelection = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImport(file);
    // Clear so re-picking the same file still fires a change event.
    e.target.value = "";
  };

  return (
    <header ref={headerRef} className="sticky top-0 z-10 flex flex-wrap items-center gap-x-4 gap-y-4 border-b border-[rgb(224,218,218)] bg-[rgb(237,233,233)] px-5 py-[14px] shadow-[0_1px_10px_rgba(60,50,50,0.06)] max-[820px]:flex-col max-[820px]:items-stretch max-[820px]:gap-y-3 max-[820px]:px-4 max-[820px]:py-2">
      {/* pr-14 on mobile keeps the title clear of the fixed HelpStar in the corner. */}
      <h1 className="m-0 whitespace-nowrap text-2xl font-bold text-black max-[820px]:pr-14 max-[820px]:text-left max-[820px]:text-lg">
        Make a color pattern!
      </h1>
      <div className={collapsibleControls(collapsed)}>
        <div className="min-h-0 overflow-hidden min-[821px]:contents">
          <Controls settings={settings} onChange={onChange} />
        </div>
      </div>
      <div className="flex items-center gap-3 self-end max-[820px]:flex-wrap max-[820px]:justify-center max-[820px]:gap-y-2 max-[820px]:self-auto">
        <button
          type="button"
          className={headerToolButton}
          disabled={!canRevert}
          aria-label="revert last step"
          data-tooltip="Revert last step (Ctrl+Z)"
          onClick={onRevert}
        >
          <Icon name="revert"  className="flex-none min-[821px]:size-4" />
        </button>
        <button
          type="button"
          className={headerToolButton}
          disabled={!canClear}
          aria-label="clear canvas"
          data-tooltip="Clear canvas"
          onClick={onClear}
        >
          <Icon name="clear" className="flex-none min-[821px]:size-4" />
        </button>

        <button
          type="button"
          className={headerExportButton}
          aria-label="export pattern"
          data-tooltip="Export pattern"
          onClick={onExport}
        >
          <Icon name="download" className="flex-none min-[821px]:size-4" />
        </button>
        <input
          id="import-pattern"
          type="file"
          className="peer sr-only"
          accept={ACCEPTED_PROJECT_TYPES}
          ref={importRef}
          onChange={handleImportThenClearSelection}
        />
        <label htmlFor="import-pattern" className={headerImportButton}>
          Import
        </label>
        <div className="ml-1 flex items-center gap-1 rounded-lg border border-[rgb(216,210,210)] bg-white px-1 py-0.5">
          <button
            type="button"
            className={headerZoomButton}
            aria-label="zoom out"
            data-tooltip="Zoom out"
            disabled={!canZoomOut}
            onClick={onZoomOut}
          >
            −
          </button>
          <span className="min-w-[3.25rem] min-[821px]:min-w-[2.75rem] text-center text-[0.9rem] min-[821px]:text-xs font-bold tabular-nums text-black" aria-live="polite">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            className={headerZoomButton}
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
