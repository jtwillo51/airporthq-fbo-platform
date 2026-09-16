"use client";

import { useEffect, useState } from "react";

/**
 * Progress indicator: an aircraft taxiing left to right along a runway,
 * 0% at the threshold and 100% at the far end.
 *
 * `durationMs` is how long the run is expected to take. Progress eases toward
 * 95% over that window and holds there - it only reaches 100% when the caller
 * flips `done`, so the bar never claims completion before the work finishes.
 */
export default function PlaneProgress({
  durationMs = 2600,
  done = false,
  label = "Working…",
}: {
  durationMs?: number;
  done?: boolean;
  label?: string;
}) {
  const [pct, setPct] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (done) {
      setPct(100);
      return;
    }
    // Driven by a timer reading wall-clock elapsed time rather than
    // requestAnimationFrame: rAF is frozen in a hidden tab, which would leave
    // the aircraft stranded mid-runway if someone switched away and came back.
    // Deriving position from elapsed time means it is always correct on return.
    const startedAt = Date.now();
    setPct(0);
    const id = setInterval(() => {
      const linear = Math.min((Date.now() - startedAt) / durationMs, 1);
      // Ease out gently. A squared curve front-loads the motion (19% of the
      // runway in the first 10% of the time), which reads as a jump; 1.4
      // keeps a steadier taxi while still easing into the hold.
      const eased = 1 - Math.pow(1 - linear, 1.4);
      setPct(Math.min(eased * 95, 95));
      if (linear >= 1) clearInterval(id);
    }, 40);
    return () => clearInterval(id);
  }, [durationMs, done]);

  const rounded = Math.round(pct);

  return (
    <div
      role="progressbar"
      aria-valuenow={rounded}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="py-3"
      // About a third of the available width, so the aircraft crosses a short
      // runway rather than the full card. Floored and capped so it stays
      // legible on a narrow viewport and does not sprawl on a wide one.
      style={{ width: "33%", minWidth: 210, maxWidth: 360 }}
    >
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-xs text-[color:var(--color-text-muted)]">{label}</span>
        <span className="font-mono text-xs" style={{ color: "var(--color-accent)" }}>
          {rounded}%
        </span>
      </div>

      <div className="relative h-8">
        {/* runway */}
        <div
          className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to right, var(--color-border) 0 10px, transparent 10px 20px)",
          }}
        />
        {/* distance covered */}
        <div
          className="absolute left-0 top-1/2 h-px -translate-y-1/2"
          style={{
            width: `${pct}%`,
            background: "var(--color-accent)",
            transition: reduceMotion ? "none" : "width 150ms ease-out",
          }}
        />
        {/* the aircraft */}
        <div
          className="absolute top-1/2"
          style={{
            left: `${pct}%`,
            transform: "translate(-50%, -50%)",
            transition: reduceMotion ? "none" : "left 150ms ease-out",
          }}
        >
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            aria-hidden="true"
            style={{
              color: "var(--color-accent)",
              filter: "drop-shadow(0 0 6px color-mix(in srgb, var(--color-accent) 45%, transparent))",
            }}
          >
            {/*
              Plan-view airliner. The source path points UP, so it is rotated
              90 degrees clockwise about the centre to point RIGHT, along the
              direction of travel - wings and tailplane sweep back from the
              nose rather than forward.
            */}
            <path
              transform="rotate(90 12 12)"
              d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"
              fill="currentColor"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
