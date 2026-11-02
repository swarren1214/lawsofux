// Builds the search index: src/generated/search.json.
//
// Four kinds of entry, all taken from content that already exists:
//   - law      one per law: name, definition, research line, the role questions
//   - example  one per "In the wild" card
//   - kestrel  one per Kestrel story
//   - quiz     one per question, only from quizzes that are open (closed ones stay hidden)
//
// Each entry also gets its law's symptom tags from content/search/symptoms.json,
// so people can search by what feels wrong ("feels slow") as well as by name.
// The index is small (~130 entries), so the search page ships it whole and
// searches in the browser.
//
// Runs in `npm run deck`, after scripts/build-learning.mjs.

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (...p) => JSON.parse(readFileSync(join(root, ...p), "utf8"));

const learning = read("src", "generated", "learning.json");
const symptoms = read("content", "search", "symptoms.json");
const quizzes = readdirSync(join(root, "content", "quizzes"))
  .filter((f) => f.endsWith(".json"))
  .map((f) => read("content", "quizzes", f));

const problems = [];
const entries = [];
const moduleOf = (key) => learning.modules.find((m) => m.key === key);

for (const law of learning.laws) {
  const tags = symptoms.laws[law.slug];
  if (!tags) {
    problems.push(`${law.slug}: no symptoms in content/search/symptoms.json`);
    continue;
  }
  const [lawBeat, wild, kestrel, roles] = law.beats;
  const base = { module: law.module, law: law.name, lawSlug: law.slug, slide: lawBeat.slide, tags };
  const paragraphs = (beat) => beat.blocks.filter((b) => b.type === "p").map((b) => b.text);
  const cards = (beat) => beat.blocks.filter((b) => b.type === "card");

  entries.push({
    ...base,
    id: law.slug,
    type: "law",
    title: law.name,
    snippet: law.definition,
    text: [
      ...paragraphs(lawBeat).slice(1),
      ...cards(roles).map((c) => `${c.label}: ${c.title} ${c.lines.join(" ")}`),
      ...cards(wild).map((c) => c.title),
      kestrel.title,
    ].join(" "),
    href: `/laws/${law.slug}`,
  });

  cards(wild).forEach((card, i) => {
    entries.push({
      ...base,
      id: `${law.slug}#wild-${i + 1}`,
      type: "example",
      title: card.title,
      snippet: card.lines[0] ?? "",
      text: card.lines.slice(1).join(" "),
      href: `/laws/${law.slug}#in-the-wild`,
    });
  });

  const story = kestrel.blocks.filter((b) => b.type === "p");
  entries.push({
    ...base,
    id: `${law.slug}#kestrel`,
    type: "kestrel",
    title: kestrel.title,
    snippet: story.filter((b) => !b.emphasis).slice(0, 2).map((b) => b.text).join(" "),
    text: story.filter((b) => b.emphasis).map((b) => b.text).join(" "),
    href: `/laws/${law.slug}#at-kestrel`,
  });
}

let quizCount = 0;
for (const quiz of quizzes) {
  if (!quiz.open) continue;
  const mod = moduleOf(quiz.module);
  quiz.questions.forEach((q, i) => {
    const law = learning.laws.find((l) => `${l.key}-law` === q.law);
    if (!law) {
      problems.push(`${quiz.module} ${q.id}: no law for ${q.law}`);
      return;
    }
    quizCount++;
    entries.push({
      id: `quiz-${q.id}`,
      type: "quiz",
      module: quiz.module,
      law: law.name,
      lawSlug: law.slug,
      slide: `${law.key}-law`,
      tags: symptoms.laws[law.slug] ?? [],
      title: q.prompt,
      // Options help matching, but the answer itself is never shown in results.
      snippet: `Module ${mod.number} quiz · Question ${i + 1} of ${quiz.questions.length}`,
      text: q.options.map((o) => o.text).join(" "),
      href: `/quiz/${quiz.module}`,
    });
  });
}

for (const chip of symptoms.featured) {
  if (!Object.values(symptoms.laws).some((tags) => tags.includes(chip)))
    problems.push(`featured symptom “${chip}” isn’t a tag on any law`);
}
for (const slug of Object.keys(symptoms.laws)) {
  if (!learning.laws.some((l) => l.slug === slug)) problems.push(`symptoms.json: unknown law “${slug}”`);
  const n = symptoms.laws[slug].length;
  if (n < 3 || n > 5) problems.push(`symptoms.json ${slug}: ${n} symptoms, expected 3 to 5`);
}

if (problems.length) {
  console.error(`[search] ${problems.length} problem(s):\n  ` + problems.join("\n  "));
  process.exit(1);
}

const modules = learning.modules.map((m) => ({ key: m.key, number: m.number, title: m.title }));
writeFileSync(
  join(root, "src", "generated", "search.json"),
  JSON.stringify({ featured: symptoms.featured, modules, entries }),
);
const count = (t) => entries.filter((e) => e.type === t).length;
console.log(
  `[search] ${entries.length} entries: ${count("law")} laws, ${count("example")} examples, ` +
    `${count("kestrel")} Kestrel stories, ${quizCount} quiz questions (open quizzes only)`,
);
