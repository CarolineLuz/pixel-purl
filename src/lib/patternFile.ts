// Save/restore an editing session to and from a `.pattern` file. The exported
// PNG is only a picture; this JSON file carries everything the editor needs to
// reopen the pattern exactly as it was — the controls, the hand-drawn stitches,
// the colour reassignments and the source image — so a downloaded pattern can be
// imported later and edited on.
//
// The image palette is *not* stored: it is re-derived from the image and colour
// count by {@link extractPalette}, which is deterministic, so a reload reproduces
// the identical palette (and therefore the same colour-reassignment keys).

import {
  defaultSettings,
  type ColorRemap,
  type MittenSettings,
  type PatternOverrides,
} from "./patternGenerator";

/** Marker identifying our files, so a stray JSON file is rejected cleanly. */
const FORMAT = "mitten-maker/pattern";

/** File-format version, bumped only if the shape below changes incompatibly. */
const VERSION = 1;

/** Everything needed to restore an editing session (Maps kept live, ready to
 *  hand straight back to the editor's state). */
export interface PatternProject {
  settings: MittenSettings;
  overrides: PatternOverrides;
  colorRemap: ColorRemap;
  /** Active paint colour. */
  color: string;
  /** Source image as a data URL, or null when there is no image. */
  image: string | null;
}

/** On-disk shape: Maps flattened to `[key, value]` arrays so they survive JSON. */
interface SerializedProject {
  format: typeof FORMAT;
  version: number;
  settings: MittenSettings;
  overrides: [string, string][];
  colorRemap: [string, string][];
  color: string;
  image: string | null;
}

/** Serialize a project to the JSON text written into a `.pattern` file. */
export function serializeProject(project: PatternProject): string {
  const payload: SerializedProject = {
    format: FORMAT,
    version: VERSION,
    settings: project.settings,
    overrides: [...project.overrides],
    colorRemap: [...project.colorRemap],
    color: project.color,
    image: project.image,
  };
  return JSON.stringify(payload);
}

/**
 * Parse the text of a `.pattern` file back into a {@link PatternProject}.
 * Throws a user-facing {@link Error} if the file isn't ours or is corrupt, so
 * the caller can surface the message; unknown settings keys are ignored and
 * missing ones fall back to their defaults, so a slightly newer/older file still
 * opens.
 */
export function deserializeProject(text: string): PatternProject {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error("That file isn't a pattern — it isn't valid JSON.");
  }

  if (!isRecord(raw) || raw.format !== FORMAT) {
    throw new Error("That file isn't a Mitten Maker pattern.");
  }
  if (typeof raw.image !== "string" && raw.image !== null && raw.image !== undefined) {
    throw new Error("That pattern file is corrupt (bad image data).");
  }

  return {
    settings: readSettings(raw.settings),
    overrides: new Map(readEntries(raw.overrides)),
    colorRemap: new Map(readEntries(raw.colorRemap)),
    color: typeof raw.color === "string" ? raw.color : "black",
    image: typeof raw.image === "string" ? raw.image : null,
  };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** Read settings leniently: take each known numeric control if present and
 *  finite, otherwise keep the default. Extra keys are dropped. */
function readSettings(raw: unknown): MittenSettings {
  const o = isRecord(raw) ? raw : {};
  const out = { ...defaultSettings };
  for (const key of Object.keys(defaultSettings) as (keyof MittenSettings)[]) {
    const v = o[key];
    if (typeof v === "number" && Number.isFinite(v)) out[key] = v;
  }
  return out;
}

/** Keep only well-formed `[string, string]` pairs; silently drop the rest. */
function readEntries(raw: unknown): [string, string][] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (e): e is [string, string] =>
      Array.isArray(e) &&
      e.length === 2 &&
      typeof e[0] === "string" &&
      typeof e[1] === "string",
  );
}
