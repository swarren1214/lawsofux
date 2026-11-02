"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ListChecks, Presentation, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { highlight, prepare, search, type EntryType, type SearchIndex, type SearchResult } from "@/lib/search";
import { cn } from "@/lib/utils";

type BrowseModule = { key: string; number: number; title: string; laws: { slug: string; name: string }[] };
type Filter = "all" | EntryType;

const TABS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "law", label: "Laws" },
  { key: "example", label: "In the wild" },
  { key: "kestrel", label: "At Kestrel" },
  { key: "quiz", label: "Quiz questions" },
];
const TYPE_LABEL: Record<EntryType, string> = {
  law: "Law",
  example: "In the wild",
  kestrel: "At Kestrel",
  quiz: "Quiz question",
};
const isFilter = (t: string): t is Filter => TABS.some((x) => x.key === t);

export function SearchView({
  index,
  browse,
  quizOpen,
  presenter,
  initialQuery,
  initialType,
}: {
  index: SearchIndex;
  browse: BrowseModule[];
  quizOpen: Record<string, boolean>;
  presenter: boolean;
  initialQuery: string;
  initialType: string;
}) {
  const prepared = React.useMemo(() => prepare(index), [index]);
  const [query, setQuery] = React.useState(initialQuery);
  const [filter, setFilter] = React.useState<Filter>(isFilter(initialType) ? initialType : "all");
  const deferred = React.useDeferredValue(query);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const results = React.useMemo(() => search(prepared, deferred), [prepared, deferred]);
  const hasQuizEntries = index.entries.some((e) => e.type === "quiz");
  const tabs = TABS.filter((t) => t.key !== "quiz" || hasQuizEntries);
  const counts = Object.fromEntries(tabs.map((t) => [t.key, t.key === "all" ? results.length : results.filter((r) => r.entry.type === t.key).length]));
  const shown = filter === "all" ? results : results.filter((r) => r.entry.type === filter);
  const best = results.find((r) => r.entry.type === "law");
  const trimmed = deferred.trim();
  const moduleOf = (key: string) => index.modules.find((m) => m.key === key)!;

  // Keep the address in step, so a search can be shared or reloaded.
  React.useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (filter !== "all") params.set("type", filter);
    const next = `/search${params.size ? `?${params}` : ""}`;
    if (next !== window.location.pathname + window.location.search) window.history.replaceState(null, "", next);
  }, [query, filter]);

  React.useEffect(() => {
    if (!initialQuery) inputRef.current?.focus();
  }, [initialQuery]);

  const pick = (s: string) => {
    setQuery(s);
    setFilter("all");
  };

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h1 id="search-title" className="text-4xl font-extrabold tracking-[-0.03em] sm:text-5xl">
            What feels wrong?
          </h1>
          <p className="text-lg text-muted-foreground">
            Describe the problem in plain words, or look up a law by name. Searches laws, real-world examples,
            {hasQuizEntries ? " Kestrel stories and quiz questions." : " and Kestrel stories."}
          </p>
        </div>

        <form role="search" onSubmit={(e) => e.preventDefault()} className="relative">
          <Search className="pointer-events-none absolute left-5 top-1/2 size-6 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape" && query) {
                e.preventDefault();
                setQuery("");
              }
            }}
            aria-labelledby="search-title"
            aria-describedby="search-summary"
            placeholder="Try “feels slow” or “Fitts’s Law”"
            autoComplete="off"
            spellCheck={false}
            className="h-16 w-full rounded-2xl bg-card pl-14 pr-14 text-xl shadow-[inset_0_0_0_1.5px_var(--input),0_8px_24px_rgba(0,0,0,0.05)] outline-none placeholder:text-muted-foreground focus-visible:shadow-[inset_0_0_0_2px_var(--primary),0_8px_24px_rgba(0,0,0,0.05)] [&::-webkit-search-cancel-button]:hidden"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <X className="size-5" />
            </button>
          ) : null}
        </form>

        <div className="-mx-4 flex items-center gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0">
          <span className="mr-1 shrink-0 text-[15px] font-semibold text-muted-foreground" id="symptoms-label">
            Try a symptom:
          </span>
          <ul aria-labelledby="symptoms-label" className="contents">
            {index.featured.map((s) => {
              const on = trimmed.toLowerCase() === s;
              return (
                <li key={s}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => pick(s)}
                    className={cn(
                      "min-h-11 shrink-0 whitespace-nowrap rounded-full px-4 text-[15px] font-semibold outline-none transition focus-visible:ring-[3px] focus-visible:ring-ring/50",
                      on ? "bg-foreground text-background" : "bg-card text-[#3A3A3C] shadow-[inset_0_0_0_1.5px_var(--input)] hover:bg-muted dark:text-foreground",
                    )}
                  >
                    {s}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <p id="search-summary" aria-live="polite" className={cn(!trimmed && "sr-only", "text-[15px] text-muted-foreground")}>
        {trimmed
          ? results.length
            ? `${results.length} ${results.length === 1 ? "result" : "results"} for “${trimmed}”`
            : `No results for “${trimmed}”`
          : ""}
      </p>

      {!trimmed ? (
        <Browse modules={browse} />
      ) : results.length === 0 ? (
        <NothingFound query={trimmed} modules={browse} onPick={pick} featured={index.featured} />
      ) : (
        <div className="-mt-4 flex flex-col gap-6">
          <div role="group" aria-label="Show" className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            {tabs.map((t) => {
              const on = filter === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  aria-pressed={on}
                  disabled={counts[t.key] === 0 && !on}
                  onClick={() => setFilter(t.key)}
                  className={cn(
                    "flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-4 text-[15px] font-semibold outline-none transition focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-40",
                    on ? "bg-foreground text-background" : "text-[#3A3A3C] enabled:hover:bg-muted dark:text-foreground",
                  )}
                >
                  {t.label}
                  <span className={cn("rounded-full px-2 py-0.5 text-xs tabular-nums", on ? "bg-background/20" : "bg-muted")}>
                    {counts[t.key]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section aria-label="Results">
              {shown.length ? (
                <ol className="flex flex-col gap-3">
                  {shown.map((r) => (
                    <ResultItem key={r.entry.id} result={r} query={deferred} vocabulary={prepared.vocabulary} module={moduleOf(r.entry.module)} />
                  ))}
                </ol>
              ) : (
                <p className="rounded-2xl bg-card p-6 text-muted-foreground">
                  Nothing in this tab.{" "}
                  <button type="button" onClick={() => setFilter("all")} className="font-semibold text-accent-foreground hover:underline">
                    Show all results
                  </button>
                </p>
              )}
            </section>

            {best ? (
              <BestMatch
                result={best}
                module={moduleOf(best.entry.module)}
                presenter={presenter}
                quizOpen={quizOpen[best.entry.module] === true}
              />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function Pill({ moduleKey, children }: { moduleKey: string; children: React.ReactNode }) {
  return (
    <span
      className="rounded-full px-3 py-1 text-[13px] font-bold"
      style={{ color: `var(--${moduleKey}-ink)`, background: `var(--${moduleKey}-tint)` }}
    >
      {children}
    </span>
  );
}

function TypeBadge({ type, moduleKey }: { type: EntryType; moduleKey: string }) {
  if (type === "law") return <Pill moduleKey={moduleKey}>{TYPE_LABEL.law}</Pill>;
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-[13px] font-bold",
        type === "kestrel" && "bg-[#1D1D1F] text-[#F5F5F7] dark:bg-[#F5F5F7] dark:text-[#1D1D1F]",
        type === "quiz" && "bg-accent text-accent-foreground",
        type === "example" && "bg-muted text-[#3A3A3C] dark:text-foreground",
      )}
    >
      {TYPE_LABEL[type]}
    </span>
  );
}

function Marked({ text, query, vocabulary }: { text: string; query: string; vocabulary: string[] }) {
  return (
    <>
      {highlight(text, query, vocabulary).map((p, i) =>
        p.hit ? (
          <mark key={i} className="rounded bg-[#FFF1A8] px-0.5 text-inherit dark:bg-[#5C4A00]">
            {p.text}
          </mark>
        ) : (
          <React.Fragment key={i}>{p.text}</React.Fragment>
        ),
      )}
    </>
  );
}

function ResultItem({
  result,
  query,
  vocabulary,
  module,
}: {
  result: SearchResult;
  query: string;
  vocabulary: string[];
  module: { key: string; number: number; title: string };
}) {
  const e = result.entry;
  const where = e.type === "law" ? `Module ${module.number} · ${module.title}` : `${e.law} · Module ${module.number}`;
  const showWhy = result.why && !e.title.toLowerCase().includes(result.why.toLowerCase());
  return (
    <li>
      <Link
        href={e.href}
        className="group flex gap-4 rounded-2xl bg-card p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)] outline-none transition hover:shadow-[0_10px_28px_rgba(0,0,0,0.08)] focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <span
          aria-hidden="true"
          className={cn("mt-2 size-3.5 shrink-0", e.type === "law" ? "rounded-full" : "rounded")}
          style={{ background: `var(--${e.module})` }}
        />
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <TypeBadge type={e.type} moduleKey={e.module} />
            <span className="text-sm text-muted-foreground">{where}</span>
          </span>
          <span className="text-lg font-bold leading-snug">
            <Marked text={e.title} query={query} vocabulary={vocabulary} />
          </span>
          <span className="text-[15px] leading-relaxed text-muted-foreground">
            <Marked text={e.snippet} query={query} vocabulary={vocabulary} />
          </span>
          {showWhy ? (
            <span className="text-sm font-semibold" style={{ color: `var(--${e.module}-ink)` }}>
              Matches “{result.why}”
            </span>
          ) : null}
        </span>
        <ArrowRight
          aria-hidden="true"
          className="mt-1 size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        />
      </Link>
    </li>
  );
}

function BestMatch({
  result,
  module,
  presenter,
  quizOpen,
}: {
  result: SearchResult;
  module: { key: string; number: number; title: string };
  presenter: boolean;
  quizOpen: boolean;
}) {
  const e = result.entry;
  return (
    <aside
      aria-labelledby="best-match-title"
      className="hidden flex-col gap-4 rounded-3xl p-6 lg:sticky lg:top-6 lg:flex"
      style={{ background: `var(--${e.module}-tint)` }}
    >
      <p className="text-sm font-bold uppercase tracking-wide" style={{ color: `var(--${e.module}-ink)` }}>
        Best match
      </p>
      <span className="self-start rounded-full bg-white/75 px-3 py-1 text-[13px] font-bold" style={{ color: `var(--${e.module}-ink)` }}>
        Module {module.number} · {module.title}
      </span>
      <h2 id="best-match-title" className="text-3xl font-extrabold tracking-tight text-[#1D1D1F]">
        {e.title}
      </h2>
      <p className="text-[17px] leading-relaxed text-[#3A3A3C]">{e.snippet}</p>
      <div className="flex flex-col gap-2">
        <Button asChild size="lg">
          <Link href={e.href}>
            Open the law <ArrowRight />
          </Link>
        </Button>
        {presenter ? (
          <Button asChild variant="outline">
            <Link href={`/present/${e.slide}`}>
              <Presentation /> Present its slides
            </Link>
          </Button>
        ) : null}
        {quizOpen ? (
          <Button asChild variant="outline">
            <Link href={`/quiz/${e.module}`}>
              <ListChecks /> Take the Module {module.number} quiz
            </Link>
          </Button>
        ) : null}
      </div>
    </aside>
  );
}

function Browse({ modules }: { modules: BrowseModule[] }) {
  return (
    <section aria-labelledby="browse-title" className="flex flex-col gap-4">
      <h2 id="browse-title" className="text-2xl font-extrabold tracking-tight">
        Or browse all 30 laws
      </h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(min(320px,100%),1fr))] gap-4">
        {modules.map((m) => (
          <div key={m.key} className="flex flex-col gap-3 rounded-3xl bg-card p-6">
            <Link href={`/modules/${m.key}`} className="flex flex-col gap-0.5 hover:underline">
              <span className="text-sm font-bold" style={{ color: `var(--${m.key}-ink)` }}>
                Module {m.number}
              </span>
              <span className="text-lg font-bold">{m.title}</span>
            </Link>
            <ul className="flex flex-wrap gap-2">
              {m.laws.map((l) => (
                <li key={l.slug}>
                  <Link
                    href={`/laws/${l.slug}`}
                    className="block rounded-xl bg-muted px-3 py-2 text-sm font-medium outline-none hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

function NothingFound({
  query,
  modules,
  featured,
  onPick,
}: {
  query: string;
  modules: BrowseModule[];
  featured: string[];
  onPick: (s: string) => void;
}) {
  return (
    <section aria-labelledby="nothing-title" className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 rounded-3xl bg-card p-8">
        <h2 id="nothing-title" className="text-2xl font-extrabold tracking-tight">
          Nothing matches “{query}” yet
        </h2>
        <p className="max-w-2xl text-[17px] leading-relaxed text-muted-foreground">
          Try describing what people experience, like{" "}
          <button type="button" onClick={() => onPick(featured[2])} className="font-semibold text-accent-foreground hover:underline">
            “{featured[2]}”
          </button>{" "}
          or{" "}
          <button type="button" onClick={() => onPick(featured[1])} className="font-semibold text-accent-foreground hover:underline">
            “{featured[1]}”
          </button>
          , or browse the modules below.
        </p>
      </div>
      <Browse modules={modules} />
    </section>
  );
}
