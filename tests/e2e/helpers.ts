import { expect, type Page } from "@playwright/test";

import { TEST_PRESENTER_PASSWORD } from "../../playwright.config";

/** Collects uncaught errors and console errors on a page. */
export function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  return errors;
}

export async function signInAsPresenter(page: Page, next = "/present") {
  await page.goto(`/present/login?next=${encodeURIComponent(next)}`);
  await page.getByLabel("Presenter password").fill(TEST_PRESENTER_PASSWORD);
  await page.getByRole("button", { name: "Open presenter mode" }).click();
  // Wait until the login page is gone (its own URL also starts with /present).
  await expect(page).not.toHaveURL(/\/present\/login/);
  await expect(page.getByText("Speaker notes")).toBeVisible();
}
