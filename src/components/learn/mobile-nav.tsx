"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LearnNav, type NavModule } from "./learn-nav";

/** Phones and small tablets: a "where am I" button that opens the full navigation from the bottom. */
export function MobileNav({
  modules,
  currentModule,
  label,
}: {
  modules: NavModule[];
  currentModule?: string;
  label: string;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="flex min-h-11 items-center gap-2 rounded-full bg-card px-4 text-sm font-semibold shadow-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 lg:hidden"
        >
          {currentModule ? (
            <span className="size-2.5 rounded-full" style={{ background: `var(--${currentModule})` }} />
          ) : null}
          {label}
          <ChevronDown className="size-4" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="bg-background px-4 pb-8 pt-5">
        <div className="flex flex-col gap-1 pr-12">
          <SheetTitle>Jump to</SheetTitle>
          <SheetDescription>Every module, law and quiz.</SheetDescription>
        </div>
        <div className="overflow-y-auto">
          <LearnNav modules={modules} currentModule={currentModule} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
