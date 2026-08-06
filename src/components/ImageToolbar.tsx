import { IMAGE_CONTROLS, specKey } from "../config/controls";
import { TOOLBAR_LAYOUTS } from "../config/toolbars";
import type { MittenSettings } from "../lib/patternGenerator";
import { CollapsibleToolbar } from "./CollapsibleToolbar";
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
    <CollapsibleToolbar
      as="form"
      open={open}
      onToggle={onToggleOpen}
      label="image tools"
      layout={TOOLBAR_LAYOUTS.image}
      collapsedIcon="image"
      collapsedLabel="grab image"
      expandedLabel="hide image tools"
    >
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
    </CollapsibleToolbar>
  );
}
