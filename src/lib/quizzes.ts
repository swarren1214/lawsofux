import "server-only";

import m1 from "../../content/quizzes/m1.json";
import { deck } from "./deck";
import { learning } from "./learning";

/*
 * Module quizzes live in content/quizzes/<module>.json, one file per module.
 * Set "open": true once that module's session has run. Presenters can preview
 * a quiz before it opens.
 *
 * Nothing is saved: people see their score and which laws to revisit.
 */

export type QuizOption = { id: string; text: string };
export type QuizQuestion = {
  id: string;
  /** The law's first slide id, e.g. "hick-law". */
  law: string;
  prompt: string;
  options: QuizOption[];
  answer: string;
  explanation: string;
};
export type Quiz = { module: string; open: boolean; questions: QuizQuestion[] };

const all: Quiz[] = [m1 as Quiz];

export function getQuiz(moduleKey: string) {
  return all.find((q) => q.module === moduleKey);
}

export function quizSummaries() {
  return all.map((q) => ({ module: q.module, open: q.open, count: q.questions.length }));
}

/** The question set plus law names, ready for the quiz page. */
export function quizForPage(quiz: Quiz) {
  const lawName = (id: string) => deck.slides.find((s) => s.id === id)?.title ?? id;
  const lawSlug = (id: string) => learning.laws.find((l) => l.key === id.replace(/-law$/, ""))?.slug ?? null;
  return quiz.questions.map((q) => ({ ...q, lawName: lawName(q.law), lawSlug: lawSlug(q.law) }));
}
