import "server-only";

import data from "@/generated/slides.json";

export type Transition = "push" | "fade";

export type Slide = {
  id: string;
  index: number;
  number: number;
  title: string;
  section: string;
  module: string | null;
  law: string | null;
  transition: Transition;
  style: string;
  html: string;
  thumbHtml: string;
  embedCount: number;
};

export type Section = {
  key: string;
  label: string;
  description: string;
  start: number;
  end: number;
};

export type Module = {
  key: string;
  number: number;
  title: string;
  start: number;
  end: number;
};

export const deck = data as unknown as {
  title: string;
  sections: Section[];
  modules: Module[];
  slides: Slide[];
};

export function getSlide(id: string): Slide | undefined {
  return deck.slides.find((s) => s.id === id);
}

/** Laws in a module, in deck order, taken from each law's first slide. */
export function lawsInModule(moduleKey: string) {
  return deck.slides
    .filter((s) => s.module === moduleKey && s.id.endsWith("-law"))
    .map((s) => ({ id: s.id, name: s.title }));
}
