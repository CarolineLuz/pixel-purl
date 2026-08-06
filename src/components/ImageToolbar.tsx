import { IMAGE_CONTROLS, specKey } from "../config/controls";
import type { MittenSettings } from "../lib/patternGenerator";
import { Icon } from "./Icon";
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
        open ? `${toolbarPanel} min-[821px]:z-[16] min-[821px]:w-[160px]` : ""
      }`}
      aria-label="image tools"
      onSubmit={(e) => e.preventDefault()}
    >
      <button
        type="button"
        className={
          open
            ? `${toolbarCloseBtn} min-[821px]:fixed min-[821px]:left-[160px] min-[821px]:top-[205px] min-[821px]:z-[17] min-[821px]:-translate-x-1/2 min-[821px]:-translate-y-1/2`
            : toolbarModeBtn
        }
        aria-pressed={open}
        aria-label={open ? "hide image tools" : "grab image"}
        onClick={onToggleOpen}
      >
        {open ? <Icon name="close" /> : <Icon name="image" />}
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
