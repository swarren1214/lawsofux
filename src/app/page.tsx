import Link from "next/link";
import { ArrowRight, ListChecks, Lock, Presentation, Search } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { learning, lawsOf } from "@/lib/learning";
import { isPresenter } from "@/lib/presenter-auth";
import { quizSummaries } from "@/lib/quizzes";

const BEATS = [
  { n: "01", title: "The law", text: "One sentence, the research behind it, and an animated picture of the idea." },
  { n: "02", title: "In the wild", text: "Real products that get it right, or wrong." },
  { n: "03", title: "At Kestrel", text: "Our fictional field-service company runs into it, with a before and after." },
  { n: "04", title: "Your move", text: "One question each for Product, Engineering and QA to bring to the next review." },
];

export default async function Home() {
  const presenter = await isPresenter();
  const quizzes = quizSummaries();
  const first = learning.laws[0];

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto flex max-w-6xl flex-col gap-14 px-4 py-14 sm:px-6 sm:py-16">
        <section className="flex max-w-3xl flex-col gap-5">
          <p className="font-semibold text-accent-foreground">For Product, Engineering &amp; QA</p>
          <h1 className="text-5xl font-extrabold leading-[1.04] tracking-[-0.04em] sm:text-7xl">
            Thirty laws.
            <br />
            One shared language.
          </h1>
          <p className="text-xl leading-relaxed text-muted-foreground">
            The psychology that decides whether people can use what we ship. Five modules, one law at a time,
            with a short quiz after each weekly session.
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/modules/m1">
                Start Module 1 <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href={`/laws/${first.slug}`}>Read {first.name}</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/search">
                <Search /> Search by symptom
              </Link>
            </Button>
          </div>
        </section>

        <section aria-labelledby="modules" className="flex scroll-mt-6 flex-col gap-5" id="modules">
          <h2 className="text-3xl font-extrabold tracking-tight" id="modules-title">
            Modules
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(340px,100%),1fr))] gap-5">
            {learning.modules.map((m) => {
              const laws = lawsOf(m.key);
              const quiz = quizzes.find((q) => q.module === m.key);
              return (
                <Card key={m.key} className="gap-4 rounded-[28px] p-7">
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className="rounded-full px-3.5 py-1.5 text-sm font-bold"
                      style={{ color: `var(--${m.key}-ink)`, background: `var(--${m.key}-tint)` }}
                    >
                      Module {m.number}
                    </span>
                    <span className="text-sm text-muted-foreground">{laws.length} laws</span>
                  </div>
                  <h3 className="text-2xl font-extrabold tracking-tight">
                    <Link href={`/modules/${m.key}`} className="hover:underline">
                      {m.title}
                    </Link>
                  </h3>
                  <p className="text-[15px] leading-relaxed text-muted-foreground">{m.subtitle}</p>
                  <ul className="flex flex-wrap gap-2">
                    {laws.map((l) => (
                      <li key={l.slug}>
                        <Link
                          href={`/laws/${l.slug}`}
                          className="block rounded-xl bg-muted px-3 py-2 text-sm font-medium outline-none hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                          {l.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto flex flex-wrap items-center gap-2 border-t pt-4">
                    <Button asChild variant="secondary">
                      <Link href={`/modules/${m.key}`}>
                        Open module <ArrowRight />
                      </Link>
                    </Button>
                    {quiz?.open ? (
                      <Button asChild variant="outline">
                        <Link href={`/quiz/${m.key}`}>
                          <ListChecks /> Take the quiz
                        </Link>
                      </Button>
                    ) : (
                      <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                        <Lock className="size-3.5" /> Quiz after the session
                      </span>
                    )}
                    {presenter ? (
                      <Button asChild variant="ghost" size="icon" className="ml-auto" aria-label={`Present Module ${m.number}`}>
                        <Link href={`/present/${m.key}`}>
                          <Presentation />
                        </Link>
                      </Button>
                    ) : null}
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="how-title" className="flex flex-col gap-5">
          <h2 id="how-title" className="text-3xl font-extrabold tracking-tight">
            Every law, four beats
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(240px,100%),1fr))] gap-4">
            {BEATS.map((b, i) => (
              <div
                key={b.n}
                className={
                  i === 3
                    ? "flex flex-col gap-2 rounded-3xl bg-[#1D1D1F] p-6 text-[#F5F5F7]"
                    : "flex flex-col gap-2 rounded-3xl bg-card p-6"
                }
              >
                <span className={i === 3 ? "text-sm font-bold text-[#64AFFF]" : "text-sm font-bold text-accent-foreground"}>
                  {b.n}
                </span>
                <span className="text-xl font-bold">{b.title}</span>
                <span className={i === 3 ? "text-[15px] leading-relaxed text-[#AEAEB2]" : "text-[15px] leading-relaxed text-muted-foreground"}>
                  {b.text}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-14 text-sm text-muted-foreground sm:px-6">
        Based on{" "}
        <a href="https://lawsofux.com" className="font-medium text-accent-foreground">
          lawsofux.com
        </a>{" "}
        by Jon Yablonski. Kestrel is a fictional company used for examples.
      </footer>
    </div>
  );
}
