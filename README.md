# Laws of UX · Team training

The Laws of UX training for Product, Engineering and QA, as a web app.
Built with Next.js, shadcn/ui and Tailwind, deployed on Vercel.

A learning site anyone can use: no accounts, nothing tracked.

- **Module and law pages** (`/modules/m1`, `/laws/hicks-law`) show every slide inline, with its
  animations, and the slide's words as real page text. Sidebar on desktop, a "jump to" sheet on phones.
- **Search** (`/search`, or press `/` anywhere) finds laws, examples and Kestrel stories by name or by
  symptom, like “feels slow” or “people miss it”. Open quizzes' questions are searchable too.
- **Presenter mode** runs the full 135-slide deck with its original animations, speaker notes
  and a separate audience window for screen sharing. It's behind a shared presenter password.
- **Module quizzes** open after each weekly session. Results show on screen; nothing is saved.
- **Parity checks** prove the app shows exactly what's in the deck, on every build.

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

## Open a module's quiz

Quizzes live in `content/quizzes/<module>.json` (Module 1 is `m1.json`). When a session ends,
set `"open": true` in that module's file and deploy. Until then learners see "opens after the
session", while signed-in presenters can preview it. On a module's recap slide, presenter mode
shows the quiz link with a Copy button so you can drop it in the call chat.

Each question names its law by the law's first slide id (`hick-law`), lists its options, the
`answer` option id, and an `explanation` shown after answering. The parity check rejects a quiz
that points at a missing law or an answer that isn't an option.

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
(`scripts/build-deck.mjs` and `scripts/build-learning.mjs` → `src/generated/`).
Law and module pages read their text straight from the slides, so a wording change in a slide
shows up on its law page too. A law's page address comes from its title (“Fitts’s Law” → `/laws/fitts-law`). Run `npm run deck` to do it by hand.
The script fails loudly if a slide has no notes, an unknown icon or an unsupported element.

After building, `scripts/check-content.mjs` compares every slide with its source and fails if
any text, speaker note, animation, build-in or transition differs, if a quiz file is invalid, or if
any law page is missing its four beats.

Speaker notes are written to a separate `notes.json` that only the presenter page imports,
after the presenter check. Learner and audience pages never load them.

## Edit search symptoms

`content/search/symptoms.json` lists 3 to 5 plain-language symptoms per law (what someone notices going
wrong, in their words), plus the `featured` chips shown on the search page. Everything else in search
comes from the slides and quizzes. The build fails if a law has no symptoms or a chip matches nothing.
A module's quiz questions join the index when its quiz opens.

## Tests

```bash
npm run build          # also runs the parity check
npm run test:e2e       # Playwright: every slide, every law and module page, navigation, search, presenter sync, quizzes
```

The first time, run `npx playwright install chromium`. GitHub Actions (`.github/workflows/ci.yml`)
runs the parity check, lint, build and all browser tests on every pull request.

## Deploy to Vercel

1. Push this repo to GitHub and import it in Vercel (framework: Next.js, no other settings).
2. In the Vercel project, add environment variables `PRESENTER_PASSWORD` and `SESSION_SECRET`.
3. Deploy. Every pull request gets its own preview URL to check slide changes before merging.

## Project layout

```
deck/                         the slides (source of truth)
content/quizzes/              one quiz per module
content/search/symptoms.json  search symptoms per law
scripts/build-deck.mjs        deck → src/generated/{slides,notes}.json
scripts/build-learning.mjs    deck → src/generated/learning.json (law and module page text)
scripts/build-search.mjs      learning + symptoms + open quizzes → src/generated/search.json
scripts/check-content.mjs     parity check: app vs deck, plus quiz validation
tests/e2e/                    Playwright tests
src/app/page.tsx              home
src/app/present/              presenter login, console route, server actions
src/app/audience/             the window you share
src/app/modules/[module]/     module pages
src/app/laws/[law]/           law pages
src/app/quiz/[module]/        module quizzes
src/app/search/               search
src/components/slides/        SlideCanvas (one slide) and DeckView (transitions)
src/components/learn/         sidebar, phone navigation, inline slides, slide text
src/components/search/        search page, header search and "/" shortcut
src/components/presenter/     console, audience view, sync channel
src/components/ui/            shadcn/ui components, styled with the deck's tokens
src/lib/                      deck data, learning pages, search engine, notes (server-only), presenter auth
```

## What's next

- **Each week:** write and open the next module's quiz after its session.
- **Phase 4:** accessibility audit (pause controls for looping animations), browsers and devices, launch.

Based on [lawsofux.com](https://lawsofux.com) by Jon Yablonski.
