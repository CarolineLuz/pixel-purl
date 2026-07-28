// Declarative descriptions of the settings controls. The toolbars render these
// rather than repeating near-identical markup per field, so adding or retuning a
// control is a data change and every control keeps the same layout and a11y
// treatment. `SettingControl` knows how to render each `kind`.

import type { MittenSettings } from "../lib/patternGenerator";

type SettingKey = keyof MittenSettings;

interface ControlBase {
  key: SettingKey;
  /** Visible label above the control; also its accessible name. */
  label: string;
  /** When given, the control is only enabled if this holds. (It is disabled
   *  outright whenever the toolbar has nothing to act on.) */
  enabledWhen?: (settings: MittenSettings) => boolean;
}

interface Bounds {
  min: number;
  max: number;
}

/** A number input paired inline with its slider. */
export interface PairedControl extends ControlBase, Bounds {
  kind: "paired";
  /** Accessible name for the slider half, when "<label> slider" won't do. */
  sliderLabel?: string;
}

/** A standalone slider filling the toolbar's width. */
export interface SliderControl extends ControlBase, Bounds {
  kind: "slider";
}

/** A checkbox over a numeric setting, e.g. an on/off thickness. */
export interface ToggleControl extends ControlBase {
  kind: "toggle";
  on: number;
  off: number;
}

/** Two number inputs under one shared label, e.g. an (x, y) pair. */
export interface DuoControl extends Bounds {
  kind: "duo";
  label: string;
  fields: Array<{ key: SettingKey; ariaLabel: string }>;
  enabledWhen?: (settings: MittenSettings) => boolean;
}

export type ControlSpec =
  | PairedControl
  | SliderControl
  | ToggleControl
  | DuoControl;

/** Stable identity for a spec, for React keys. */
export const specKey = (spec: ControlSpec): string =>
  spec.kind === "duo" ? spec.label : spec.key;

/** Grid dimensions — always available, so they live in the header. */
export const GRID_CONTROLS: ControlSpec[] = [
  { kind: "paired", key: "stitches", label: "stitches", min: 15, max: 300 },
  { kind: "paired", key: "rows", label: "rows", min: 40, max: 500 },
];

/** Everything that only makes sense with an image loaded. */
export const IMAGE_CONTROLS: ControlSpec[] = [
  {
    kind: "duo",
    label: "start point (x, y)",
    min: -100,
    max: 100,
    fields: [
      { key: "offsetX", ariaLabel: "start point x" },
      { key: "offsetY", ariaLabel: "start point y" },
    ],
  },
  { kind: "slider", key: "size", label: "resize small/large", min: 0, max: 200 },
  {
    kind: "paired",
    key: "rotation",
    label: "rotate",
    sliderLabel: "rotation slider",
    min: -180,
    max: 180,
  },
  { kind: "paired", key: "numColors", label: "colors", min: 2, max: 10 },
  { kind: "slider", key: "brightness", label: "brightness", min: -200, max: 200 },
  { kind: "toggle", key: "edgeThickness", label: "enhance edges", on: 1, off: 0 },
  {
    kind: "slider",
    key: "edgeSensitivity",
    label: "edge sensitivity",
    min: 0,
    max: 100,
    enabledWhen: (settings) => settings.edgeThickness > 0,
  },
];
