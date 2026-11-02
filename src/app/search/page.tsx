import type { Metadata } from "next";

import { SearchView } from "@/components/search/search-view";
import { SiteHeader } from "@/components/site-header";
import index from "@/generated/search.json";
import { navTree } from "@/lib/learning";
import { isPresenter } from "@/lib/presenter-auth";
import { quizSummaries } from "@/lib/quizzes";
import type { SearchIndex } from "@/lib/search";

export const metadata: Metadata = {
  title: "Search · Laws of UX",
  description: "Find a law by name, or by what feels wrong: “feels slow”, “people miss it”, “too many options”.",
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const { q = "", type = "all" } = await searchParams;
  const quizOpen = Object.fromEntries(quizSummaries().map((s) => [s.module, s.open]));

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <SearchView
          index={index as SearchIndex}
          browse={navTree(quizOpen)}
          quizOpen={quizOpen}
          presenter={await isPresenter()}
          initialQuery={q}
          initialType={type}
        />
      </main>
    </div>
  );
}
