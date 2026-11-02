import type { Slide } from "@/lib/deck";
import type { StageSlide } from "./types";

/** Picks only what the browser needs to render a slide. */
export function toStageSlide(s: Slide): StageSlide {
  return {
    id: s.id,
    number: s.number,
    title: s.title,
    section: s.section,
    module: s.module,
    law: s.law,
    transition: s.transition,
    style: s.style,
    html: s.html,
    thumbHtml: s.thumbHtml,
  };
}
