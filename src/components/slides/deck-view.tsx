"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { SlideCanvas } from "./slide-canvas";
import type { StageSlide } from "./types";

const TRANSITION_MS = 560;

type Layer = { slide: StageSlide; role: "current" | "leaving"; className: string };

/**
 * Shows the slide at `index` and plays the deck's transition (push or fade)
 * whenever the index changes. The incoming slide's transition is used, the way
 * a presentation app does it.
 */
export function DeckView({
  slides,
  index,
  className,
  children,
}: {
  slides: StageSlide[];
  index: number;
  className?: string;
  children?: React.ReactNode;
}) {
  const [layers, setLayers] = React.useState<Layer[]>([
    { slide: slides[index], role: "current", className: "" },
  ]);
  const lastIndex = React.useRef(index);

  React.useEffect(() => {
    const from = lastIndex.current;
    if (from === index) return;
    lastIndex.current = index;
    const incoming = slides[index];
    const outgoing = slides[from];
    const back = index < from ? " t-back" : "";
    const kind = incoming.transition === "fade" ? "fade" : "push";
    setLayers([
      { slide: outgoing, role: "leaving", className: `t-${kind}-out${back}` },
      { slide: incoming, role: "current", className: `t-${kind}-in${back}` },
    ]);
    const t = window.setTimeout(() => {
      setLayers([{ slide: incoming, role: "current", className: "" }]);
    }, TRANSITION_MS);
    return () => window.clearTimeout(t);
  }, [index, slides]);

  return (
    <div className={cn("relative aspect-video w-full overflow-hidden bg-black", className)}>
      {layers.map((layer) => (
        <div
          // Keyed by slide so the outgoing slide keeps its DOM (no replayed builds or reloaded animations).
          key={layer.slide.id}
          className={cn("slide-layer", layer.className)}
          aria-hidden={layer.role === "leaving"}
        >
          <SlideCanvas slide={layer.slide} />
        </div>
      ))}
      {children}
    </div>
  );
}
