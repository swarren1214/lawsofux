import { expect, test } from "@playwright/test";

import m1 from "../../content/quizzes/m1.json";
import symptoms from "../../content/search/symptoms.json";
import { signInAsPresenter, trackErrors } from "./helpers";

const input = (page: import("@playwright/test").Page) => page.getByRole("searchbox", { name: "What feels wrong?" });
const results = (page: import("@playwright/test").Page) => page.getByRole("region", { name: "Results" }).getByRole("listitem");

test.use({ viewport: { width: 1440, height: 1000 } });

test("a symptom chip finds the right law, explains the match and updates the address", async ({ page }) => {
  const errors = trackErrors(page);
  await page.goto("/search");
  await expect(input(page)).toBeFocused();
  await page.getByRole("button", { name: "feels slow" }).click();
  await expect(page.getByRole("button", { name: "feels slow" })).toHaveAttribute("aria-pressed", "true");
  await expect(input(page)).toHaveValue("feels slow");
  await expect(page).toHaveURL(/\/search\?q=feels\+slow$/);

  await expect(results(page).first()).toContainText("Doherty Threshold");
  await expect(results(page).first()).toContainText("Matches “feels slow”");
  const best = page.getByRole("complementary", { name: "Doherty Threshold" });
  await expect(best).toContainText("Best match");
  await best.getByRole("link", { name: /Open the law/ }).click();
  await expect(page).toHaveURL(/\/laws\/doherty-threshold$/);
  expect(errors).toEqual([]);
});

test("every featured symptom finds at least one law", async ({ page }) => {
  await page.goto("/search");
  for (const s of symptoms.featured) {
    await page.getByRole("button", { name: s, exact: true }).click();
    await expect(page.getByRole("group", { name: "Show" }).getByRole("button", { name: /^Laws/ })).not.toBeDisabled();
  }
});

test("type tabs filter results and show counts", async ({ page }) => {
  await page.goto("/search?q=too%20many%20options");
  const tabs = page.getByRole("group", { name: "Show" });
  const kestrel = tabs.getByRole("button", { name: /At Kestrel/ });
  const n = Number(await kestrel.locator("span").innerText());
  expect(n).toBeGreaterThan(0);
  await kestrel.click();
  await expect(page).toHaveURL(/type=kestrel/);
  await expect(results(page)).toHaveCount(n);
  for (const item of await results(page).all()) await expect(item).toContainText("At Kestrel");
});

test("search forgives typos, plurals, possessives and extra words", async ({ page }) => {
  await page.goto("/search");
  for (const [q, law] of [
    ["fits law", "Fitts’s Law"],
    ["hicks", "Hick’s Law"],
    ["my app feels slow", "Doherty Threshold"],
    ["people missed the warning", "Selective Attention"],
    ["pragnanz", "Law of Prägnanz"],
  ]) {
    await input(page).fill(q);
    await expect(page.getByRole("complementary").getByRole("heading", { level: 2 }), q).toHaveText(law);
  }
});

test("a link with ?q= opens straight to results", async ({ page }) => {
  await page.goto("/search?q=gloves");
  await expect(input(page)).toHaveValue("gloves");
  await expect(results(page).first()).toContainText(/Fitts’s Law|gloved thumb|tap targets|Screen edges/);
  await expect(page.locator("mark").first()).toBeVisible();
});

test("nothing found suggests symptoms and the modules", async ({ page }) => {
  await page.goto("/search?q=xyzzy");
  await expect(page.getByRole("heading", { name: "Nothing matches “xyzzy” yet" })).toBeVisible();
  await page.getByRole("button", { name: /people miss it/ }).first().click();
  await expect(results(page).first()).toBeVisible();
});

test("Escape and the clear button empty the search", async ({ page }) => {
  await page.goto("/search?q=gloves");
  await input(page).press("Escape");
  await expect(input(page)).toHaveValue("");
  await expect(page.getByRole("heading", { name: "Or browse all 30 laws" })).toBeVisible();
  await input(page).fill("flow");
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(input(page)).toHaveValue("");
  await expect(input(page)).toBeFocused();
});

test("“/” jumps to search from any page", async ({ page }) => {
  await page.goto("/laws/hicks-law");
  await page.keyboard.press("/");
  await expect(page).toHaveURL(/\/search$/);
  await expect(input(page)).toBeFocused();
});

test("closed quizzes stay out of search", async ({ page }) => {
  test.skip(m1.open, "Module 1 quiz is open");
  await page.goto(`/search?q=${encodeURIComponent(m1.questions[0].prompt)}`);
  await expect(page.getByRole("group", { name: "Show" }).getByRole("button", { name: /Quiz questions/ })).toHaveCount(0);
  await expect(page.getByText("Quiz question", { exact: true })).toHaveCount(0);
});

test("presenters get “Present its slides” on the best match", async ({ page }) => {
  await signInAsPresenter(page);
  await page.goto("/search?q=hicks");
  await page.getByRole("complementary").getByRole("link", { name: /Present its slides/ }).click();
  await expect(page).toHaveURL(/\/present\/hick-law$/);
});

test.describe("on a phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test("the header search icon opens search and results come first", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Search", exact: true }).click();
    await expect(page).toHaveURL(/\/search$/);
    await input(page).fill("gloves");
    await expect(page.getByRole("complementary")).toBeHidden();
    await expect(results(page).first()).toBeVisible();
  });
});
