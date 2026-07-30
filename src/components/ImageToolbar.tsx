import { IMAGE_CONTROLS, specKey } from "../config/controls";
import type { MittenSettings } from "../lib/patternGenerator";
import {
  toolbarBase,
  toolbarCloseBtn,
  toolbarModeBtn,
  toolbarPanel,
} from "../styles/ui";
import { ImagePicker } from "./ImagePicker";
import { SettingControl } from "./SettingControl";

interface ImageToolbarProps {
  settings: MittenSettings;
  hasImage: boolean;
  /** Whether the toolbar is expanded (controlled by the parent). */
  open: boolean;
  onToggleOpen: () => void;
  onChange: (key: keyof MittenSettings, value: number | boolean) => void;
  onImageChange: (file: File | null) => void;
}

export function ImageToolbar({
  settings,
  hasImage,
  open,
  onToggleOpen,
  onChange,
  onImageChange,
}: ImageToolbarProps) {
  return (
    <form
      className={`${toolbarBase} top-[205px] max-h-[calc(100vh_-_221px)] gap-3 ${
        open ? `${toolbarPanel} z-[16]` : ""
      }`}
      aria-label="image tools"
      onSubmit={(e) => e.preventDefault()}
    >
      <button
        type="button"
        className={open ? toolbarCloseBtn : toolbarModeBtn}
        aria-pressed={open}
        aria-label={open ? "hide image tools" : "grab image"}
        onClick={onToggleOpen}
      >
        {open ? (
          "×"
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <g fill="currentColor">
              <path d="M4 2h16v2H4zm0 18h16v2H4zM2 4h2v16H2zm18 0h2v16h-2zm-4 8h2v2h-2zm-2 2h2v2h-2zm4 0h2v2h-2zm-8 0h2v2h-2zm2 2h2v2h-2zm2 2h2v2h-2z" />
              <path d="M20 16h2v2h-2zM8 16h2v2H8zm-2 2h2v2H6zM8 6h2v2H8zM6 8h2v2H6zm2 2h2v2H8zm2-2h2v2h-2z" />
            </g>
          </svg>
        )}
      </button>

      {open && (
        <>
          <ImagePicker hasImage={hasImage} onImageChange={onImageChange} />
          {IMAGE_CONTROLS.map((spec) => (
            <SettingControl
              key={specKey(spec)}
              spec={spec}
              settings={settings}
              disabled={!hasImage}
              onChange={onChange}
            />
          ))}
        </>
      )}
    </form>
  );
}
