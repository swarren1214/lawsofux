import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { PresenterConsole } from "@/components/presenter/presenter-console";
import { toStageSlide } from "@/components/slides/stage-slide";
import { deck } from "@/lib/deck";
import { isPresenter } from "@/lib/presenter-auth";
import { quizSummaries } from "@/lib/quizzes";

export const metadata: Metadata = { title: "Presenter · Laws of UX" };

export default async function PresentPage({ params }: { params: Promise<{ slide: string }> }) {
  const { slide: id } = await params;
  if (!(await isPresenter())) redirect(`/present/login?next=/present/${encodeURIComponent(id)}`);

  const index = deck.slides.findIndex((s) => s.id === id);
  if (index < 0) notFound();

  // Notes are loaded only after the presenter check above.
  const { notes } = await import("@/lib/notes");

  return (
    <PresenterConsole
      slides={deck.slides.map(toStageSlide)}
      notes={notes}
      sections={deck.sections.map(({ key, label, start, end }) => ({ key, label, start, end }))}
      modules={deck.modules}
      initialIndex={index}
      quizzes={quizSummaries()}
    />
  );
}
