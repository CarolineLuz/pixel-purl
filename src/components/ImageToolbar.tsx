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
      className={`${toolbarBase} top-[205px] max-h-[calc(100vh_-_221px)] gap-3 max-[600px]:items-end ${
        open ? `${toolbarPanel} z-[16]` : ""
      }`}
      aria-label="image tools"
      onSubmit={(e) => e.preventDefault()}
    >
      <button
        type="button"
        className={open ? toolbarCloseBtn : toolbarModeBtn}
        aria-pressed={open}
        aria-label={open ? "hide image tools" : undefined}
        onClick={onToggleOpen}
      >
        {open ? "×" : "image config"}
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
