"use client";

import * as React from "react";
import { RotateCcw } from "lucide-react";

import { SlideCanvas } from "@/components/slides/slide-canvas";
import type { StageSlide } from "@/components/slides/types";
import { cn } from "@/lib/utils";

/**
 * A deck slide inside a page. It mounts when it scrolls into view, so its
 * build-ins play while you're looking at it and looping animations only load
 * when needed. Replay runs the build-ins again.
 */
export function InlineSlide({ slide, className }: { slide: StageSlide; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [visible, setVisible] = React.useState(false);
  const [run, setRun] = React.useState(0);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <figure className={cn("group relative m-0", className)}>
      {/* The slide is decorative here: its words are on the page as real text,
          so screen readers and the Tab key skip it (no duplicate headings). */}
      <div
        ref={ref}
        inert
        aria-hidden="true"
        className="relative aspect-video w-full overflow-hidden rounded-2xl bg-muted shadow-[0_16px_44px_rgba(0,0,0,0.10),0_1px_3px_rgba(0,0,0,0.05)] sm:rounded-[28px]"
      >
        {visible ? (
          <SlideCanvas key={run} slide={slide} />
        ) : (
          <SlideCanvas slide={slide} variant="thumb" className="opacity-0" />
        )}
      </div>
      <button
        type="button"
        onClick={() => setRun((r) => r + 1)}
        className="absolute bottom-3 right-3 flex min-h-9 items-center gap-1.5 rounded-full bg-black/55 px-3 text-xs font-semibold text-white opacity-0 outline-none backdrop-blur transition-opacity hover:bg-black/70 focus-visible:opacity-100 focus-visible:ring-[3px] focus-visible:ring-white/60 group-hover:opacity-100"
      >
        <RotateCcw className="size-3.5" /> Replay
      </button>
      <figcaption className="sr-only">Slide {slide.number}: {slide.title}. The slide’s text follows.</figcaption>
    </figure>
  );
}
