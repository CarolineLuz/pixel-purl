import type { MittenSettings } from "../types/pattern";

export const STITCH_SIZE = 10;

export const LABEL_MARGIN = 24;

export const INK_COLORS = {
  black: "black",
  grey: "grey",
  white: "white",
  crimson: "crimson",
  red: "red",
  coral: "coral",
  orange: "orange",
  gold: "gold",
  yellow: "yellow",
  olive: "olive",
  green: "green",
  lime: "limegreen",
  teal: "teal",
  cyan: "darkcyan",
  aqua: "aqua",
  skyblue: "skyblue",
  royalblue: "royalblue",
  blue: "blue",
  navy: "navy",
  indigo: "indigo",
  purple: "purple",
  violet: "violet",
  magenta: "magenta",
  hotpink: "hotpink",
  pink: "pink",
  brown: "saddlebrown",
  tan: "tan",
} as const;

export type Tool = keyof typeof INK_COLORS;

export const defaultSettings: MittenSettings = {
  stitches: 100,
  rows: 50,
  offsetX: 0,
  offsetY: 0,
  size: 100,
  rotation: 0,
  brightness: 0,
  edgeThickness: 0,
  edgeSensitivity: 50,
  numColors: 3,
};
