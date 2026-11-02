"use client";

import * as React from "react";
import Link from "next/link";
import { Check, RotateCcw, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Question = {
  id: string;
  law: string;
  lawName: string;
  lawSlug: string | null;
  prompt: string;
  options: { id: string; text: string }[];
  answer: string;
  explanation: string;
};

const LETTERS = ["A", "B", "C", "D", "E", "F"];

/**
 * One question at a time: pick an answer, check it, read why, move on.
 * Results stay in this browser tab; nothing is saved or sent anywhere.
 */
export function QuizRunner({ moduleNumber, questions }: { moduleNumber: number; questions: Question[] }) {
  const [index, setIndex] = React.useState(0);
  const [picked, setPicked] = React.useState<string | null>(null);
  const [checked, setChecked] = React.useState(false);
  const [results, setResults] = React.useState<boolean[]>([]);
  const [done, setDone] = React.useState(false);
  const headingRef = React.useRef<HTMLHeadingElement>(null);

  const q = questions[index];
  const score = results.filter(Boolean).length;
  const lastRight = checked && results[results.length - 1];

  React.useEffect(() => {
    headingRef.current?.focus();
  }, [index, done]);

  const check = () => {
    if (!picked || checked) return;
    setChecked(true);
    setResults((r) => [...r, picked === q.answer]);
  };

  const next = () => {
    if (index === questions.length - 1) {
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
    setChecked(false);
  };

  const restart = () => {
    setIndex(0);
    setPicked(null);
    setChecked(false);
    setResults([]);
    setDone(false);
  };

  if (done) {
    const title = score === questions.length ? "Perfect score." : score >= questions.length - 2 ? "Nicely done." : "Good start.";
    return (
      <section className="flex flex-col gap-7 rounded-[32px] bg-card p-6 shadow-[0_16px_44px_rgba(0,0,0,0.06)] sm:p-10">
        <div className="flex flex-wrap items-center gap-8">
          <div className="flex size-40 shrink-0 items-center justify-center rounded-full bg-accent">
            <span className="text-5xl font-extrabold tracking-tight text-accent-foreground">
              {score}/{questions.length}
            </span>
          </div>
          <div className="flex min-w-64 flex-1 flex-col gap-2">
            <h2 ref={headingRef} tabIndex={-1} className="text-3xl font-extrabold tracking-tight outline-none">
              {title}
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Anything marked below is worth another look before the next session.
            </p>
          </div>
        </div>
        <ul className="flex flex-col gap-2">
          {questions.map((x, i) => {
            const ok = results[i];
            return (
              <li key={x.id} className="flex items-center gap-4 rounded-2xl bg-muted px-4 py-3.5">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full text-white",
                    ok ? "bg-[#1E7A35]" : "bg-[#C4264A]",
                  )}
                  aria-hidden="true"
                >
                  {ok ? <Check className="size-4" strokeWidth={3} /> : <X className="size-4" strokeWidth={3} />}
                </span>
                <span className="flex-1 text-[17px] font-semibold">{x.lawName}</span>
                <span className="text-[15px] text-muted-foreground">{ok ? "Correct" : "Worth a second look"}</span>
                {x.lawSlug ? (
                  <Link href={`/laws/${x.lawSlug}`} className="text-[15px] font-semibold text-accent-foreground hover:underline">
                    Review
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ul>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="lg" onClick={restart}>
            <RotateCcw /> Take it again
          </Button>
          <Button asChild size="lg">
            <Link href="/#modules">Back to the modules</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6 rounded-[32px] bg-card p-6 shadow-[0_16px_44px_rgba(0,0,0,0.06)] sm:p-10">
      <div className="flex flex-col gap-3">
        <div className="flex justify-between gap-3 text-[15px]">
          <span className="font-semibold">
            Question {index + 1} of {questions.length}
          </span>
          <span className="text-muted-foreground">{q.lawName}</span>
        </div>
        <div className="flex gap-1.5" aria-hidden="true">
          {questions.map((x, i) => (
            <span
              key={x.id}
              className={cn(
                "h-2 flex-1 rounded-full",
                i < results.length ? (results[i] ? "bg-[#1E7A35]" : "bg-[#C4264A]") : i === index ? "bg-primary" : "bg-border",
              )}
            />
          ))}
        </div>
      </div>

      <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-bold leading-snug tracking-tight outline-none sm:text-3xl">
        {q.prompt}
      </h2>

      <div role="radiogroup" aria-label="Answers" className="flex flex-col gap-3">
        {q.options.map((o, i) => {
          const isPicked = picked === o.id;
          const isAnswer = o.id === q.answer;
          const state = checked ? (isAnswer ? "right" : isPicked ? "wrong" : "idle") : isPicked ? "picked" : "idle";
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={isPicked}
              disabled={checked}
              onClick={() => setPicked(o.id)}
              className={cn(
                "flex min-h-16 w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left text-[17px] leading-snug outline-none transition focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-default",
                state === "idle" && "bg-card shadow-[inset_0_0_0_1.5px_var(--input)] enabled:hover:bg-muted",
                state === "picked" && "bg-accent shadow-[inset_0_0_0_2px_var(--primary)]",
                state === "right" && "bg-[#E6F6EA] shadow-[inset_0_0_0_2px_#1E7A35]",
                state === "wrong" && "bg-[#FCE9ED] shadow-[inset_0_0_0_2px_#C4264A]",
              )}
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-xl text-[15px] font-bold",
                  state === "idle" && "bg-muted text-foreground",
                  state === "picked" && "bg-primary text-primary-foreground",
                  state === "right" && "bg-[#1E7A35] text-white",
                  state === "wrong" && "bg-[#C4264A] text-white",
                )}
              >
                {LETTERS[i]}
              </span>
              <span className="flex-1">{o.text}</span>
              {state === "right" ? <span className="text-sm font-bold text-[#1E7A35]">Correct answer</span> : null}
              {state === "wrong" ? <span className="text-sm font-bold text-[#C4264A]">Your answer</span> : null}
            </button>
          );
        })}
      </div>

      <div aria-live="polite">
        {checked ? (
          <div
            className={cn(
              "flex flex-col gap-2 rounded-2xl px-5 py-4",
              lastRight ? "bg-[#E6F6EA] text-[#1E7A35]" : "bg-[#FCE9ED] text-[#C4264A]",
            )}
          >
            <strong className="text-lg">{lastRight ? "That’s right." : "Not quite."}</strong>
            <p className="text-[17px] leading-relaxed text-[#3A3A3C]">{q.explanation}</p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[15px] text-muted-foreground">
          Score so far: {score} of {results.length}
        </span>
        {checked ? (
          <Button size="lg" onClick={next}>
            {index === questions.length - 1 ? "See results" : "Next question"}
          </Button>
        ) : (
          <Button size="lg" onClick={check} disabled={!picked}>
            Check answer
          </Button>
        )}
      </div>
      <p className="sr-only">Module {moduleNumber} quiz</p>
    </section>
  );
}
