/** The parts of a slide the client needs to render it. Never includes notes. */
export type StageSlide = {
  id: string;
  number: number;
  title: string;
  section: string;
  module: string | null;
  law: string | null;
  transition: "push" | "fade";
  style: string;
  html: string;
  thumbHtml: string;
};

export type DeckSection = { key: string; label: string; start: number; end: number };
export type DeckModule = { key: string; number: number; title: string; start: number; end: number };
