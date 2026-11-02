/**
 * Messages between the presenter console and the audience window.
 * Both windows are on the same origin, so a BroadcastChannel connects them
 * with no server involved.
 */
export const CHANNEL_NAME = "lawsofux-present";

export type ConsoleMessage =
  | { type: "state"; slide: number; blank: boolean }
  | { type: "close" };

export type AudienceMessage =
  | { type: "hello" }
  | { type: "beat" }
  | { type: "key"; key: string }
  | { type: "bye" };

/** How often the audience window reports in, and when the console calls it lost. */
export const HEARTBEAT_MS = 2000;
export const HEARTBEAT_TIMEOUT_MS = 5000;

export const NEXT_KEYS = ["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"];
export const PREV_KEYS = ["ArrowLeft", "ArrowUp", "PageUp", "Backspace"];
export const BLANK_KEYS = ["b", "B", "."];
