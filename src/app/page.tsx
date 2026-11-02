import Link from "next/link";
import { Presentation } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { deck, lawsInModule } from "@/lib/deck";
import { isPresenter } from "@/lib/presenter-auth";

export default async function Home() {
  const presenter = await isPresenter();

  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 py-3.5">
          <Link href="/" className="flex items-center gap-3">
            <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
              <rect width="14" height="14" rx="4" fill="#0071E3" />
              <rect x="18" width="14" height="14" rx="4" fill="#AF52DE" />
              <rect y="18" width="14" height="14" rx="4" fill="#34C759" />
              <rect x="18" y="18" width="14" height="14" rx="7" fill="#FF9500" />
            </svg>
            <span className="flex flex-col leading-tight">
              <span className="text-[17px] font-bold tracking-tight">Laws of UX</span>
              <span className="text-[13px] text-muted-foreground">Team training</span>
            </span>
          </Link>
          <div className="flex-1" />
          <Button asChild variant={presenter ? "default" : "outline"}>
            <Link href="/present">
              <Presentation /> {presenter ? "Open presenter mode" : "Presenter sign-in"}
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-16">
        <section className="flex max-w-3xl flex-col gap-5">
          <p className="font-semibold text-accent-foreground">For Product, Engineering &amp; QA</p>
          <h1 className="text-5xl font-extrabold leading-[1.04] tracking-[-0.04em] sm:text-7xl">
            Thirty laws.
            <br />
            One shared language.
          </h1>
          <p className="text-xl leading-relaxed text-muted-foreground">
            Five weekly sessions, one module at a time. Law pages, quizzes and progress tracking are on the
            way; each module’s quiz opens right after its session.
          </p>
        </section>

        <section aria-labelledby="modules" className="flex flex-col gap-5">
          <h2 id="modules" className="text-3xl font-extrabold tracking-tight">
            Modules
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-5">
            {deck.modules.map((m) => {
              const laws = lawsInModule(m.key);
              return (
                <Card key={m.key} className="gap-4 rounded-[28px] p-7">
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className="rounded-full px-3.5 py-1.5 text-sm font-bold"
                      style={{ color: `var(--${m.key}-ink)`, background: `var(--${m.key}-tint)` }}
                    >
                      Module {m.number}
                    </span>
                    <span className="text-sm text-muted-foreground">{laws.length} laws</span>
                  </div>
                  <h3 className="text-2xl font-extrabold tracking-tight">{m.title}</h3>
                  <ul className="flex flex-wrap gap-2">
                    {laws.map((l) => (
                      <li key={l.id} className="rounded-xl bg-muted px-3 py-2 text-sm font-medium">
                        {l.name}
                      </li>
                    ))}
                  </ul>
                  {presenter ? (
                    <Button asChild variant="secondary" className="mt-auto self-start">
                      <Link href={`/present/${m.key}`}>
                        <Presentation /> Present Module {m.number}
                      </Link>
                    </Button>
                  ) : null}
                </Card>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-6 pb-14 text-sm text-muted-foreground">
        Based on{" "}
        <a href="https://lawsofux.com" className="font-medium text-accent-foreground">
          lawsofux.com
        </a>{" "}
        by Jon Yablonski. Kestrel is a fictional company used for examples.
      </footer>
    </div>
  );
}
