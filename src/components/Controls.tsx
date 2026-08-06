import { GRID_CONTROLS, specKey } from "../config/controls";
import type { MittenSettings } from "../lib/patternGenerator";
import { SettingControl } from "./SettingControl";

interface ControlsProps {
  settings: MittenSettings;
  onChange: (key: keyof MittenSettings, value: number | boolean) => void;
}

/** The always-visible grid controls in the header. */
export function Controls({ settings, onChange }: ControlsProps) {
  return (
    <form
      className="m-0 flex flex-wrap items-end gap-x-5 gap-y-3 max-[820px]:flex-col max-[820px]:items-stretch max-[820px]:gap-y-2"
      onSubmit={(e) => e.preventDefault()}
    >
      {GRID_CONTROLS.map((spec) => (
        <SettingControl
          key={specKey(spec)}
          spec={spec}
          settings={settings}
          onChange={onChange}
        />
      ))}
    </form>
  );
}
