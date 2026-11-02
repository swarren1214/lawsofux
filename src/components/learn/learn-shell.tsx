import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { navTree } from "@/lib/learning";
import { quizSummaries } from "@/lib/quizzes";
import { LearnNav } from "./learn-nav";
import { MobileNav } from "./mobile-nav";

export type Crumb = { label: string; href?: string };

/** Layout for module and law pages: sidebar on desktop, a jump-to menu on phones. */
export function LearnShell({
  currentModule,
  mobileLabel,
  crumbs,
  actions,
  children,
}: {
  currentModule?: string;
  mobileLabel: string;
  crumbs: Crumb[];
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const quizOpen = Object.fromEntries(quizSummaries().map((q) => [q.module, q.open]));
  const modules = navTree(quizOpen);

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <div className="mx-auto flex max-w-[1376px] items-start gap-8 px-4 py-6 sm:px-6 lg:py-8">
        <nav
          aria-label="Modules and laws"
          className="sticky top-6 hidden max-h-[calc(100vh-3rem)] w-[300px] shrink-0 overflow-y-auto pb-6 lg:block"
        >
          <LearnNav modules={modules} currentModule={currentModule} />
        </nav>

        <main className="flex min-w-0 flex-1 flex-col gap-8">
          <div className="flex flex-wrap items-center gap-3">
            <nav aria-label="Breadcrumb" className="hidden min-w-0 sm:block">
              <ol className="flex flex-wrap items-center gap-1.5 text-[15px] text-muted-foreground">
                {crumbs.map((c, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    {i > 0 ? <ChevronRight className="size-3.5" aria-hidden="true" /> : null}
                    {c.href ? (
                      <Link href={c.href} className="hover:text-foreground">
                        {c.label}
                      </Link>
                    ) : (
                      <span aria-current="page" className="font-semibold text-foreground">
                        {c.label}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
            <MobileNav modules={modules} currentModule={currentModule} label={mobileLabel} />
            <div className="flex-1" />
            {actions}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
