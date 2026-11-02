// Parity check: proves the app shows exactly what's in the deck.
//
// For every slide in deck/, compares the source file with the generated data
// the app renders (src/generated/), and fails if anything was lost:
//   - every word of slide text
//   - speaker notes, word for word
//   - each looping animation's code, unchanged
//   - every build-in, in the same order, with the same effect
//   - the slide transition
// It also checks the quiz files in content/quizzes/.
//
// Runs after scripts/build-deck.mjs in `npm run deck`, so `dev`, `build` and CI all enforce it.

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const deck = JSON.parse(readFileSync(join(root, "deck", "deck.json"), "utf8"));
const { slides, modules } = JSON.parse(readFileSync(join(root, "src", "generated", "slides.json"), "utf8"));
const notes = JSON.parse(readFileSync(join(root, "src", "generated", "notes.json"), "utf8"));

const failures = [];
const fail = (msg) => failures.push(msg);

const decode = (s) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");

/** Visible words in slide markup, ignoring animation code and icon drawings. */
function words(html) {
  return decode(
    html
      .replace(/<x-embed[\s\S]*?<\/x-embed>/g, " ")
      .replace(/<iframe[\s\S]*?<\/iframe>/g, " ")
      .replace(/<style[\s\S]*?<\/style>/g, " ")
      .replace(/<script[\s\S]*?<\/script>/g, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

const buildIns = (html) => [...html.matchAll(/data-build-in="([^"]*)"/g)].map((m) => m[1]);

if (slides.length !== deck.order.length) fail(`slide count: deck has ${deck.order.length}, app has ${slides.length}`);

deck.order.forEach((id, i) => {
  const app = slides[i];
  if (!app || app.id !== id) {
    fail(`${id}: missing or out of order (position ${i + 1})`);
    return;
  }
  const raw = readFileSync(join(root, "deck", "slides", `${id}.html`), "utf8");
  const aside = raw.match(/<aside>([\s\S]*?)<\/aside>/);
  const body = raw.replace(/<aside>[\s\S]*?<\/aside>/, "");

  // Text
  const want = words(body);
  const got = words(app.html);
  if (want !== got) {
    const a = want.split(" ");
    const b = got.split(" ");
    const at = a.findIndex((w, k) => w !== b[k]);
    fail(`${id}: slide text differs near “${a.slice(Math.max(0, at - 3), at + 4).join(" ")}”`);
  }

  // Notes
  const note = notes[id];
  if (!aside || !note) fail(`${id}: speaker notes missing`);
  else {
    const rebuilt = (note.timing ? `[~${note.timing}] ` : "") + note.text;
    if (decode(aside[1]).trim().replace(/\s+/g, " ") !== rebuilt.trim().replace(/\s+/g, " ")) {
      fail(`${id}: speaker notes differ from the deck`);
    }
  }
  if (/<aside/i.test(app.html) || (note && app.html.includes(note.text.slice(0, 40)))) {
    fail(`${id}: speaker notes leaked into public slide markup`);
  }

  // Looping animations: same count, original code intact inside each sandboxed frame
  const embeds = [...body.matchAll(/<x-embed[^>]*>([\s\S]*?)<\/x-embed>/g)].map((m) => m[1]);
  const frames = [...app.html.matchAll(/<iframe[^>]*srcdoc="([^"]*)"[^>]*><\/iframe>/g)].map((m) =>
    m[1].replace(/&quot;/g, '"').replace(/&amp;/g, "&"),
  );
  if (embeds.length !== frames.length) fail(`${id}: ${embeds.length} animations in deck, ${frames.length} in app`);
  embeds.forEach((code, k) => {
    if (frames[k] && !frames[k].includes(code)) fail(`${id}: animation ${k + 1} code was changed`);
  });
  if (/sandbox="allow-scripts"/.test(app.html) === false && frames.length) fail(`${id}: animation frames aren’t sandboxed`);
  if (/allow-same-origin/.test(app.html)) fail(`${id}: animation frames must not get same-origin access`);

  // Build-ins and transition
  if (buildIns(body).join("|") !== buildIns(app.html).join("|")) fail(`${id}: build-ins differ from the deck`);
  const transition = raw.match(/<section[^>]*data-transition="([^"]*)"/)?.[1] ?? "push";
  if (transition !== app.transition) fail(`${id}: transition is ${app.transition}, deck says ${transition}`);
});

// Quizzes
const quizDir = join(root, "content", "quizzes");
let questionCount = 0;
for (const file of readdirSync(quizDir).filter((f) => f.endsWith(".json"))) {
  const quiz = JSON.parse(readFileSync(join(quizDir, file), "utf8"));
  const mod = modules.find((m) => m.key === quiz.module);
  if (!mod) {
    fail(`${file}: unknown module “${quiz.module}”`);
    continue;
  }
  if (typeof quiz.open !== "boolean") fail(`${file}: "open" must be true or false`);
  const ids = new Set();
  for (const q of quiz.questions) {
    questionCount++;
    if (ids.has(q.id)) fail(`${file}: duplicate question id ${q.id}`);
    ids.add(q.id);
    const law = slides.find((s) => s.id === q.law);
    if (!law || !q.law.endsWith("-law")) fail(`${file} ${q.id}: “${q.law}” isn’t a law slide`);
    else if (law.module !== quiz.module) fail(`${file} ${q.id}: ${q.law} belongs to ${law.module}, not ${quiz.module}`);
    if (q.options.length < 2) fail(`${file} ${q.id}: needs at least two options`);
    if (!q.options.some((o) => o.id === q.answer)) fail(`${file} ${q.id}: answer “${q.answer}” isn’t one of the options`);
    if (!q.explanation?.trim()) fail(`${file} ${q.id}: missing explanation`);
  }
}

// ---- Learning pages: every law slide has a page with four readable beats ----
const learning = JSON.parse(readFileSync(join(root, "src", "generated", "learning.json"), "utf8"));
const lawSlides = slides.filter((s) => s.id.endsWith("-law"));
if (learning.laws.length !== lawSlides.length)
  fail(`learning: ${learning.laws.length} law pages but ${lawSlides.length} law slides`);
const slugs = new Set();
for (const law of learning.laws) {
  if (slugs.has(law.slug)) fail(`learning: duplicate slug ${law.slug}`);
  slugs.add(law.slug);
  if (!/^[a-z0-9-]+$/.test(law.slug)) fail(`learning: bad slug “${law.slug}”`);
  if (law.beats.length !== 4) fail(`learning ${law.slug}: ${law.beats.length} beats, expected 4`);
  for (const b of law.beats) {
    if (!b.title?.trim()) fail(`learning ${law.slug} ${b.slide}: missing title`);
    if (!b.blocks.length) fail(`learning ${law.slug} ${b.slide}: no text extracted`);
    if (!slides.some((s) => s.id === b.slide)) fail(`learning ${law.slug}: unknown slide ${b.slide}`);
  }
}
for (const m of learning.modules)
  for (const slug of m.laws) if (!slugs.has(slug)) fail(`learning ${m.key}: unknown law ${slug}`);

// ---- Search: every law is findable; closed quizzes never leak into the index ----
const searchIndex = JSON.parse(readFileSync(join(root, "src", "generated", "search.json"), "utf8"));
for (const law of learning.laws)
  if (!searchIndex.entries.some((e) => e.type === "law" && e.lawSlug === law.slug)) fail(`search: ${law.slug} isn’t in the index`);
for (const file of readdirSync(quizDir).filter((f) => f.endsWith(".json"))) {
  const quiz = JSON.parse(readFileSync(join(quizDir, file), "utf8"));
  if (quiz.open) continue;
  for (const q of quiz.questions)
    if (searchIndex.entries.some((e) => e.id === `quiz-${q.id}`)) fail(`search: ${q.id} is searchable but its quiz isn’t open`);
}

if (failures.length) {
  console.error(`[parity] ${failures.length} problem(s):\n  ` + failures.join("\n  "));
  process.exit(1);
}
console.log(`[parity] all ${slides.length} slides match the deck; ${questionCount} quiz questions valid; ${learning.laws.length} law pages; ${searchIndex.entries.length} search entries`);
