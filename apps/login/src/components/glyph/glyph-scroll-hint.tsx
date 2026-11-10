"use client";

/**
 * Phones only: a faint pulsing chevron at the bottom edge telling people the
 * sign-in controls are below the stele. Appears after the entry scramble and
 * disappears for good once they scroll or the controls come into view.
 */
import { useEffect, useState } from "react";
import ui from "./glyph-ui.module.css";

// What people need to reach: the primary button if the step has one, else the controls column.
const TARGETS = ["[data-glyph-scroll-target]", "[data-glyph-controls]"];

export function GlyphScrollHint() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!window.matchMedia("(max-width: 899px)").matches) return;
    let done = false;
    const stop = () => {
      done = true;
      setOn(false);
    };

    const target = TARGETS.map((sel) => document.querySelector(sel)).find(Boolean) ?? null;
    let firstControlVisible = false;
    const io = target
      ? new IntersectionObserver(
          (entries) => {
            firstControlVisible = entries.some((e) => e.isIntersecting);
            if (firstControlVisible) stop();
          },
          { threshold: 0.05 },
        )
      : null;
    if (target && io) io.observe(target);

    const onScroll = () => {
      if (window.scrollY > 40) stop();
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // wait for the entry scramble, then show only if there is somewhere to scroll
    const timer = window.setTimeout(() => {
      const canScroll = document.documentElement.scrollHeight > window.innerHeight + 40;
      if (!done && canScroll && !firstControlVisible && window.scrollY <= 40) setOn(true);
    }, 2000);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      io?.disconnect();
    };
  }, []);

  return (
    <svg
      className={`${ui.tokens} ${ui.scrollHint} ${on ? ui.scrollHintOn : ""}`}
      viewBox="-12 -2 24 16"
      aria-hidden="true"
    >
      <path d="M -10 0 L 0 6 L 10 0" fill="none" stroke="currentColor" strokeWidth="1.1" />
      <path d="M -7 6 L 0 10 L 7 6" fill="none" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}
