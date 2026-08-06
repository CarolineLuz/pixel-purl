import type { ChangeEvent } from "react";
import type { ControlSpec } from "../config/controls";
import type { MittenSettings } from "../lib/patternGenerator";
import {
  control,
  controlLabel,
  controlPair,
  controlToggle,
  numberInput,
  rangeFull,
  rangePaired,
} from "../styles/ui";

interface SettingControlProps {
  spec: ControlSpec;
  settings: MittenSettings;
  /** Disabled for reasons outside the spec — e.g. no image is loaded yet. */
  disabled?: boolean;
  onChange: (key: keyof MittenSettings, value: number | boolean) => void;
}

/** Renders one {@link ControlSpec}. The single place that decides what a
 *  labelled setting looks like, so all of them stay consistent. */
export function SettingControl({
  spec,
  settings,
  disabled = false,
  onChange,
}: SettingControlProps) {
  const off = disabled || (spec.enabledWhen ? !spec.enabledWhen(settings) : false);

  const handleNumber =
    (key: keyof MittenSettings) => (e: ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(e.target.value, 10);
      onChange(key, Number.isNaN(value) ? 0 : value);
    };

  if (spec.kind === "duo") {
    const [first] = spec.fields;
    return (
      <div className={control}>
        <label htmlFor={first.key} className={controlLabel}>
          {spec.label}
        </label>
        <div className={controlPair}>
          {spec.fields.map((field) => (
            <input
              key={field.key}
              id={field.key}
              name={field.key}
              type="number"
              className={numberInput}
              aria-label={field.ariaLabel}
              min={spec.min}
              max={spec.max}
              value={settings[field.key]}
              disabled={off}
              onChange={handleNumber(field.key)}
            />
          ))}
        </div>
      </div>
    );
  }

  if (spec.kind === "toggle") {
    return (
      <div className={controlToggle}>
        <label htmlFor={spec.key} className={controlLabel}>
          {spec.label}
        </label>
        <input
          id={spec.key}
          name={spec.key}
          type="checkbox"
          checked={settings[spec.key] > spec.off}
          disabled={off}
          onChange={(e) => onChange(spec.key, e.target.checked ? spec.on : spec.off)}
        />
      </div>
    );
  }

  const slider = (
    <input
      id={spec.kind === "slider" ? spec.key : undefined}
      aria-label={
        spec.kind === "paired"
          ? (spec.sliderLabel ?? `${spec.label} slider`)
          : undefined
      }
      name={spec.kind === "paired" ? `${spec.key}-slider` : spec.key}
      type="range"
      className={spec.kind === "paired" ? rangePaired : rangeFull}
      min={spec.min}
      max={spec.max}
      value={settings[spec.key]}
      disabled={off}
      onChange={handleNumber(spec.key)}
    />
  );

  return (
    <div className={control}>
      <label htmlFor={spec.key} className={controlLabel}>
        {spec.label}
      </label>
      {spec.kind === "slider" ? (
        slider
      ) : (
        <div className={controlPair}>
          <input
            id={spec.key}
            name={spec.key}
            type="number"
            className={numberInput}
            min={spec.min}
            max={spec.max}
            value={settings[spec.key]}
            disabled={off}
            onChange={handleNumber(spec.key)}
          />
          {slider}
        </div>
      )}
    </div>
  );
}
