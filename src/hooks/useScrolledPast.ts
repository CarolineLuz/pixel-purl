import { useEffect, useState } from "react";

/**
 * Tracks whether the window is scrolled past `threshold` pixels from the top.
 * Used to collapse the grid controls on mobile once the user scrolls into the
 * canvas.
 *
 * Collapsing changes the page height, which can nudge `scrollY` back across a
 * single threshold and cause a hide/show oscillation. To avoid that flicker we
 * use hysteresis: switch on at `threshold`, but only switch back off once
 * scrolled above `release` (a lower value), leaving a dead zone in between.
 */
export function useScrolledPast(threshold: number, release = threshold / 2): boolean {
  const [scrolled, setScrolled] = useState(
    () => typeof window !== "undefined" && window.scrollY > threshold,
  );

  useEffect(() => {
    const onScroll = () => {
      setScrolled((prev) =>
        prev ? window.scrollY > release : window.scrollY > threshold,
      );
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold, release]);

  return scrolled;
}
