export const mobileShrink = "max-[820px]:scale-90";

export const control = "flex flex-col gap-1";

export const controlToggle = "flex items-center gap-2";

export const controlLabel = "text-xs whitespace-nowrap";

export const controlPair = "flex items-center gap-2";

export const numberInput =
  "w-[3.4rem] rounded-md border border-[rgb(216,210,210)] bg-white px-[5px] py-[3px] text-[0.72rem] focus:border-brand focus:outline-none min-[821px]:w-[2.6rem] min-[821px]:text-[0.68rem]";

export const rangePaired =
  "block w-[80px] accent-brand max-[820px]:w-auto max-[820px]:grow";

export const rangeFull = "block w-[70%] accent-brand max-[820px]:w-[102px]";

export const toolbarBase =
  "fixed left-0 min-[821px]:z-[15] m-0 flex flex-col items-stretch max-[820px]:static";

export const toolbarScroll =
  "flex flex-col items-stretch gap-2 overflow-y-auto max-[820px]:max-h-none";

export const toolbarPanel =
  "rounded-r-xl border border-l-0 border-[rgb(224,218,218)] bg-[rgb(248,245,245)] px-4 py-4 s] max-[820px]:relative max-[820px]:order-1 max-[820px]:-ml-4 max-[820px]:w-[calc(100%_+_2rem)] max-[820px]:rounded-none max-[820px]:border-0 max-[820px]:bg-[rgb(237,233,233)] max-[820px]:pr-8 max-[820px]:shadow-none";

export const toolbarModeBtn =
  `cursor-pointer rounded-r-lg border border-l-0 border-[rgb(224,218,218)] bg-[rgb(238,233,233)] px-3.5 py-2 text-[0.8rem] font-bold shadow-[2px_2px_10px_rgba(60,50,50,0.10)] transition-colors hover:bg-[rgb(231,224,224)] hover:text-brand max-[820px]:rounded-none max-[820px]:border-0 max-[820px]:bg-transparent max-[820px]:p-0 max-[820px]:font-normal max-[820px]:underline max-[820px]:underline-offset-2 max-[820px]:shadow-none max-[820px]:hover:bg-transparent ${mobileShrink}`;

export const toolbarCloseBtn =
  `absolute z-[17] cursor-pointer border-none bg-transparent px-1 py-0 text-[1.6rem] leading-none text-black transition-colors hover:text-brand min-[821px]:left-full min-[821px]:top-0 min-[821px]:ml-0 max-[820px]:right-2 max-[820px]:top-1 ${mobileShrink}`;

export const actionBtn =
  `inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-[rgb(216,210,210)] bg-white px-3 py-1.5 text-[0.8rem] transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[rgb(216,210,210)] disabled:hover:text-inherit ${mobileShrink}`;

export const actionBtnSquare =
  `inline-flex size-8 cursor-pointer items-center justify-center rounded-md border border-[rgb(216,210,210)] bg-white text-[0.8rem] transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[rgb(216,210,210)] disabled:hover:text-inherit ${mobileShrink}`;

export const toggleBtn = (active: boolean, extra = "") =>
  `inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-[0.8rem] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${mobileShrink} ${
    active
      ? "border-brand bg-brand text-black"
      : "border-[rgb(216,210,210)] bg-white text-black hover:border-brand hover:text-brand disabled:hover:border-[rgb(216,210,210)] disabled:hover:text-black"
  } ${extra}`;

export const iconToggleBtn = (active: boolean) =>
  `inline-flex cursor-pointer items-center justify-center rounded-md border p-2 transition-colors min-[821px]:scale-85 ${mobileShrink} ${
    active
      ? "border-brand bg-brand text-black"
      : "border-[rgb(216,210,210)] bg-white text-black hover:border-brand hover:text-brand"
  }`;

export const hint = "text-[0.8rem] leading-[1.3] text-[rgb(51, 47, 47)]";

export const headerToolButton =
  `inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[rgb(216,210,210)] bg-white px-4 py-[10px] text-[0.9rem] min-[821px]:px-3.5 min-[821px]:py-2 min-[821px]:text-xs font-bold text-black transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-[rgb(216,210,210)] disabled:hover:text-black${mobileShrink}`;

export const headerExportButton =
  `cursor-pointer rounded-lg bg-brand px-4 py-[10px] text-[0.9rem] min-[821px]:px-3.5 min-[821px]:py-2 min-[821px]:text-xs font-bold text-black shadow-[0_2px_10px_rgba(214,40,40,0.28)] transition-transform duration-150 ease-[ease] hover:scale-105 focus-visible:scale-105 focus-visible:outline-none${mobileShrink}`;

export const headerImportButton =
  `cursor-pointer rounded-lg border border-brand bg-transparent px-4 py-[10px] text-center text-[0.9rem] min-[821px]:px-3.5 min-[821px]:py-2 min-[821px]:text-xs font-bold text-brand transition-transform duration-150 ease-[ease] hover:scale-105 peer-focus-visible:scale-105 peer-focus-visible:outline-none${mobileShrink}`;

export const headerZoomButton =
  `inline-flex h-8 w-8 min-[821px]:h-7 min-[821px]:w-7 cursor-pointer items-center justify-center rounded-md text-2xl min-[821px]:text-xl font-bold leading-none text-black transition-colors hover:text-brand disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-black ${mobileShrink}`;

/** Wraps the header grid controls so they animate their mobile collapse (grid row 1fr→0fr + fade); stays `contents` on desktop so the controls flow into the header flex. */
export const collapsibleControls = (collapsed: boolean) =>
  `min-[821px]:contents grid grid-rows-[1fr] opacity-100 transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
    collapsed ? "max-[820px]:grid-rows-[0fr] max-[820px]:opacity-0" : ""
  }`;
