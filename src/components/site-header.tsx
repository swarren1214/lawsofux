import Link from "next/link";
import { Presentation } from "lucide-react";

import { HeaderSearch } from "@/components/search/header-search";
import { Button } from "@/components/ui/button";
import { isPresenter } from "@/lib/presenter-auth";

export async function SiteHeader() {
  const presenter = await isPresenter();
  return (
    <header className="border-b bg-card">
      <div className="mx-auto flex max-w-6xl items-center gap-2 sm:gap-4 px-4 py-3.5 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
            <rect width="14" height="14" rx="4" fill="#0071E3" />
            <rect x="18" width="14" height="14" rx="4" fill="#AF52DE" />
            <rect y="18" width="14" height="14" rx="4" fill="#34C759" />
            <rect x="18" y="18" width="14" height="14" rx="7" fill="#FF9500" />
          </svg>
          <span className="flex flex-col leading-tight">
            <span className="text-[17px] font-bold tracking-tight">Laws of UX</span>
            <span className="hidden text-[13px] text-muted-foreground sm:block">Team training</span>
          </span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1">
          <Link href="/#modules" className="rounded-full px-3.5 py-2 text-[15px] font-medium text-[#3A3A3C] hover:bg-muted">
            Modules
          </Link>
        </nav>
        <div className="flex-1" />
        <HeaderSearch />
        <Button asChild variant={presenter ? "default" : "ghost"} size="sm">
          <Link href="/present" aria-label={presenter ? "Open presenter mode" : "Presenters"}>
            <Presentation />
            <span className="hidden sm:inline">{presenter ? "Open presenter mode" : "Presenters"}</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}
