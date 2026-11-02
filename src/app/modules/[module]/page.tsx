import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ListChecks, Lock, Presentation } from "lucide-react";

import { InlineSlide } from "@/components/learn/inline-slide";
import { LearnShell } from "@/components/learn/learn-shell";
import { toStageSlide } from "@/components/slides/stage-slide";
import { Button } from "@/components/ui/button";
import { getSlide } from "@/lib/deck";
import { getModule, learning, lawsOf } from "@/lib/learning";
import { isPresenter } from "@/lib/presenter-auth";
import { getQuiz } from "@/lib/quizzes";

export function generateStaticParams() {
  return learning.modules.map((m) => ({ module: m.key }));
}

export async function generateMetadata({ params }: { params: Promise<{ module: string }> }): Promise<Metadata> {
  const mod = getModule((await params).module);
  return mod ? { title: `Module ${mod.number}: ${mod.title} · Laws of UX`, description: mod.subtitle } : {};
}

export default async function ModulePage({ params }: { params: Promise<{ module: string }> }) {
  const mod = getModule((await params).module);
  if (!mod) notFound();
  const laws = lawsOf(mod.key);
  const quiz = getQuiz(mod.key);
  const presenter = await isPresenter();
  const nextModule = learning.modules.find((m) => m.number === mod.number + 1);

  return (
    <LearnShell
      currentModule={mod.key}
      mobileLabel={`Module ${mod.number} · ${laws.length} laws`}
      crumbs={[{ label: "Modules", href: "/#modules" }, { label: `Module ${mod.number} · ${mod.title}` }]}
      actions={
        presenter ? (
          <Button asChild variant="secondary" size="sm" className="bg-[#1D1D1F] text-white hover:bg-[#1D1D1F]/90">
            <Link href={`/present/${mod.divider}`}>
              <Presentation /> Present Module {mod.number}
            </Link>
          </Button>
        ) : null
      }
    >
      <section aria-labelledby="module-title" className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <span
            className="w-fit rounded-full px-3.5 py-1.5 text-sm font-bold"
            style={{ color: `var(--${mod.key}-ink)`, background: `var(--${mod.key}-tint)` }}
          >
            Module {mod.number} of {learning.modules.length}
          </span>
          <h1 id="module-title" className="text-5xl font-extrabold leading-[1.04] tracking-[-0.03em] sm:text-6xl">
            {mod.title}
          </h1>
          <p className="max-w-3xl text-xl leading-relaxed text-muted-foreground">{mod.subtitle}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={`/laws/${laws[0].slug}`}>
                Start with {laws[0].name} <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
        <InlineSlide slide={toStageSlide(getSlide(mod.divider)!)} />
      </section>

      <section aria-labelledby="laws-title" className="flex flex-col gap-4">
        <h2 id="laws-title" className="text-3xl font-extrabold tracking-tight">
          {laws.length} laws in this module
        </h2>
        <ol className="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-4">
          {laws.map((l) => (
            <li key={l.slug}>
              <Link
                href={`/laws/${l.slug}`}
                className="group flex h-full flex-col gap-2.5 rounded-3xl bg-card p-6 shadow-[0_8px_24px_rgba(0,0,0,0.05)] outline-none transition hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(0,0,0,0.09)] focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <span className="text-sm font-bold" style={{ color: `var(--${mod.key}-ink)` }}>
                  Law {l.position}
                </span>
                <span className="text-xl font-bold leading-snug">{l.name}</span>
                <span className="text-[15px] leading-relaxed text-muted-foreground">{l.definition}</span>
                <span className="mt-auto flex items-center gap-1 pt-2 text-sm font-semibold text-accent-foreground">
                  Read <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="recap-title" className="flex flex-col gap-4">
        <h2 id="recap-title" className="text-3xl font-extrabold tracking-tight">
          Module {mod.number} in one slide
        </h2>
        <InlineSlide slide={toStageSlide(getSlide(mod.recap)!)} />
      </section>

      <section
        aria-label={`Module ${mod.number} quiz`}
        className="mb-10 flex flex-wrap items-center gap-5 rounded-3xl p-6 sm:p-8"
        style={{ background: `var(--${mod.key}-tint)` }}
      >
        <div className="flex min-w-60 flex-1 flex-col gap-1.5">
          <h2 className="text-2xl font-extrabold tracking-tight">Module {mod.number} quiz</h2>
          <p className="text-[#3A3A3C]">
            {quiz
              ? quiz.open
                ? `${quiz.questions.length} quick questions, one per law. Nothing is saved.`
                : "Opens right after the session."
              : "Coming after the session."}
          </p>
        </div>
        {quiz?.open ? (
          <Button asChild size="lg">
            <Link href={`/quiz/${mod.key}`}>
              <ListChecks /> Take the quiz
            </Link>
          </Button>
        ) : (
          <span className="flex items-center gap-2 font-semibold text-[#3A3A3C]">
            <Lock className="size-4" /> Not open yet
          </span>
        )}
        {nextModule ? (
          <Link
            href={`/modules/${nextModule.key}`}
            className="flex w-full items-center gap-1.5 border-t border-black/10 pt-4 text-[15px] font-semibold"
            style={{ color: `var(--${mod.key}-ink)` }}
          >
            Next: Module {nextModule.number} · {nextModule.title} <ArrowRight className="size-4" />
          </Link>
        ) : null}
      </section>
    </LearnShell>
  );
}
