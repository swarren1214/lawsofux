// Builds the learning site's content from the deck.
//
// Every law has four slides (<prefix>-law, -wild, -kestrel, -roles). This script
// reads them and writes src/generated/learning.json with:
//   - modules: number, title, subtitle, laws in order, divider and recap slides
//   - laws: slug, name, module, position, and each beat's readable text
//     (title, paragraphs and cards), taken straight from the slide markup
//
// The law pages show each slide inline AND its text as web text, so the words
// are selectable, searchable and readable by screen readers.
//
// Runs in `npm run deck`, after scripts/build-deck.mjs.

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "node-html-parser";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const deck = JSON.parse(readFileSync(join(root, "deck", "deck.json"), "utf8"));
const { modules: deckModules } = JSON.parse(readFileSync(join(root, "src", "generated", "slides.json"), "utf8"));

const BEATS = ["law", "wild", "kestrel", "roles"];
const problems = [];

const clean = (s) => s.replace(/\s+/g, " ").trim();

const slugify = (s) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/s[’']s\b/g, "s")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function loadSection(id) {
  const raw = readFileSync(join(root, "deck", "slides", `${id}.html`), "utf8")
    .replace(/<aside>[\s\S]*?<\/aside>/, "")
    .replace(/<x-embed[\s\S]*?<\/x-embed>/g, "");
  const section = parse(raw).querySelector("section");
  if (!section) throw new Error(`${id}: no <section>`);
  return section;
}

const leftOf = (el) => {
  const m = (el.getAttribute?.("style") || "").match(/left:\s*(\d+)px/);
  return m ? Number(m[1]) : 0;
};

/** Text of an element, ignoring SVG drawings. */
function textOf(el) {
  // "Aesthetic-<br>Usability" is a line break inside one word, not a space.
  const copy = parse(el.toString().replace(/-\s*<br\s*\/?>\s*/g, "-").replace(/<br\s*\/?>/g, " "));
  copy.querySelectorAll("svg").forEach((s) => s.remove());
  return clean(copy.text);
}

/**
 * Turns one slide into readable blocks, in the order the slide reads.
 * Kestrel slides draw a before/after phone mock on their right half; that mock
 * stays in the slide image and is left out of the text.
 */
function extract(id, kind) {
  const section = loadSection(id);
  const out = { slide: id, label: null, title: null, source: null, blocks: [] };

  for (const el of section.childNodes) {
    if (el.nodeType !== 1) continue;
    const tag = el.tagName.toLowerCase();
    if (kind === "kestrel" && leftOf(el) >= 900) continue;
    const text = textOf(el);
    if (!text) continue;

    if (["p", "h1", "h2", "h3"].includes(tag)) {
      if (/^Beat \d+ ·/.test(text)) out.label = text.replace(/^Beat \d+ ·\s*/, "");
      else if (/^Next: /.test(text)) continue;
      else if (/^Source: /.test(text)) out.source = text.replace(/^Source:\s*/, "");
      else if ((tag === "h1" || tag === "h2") && !out.title) out.title = text;
      else out.blocks.push({ type: "p", text });
      continue;
    }

    // A card: an optional small label, a heading, and its lines.
    const parts = el.querySelectorAll("h3, p, li").map((n) => ({ tag: n.tagName.toLowerCase(), text: textOf(n) }));
    const usable = parts.filter((p) => p.text && !/^\d{1,2}$/.test(p.text));
    const h = usable.findIndex((p) => p.tag === "h3");
    if (h < 0) {
      // A text panel with no heading (e.g. "The fix: …")
      out.blocks.push({ type: "p", text, emphasis: true });
      continue;
    }
    out.blocks.push({
      type: "card",
      label: usable.slice(0, h).map((p) => p.text).join(" ") || null,
      title: usable[h].text,
      lines: usable.slice(h + 1).map((p) => p.text),
    });
  }

  if (!out.title) problems.push(`${id}: no title found`);
  if (!out.blocks.length) problems.push(`${id}: no text found`);
  return out;
}

// Laws, in deck order
const lawPrefixes = deck.order.filter((id) => id.endsWith("-law")).map((id) => id.slice(0, -4));
const laws = [];
for (const prefix of lawPrefixes) {
  const ids = BEATS.map((b) => `${prefix}-${b}`);
  const missing = ids.filter((id) => !deck.order.includes(id));
  if (missing.length) {
    problems.push(`${prefix}: missing slides ${missing.join(", ")}`);
    continue;
  }
  const beats = BEATS.map((kind) => ({ kind, ...extract(`${prefix}-${kind}`, kind) }));
  const index = deck.order.indexOf(`${prefix}-law`);
  const mod = deckModules.find((m) => index >= m.start && index <= m.end);
  const name = beats[0].title;
  laws.push({
    key: prefix,
    slug: slugify(name),
    name,
    module: mod?.key ?? null,
    definition: beats[0].blocks[0]?.text ?? "",
    beats,
  });
}

// Modules
const modules = deckModules.map((m) => {
  const divider = loadSection(m.key);
  const subtitle =
    divider
      .querySelectorAll("p")
      .map((p) => textOf(p))
      .find((t) => t.length > 30) ?? "";
  const moduleLaws = laws.filter((l) => l.module === m.key);
  moduleLaws.forEach((l, i) => {
    l.position = i + 1;
    l.ofTotal = moduleLaws.length;
  });
  return {
    key: m.key,
    number: m.number,
    title: m.title,
    subtitle,
    divider: m.key,
    recap: `${m.key}-recap`,
    laws: moduleLaws.map((l) => l.slug),
  };
});

const slugs = new Set();
for (const l of laws) {
  if (slugs.has(l.slug)) problems.push(`duplicate law slug ${l.slug}`);
  slugs.add(l.slug);
  if (!l.module) problems.push(`${l.key}: not inside a module`);
}

writeFileSync(join(root, "src", "generated", "learning.json"), JSON.stringify({ modules, laws }));
console.log(`[learning] ${modules.length} modules, ${laws.length} law pages`);
if (problems.length) {
  console.error(`[learning] ${problems.length} problem(s):\n  ` + problems.join("\n  "));
  process.exit(1);
}
