"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";

/** The header's way into search. Press "/" or ⌘K / Ctrl+K from any page to jump there. */
export function HeaderSearch() {
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      const slash = e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey;
      const cmdK = e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey);
      if (!slash && !cmdK) return;
      e.preventDefault();
      if (pathname === "/search") document.querySelector<HTMLInputElement>('input[name="q"]')?.focus();
      else router.push("/search");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pathname, router]);

  return (
    <Link
      href="/search"
      aria-label="Search"
      aria-current={pathname === "/search" ? "page" : undefined}
      aria-keyshortcuts="/ Control+K Meta+K"
      className="flex min-h-11 min-w-11 items-center justify-center gap-2.5 rounded-full text-[15px] text-muted-foreground outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:min-w-56 sm:justify-start sm:bg-muted sm:pl-4 sm:pr-2 sm:hover:bg-secondary"
    >
      <Search className="size-[18px]" aria-hidden="true" />
      <span className="hidden flex-1 sm:inline">Search laws and symptoms</span>
      <kbd className="hidden rounded-md bg-card px-2 py-0.5 font-sans text-xs font-semibold text-muted-foreground shadow-sm sm:inline">/</kbd>
    </Link>
  );
}
