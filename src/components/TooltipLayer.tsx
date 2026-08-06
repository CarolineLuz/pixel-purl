import { useEffect, useLayoutEffect, useRef, useState } from "react";

/** A viewport margin and the gap between the trigger and its tooltip. */
const MARGIN = 8;
const GAP = 6;

interface Tip {
  label: string;
  anchor: DOMRect;
}

/**
 * A single app-wide tooltip rendered as a `position: fixed` element at the root,
 * so it can never be clipped by a scrolling toolbar or any `overflow` ancestor
 * (which a CSS `::after` tooltip living inside those containers always is).
 *
 * It watches for hover/focus on any `[data-tooltip]` element via delegated
 * listeners, positions itself below the trigger — flipping above when there is
 * no room — and clamps horizontally so it stays fully on screen. Mount once.
 */
export function TooltipLayer() {
  const [tip, setTip] = useState<Tip | null>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const activeRef = useRef<Element | null>(null);

  useEffect(() => {
    const trigger = (el: EventTarget | null) =>
      el instanceof Element ? el.closest("[data-tooltip]") : null;

    const show = (e: Event) => {
      const target = trigger(e.target);
      if (!target || target === activeRef.current) return;
      const label = target.getAttribute("data-tooltip");
      if (!label) return;
      activeRef.current = target;
      setTip({ label, anchor: target.getBoundingClientRect() });
    };

    const leave = (e: Event) => {
      const from = trigger(e.target);
      if (!from || from !== activeRef.current) return;
      // Ignore moves between the trigger and its own descendants.
      const to = trigger((e as MouseEvent | FocusEvent).relatedTarget ?? null);
      if (to === from) return;
      hide();
    };

    const hide = () => {
      activeRef.current = null;
      setTip(null);
      setPos(null);
    };

    document.addEventListener("mouseover", show);
    document.addEventListener("mouseout", leave);
    document.addEventListener("focusin", show);
    document.addEventListener("focusout", leave);
    // Any scroll or click makes the cached anchor rect stale, so dismiss.
    window.addEventListener("scroll", hide, true);
    document.addEventListener("click", hide, true);
    return () => {
      document.removeEventListener("mouseover", show);
      document.removeEventListener("mouseout", leave);
      document.removeEventListener("focusin", show);
      document.removeEventListener("focusout", leave);
      window.removeEventListener("scroll", hide, true);
      document.removeEventListener("click", hide, true);
    };
  }, []);

  // Measure the rendered tooltip, then place it and clamp it to the viewport.
  useLayoutEffect(() => {
    if (!tip || !ref.current) return;
    const { anchor } = tip;
    const { offsetWidth: w, offsetHeight: h } = ref.current;

    let top = anchor.bottom + GAP;
    if (top + h > window.innerHeight - MARGIN) top = anchor.top - h - GAP;

    const centered = anchor.left + anchor.width / 2 - w / 2;
    const left = Math.max(
      MARGIN,
      Math.min(centered, window.innerWidth - w - MARGIN),
    );
    setPos({ left, top });
  }, [tip]);

  if (!tip) return null;
  return (
    <div
      ref={ref}
      role="tooltip"
      className="tooltip-pop"
      style={{
        left: pos?.left ?? 0,
        top: pos?.top ?? 0,
        // Hidden for the first frame until measured, to avoid a positioning flash.
        visibility: pos ? "visible" : "hidden",
      }}
    >
      {tip.label}
    </div>
  );
}
