"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import type { StageSlide } from "./types";

/** Delay before the first build-in, and the gap between build-in steps. */
const BUILD_START_MS = 380;
const BUILD_STEP_MS = 220;

/** Parses an inline style string ("a:b;c:d") into a React style object. */
function parseStyle(css: string): React.CSSProperties {
  const out: Record<string, string> = {};
  for (const decl of css.split(";")) {
    const i = decl.indexOf(":");
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim();
    const value = decl.slice(i + 1).trim();
    if (!prop) continue;
    out[prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = value;
  }
  return out as React.CSSProperties;
}

/**
 * Renders one deck slide at its native 1920 x 1080 size, scaled to fill its
 * container. "live" runs looping animations and plays build-ins; "thumb" shows
 * the slide's final state with no animation.
 */
export function SlideCanvas({
  slide,
  variant = "live",
  className,
}: {
  slide: StageSlide;
  variant?: "live" | "thumb";
  className?: string;
}) {
  const frameRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = React.useState(0);

  React.useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const update = () => setScale(frame.clientWidth / 1920);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(frame);
    return () => ro.disconnect();
  }, []);

  // Build-ins play automatically, in their numbered order, as soon as the slide appears.
  React.useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || variant !== "live") return;
    const items = Array.from(canvas.querySelectorAll<HTMLElement>("[data-build-in]"));
    for (const el of items) {
      const [type = "fade", step = "1"] = (el.getAttribute("data-build-in") || "").split(/\s+/);
      el.classList.remove("bi-run", "bi-fade", "bi-rise", "bi-pop");
      el.classList.add("bi-wait", `bi-${type}`);
      el.style.animationDelay = `${BUILD_START_MS + (Number(step) - 1) * BUILD_STEP_MS}ms`;
    }
    const raf = requestAnimationFrame(() => {
      for (const el of items) {
        el.classList.remove("bi-wait");
        el.classList.add("bi-run");
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [slide.id, variant]);

  const html = variant === "live" ? slide.html : slide.thumbHtml;

  return (
    <div
      ref={frameRef}
      className={cn("relative aspect-video w-full overflow-hidden", className)}
      aria-label={`Slide ${slide.number}: ${slide.title}`}
      role="img"
    >
      <div
        ref={canvasRef}
        className="slide-canvas"
        style={{
          ...parseStyle(slide.style),
          transform: `scale(${scale})`,
          visibility: scale ? "visible" : "hidden",
        }}
        // Slide markup comes from the repo's own deck/ files, built at deploy time.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
