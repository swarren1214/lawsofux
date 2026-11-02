import type { Beat } from "@/lib/learning";
import { cn } from "@/lib/utils";

/**
 * A slide's words as page text: paragraphs, a highlighted "fix" panel, and
 * cards. In-the-wild cards end with a one-line lesson, shown in bold.
 */
export function BeatText({ beat, moduleKey }: { beat: Beat; moduleKey: string }) {
  const paragraphs = beat.blocks.filter((b) => b.type === "p");
  const cards = beat.blocks.filter((b) => b.type === "card");
  const dark = beat.kind === "kestrel";

  return (
    <div className="flex flex-col gap-4">
      {paragraphs.map((b, i) =>
        b.type === "p" && b.emphasis ? (
          <p
            key={i}
            className={cn(
              "rounded-2xl px-5 py-4 text-[17px] leading-relaxed",
              dark ? "bg-[#1D1D1F] text-[#F5F5F7]" : "bg-accent text-foreground",
            )}
          >
            {b.text}
          </p>
        ) : (
          <p key={i} className="max-w-3xl text-lg leading-relaxed text-[#3A3A3C]">
            {b.type === "p" ? b.text : null}
          </p>
        ),
      )}
      {cards.length ? (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(260px,100%),1fr))] gap-4">
          {cards.map((c, i) =>
            c.type === "card" ? (
              <article key={i} className="flex flex-col gap-2.5 rounded-3xl bg-card p-6 shadow-[0_8px_24px_rgba(0,0,0,0.05)]">
                {c.label ? (
                  <span
                    className="w-fit rounded-full px-3 py-1 text-[13px] font-bold"
                    style={{ color: `var(--${moduleKey}-ink)`, background: `var(--${moduleKey}-tint)` }}
                  >
                    {c.label}
                  </span>
                ) : null}
                <h4 className="text-xl font-bold leading-snug">{c.title}</h4>
                {c.lines.map((line, j) => {
                  const lesson = beat.kind === "wild" && j === c.lines.length - 1 && c.lines.length > 1;
                  return (
                    <p
                      key={j}
                      className={cn(
                        "text-base leading-relaxed",
                        lesson ? "font-bold" : "text-muted-foreground",
                      )}
                      style={lesson ? { color: `var(--${moduleKey}-ink)` } : undefined}
                    >
                      {line}
                    </p>
                  );
                })}
              </article>
            ) : null,
          )}
        </div>
      ) : null}
    </div>
  );
}
