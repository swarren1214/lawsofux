import "server-only";

import data from "@/generated/notes.json";

export type SpeakerNote = {
  /** The timing cue, e.g. "3 min" from "[~3 min]". */
  timing: string | null;
  minutes: number;
  text: string;
};

/**
 * Speaker notes are presenter-only. Import this module only from pages and
 * routes that have already checked the presenter session.
 */
export const notes = data as Record<string, SpeakerNote>;
