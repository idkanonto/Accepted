"use client";

import { useEffect, useRef } from "react";

/** Bring the result of an explicit action into view without moving focus on timer ticks. */
export function useStageFocus<T extends HTMLElement>(
  dependency: unknown,
  enabled: boolean,
  mobileOnly = false,
) {
  const ref = useRef<T>(null);
  useEffect(() => {
    if (
      !enabled ||
      (mobileOnly && !window.matchMedia("(max-width: 767px)").matches)
    )
      return;
    const frame = requestAnimationFrame(() => {
      const stage = ref.current;
      if (!stage) return;
      stage.focus({ preventScroll: true });
      stage.scrollIntoView({
        block: "start",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [dependency, enabled, mobileOnly]);
  return ref;
}
