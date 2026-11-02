// Builds the app's slide data from the deck in deck/.
//
// deck/ is the source of truth: deck.json (order + sections) and one HTML file
// per slide. This script turns them into two generated modules:
//
//   src/generated/slides.json  public: slide markup, transitions, titles, sections
//   src/generated/notes.json   presenter-only: speaker notes, timing and cues
//
// Notes live in their own file so learner and audience pages can never import
// them. Only the presenter page (behind the presenter login) reads notes.json.
//
// Run automatically before `dev` and `build` (see package.json).

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Check,
  CircleCheck,
  Clock,
  MessageCircle,
  Settings,
  Star,
  TriangleAlert,
} from "lucide-react";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const deckDir = join(root, "deck");
const outDir = join(root, "src", "generated");

// Icon names used by the deck's <x-icon> elements, mapped to Lucide icons.
const ICONS = {
  Chat: MessageCircle,
  Check: Check,
  CheckCircle: CircleCheck,
  Clock: Clock,
  Settings: Settings,
  Star: Star,
  Warning: TriangleAlert,
};

const deck = JSON.parse(readFileSync(join(deckDir, "deck.json"), "utf8"));
const problems = [];

const decode = (s) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");

const stripTags = (s) =>
  decode(s.replace(/-\s*<br\s*\/?>\s*/g, "-").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

const attr = (attrs, name) => {
  const m = attrs.match(new RegExp(`\\s${name}="([^"]*)"`));
  return m ? m[1] : null;
};

const escapeAttr = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");

// The deck sets font-family: 'Inter'. The app self-hosts Inter as "Inter Variable".
const fixFonts = (s) => s.replace(/'Inter'/g, "'Inter Variable', 'Inter'");

function embedDocument(content) {
  return (
    "<!doctype html><html><head><meta charset=\"utf-8\">" +
    "<style>:root{color-scheme:normal}html,body{margin:0;background:transparent}</style>" +
    "</head><body>" +
    content +
    "</body></html>"
  );
}

function renderIcon(attrs, slideId) {
  const name = attr(attrs, "name");
  const style = attr(attrs, "style") || "";
  const Icon = ICONS[name];
  if (!Icon) {
    problems.push(`${slideId}: unmapped icon "${name}"`);
    return "";
  }
  const svg = renderToStaticMarkup(createElement(Icon, { "aria-hidden": "true", strokeWidth: 2.25 }));
  return svg.replace("<svg ", `<svg style="${style}" `);
}

// Sections: deck.json lists each section with the slide it starts on.
const order = deck.order;
const sectionStarts = Object.entries(deck.sections)
  .map(([key, s]) => ({ key, start: order.indexOf(s.start), description: s.description }))
  .filter((s) => s.start >= 0)
  .sort((a, b) => a.start - b.start);

const sectionLabel = (description) => description.split(":")[0].replace(/\s+—\s+/, " · ").trim();

const sections = sectionStarts.map((s, i) => ({
  key: s.key,
  label: sectionLabel(s.description),
  description: s.description,
  start: s.start,
  end: (sectionStarts[i + 1]?.start ?? order.length) - 1,
}));

const sectionFor = (index) => {
  let found = sections[0];
  for (const s of sections) if (s.start <= index) found = s;
  return found;
};

// Modules: Module 1-5 run from each divider (m1...m5) to the slide before the next divider.
const moduleKeys = ["m1", "m2", "m3", "m4", "m5"];
const modules = moduleKeys.map((key, i) => {
  const start = order.indexOf(key);
  const nextStart = i + 1 < moduleKeys.length ? order.indexOf(moduleKeys[i + 1]) : order.indexOf("close");
  const section = sections.find((s) => s.key === key);
  return {
    key,
    number: i + 1,
    title: section ? section.label.replace(/^Module \d+ · /, "") : key,
    start,
    end: nextStart - 1,
  };
});

const moduleFor = (index) => modules.find((m) => index >= m.start && index <= m.end)?.key ?? null;

const slides = [];
const notes = {};

order.forEach((id, index) => {
  const raw = readFileSync(join(deckDir, "slides", `${id}.html`), "utf8");
  const open = raw.match(/<section([^>]*)>/);
  if (!open) {
    problems.push(`${id}: no <section>`);
    return;
  }
  const sectionAttrs = open[1];
  let inner = raw.slice(open.index + open[0].length, raw.lastIndexOf("</section>"));

  // Speaker notes: pulled out of the public markup entirely.
  const aside = inner.match(/<aside>([\s\S]*?)<\/aside>/);
  inner = inner.replace(/<aside>[\s\S]*?<\/aside>/, "");
  if (aside) {
    const text = decode(aside[1]).trim();
    const timing = text.match(/^\[~([^\]]+)\]\s*/);
    const minutes = timing ? Math.max(...(timing[1].match(/\d+(\.\d+)?/g) || ["0"]).map(Number)) : 0;
    notes[id] = {
      timing: timing ? timing[1].trim() : null,
      minutes,
      text: timing ? text.slice(timing[0].length) : text,
    };
  } else {
    problems.push(`${id}: no speaker notes`);
  }

  // Looping animations: pulled out first so their code is left untouched.
  const embeds = [];
  inner = inner.replace(/<x-embed([^>]*)>([\s\S]*?)<\/x-embed>/g, (_, attrs, content) => {
    embeds.push({ style: attr(attrs, "style") || "", content });
    return `@@EMBED${embeds.length - 1}@@`;
  });

  // Icons
  inner = inner.replace(/<x-icon([^>]*)><\/x-icon>/g, (_, attrs) => renderIcon(attrs, id));
  if (/<x-[a-z]/.test(inner)) problems.push(`${id}: unhandled custom element`);

  // Prefix SVG ids so slides shown side by side (thumbnails) never share gradient ids.
  const ids = [...inner.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  for (const svgId of new Set(ids)) {
    const safe = svgId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const next = `${id}__${svgId}`;
    inner = inner
      .replace(new RegExp(`(\\sid=")${safe}"`, "g"), `$1${next}"`)
      .replace(new RegExp(`url\\(#${safe}\\)`, "g"), `url(#${next})`)
      .replace(new RegExp(`href="#${safe}"`, "g"), `href="#${next}"`);
  }

  inner = fixFonts(inner);

  const live = inner.replace(/@@EMBED(\d+)@@/g, (_, n) => {
    const e = embeds[Number(n)];
    return `<iframe data-embed="${n}" title="Animation" sandbox="allow-scripts" srcdoc="${escapeAttr(
      embedDocument(e.content),
    )}" style="${e.style}"></iframe>`;
  });
  const thumb = inner.replace(/@@EMBED(\d+)@@/g, (_, n) => `<div style="${embeds[Number(n)].style}"></div>`);

  const heading = inner.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/);
  const section = sectionFor(index);

  slides.push({
    id,
    index,
    number: index + 1,
    title: heading ? stripTags(heading[1]) : id,
    section: section.key,
    module: moduleFor(index),
    transition: attr(sectionAttrs, "data-transition") || "push",
    style: fixFonts(attr(sectionAttrs, "style") || ""),
    html: live,
    thumbHtml: thumb,
    embedCount: embeds.length,
  });
});

// Law label for each of a law's four slides (hick-law, hick-wild, hick-kestrel, hick-roles).
const lawTitles = Object.fromEntries(
  slides.filter((s) => s.id.endsWith("-law")).map((s) => [s.id.slice(0, -4), s.title]),
);
for (const s of slides) {
  const prefix = s.id.split("-")[0];
  s.law = s.id.includes("-") && lawTitles[prefix] && !s.id.endsWith("-recap") ? lawTitles[prefix] : null;
}

mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, "slides.json"),
  JSON.stringify({ title: deck.title, sections, modules, slides }),
);
writeFileSync(join(outDir, "notes.json"), JSON.stringify(notes));

const embedTotal = slides.reduce((n, s) => n + s.embedCount, 0);
console.log(
  `[deck] ${slides.length} slides, ${sections.length} sections, ${embedTotal} animations, ${Object.keys(notes).length} notes`,
);
if (problems.length) {
  console.error(`[deck] ${problems.length} problem(s):\n  ` + problems.join("\n  "));
  process.exit(1);
}
