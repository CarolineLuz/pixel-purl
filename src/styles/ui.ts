// Shared Tailwind class strings for the UI chrome reused across components:
// the labelled form controls (formerly the .control / .control__pair CSS rules)
// and the left-rail toolbars shared by the draw, image, and select tools.

/** A labelled control: label stacked above its input(s). */
export const control = "flex flex-col gap-1";

/** The label above a control. */
export const controlLabel = "text-xs whitespace-nowrap";

/** A number input paired inline with its slider. */
export const controlPair = "flex items-center gap-2";

/** Numeric text inputs. */
export const numberInput =
  "w-16 rounded-md border border-[rgb(216,210,210)] bg-white px-1.5 py-1 text-[0.85rem] focus:border-brand focus:outline-none";

/** A slider sitting next to a number input (fixed width). */
export const rangePaired = "block w-[120px] accent-brand";

/** A standalone slider that fills the toolbar, narrowing to a fixed width on
 *  small screens where the toolbar becomes a horizontal bar. */
export const rangeFull = "block w-full accent-brand max-[600px]:w-[120px]";

/** Positioning + layout shared by the fixed left-rail toolbars (draw + image +
 *  select). Each grows downward from its own top so opening one never shifts the
 *  other's collapsed button. On narrow screens they drop out of the fixed rail
 *  (the `.contents` wrapper flows them instead) but stay a vertical column, so an
 *  expanded panel stacks its controls as full-width rows.
 *  Panel chrome (border/background/padding) lives in `toolbarPanel` and is only
 *  applied while expanded, so a collapsed toolbar shows just its labelled button.
 *  Callers add their own `top`, `max-h`, and `gap`. */
export const toolbarBase =
  "fixed left-0 z-[15] m-0 flex flex-col items-stretch overflow-y-auto max-[600px]:static max-[600px]:max-h-none";

/** The rounded card chrome for an expanded toolbar. Applied only while open. A
 *  soft drop shadow lifts the open panel off the canvas; on narrow screens it
 *  flattens into a full-width bar with no shadow or side borders, and `order-1`
 *  drops it below the row of collapsed toggle links rather than splitting them. */
export const toolbarPanel =
  "rounded-r-xl border border-l-0 border-[rgb(224,218,218)] bg-[rgb(248,245,245)] px-4 py-4 shadow-[3px_4px_18px_rgba(60,50,50,0.12)] max-[600px]:order-1 max-[600px]:-ml-4 max-[600px]:w-[calc(100%_+_2rem)] max-[600px]:rounded-none max-[600px]:border-x-0 max-[600px]:border-b max-[600px]:bg-[rgb(237,233,233)] max-[600px]:shadow-none";

/** The collapsed toolbar's toggle button ("drawing" / "image config") — a tab
 *  hugging the left edge of the viewport, so the three rails read as one group.
 *  On narrow screens the tab chrome falls away and it becomes a plain underlined
 *  text link, so the three collapsed toolbars read as one horizontal row of
 *  links (laid out by the flex row on the `.contents` wrapper). */
export const toolbarModeBtn =
  "cursor-pointer rounded-r-lg border border-l-0 border-[rgb(224,218,218)] bg-[rgb(238,233,233)] px-3.5 py-2 text-[0.8rem] font-bold shadow-[2px_2px_10px_rgba(60,50,50,0.10)] transition-colors hover:bg-[rgb(231,224,224)] hover:text-brand max-[600px]:rounded-none max-[600px]:border-0 max-[600px]:bg-transparent max-[600px]:p-0 max-[600px]:font-normal max-[600px]:underline max-[600px]:underline-offset-2 max-[600px]:shadow-none max-[600px]:hover:bg-transparent";

/** The expanded toolbar's close (×) button. */
export const toolbarCloseBtn =
  "mb-1 cursor-pointer self-end border-none bg-transparent px-1 py-0 text-[1.6rem] leading-none text-black transition-colors hover:text-brand";

/** Secondary action button (revert / clear / copy / paste …): white with a soft
 *  border that picks up the brand colour on hover. Shared by the draw + select
 *  toolbars so they stay visually identical. */
export const actionBtn =
  "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-[rgb(216,210,210)] bg-white px-3 py-1.5 text-[0.8rem] transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[rgb(216,210,210)] disabled:hover:text-inherit";

/** A short muted hint / group label used inside the toolbars. */
export const hint = "text-[0.7rem] leading-[1.3] text-[rgb(118,112,112)]";
