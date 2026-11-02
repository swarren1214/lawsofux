"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  EyeOff,
  Eye,
  LogOut,
  MonitorUp,
  Pause,
  Play,
  RotateCcw,
  X,
} from "lucide-react";

import { logout } from "@/app/present/actions";
import { DeckView } from "@/components/slides/deck-view";
import { SlideCanvas } from "@/components/slides/slide-canvas";
import type { DeckModule, DeckSection, StageSlide } from "@/components/slides/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  BLANK_KEYS,
  CHANNEL_NAME,
  HEARTBEAT_TIMEOUT_MS,
  NEXT_KEYS,
  PREV_KEYS,
  type AudienceMessage,
  type ConsoleMessage,
} from "./channel";

type Note = { timing: string | null; minutes: number; text: string };

const SHARE_STEPS: Record<string, { label: string; steps: string[]; tip: string }> = {
  meet: {
    label: "Google Meet",
    steps: [
      "Open the audience window first. It opens as its own window called “Laws of UX · Audience.”",
      "In Meet, choose Share screen, then pick the window or tab option.",
      "Select the Audience window and share it. Come back here to drive.",
    ],
    tip: "Use Chrome or Edge. Sharing just that window keeps your notes private.",
  },
  zoom: {
    label: "Zoom",
    steps: [
      "Open the audience window first.",
      "In Zoom, choose Share and pick the “Laws of UX · Audience” window, not your screen or desktop.",
      "Click Share, then come back to this window to drive.",
    ],
    tip: "Avoid “Screen” or “Desktop”: those share your notes too.",
  },
  teams: {
    label: "Teams",
    steps: [
      "Open the audience window first.",
      "In Teams, choose Share, then pick the “Laws of UX · Audience” window.",
      "In Teams on the web, pick the Audience tab instead. Then come back here to drive.",
    ],
    tip: "If the window isn’t listed, make sure it’s open and not minimized, then reopen the Share menu.",
  },
};

const pad = (n: number) => String(n).padStart(2, "0");
const clock = (s: number) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;

function NoteText({ text, size }: { text: string; size: number }) {
  const parts = text.split(/(\[[^\]]+\])/).filter(Boolean);
  return (
    <p className="max-h-[440px] overflow-y-auto pr-1 leading-relaxed" style={{ fontSize: size }}>
      {parts.map((p, i) =>
        p.startsWith("[") ? (
          <span key={i} className="font-semibold italic text-accent-foreground">
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </p>
  );
}

export function PresenterConsole({
  slides,
  notes,
  sections,
  modules,
  initialIndex,
}: {
  slides: StageSlide[];
  notes: Record<string, Note>;
  sections: DeckSection[];
  modules: DeckModule[];
  initialIndex: number;
}) {
  const [index, setIndex] = React.useState(initialIndex);
  const [blank, setBlank] = React.useState(false);
  const [seconds, setSeconds] = React.useState(0);
  const [running, setRunning] = React.useState(true);
  const [noteSize, setNoteSize] = React.useState(19);
  const [showHelp, setShowHelp] = React.useState(false);
  const [lastBeat, setLastBeat] = React.useState(0);
  const [now, setNow] = React.useState(() => Date.now());

  const channelRef = React.useRef<BroadcastChannel | null>(null);
  const audienceRef = React.useRef<Window | null>(null);
  const stateRef = React.useRef({ index, blank });
  React.useEffect(() => {
    stateRef.current = { index, blank };
  }, [index, blank]);

  const slide = slides[index];
  const note = notes[slide.id];
  const section = sections.find((s) => s.key === slide.section);
  const mod = modules.find((m) => m.key === slide.module);
  const audienceConnected = now - lastBeat < HEARTBEAT_TIMEOUT_MS;

  const go = React.useCallback(
    (to: number) => setIndex(Math.max(0, Math.min(slides.length - 1, to))),
    [slides.length],
  );

  const handleKey = React.useCallback(
    (key: string) => {
      const { index: i } = stateRef.current;
      if (NEXT_KEYS.includes(key)) go(i + 1);
      else if (PREV_KEYS.includes(key)) go(i - 1);
      else if (BLANK_KEYS.includes(key)) setBlank((b) => !b);
      else if (key === "Home") go(0);
      else if (key === "End") go(slides.length - 1);
    },
    [go, slides.length],
  );

  // Channel to the audience window
  React.useEffect(() => {
    const ch = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = ch;
    ch.onmessage = (e: MessageEvent<AudienceMessage>) => {
      const msg = e.data;
      if (msg.type === "hello") {
        setLastBeat(Date.now());
        const { index: i, blank: b } = stateRef.current;
        ch.postMessage({ type: "state", slide: i, blank: b } satisfies ConsoleMessage);
      } else if (msg.type === "beat") {
        setLastBeat(Date.now());
      } else if (msg.type === "key") {
        handleKey(msg.key);
      } else if (msg.type === "bye") {
        setLastBeat(0);
      }
    };
    return () => ch.close();
  }, [handleKey]);

  // Tell the audience window about every change, and keep the URL in step.
  React.useEffect(() => {
    channelRef.current?.postMessage({ type: "state", slide: index, blank } satisfies ConsoleMessage);
    window.history.replaceState(null, "", `/present/${slides[index].id}`);
  }, [index, blank, slides]);

  // Timer and sync status
  React.useEffect(() => {
    const t = window.setInterval(() => {
      setNow(Date.now());
      if (running) setSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(t);
  }, [running]);

  // Keyboard and clickers
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(el.tagName))) return;
      // Let Space and Enter press a focused button instead of advancing.
      if (el?.tagName === "BUTTON" && (e.key === " " || e.key === "Enter")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if ([...NEXT_KEYS, ...PREV_KEYS, ...BLANK_KEYS, "Home", "End"].includes(e.key)) {
        e.preventDefault();
        handleKey(e.key);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleKey]);

  const openAudience = () => {
    const w = window.open(
      `/audience?slide=${slides[index].id}`,
      "lawsofux-audience",
      "popup=yes,width=1280,height=760",
    );
    audienceRef.current = w;
    w?.focus();
  };

  const closeAudience = () => {
    channelRef.current?.postMessage({ type: "close" } satisfies ConsoleMessage);
    audienceRef.current?.close();
    setLastBeat(0);
    setBlank(false);
  };

  const plannedMinutes = (from: number, to: number) =>
    slides.slice(from, to + 1).reduce((n, s) => n + (notes[s.id]?.minutes ?? 0), 0);

  const next = slides[index + 1];
  const thumbStart = Math.max(0, Math.min(index - 3, slides.length - 7));
  const thumbs = slides.slice(thumbStart, thumbStart + 7);
  const where = slide.law ?? section?.label ?? "";

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <header className="border-b">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-3 px-6 py-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <X /> Exit
            </Link>
          </Button>
          <div className="flex min-w-0 items-center gap-2.5 text-[15px]">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: `var(--${slide.module ?? "m1"})` }} />
            <span className="font-semibold">{mod ? `Module ${mod.number} · ${mod.title}` : "Introduction"}</span>
            {where && mod ? <span className="truncate text-muted-foreground">· {where}</span> : null}
          </div>
          <div className="flex-1" />

          <div className="flex items-center gap-1 rounded-full bg-card py-1 pl-4 pr-1">
            <span className="text-xs font-semibold text-muted-foreground">Elapsed</span>
            <span className="min-w-14 px-2 text-lg font-bold tabular-nums">{clock(seconds)}</span>
            <Button variant="secondary" size="sm" onClick={() => setRunning((r) => !r)}>
              {running ? <Pause /> : <Play />} {running ? "Pause" : "Resume"}
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Reset timer" onClick={() => setSeconds(0)}>
              <RotateCcw />
            </Button>
          </div>

          {audienceConnected ? (
            <div role="status" className="flex items-center gap-1 rounded-full bg-card py-1 pl-4 pr-1">
              <span className={cn("size-2.5 rounded-full", blank ? "bg-[#FF9F0A]" : "bg-[#30D158]")} />
              <span className="px-2 text-sm font-semibold">
                {blank ? "Audience sees blank screen" : `Audience in sync · slide ${slide.number}`}
              </span>
              <Button
                variant={blank ? "default" : "secondary"}
                size="sm"
                aria-pressed={blank}
                onClick={() => setBlank((b) => !b)}
                className={blank ? "bg-[#FF9F0A] text-[#1D1D1F] hover:bg-[#FF9F0A]/90" : ""}
              >
                {blank ? <Eye /> : <EyeOff />} {blank ? "Show slides" : "Blank"}
              </Button>
              <Button variant="ghost" size="sm" onClick={closeAudience}>
                Close
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={openAudience}>
              <MonitorUp /> Open audience window
            </Button>
          )}

          <Button
            variant={showHelp ? "outline" : "secondary"}
            size="sm"
            aria-expanded={showHelp}
            onClick={() => setShowHelp((h) => !h)}
          >
            <CircleHelp /> How to share
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-start gap-6 p-6">
        <main className="flex min-w-0 flex-[999_1_640px] flex-col gap-4">
          <div className="flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <span>
              {audienceConnected
                ? blank
                  ? "Current slide · hidden from audience"
                  : "Current slide · showing in audience window"
                : "Current slide · audience window closed"}
            </span>
            <span className="normal-case tracking-normal font-medium">Animations play on their own; slides wait for you</span>
          </div>

          <DeckView slides={slides} index={index} className="rounded-2xl ring-1 ring-border shadow-2xl">
            {blank && audienceConnected ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 text-center">
                <span className="text-2xl font-bold">The audience sees a blank screen</span>
                <span className="text-muted-foreground">Press B or choose Show slides to bring it back.</span>
              </div>
            ) : null}
          </DeckView>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="secondary" size="lg" onClick={() => go(index - 1)} disabled={index === 0}>
              <ChevronLeft /> Previous
            </Button>
            <div className="flex min-w-48 flex-1 flex-col items-center gap-1.5">
              <span className="text-[15px] font-semibold">
                Slide {slide.number} of {slides.length}
              </span>
              <span className="block h-1.5 w-full max-w-80 overflow-hidden rounded-full bg-secondary">
                <span
                  className="block h-full rounded-full bg-[#2997FF] transition-[width]"
                  style={{ width: `${(slide.number / slides.length) * 100}%` }}
                />
              </span>
            </div>
            <Button size="lg" onClick={() => go(index + 1)} disabled={index === slides.length - 1}>
              Next <ChevronRight />
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label htmlFor="jump" className="text-sm font-semibold text-muted-foreground">
              Jump to
            </label>
            <select
              id="jump"
              value={slide.section}
              onChange={(e) => {
                const s = sections.find((x) => x.key === e.target.value);
                if (s) go(s.start);
              }}
              className="h-10 min-w-64 rounded-xl border border-input bg-card px-3 text-sm font-medium"
            >
              {sections.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <nav aria-label="Nearby slides" className="grid grid-cols-7 gap-2">
            {thumbs.map((t) => {
              const i = t.number - 1;
              const current = i === index;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-current={current ? "true" : undefined}
                  className={cn(
                    "flex flex-col gap-1.5 rounded-xl bg-card p-2 text-left outline-none transition hover:bg-secondary focus-visible:ring-[3px] focus-visible:ring-ring/50",
                    current && "bg-secondary ring-2 ring-[#2997FF]",
                  )}
                >
                  <SlideCanvas slide={t} variant="thumb" className="rounded-md" />
                  <span className="text-[11px] font-semibold text-muted-foreground">Slide {t.number}</span>
                  <span className="line-clamp-2 text-xs font-semibold leading-snug">{t.title}</span>
                </button>
              );
            })}
          </nav>
        </main>

        <aside aria-label="Presenter tools" className="flex min-w-0 flex-[1_1_380px] flex-col gap-4">
          {showHelp ? (
            <section className="flex flex-col gap-4 rounded-2xl bg-[#F5F5F7] p-6 text-[#1D1D1F]">
              <div className="flex items-start gap-3">
                <div className="flex flex-1 flex-col gap-1">
                  <h2 className="text-lg font-extrabold">Share only the slides</h2>
                  <p className="text-sm leading-relaxed text-[#6E6E73]">
                    Share the audience window, not your whole screen. Your notes never appear in it.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHelp(false)}
                  aria-label="Close sharing help"
                  className="flex size-9 items-center justify-center rounded-full bg-[#E5E5EA] text-[#3A3A3C]"
                >
                  <X className="size-4" />
                </button>
              </div>
              <Tabs defaultValue="meet">
                <TabsList className="bg-[#E5E5EA]">
                  {Object.entries(SHARE_STEPS).map(([k, v]) => (
                    <TabsTrigger
                      key={k}
                      value={k}
                      className="text-[#3A3A3C] data-[state=active]:bg-white data-[state=active]:text-[#1D1D1F]"
                    >
                      {v.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {Object.entries(SHARE_STEPS).map(([k, v]) => (
                  <TabsContent key={k} value={k} className="flex flex-col gap-3">
                    <ol className="flex flex-col gap-2.5">
                      {v.steps.map((s, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#1D1D1F] text-xs font-bold text-white">
                            {i + 1}
                          </span>
                          <span className="pt-0.5 text-[15px] leading-relaxed">{s}</span>
                        </li>
                      ))}
                    </ol>
                    <p className="rounded-xl bg-white p-3 text-sm leading-relaxed text-[#3A3A3C]">{v.tip}</p>
                  </TabsContent>
                ))}
              </Tabs>
              <div className="flex flex-col gap-2 border-t border-[#E5E5EA] pt-3 text-sm leading-relaxed">
                <span>
                  <strong>Two monitors:</strong> put the audience window full-screen on the second one.
                </span>
                <span>
                  <strong>One monitor:</strong> keep the audience window open beside this one. Don’t minimize it.
                </span>
                <span>
                  <strong>Keys:</strong> → or Space for next, ← for previous, B to blank. Clickers work too.
                </span>
              </div>
            </section>
          ) : null}

          <div className="flex items-center gap-4 rounded-2xl bg-card p-4">
            <div className="w-28 shrink-0 overflow-hidden rounded-md ring-1 ring-border">
              {next ? <SlideCanvas slide={next} variant="thumb" /> : <div className="aspect-video bg-black" />}
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Up next</span>
              <span className="line-clamp-2 font-bold">{next ? next.title : "End of the deck"}</span>
            </div>
          </div>

          <section className="flex flex-col gap-3 rounded-2xl bg-card p-5">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="flex-1 font-bold">Speaker notes</h2>
              {note?.timing ? (
                <Badge className="bg-[#64AFFF] text-[#1D1D1F]">About {note.timing}</Badge>
              ) : null}
              <Button
                variant="secondary"
                size="icon-sm"
                aria-label="Smaller text"
                onClick={() => setNoteSize((n) => Math.max(15, n - 2))}
              >
                A−
              </Button>
              <Button
                variant="secondary"
                size="icon-sm"
                aria-label="Larger text"
                onClick={() => setNoteSize((n) => Math.min(29, n + 2))}
              >
                A+
              </Button>
            </div>
            {note ? <NoteText text={note.text} size={noteSize} /> : <p className="text-muted-foreground">No notes for this slide.</p>}
          </section>

          <section className="flex flex-col gap-2 rounded-2xl bg-card p-5 text-[15px]">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pacing</span>
            {slide.law ? (
              <div className="flex justify-between gap-3">
                <span className="truncate">Planned for {slide.law}</span>
                <span className="font-bold">
                  {slides.filter((s) => s.law === slide.law).reduce((n, s) => n + (notes[s.id]?.minutes ?? 0), 0)} min
                </span>
              </div>
            ) : section ? (
              <div className="flex justify-between gap-3">
                <span className="truncate">Planned for {section.label}</span>
                <span className="font-bold">{plannedMinutes(section.start, section.end)} min</span>
              </div>
            ) : null}
            {mod ? (
              <div className="flex justify-between gap-3">
                <span>Planned for Module {mod.number}</span>
                <span className="font-bold">{plannedMinutes(mod.start, mod.end)} min</span>
              </div>
            ) : null}
          </section>

          <a
            href="/audience"
            onClick={(e) => {
              e.preventDefault();
              openAudience();
            }}
            className="flex items-center gap-2 self-start text-sm font-semibold text-accent-foreground"
          >
            <ExternalLink className="size-4" /> Reopen the audience window
          </a>
          <form action={logout} className="self-start">
            <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">
              <LogOut /> Sign out of presenter mode
            </Button>
          </form>
        </aside>
      </div>
    </div>
  );
}
