import type { Metadata } from "next";

import { AudienceView } from "@/components/presenter/audience-view";
import { toStageSlide } from "@/components/slides/stage-slide";
import { deck } from "@/lib/deck";

// The window title is what people pick from the share list in Meet, Zoom and Teams.
export const metadata: Metadata = { title: { absolute: "Laws of UX · Audience" } };

export default async function AudiencePage({
  searchParams,
}: {
  searchParams: Promise<{ slide?: string }>;
}) {
  const { slide } = await searchParams;
  const found = deck.slides.findIndex((s) => s.id === slide);
  // No speaker notes are imported here, so they can never reach this window.
  return <AudienceView slides={deck.slides.map(toStageSlide)} initialIndex={Math.max(0, found)} />;
}
