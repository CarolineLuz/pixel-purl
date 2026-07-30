import { useRef, type ChangeEvent } from "react";
import { ACCEPTED_PROJECT_TYPES } from "../config/editor";
import type { MittenSettings } from "../lib/patternGenerator";
import { Controls } from "./Controls";
import { Icon } from "./Icon";

interface AppHeaderProps {
  settings: MittenSettings;
  onChange: (key: keyof MittenSettings, value: number | boolean) => void;
  canRevert: boolean;
  onRevert: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
}

/** Title, the grid controls, and the revert / export / import buttons. */
export function AppHeader({ settings, onChange, canRevert, onRevert, onExport, onImport }: AppHeaderProps) {
  const importRef = useRef<HTMLInputElement>(null);

  const handleImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onImport(file);
    // Reset so choosing the same file again still fires a change event.
    e.target.value = "";
  };

  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center gap-x-7 gap-y-4 border-b border-[rgb(224,218,218)] bg-[rgb(237,233,233)] px-5 py-[14px] shadow-[0_1px_10px_rgba(60,50,50,0.06)] max-[600px]:flex-col max-[600px]:items-stretch">
      <h1 className="m-0 whitespace-nowrap text-2xl font-bold text-black max-[600px]:text-center">
        Make a color pattern!
      </h1>
      <Controls settings={settings} onChange={onChange} />
      <div className="flex items-center gap-3 self-end max-[600px]:self-auto">
        <button
          type="button"
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[rgb(216,210,210)] bg-white px-4 py-[10px] text-[0.9rem] font-bold text-black transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[rgb(216,210,210)] disabled:hover:text-black"
          disabled={!canRevert}
          aria-label="revert last step"
          title="Revert last step (Ctrl+Z)"
          onClick={onRevert}
        >
          <Icon name="revert" size={24} className="flex-none" />
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
          className="cursor-pointer rounded-lg border border-brand bg-transparent px-4 py-[10px] text-[0.9rem] font-bold text-brand transition-transform duration-150 ease-[ease] hover:scale-105 peer-focus-visible:scale-105 peer-focus-visible:outline-none"
        >
          Import
        </label>
        <button
          type="button"
          className="cursor-pointer rounded-lg bg-brand px-4 py-[10px] text-[0.9rem] font-bold text-black shadow-[0_2px_10px_rgba(214,40,40,0.28)] transition-transform duration-150 ease-[ease] hover:scale-105 focus-visible:scale-105 focus-visible:outline-none"
          onClick={onExport}
        >
          <Icon name="download" size={24} className="flex-none" />
        </button>
      </div>
    </header>
  );
}
