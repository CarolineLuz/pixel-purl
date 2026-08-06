/**
 * Layout for the three stacked collapsible toolbars (draw, image, select).
 *
 * Values are kept as complete literal Tailwind classes rather than being
 * assembled from numbers: Tailwind's JIT only generates arbitrary-value
 * utilities (`top-[150px]`, `left-[120px]`, …) that it can find as literal
 * strings in source, so interpolating the pixel values would silently drop
 * the styles.
 *
 * `maxHeight` caps the scroll region: the vertical offset + 16px gap + the
 * panel's 32px vertical padding, so the panel bottom clears the viewport.
 */
export interface ToolbarLayout {
  /** Vertical offset from the top of the viewport. */
  top: string;
  /** Max-height of the scrollable body once expanded. */
  maxHeight: string;
  /** Panel width once expanded (desktop only). */
  width: string;
}

export const TOOLBAR_LAYOUTS = {
  draw: {
    top: "top-[150px]",
    maxHeight: "max-h-[calc(100vh_-_198px)]",
    width: "min-[821px]:w-[120px]",
  },
  image: {
    top: "top-[205px]",
    maxHeight: "max-h-[calc(100vh_-_253px)]",
    width: "min-[821px]:w-[160px]",
  },
  select: {
    top: "top-[260px]",
    maxHeight: "max-h-[calc(100vh_-_308px)]",
    width: "min-[821px]:w-[140px]",
  },
} satisfies Record<string, ToolbarLayout>;
