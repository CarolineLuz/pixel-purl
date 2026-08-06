export const mobileShrink = "max-[820px]:scale-70";

export const control = "flex flex-col gap-1";

export const controlToggle = "flex items-center gap-2";

export const controlLabel = "text-xs whitespace-nowrap";

export const controlPair = "flex items-center gap-2";

export const numberInput =
  "w-16 rounded-md border border-[rgb(216,210,210)] bg-white px-1.5 py-1 text-[0.85rem] focus:border-brand focus:outline-none";

export const rangePaired =
  "block w-[120px] accent-brand max-[820px]:w-auto max-[820px]:grow";

export const rangeFull = "block w-full accent-brand max-[820px]:w-[120px]";

export const toolbarBase =
  "fixed left-0 min-[821px]:z-[15] m-0 flex flex-col items-stretch overflow-y-auto max-[820px]:static max-[820px]:max-h-none";

export const toolbarPanel =
  "rounded-r-xl border border-l-0 border-[rgb(224,218,218)] bg-[rgb(248,245,245)] px-4 py-4 s] max-[820px]:relative max-[820px]:order-1 max-[820px]:-ml-4 max-[820px]:w-[calc(100%_+_2rem)] max-[820px]:rounded-none max-[820px]:border-0 max-[820px]:bg-[rgb(237,233,233)] max-[820px]:pr-8 max-[820px]:shadow-none";

export const toolbarModeBtn =
  `cursor-pointer rounded-r-lg border border-l-0 border-[rgb(224,218,218)] bg-[rgb(238,233,233)] px-3.5 py-2 text-[0.8rem] font-bold shadow-[2px_2px_10px_rgba(60,50,50,0.10)] transition-colors hover:bg-[rgb(231,224,224)] hover:text-brand max-[820px]:rounded-none max-[820px]:border-0 max-[820px]:bg-transparent max-[820px]:p-0 max-[820px]:font-normal max-[820px]:underline max-[820px]:underline-offset-2 max-[820px]:shadow-none max-[820px]:hover:bg-transparent ${mobileShrink}`;

export const toolbarCloseBtn =
  `mb-1 cursor-pointer self-end border-none bg-transparent px-1 py-0 text-[1.6rem] leading-none text-black transition-colors hover:text-brand max-[820px]:absolute max-[820px]:right-2 max-[820px]:top-2 max-[820px]:z-[1] max-[820px]:mb-0 ${mobileShrink}`;

export const actionBtn =
  `inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-[rgb(216,210,210)] bg-white px-3 py-1.5 text-[0.8rem] transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[rgb(216,210,210)] disabled:hover:text-inherit ${mobileShrink}`;

export const actionBtnSquare =
  `inline-flex size-12 cursor-pointer items-center justify-center rounded-md border border-[rgb(216,210,210)] bg-white text-[0.8rem] transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[rgb(216,210,210)] disabled:hover:text-inherit ${mobileShrink}`;

export const toggleBtn = (active: boolean, extra = "") =>
  `inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-[0.8rem] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${mobileShrink} ${
    active
      ? "border-brand bg-brand text-black"
      : "border-[rgb(216,210,210)] bg-white text-black hover:border-brand hover:text-brand disabled:hover:border-[rgb(216,210,210)] disabled:hover:text-black"
  } ${extra}`;

export const iconToggleBtn = (active: boolean) =>
  `inline-flex cursor-pointer items-center justify-center rounded-md border p-2 transition-colors ${mobileShrink} ${
    active
      ? "border-brand bg-brand text-black"
      : "border-[rgb(216,210,210)] bg-white text-black hover:border-brand hover:text-brand"
  }`;

export const hint = "text-[0.8rem] leading-[1.3] text-[rgb(51, 47, 47)]";
