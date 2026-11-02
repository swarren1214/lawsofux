"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ListChecks, Lock } from "lucide-react";

import { cn } from "@/lib/utils";

export type NavModule = {
  key: string;
  number: number;
  title: string;
  quiz: { open: boolean } | null;
  laws: { slug: string; name: string }[];
};

/**
 * Modules and their laws. The module you're in starts open; the others
 * expand on click. Used in the desktop sidebar and the mobile menu.
 */
export function LearnNav({
  modules,
  currentModule,
  onNavigate,
}: {
  modules: NavModule[];
  currentModule?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState<Record<string, boolean>>(() =>
    currentModule ? { [currentModule]: true } : {},
  );

  return (
    <div className="flex flex-col gap-2">
      {modules.map((m) => {
        const isOpen = !!open[m.key];
        const modHref = `/modules/${m.key}`;
        return (
          <div key={m.key} className="overflow-hidden rounded-2xl bg-card">
            <div className="flex items-center">
              <Link
                href={modHref}
                onClick={onNavigate}
                aria-current={pathname === modHref ? "page" : undefined}
                className="flex min-h-14 flex-1 items-center gap-3 py-3 pl-4 outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/50"
              >
                <span className="size-3 shrink-0 rounded-full" style={{ background: `var(--${m.key})` }} />
                <span className="flex flex-col">
                  <span className="text-[13px] font-semibold text-muted-foreground">Module {m.number}</span>
                  <span className="text-[15px] font-bold leading-snug">{m.title}</span>
                </span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen((o) => ({ ...o, [m.key]: !isOpen }))}
                aria-expanded={isOpen}
                aria-label={`${isOpen ? "Hide" : "Show"} Module ${m.number} laws`}
                className="mr-2 flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} />
              </button>
            </div>
            {isOpen ? (
              <ul className="flex flex-col gap-0.5 px-2 pb-2.5">
                {m.laws.map((l) => {
                  const href = `/laws/${l.slug}`;
                  const current = pathname === href;
                  return (
                    <li key={l.slug}>
                      <Link
                        href={href}
                        onClick={onNavigate}
                        aria-current={current ? "page" : undefined}
                        className={cn(
                          "flex min-h-10 items-center gap-2.5 rounded-xl px-3 text-[15px] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
                          current ? "bg-accent font-bold text-accent-foreground" : "font-medium text-[#3A3A3C] hover:bg-muted",
                        )}
                      >
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ background: current ? `var(--${m.key})` : "var(--input)" }}
                        />
                        {l.name}
                      </Link>
                    </li>
                  );
                })}
                {m.quiz ? (
                  <li>
                    <Link
                      href={`/quiz/${m.key}`}
                      onClick={onNavigate}
                      aria-current={pathname === `/quiz/${m.key}` ? "page" : undefined}
                      className="mt-1 flex min-h-11 items-center gap-2.5 rounded-xl bg-muted px-3 text-[15px] font-semibold outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      {m.quiz.open ? <ListChecks className="size-4" /> : <Lock className="size-4 text-muted-foreground" />}
                      Module {m.number} quiz
                      {!m.quiz.open ? <span className="ml-auto text-xs font-medium text-muted-foreground">After the session</span> : null}
                    </Link>
                  </li>
                ) : null}
              </ul>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
