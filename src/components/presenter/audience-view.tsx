"use client";

import * as React from "react";
import { Maximize } from "lucide-react";

import { DeckView } from "@/components/slides/deck-view";
import type { StageSlide } from "@/components/slides/types";
import {
  BLANK_KEYS,
  CHANNEL_NAME,
  HEARTBEAT_MS,
  NEXT_KEYS,
  PREV_KEYS,
  type AudienceMessage,
  type ConsoleMessage,
} from "./channel";

/**
 * The window that gets shared in Google Meet, Zoom or Teams. It shows only the
 * slide, scaled to fit on black, and follows the presenter console.
 */
export function AudienceView({ slides, initialIndex }: { slides: StageSlide[]; initialIndex: number }) {
  const [index, setIndex] = React.useState(initialIndex);
  const [blank, setBlank] = React.useState(false);
  const [hint, setHint] = React.useState(true);
  const channelRef = React.useRef<BroadcastChannel | null>(null);

  React.useEffect(() => {
    const ch = new BroadcastChannel(CHANNEL_NAME);
    channelRef.current = ch;
    const send = (m: AudienceMessage) => ch.postMessage(m);
    ch.onmessage = (e: MessageEvent<ConsoleMessage>) => {
      const msg = e.data;
      if (msg.type === "state") {
        setIndex(Math.max(0, Math.min(slides.length - 1, msg.slide)));
        setBlank(msg.blank);
      } else if (msg.type === "close") {
        window.close();
      }
    };
    send({ type: "hello" });
    const beat = window.setInterval(() => send({ type: "beat" }), HEARTBEAT_MS);
    const bye = () => send({ type: "bye" });
    window.addEventListener("pagehide", bye);
    return () => {
      window.clearInterval(beat);
      window.removeEventListener("pagehide", bye);
      bye();
      ch.close();
    };
  }, [slides.length]);

  // Keys pressed here (clicker focus landed on this window) drive the console.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if ([...NEXT_KEYS, ...PREV_KEYS, ...BLANK_KEYS, "Home", "End"].includes(e.key)) {
        e.preventDefault();
        channelRef.current?.postMessage({ type: "key", key: e.key } satisfies AudienceMessage);
      } else if (e.key === "f" || e.key === "F") {
        void document.documentElement.requestFullscreen?.();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // The controls hint shows on mouse movement only, so it never lingers in the shared view.
  React.useEffect(() => {
    let t = window.setTimeout(() => setHint(false), 2500);
    const show = () => {
      setHint(true);
      window.clearTimeout(t);
      t = window.setTimeout(() => setHint(false), 2000);
    };
    window.addEventListener("mousemove", show);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("mousemove", show);
    };
  }, []);

  return (
    <div className="flex h-screen w-screen items-center justify-center overflow-hidden bg-black">
      <div className="w-[min(100vw,177.78vh)]">
        <DeckView slides={slides} index={index}>
          {blank ? <div className="absolute inset-0 bg-black" /> : null}
        </DeckView>
      </div>
      <div
        className="fixed bottom-5 right-5 flex items-center gap-3 rounded-full bg-[#1C1C1E]/90 py-2 pl-4 pr-2 text-[13px] text-[#D1D1D6] transition-opacity duration-300"
        style={{ opacity: hint ? 1 : 0, pointerEvents: hint ? "auto" : "none" }}
      >
        <span className="size-2 rounded-full bg-[#30D158]" />
        Controlled from presenter view
        <button
          type="button"
          onClick={() => void document.documentElement.requestFullscreen?.()}
          className="flex items-center gap-1.5 rounded-full bg-[#2C2C2E] px-3 py-1.5 font-semibold text-[#F5F5F7]"
        >
          <Maximize className="size-3.5" /> Full screen
        </button>
      </div>
    </div>
  );
}
