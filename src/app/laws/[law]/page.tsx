import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ListChecks, Presentation } from "lucide-react";

import { BeatText } from "@/components/learn/beat-text";
import { InlineSlide } from "@/components/learn/inline-slide";
import { LearnShell } from "@/components/learn/learn-shell";
import { toStageSlide } from "@/components/slides/stage-slide";
import { Button } from "@/components/ui/button";
import { getSlide } from "@/lib/deck";
import { getLaw, getModule, learning, neighbors } from "@/lib/learning";
import { isPresenter } from "@/lib/presenter-auth";
import { getQuiz } from "@/lib/quizzes";

export function generateStaticParams() {
  return learning.laws.map((l) => ({ law: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ law: string }> }): Promise<Metadata> {
  const law = getLaw((await params).law);
  return law ? { title: `${law.name} · Laws of UX`, description: law.definition } : {};
}

const SECTION_IDS: Record<string, string> = { wild: "in-the-wild", kestrel: "at-kestrel", roles: "your-move" };

/** "lawsofux.com/hicks-law · Hick, 1952" → link the first part. */
function Source({ text }: { text: string }) {
  const [site, ...rest] = text.split(" · ");
  const href = site.startsWith("lawsofux.com") ? `https://${site}/` : null;
  return (
    <p className="text-sm text-muted-foreground">
      Source:{" "}
      {href ? (
        <a href={href} className="font-medium text-accent-foreground hover:underline">
          {site}
        </a>
      ) : (
        site
      )}
      {rest.length ? ` · ${rest.join(" · ")}` : null}
    </p>
  );
}

export default async function LawPage({ params }: { params: Promise<{ law: string }> }) {
  const law = getLaw((await params).law);
  if (!law) notFound();
  const mod = getModule(law.module)!;
  const { prev, next } = neighbors(law.slug);
  const presenter = await isPresenter();
  const quiz = getQuiz(mod.key);
  const [lawBeat, ...rest] = law.beats;
  const slideOf = (id: string) => toStageSlide(getSlide(id)!);
  const isLastInModule = law.position === law.ofTotal;

  return (
    <LearnShell
      currentModule={mod.key}
      mobileLabel={`Module ${mod.number} · Law ${law.position} of ${law.ofTotal}`}
      crumbs={[
        { label: "Modules", href: "/#modules" },
        { label: `Module ${mod.number} · ${mod.title}`, href: `/modules/${mod.key}` },
        { label: law.name },
      ]}
      actions={
        presenter ? (
          <Button asChild variant="secondary" size="sm" className="bg-[#1D1D1F] text-white hover:bg-[#1D1D1F]/90">
            <Link href={`/present/${lawBeat.slide}`}>
              <Presentation /> Present this law
            </Link>
          </Button>
        ) : null
      }
    >
      {/* Beat 1: the law */}
      <section aria-labelledby="law-title" className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href={`/modules/${mod.key}`}
              className="rounded-full px-3.5 py-1.5 text-sm font-bold"
              style={{ color: `var(--${mod.key}-ink)`, background: `var(--${mod.key}-tint)` }}
            >
              Module {mod.number}
            </Link>
            <span className="text-[15px] text-muted-foreground">
              Law {law.position} of {law.ofTotal}
            </span>
          </div>
          <h1 id="law-title" className="text-5xl font-extrabold leading-[1.04] tracking-[-0.03em] sm:text-6xl">
            {law.name}
          </h1>
          {lawBeat.blocks.map((b, i) =>
            b.type === "p" ? (
              <p
                key={i}
                className={
                  i === 0
                    ? "max-w-3xl text-2xl font-semibold leading-snug"
                    : "max-w-3xl text-lg leading-relaxed text-muted-foreground"
                }
              >
                {b.text}
              </p>
            ) : null,
          )}
          {lawBeat.source ? <Source text={lawBeat.source} /> : null}
        </div>
        <InlineSlide slide={slideOf(lawBeat.slide)} />
      </section>

      <nav aria-label="On this page" className="flex gap-2 overflow-x-auto pb-1">
        {rest.map((b) => (
          <a
            key={b.kind}
            href={`#${SECTION_IDS[b.kind]}`}
            className="shrink-0 rounded-full bg-card px-4 py-2.5 text-[15px] font-semibold shadow-sm hover:bg-muted"
          >
            {b.label?.replace(/ \(fictional\)$/, "")}
          </a>
        ))}
        {quiz ? (
          <Link
            href={`/quiz/${mod.key}`}
            className="flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-[15px] font-semibold"
            style={{ color: `var(--${mod.key}-ink)`, background: `var(--${mod.key}-tint)` }}
          >
            <ListChecks className="size-4" /> Module {mod.number} quiz
          </Link>
        ) : null}
      </nav>

      {/* Beats 2-4 */}
      {rest.map((beat) => (
        <section
          key={beat.kind}
          id={SECTION_IDS[beat.kind]}
          aria-labelledby={`${SECTION_IDS[beat.kind]}-title`}
          className="flex scroll-mt-6 flex-col gap-5"
        >
          <div className="flex flex-col gap-1.5">
            <p className="text-[15px] font-bold" style={{ color: `var(--${mod.key}-ink)` }}>
              {beat.label}
            </p>
            <h2 id={`${SECTION_IDS[beat.kind]}-title`} className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              {beat.title}
            </h2>
          </div>
          <InlineSlide slide={slideOf(beat.slide)} />
          <BeatText beat={beat} moduleKey={mod.key} />
        </section>
      ))}

      <nav aria-label="Next and previous" className="grid gap-3 border-t pt-6 pb-10 sm:grid-cols-2">
        {prev ? (
          <Link href={`/laws/${prev.slug}`} className="flex flex-col gap-1 rounded-2xl bg-card p-5 hover:bg-muted">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              <ArrowLeft className="size-4" /> Previous
            </span>
            <span className="text-lg font-bold">{prev.name}</span>
          </Link>
        ) : (
          <span />
        )}
        {isLastInModule && quiz ? (
          <Link
            href={`/quiz/${mod.key}`}
            className="flex flex-col items-end gap-1 rounded-2xl p-5 text-right"
            style={{ background: `var(--${mod.key}-tint)` }}
          >
            <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: `var(--${mod.key}-ink)` }}>
              End of Module {mod.number} <ArrowRight className="size-4" />
            </span>
            <span className="text-lg font-bold">Module {mod.number} quiz</span>
          </Link>
        ) : next ? (
          <Link
            href={`/laws/${next.slug}`}
            className="flex flex-col items-end gap-1 rounded-2xl bg-card p-5 text-right hover:bg-muted"
          >
            <span className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              Next <ArrowRight className="size-4" />
            </span>
            <span className="text-lg font-bold">{next.name}</span>
          </Link>
        ) : null}
      </nav>
    </LearnShell>
  );
}
