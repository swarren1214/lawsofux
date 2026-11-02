/*
 * Search over the generated index (src/generated/search.json), in the browser.
 *
 * - Every meaningful word must match (title, symptom tags, law name, snippet or body).
 *   Words that appear nowhere in the whole index are ignored, so
 *   "my app feels slow" still finds "feels slow".
 * - Matching is forgiving: possessives ("Hick’s" = "hicks"), plurals and -ing/-ed,
 *   prefixes while typing ("fit" → Fitts’s Law) and one typo ("fits law").
 * - A whole symptom phrase in the query ranks highest and becomes the result's
 *   "Matches “…”" line.
 */

export type EntryType = "law" | "example" | "kestrel" | "quiz";

export type SearchEntry = {
  id: string;
  type: EntryType;
  module: string;
  law: string;
  lawSlug: string;
  /** The law's first slide, for "Present its slides". */
  slide: string;
  tags: string[];
  title: string;
  snippet: string;
  text: string;
  href: string;
};

export type SearchIndex = {
  featured: string[];
  modules: { key: string; number: number; title: string }[];
  entries: SearchEntry[];
};

export type SearchResult = {
  entry: SearchEntry;
  score: number;
  /** The symptom tag that explains the match, if one did. */
  why: string | null;
};

const STOP = new Set(
  "a an and are as at be but by can do does for from how i if in into is it its my of on or our so that the their them then there they this to too us was we what when where which who why will with you your".split(
    " ",
  ),
);
// "too" is a stop word for single-word matching only; phrases like "too many options" still match whole.

/** Lowercase, no accents, no apostrophes ("Fitts’s" → "fitts", "Hick’s" → "hicks"). */
export function normalize(s: string) {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[“”"]/g, "")
    .replace(/s[’']s\b/g, "s")
    .replace(/[’']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Crude English stem: enough to make plurals and -ing/-ed line up. */
export function stem(w: string) {
  if (w.length > 5 && w.endsWith("ing")) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith("ed")) return w.slice(0, -2);
  if (w.length > 4 && w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
}

export function words(s: string) {
  return normalize(s)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map(stem);
}

/** True when a and b differ by at most one edit (insert, delete, substitute, swap). */
function withinOne(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (i === a.length && i === b.length) return true;
  const rest = (x: number, y: number) => a.slice(i + x) === b.slice(i + y);
  if (rest(1, 1) || rest(1, 0) || rest(0, 1)) return true;
  // swapped neighbors: "fitst" ↔ "fitts"
  return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2);
}

/** How well query word q matches index word t: 1 exact, 0.8 prefix, 0.6 one typo, 0 none. */
function wordMatch(q: string, t: string) {
  if (q === t) return 1;
  if (q.length >= 2 && t.startsWith(q)) return 0.8;
  if (q.length >= 5 && withinOne(q, t)) return 0.6;
  return 0;
}

type Prepared = {
  entry: SearchEntry;
  order: number;
  fields: { weight: number; words: string[] }[];
  tags: { raw: string; norm: string; words: string[] }[];
};

const WEIGHTS = { title: 6, tags: 4, law: 3, snippet: 2, text: 1 };

export function prepare(index: SearchIndex) {
  const prepared: Prepared[] = index.entries.map((entry, order) => ({
    entry,
    order,
    fields: [
      { weight: WEIGHTS.title, words: words(entry.title) },
      { weight: WEIGHTS.tags, words: entry.tags.flatMap(words) },
      { weight: WEIGHTS.law, words: entry.type === "law" ? [] : words(entry.law) },
      { weight: WEIGHTS.snippet, words: words(entry.snippet) },
      { weight: WEIGHTS.text, words: words(entry.text) },
    ],
    tags: entry.tags.map((raw) => ({ raw, norm: normalize(raw), words: words(raw) })),
  }));
  const vocabulary = [...new Set(prepared.flatMap((p) => p.fields.flatMap((f) => f.words)))];
  return { prepared, vocabulary };
}

export type Prepared_ = ReturnType<typeof prepare>;

/** The query words worth matching: no stop words, nothing the index has never heard of. */
export function queryWords(query: string, vocabulary: string[]) {
  const ws = words(query).filter((w) => !STOP.has(w));
  return ws.filter((w) => vocabulary.some((v) => wordMatch(w, v) > 0));
}

export function search({ prepared, vocabulary }: Prepared_, query: string): SearchResult[] {
  const q = normalize(query);
  if (!q) return [];
  const qs = queryWords(query, vocabulary);
  const results: (SearchResult & { order: number })[] = [];

  for (const p of prepared) {
    // A whole symptom phrase in the query (or the query inside a symptom) wins outright.
    const phrase = p.tags.find((t) => q.includes(t.norm) || (q.length >= 4 && t.norm.includes(q)));
    let score = phrase ? 12 : 0;
    let ok = qs.length > 0 || Boolean(phrase);

    for (const w of qs) {
      let best = 0;
      for (const f of p.fields) for (const t of f.words) best = Math.max(best, f.weight * wordMatch(w, t));
      if (best === 0) {
        if (!phrase) ok = false;
        continue;
      }
      score += best;
    }
    if (!ok) continue;

    const title = normalize(p.entry.title);
    if (title === q) score += 20;
    else if (title.startsWith(q)) score += 8;
    if (p.entry.type === "law") score += 1.5;

    const why =
      phrase?.raw ??
      p.tags.find((t) => qs.length > 0 && qs.every((w) => t.words.some((tw) => wordMatch(w, tw) >= 0.8)))?.raw ??
      null;
    results.push({ entry: p.entry, score, why, order: p.order });
  }

  // Best score first; ties keep deck order.
  return results.sort((a, b) => b.score - a.score || a.order - b.order).map((r) => ({ entry: r.entry, score: r.score, why: r.why }));
}

/** Splits text into plain and matched pieces, for highlighting. */
export function highlight(text: string, query: string, vocabulary: string[]) {
  const qs = queryWords(query, vocabulary);
  if (!qs.length) return [{ text, hit: false }];
  const parts: { text: string; hit: boolean }[] = [];
  for (const piece of text.split(/(\s+)/)) {
    const core = words(piece);
    const hit = core.length > 0 && core.some((c) => qs.some((w) => wordMatch(w, c) >= 0.8));
    const last = parts.at(-1);
    if (last && last.hit === hit) last.text += piece;
    else parts.push({ text: piece, hit });
  }
  return parts;
}
