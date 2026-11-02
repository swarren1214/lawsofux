import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";

import { QuizRunner } from "@/components/quiz/quiz-runner";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui/badge";
import { deck } from "@/lib/deck";
import { isPresenter } from "@/lib/presenter-auth";
import { getQuiz, quizForPage } from "@/lib/quizzes";

export async function generateMetadata({ params }: { params: Promise<{ module: string }> }): Promise<Metadata> {
  const { module } = await params;
  const mod = deck.modules.find((m) => m.key === module);
  return { title: mod ? `Module ${mod.number} quiz · Laws of UX` : "Quiz · Laws of UX" };
}

export default async function QuizPage({ params }: { params: Promise<{ module: string }> }) {
  const { module } = await params;
  const mod = deck.modules.find((m) => m.key === module);
  const quiz = getQuiz(module);
  if (!mod || !quiz) notFound();

  const preview = !quiz.open && (await isPresenter());
  const available = quiz.open || preview;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              className="rounded-full px-3.5 py-1.5 text-sm font-bold"
              style={{ color: `var(--${mod.key}-ink)`, background: `var(--${mod.key}-tint)` }}
            >
              Module {mod.number} quiz
            </span>
            <span className="text-[15px] text-muted-foreground">
              {quiz.questions.length} questions · about 5 minutes · nothing is saved
            </span>
            {preview ? <Badge variant="secondary">Presenter preview: not open yet</Badge> : null}
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{mod.title}</h1>
        </div>

        {available ? (
          <QuizRunner moduleNumber={mod.number} questions={quizForPage(quiz)} />
        ) : (
          <section className="flex flex-col items-center gap-3 rounded-[32px] bg-card p-10 text-center shadow-[0_16px_44px_rgba(0,0,0,0.06)]">
            <span className="flex size-14 items-center justify-center rounded-full bg-muted">
              <Lock className="size-6 text-muted-foreground" />
            </span>
            <h2 className="text-2xl font-bold">This quiz opens after the Module {mod.number} session</h2>
            <p className="max-w-md text-muted-foreground">Check back once the session has run.</p>
            <Link href="/" className="mt-2 font-semibold text-accent-foreground">
              Back to the modules
            </Link>
          </section>
        )}
      </main>
    </div>
  );
}
