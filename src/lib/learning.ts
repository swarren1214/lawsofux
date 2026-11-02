import "server-only";

import data from "@/generated/learning.json";

export type Block =
  | { type: "p"; text: string; emphasis?: boolean }
  | { type: "card"; label: string | null; title: string; lines: string[] };

export type Beat = {
  kind: "law" | "wild" | "kestrel" | "roles";
  slide: string;
  label: string | null;
  title: string;
  source: string | null;
  blocks: Block[];
};

export type Law = {
  key: string;
  slug: string;
  name: string;
  module: string;
  definition: string;
  position: number;
  ofTotal: number;
  beats: Beat[];
};

export type LearningModule = {
  key: string;
  number: number;
  title: string;
  subtitle: string;
  divider: string;
  recap: string;
  laws: string[];
};

export const learning = data as unknown as { modules: LearningModule[]; laws: Law[] };

export const getLaw = (slug: string) => learning.laws.find((l) => l.slug === slug);
export const getModule = (key: string) => learning.modules.find((m) => m.key === key);
export const lawsOf = (key: string) => learning.laws.filter((l) => l.module === key);

/** Previous and next law in deck order, across modules. */
export function neighbors(slug: string) {
  const i = learning.laws.findIndex((l) => l.slug === slug);
  return { prev: learning.laws[i - 1] ?? null, next: learning.laws[i + 1] ?? null };
}

/** The navigation tree the sidebar and mobile menu render. */
export function navTree(quizOpen: Record<string, boolean>) {
  return learning.modules.map((m) => ({
    key: m.key,
    number: m.number,
    title: m.title,
    quiz: m.key in quizOpen ? { open: quizOpen[m.key] } : null,
    laws: lawsOf(m.key).map((l) => ({ slug: l.slug, name: l.name })),
  }));
}

export type NavTree = ReturnType<typeof navTree>;
