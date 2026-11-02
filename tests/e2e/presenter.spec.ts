import { expect, test } from "@playwright/test";

import notes from "../../src/generated/notes.json";
import { signInAsPresenter, trackErrors } from "./helpers";

test("presenter mode needs the presenter password", async ({ page }) => {
  await page.goto("/present/hick-law");
  await expect(page).toHaveURL(/\/present\/login/);
  await page.getByLabel("Presenter password").fill("wrong password");
  await page.getByRole("button", { name: "Open presenter mode" }).click();
  await expect(page.locator("#login-error")).toContainText("isn’t right");
});

test("speaker notes never reach the audience window", async ({ request }) => {
  const html = await (await request.get("/audience?slide=hick-law")).text();
  expect(html).not.toContain(notes["hick-law"].text.slice(0, 60));
  expect(html).not.toContain("<aside");
});

test("console drives the audience window", async ({ page, context }) => {
  const errors = trackErrors(page);
  await signInAsPresenter(page, "/present/hick-law");
  await expect(page.getByText("Speaker notes")).toBeVisible();
  await expect(page.getByText(notes["hick-law"].text.slice(0, 30))).toBeVisible();

  const [audience] = await Promise.all([
    context.waitForEvent("page"),
    page.getByRole("button", { name: "Open audience window" }).click(),
  ]);
  await expect(audience).toHaveTitle("Laws of UX · Audience");
  await expect(page.getByRole("status")).toContainText("in sync · slide 6");

  // Advance from the console
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/\/present\/hick-wild/);
  await expect(page.getByRole("status")).toContainText("slide 7");
  await expect(audience.getByRole("img", { name: /Slide 7:/ })).toBeVisible();

  // A clicker press landing on the audience window still drives the console
  await audience.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/\/present\/hick-kestrel/);

  // Blank screen
  await page.keyboard.press("b");
  await expect(page.getByRole("status")).toContainText("blank");
  await page.keyboard.press("b");
  await expect(page.getByRole("status")).toContainText("in sync");

  expect(errors).toEqual([]);
});

test("recap slide offers the module quiz link", async ({ page }) => {
  await signInAsPresenter(page, "/present/m1-recap");
  await expect(page.getByRole("heading", { name: "Module 1 quiz" })).toBeVisible();
  await expect(page.getByText("/quiz/m1")).toBeVisible();
});
