export type IconName = "draw" | "select" | "image" | "revert" | "download" | "fill" | "row" | "column" | "clear" | "copy" | "paste" | "move" | "close";

export type IconVariant = "fill" | "stroke" | "currentColor";

export interface IconDef {
  variant: IconVariant;
  paths: string[];
}

export const ICONS: Record<IconName, IconDef> = {
  draw: {
    variant: "fill",
    paths: [
      "M18 2h-2v2h-2v2h-2v2h-2v2H8v2H6v2H4v2H2v6h6v-2h2v-2h2v-2h2v-2h2v-2h2v-2h2V8h2V6h-2V4h-2zm0 8h-2v2h-2v2h-2v2h-2v2H8v-2H6v-2h2v-2h2v-2h2V8h2V6h2v2h2zM6 16H4v4h4v-2H6z",
    ],
  },
  select: {
    variant: "fill",
    paths: [
      "M5 3H3v2h2zm2 0h2v2H7zm6 0h-2v2h2zm2 0h2v2h-2zm4 0h2v2h-2zM3 7h2v2H3zm2 4H3v2h2zm-2 4h2v2H3zm2 4H3v2h2zm2 0h2v2H7zm6 0h-2v2h2zm6-8h2v2h-2zm2-4h-2v2h2zm-6 10v-2h6v2h-2v2h-2v2h-2zm4 2v2h2v-2z"
    ],
  },
  image: {
    variant: "fill",
    paths: [
      "M4 2h16v2H4zm0 18h16v2H4zM2 4h2v16H2zm18 0h2v16h-2zm-4 8h2v2h-2zm-2 2h2v2h-2zm4 0h2v2h-2zm-8 0h2v2h-2zm2 2h2v2h-2zm2 2h2v2h-2z",
      "M20 16h2v2h-2zM8 16h2v2H8zm-2 2h2v2H6zM8 6h2v2H8zM6 8h2v2H6zm2 2h2v2H8zm2-2h2v2h-2z",
    ],
  },
  revert: {
    variant: "fill",
    paths: [
      "M18 8H4v2h14zm2 2h-2v10h2zM8 14h2v-2H8zm-2-2h2v-2H6zm0-4h2V6H6z",
      "M8 12h2V4H8z"
    ],
  },
  download: {
    variant: "fill",
    paths: [
      "M4 20h16v2H4zm7-18h2v16h-2zm2 12h2v2h-2zm2-2h2v2h-2zm2-2h2v2h-2zm-8 4h2v2H9zm-2-2h2v2H7zm-2-2h2v2H5z"
    ],
  },
  fill: {
    variant: "currentColor",
    paths: [
      "M9 2h2v2H9zm4 4V4h-2v2H9v2H7v2H5v2H3v2h2v2h2v2h2v2h2v2h2v-2h2v-2h2v-2h2v6h2V12h-2v-2h-2V8h-2V6zm0 0v2h2v2h2v2h2v2H5v-2h2v-2h2V8h2V6z"
    ]
  },
  row: {
    variant: "currentColor",
    paths: [
      "M3 9h2v2H3zm8 0h2v2h-2zm8 0h2v2h-2zM1 11h2v2H1zm8 0h2v2H9zm8 0h2v2h-2zM3 13h2v2H3zm8 0h2v2h-2zm8 0h2v2h-2zM5 11h2v2H5zm8 0h2v2h-2zm8 0h2v2h-2z"
    ]
  },
  column: {
    variant: "currentColor",
    paths: [
      "M15 3v2h-2V3zm0 8v2h-2v-2zm0 8v2h-2v-2zM13 1v2h-2V1zm0 8v2h-2V9zm0 8v2h-2v-2zM11 3v2H9V3zm0 8v2H9v-2zm0 8v2H9v-2zm2-14v2h-2V5zm0 8v2h-2v-2zm0 8v2h-2v-2z"
    ]
  },
  clear: {
    variant: "fill",
    paths: [
      "M9 3h6v2H9zM5 6h14v2H5zM6 8h2v13H6zm10 0h2v13h-2zm-8 11h8v2H8zm1-9h2v7H9zm4 0h2v7h-2z"
    ]
  },
  copy: {
    variant: "fill",
    paths: [
      "M8 6h12v2H8zM4 2h12v2H4zm2 6h2v12H6zM2 4h2v12H2zm6 16h12v2H8zM20 8h2v12h-2zm-4-4h2v2h-2zM4 16h2v2H4z"
    ]
  },
  paste: {
    variant: "fill",
    paths: [
      "M22 4H2v16h10v-2H4V6h16v4h2zm-3 13h3v-2h-3v-3h-2v3h-3v2h3v3h2z"
    ]
  },
  move: {
    variant: "currentColor",
    paths: [
      "M13 0h-2v2H9v2H7v2h2V4h2v7H4V9h2V7H4v2H2v2H0v2h2v2h2v2h2v-2H4v-2h7v7H9v-2H7v2h2v2h2v2h2v-2h2v-2h2v-2h-2v2h-2v-7h7v2h-2v2h2v-2h2v-2h2v-2h-2V9h-2V7h-2v2h2v2h-7V4h2v2h2V4h-2V2h-2z"
    ]
  },
  close: {
    variant: "currentColor",
    paths: [
      "M7 19H5v-2h2zm12 0h-2v-2h2zM9 15v2H7v-2zm8 2h-2v-2h2zm-6-2H9v-2h2zm4 0h-2v-2h2zm-2-2h-2v-2h2zm-2-2H9V9h2zm4 0h-2V9h2zM9 9H7V7h2zm8 0h-2V7h2zM7 7H5V5h2zm12 0h-2V5h2z"
    ]
  }
};
