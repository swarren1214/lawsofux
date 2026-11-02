# Laws of UX · Team training

The Laws of UX training for Product, Engineering and QA, as a web app.
Built with Next.js, shadcn/ui and Tailwind, deployed on Vercel.

**Current phase: 0, presenter fast track.** Presenter mode runs the full
135-slide deck with its original animations, speaker notes and a separate
audience window for screen sharing. The learning site, accounts, quizzes,
search and admin dashboard follow in later phases (see the implementation plan).

## Run it locally

```bash
npm install
cp .env.example .env.local   # then set PRESENTER_PASSWORD and SESSION_SECRET
npm run dev
```

Open http://localhost:3000 and choose **Presenter sign-in**.

`SESSION_SECRET` can be any long random string, for example from `openssl rand -base64 32`.

## Present a session

1. Go to `/present` and sign in with the presenter password.
2. Click **Open audience window**. It opens a window titled "Laws of UX · Audience".
3. In your video call, share **that window** (not your screen):
   - **Google Meet:** Share screen, then the window or tab option, then pick the Audience window.
   - **Zoom:** Share, then pick the "Laws of UX · Audience" window.
   - **Teams:** Share, then pick the window under Window.
4. Drive from the presenter console. The audience window follows.

Keys work in either window: → / Space / Page Down for next, ← / Page Up for previous,
**B** to blank the audience screen, **Home** and **End** to jump. Most clickers send Page Up/Down.
Press **F** in the audience window for full screen (useful on a second monitor).

Animations (build-ins and looping animations) play on their own. Slides wait for you to advance.

## Edit the slides

The deck lives in `deck/`. It's the only place content is edited.

- `deck/deck.json` holds the slide order and sections.
- `deck/slides/<id>.html` is one slide: a `<section>` laid out on a 1920 × 1080 canvas.
  - `data-transition="push|fade"` sets the slide transition.
  - `data-build-in="fade|rise|pop N"` animates an element in, in order N.
  - `<x-embed>` holds a looping animation. It runs in a sandboxed iframe, unchanged.
  - `<x-icon name="…">` is an icon (mapped to Lucide in `scripts/build-deck.mjs`).
  - `<aside>` is the speaker notes. Start with a timing cue like `[~3 min]`; stage cues go in `[brackets]`.

`npm run dev` and `npm run build` regenerate the app's slide data automatically
(`scripts/build-deck.mjs` → `src/generated/`). Run `npm run deck` to do it by hand.
The script fails loudly if a slide has no notes, an unknown icon or an unsupported element.

Speaker notes are written to a separate `notes.json` that only the presenter page imports,
after the presenter check. Learner and audience pages never load them.

## Deploy to Vercel

1. Push this repo to GitHub and import it in Vercel (framework: Next.js, no other settings).
2. In the Vercel project, add environment variables `PRESENTER_PASSWORD` and `SESSION_SECRET`.
3. Deploy. Every pull request gets its own preview URL to check slide changes before merging.

## Project layout

```
deck/                         the slides (source of truth)
scripts/build-deck.mjs        deck → src/generated/{slides,notes}.json
src/app/page.tsx              home
src/app/present/              presenter login, console route, server actions
src/app/audience/             the window you share
src/components/slides/        SlideCanvas (one slide) and DeckView (transitions)
src/components/presenter/     console, audience view, sync channel
src/components/ui/            shadcn/ui components, styled with the deck's tokens
src/lib/                      deck data, notes (server-only), presenter auth
```

## What's next

- **Phase 1 (Nov 9–13):** Supabase, optional username and password accounts, presenter and admin roles,
  parity tests, the Module 1 quiz.
- **Phase 2 (Nov 16–25):** home, module and law pages with inline slides, progress, mobile.
- **Phase 3 (Nov 30–Dec 4):** search, quiz polish.
- **Phase 4 (Dec 7–11):** admin dashboard, accessibility audit, launch.

Based on [lawsofux.com](https://lawsofux.com) by Jon Yablonski.
