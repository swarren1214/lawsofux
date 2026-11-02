import { expect, test } from "@playwright/test";

import data from "../../src/generated/slides.json";
import { trackErrors } from "./helpers";

// Every slide renders in the audience window with its animations and no errors.
for (const slide of data.slides) {
  test(`slide ${slide.number}: ${slide.id} renders`, async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto(`/audience?slide=${slide.id}`);
    const canvas = page.locator(".slide-canvas").first();
    await expect(canvas).toBeVisible();
    await expect(page.locator("iframe[data-embed]")).toHaveCount(slide.embedCount);
    // Build-ins finish and leave nothing hidden.
    await expect(page.locator("[data-build-in].bi-wait")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
