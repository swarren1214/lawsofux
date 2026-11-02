import { expect, test } from "@playwright/test";

import learning from "../../src/generated/learning.json";
import m1 from "../../content/quizzes/m1.json";
import { signInAsPresenter, trackErrors } from "./helpers";

type Law = { slug: string; name: string; module: string; position: number; ofTotal: number; beats: { title: string }[] };
type Mod = { key: string; number: number; title: string; laws: string[] };
const laws = learning.laws as Law[];
const modules = learning.modules as Mod[];

test.describe("every law page", () => {
  for (const law of laws) {
    test(`${law.name} renders its four slides and text`, async ({ page }) => {
      const errors = trackErrors(page);
      await page.goto(`/laws/${law.slug}`);
      await expect(page.getByRole("heading", { level: 1, name: law.name })).toBeVisible();
      await expect(page.locator("main figure")).toHaveCount(4);
      for (const beat of law.beats.slice(1)) {
        await expect(page.getByRole("heading", { level: 2, name: beat.title })).toBeVisible();
      }
      await expect(page.getByText(`Law ${law.position} of ${law.ofTotal}`, { exact: true })).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
});

test.describe("every module page", () => {
  for (const mod of modules) {
    test(`Module ${mod.number} lists its laws`, async ({ page }) => {
      const errors = trackErrors(page);
      await page.goto(`/modules/${mod.key}`);
      await expect(page.getByRole("heading", { level: 1, name: mod.title })).toBeVisible();
      const list = page.getByRole("heading", { name: `${mod.laws.length} laws in this module` }).locator("..");
      await expect(list.getByRole("listitem")).toHaveCount(mod.laws.length);
      // Divider and recap slides.
      await expect(page.locator("main figure")).toHaveCount(2);
      expect(errors).toEqual([]);
    });
  }
});

test("slides play when scrolled into view", async ({ page }) => {
  await page.goto("/laws/hicks-law");
  const kestrel = page.locator("#at-kestrel figure");
  await kestrel.scrollIntoViewIfNeeded();
  await expect(kestrel.locator("iframe[data-embed]").first()).toBeAttached();
});

test("sidebar, breadcrumbs and next/previous move through the course", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/laws/hicks-law");
  const sidebar = page.getByRole("navigation", { name: "Modules and laws" });
  await expect(sidebar.getByRole("link", { name: "Hick’s Law" })).toHaveAttribute("aria-current", "page");

  await page.getByRole("navigation", { name: "Next and previous" }).getByRole("link", { name: /Choice Overload/ }).click();
  await expect(page).toHaveURL(/\/laws\/choice-overload$/);
  await page.getByRole("navigation", { name: "Next and previous" }).getByRole("link", { name: /Hick’s Law/ }).click();
  await expect(page).toHaveURL(/\/laws\/hicks-law$/);

  // Open a closed module in the sidebar and jump to one of its laws.
  await sidebar.getByRole("button", { name: "Show Module 3 laws" }).click();
  await sidebar.getByRole("link", { name: "Fitts’s Law" }).click();
  await expect(page).toHaveURL(/\/laws\/fitts-law$/);
  await expect(page.getByRole("heading", { level: 1, name: "Fitts’s Law" })).toBeVisible();

  await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: /Module 3/ }).click();
  await expect(page).toHaveURL(/\/modules\/m3$/);
});

test("the last law in a module points to the quiz", async ({ page }) => {
  const last = laws.filter((l) => l.module === "m1").at(-1)!;
  await page.goto(`/laws/${last.slug}`);
  const link = page.getByRole("navigation", { name: "Next and previous" }).getByRole("link", { name: /Module 1 quiz/ });
  await expect(link).toHaveAttribute("href", "/quiz/m1");
});

test("on-this-page chips jump to each beat", async ({ page }) => {
  await page.goto("/laws/hicks-law");
  await page.getByRole("navigation", { name: "On this page" }).getByRole("link", { name: "Your move" }).click();
  await expect(page).toHaveURL(/#your-move$/);
  await expect(page.locator("#your-move")).toBeInViewport();
});

test("home links into modules and laws", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Start Module 1" }).click();
  await expect(page).toHaveURL(/\/modules\/m1$/);
  await page.getByRole("link", { name: /Start with Hick’s Law/ }).click();
  await expect(page).toHaveURL(/\/laws\/hicks-law$/);
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("the jump sheet opens and navigates", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto("/laws/von-restorff-effect");
    await expect(page.getByRole("navigation", { name: "Modules and laws" })).toBeHidden();
    await page.getByRole("button", { name: /Module 2 · Law 6 of 7/ }).click();
    const sheet = page.getByRole("dialog", { name: "Jump to" });
    await expect(sheet).toBeVisible();
    await sheet.getByRole("link", { name: "Law of Similarity" }).click();
    await expect(page).toHaveURL(/\/laws\/law-of-similarity$/);
    await expect(sheet).toBeHidden();
    expect(errors).toEqual([]);
  });

  test("header fits on one row", async ({ page }) => {
    await page.goto("/");
    const box = await page.locator("header").boundingBox();
    expect(box!.height).toBeLessThan(80);
  });
});

test("quiz results link back to each law", async ({ page }) => {
  if (!m1.open) await signInAsPresenter(page, "/present");
  await page.goto("/quiz/m1");
  for (const [i, q] of m1.questions.entries()) {
    await page.getByRole("radio").first().click();
    await page.getByRole("button", { name: "Check answer" }).click();
    await page.getByRole("button", { name: i === m1.questions.length - 1 ? "See results" : "Next question" }).click();
    void q;
  }
  const review = page.getByRole("link", { name: "Review" });
  await expect(review).toHaveCount(m1.questions.length);
  await review.first().click();
  await expect(page).toHaveURL(/\/laws\/hicks-law$/);
});
