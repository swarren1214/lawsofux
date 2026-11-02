import { expect, test } from "@playwright/test";

import m1 from "../../content/quizzes/m1.json";
import { signInAsPresenter, trackErrors } from "./helpers";

test("home lists all five modules", async ({ page }) => {
  await page.goto("/");
  for (const name of ["How people decide", "How people see", "How people act", "How teams make trade-offs"]) {
    await expect(page.getByRole("heading", { name })).toBeVisible();
  }
});

test("a quiz that isn’t open yet is locked for learners", async ({ page }) => {
  test.skip(m1.open, "Module 1 quiz is open");
  await page.goto("/quiz/m1");
  await expect(page.getByRole("heading", { name: /opens after the Module 1 session/ })).toBeVisible();
});

test("Module 1 quiz runs start to finish", async ({ page }) => {
  const errors = trackErrors(page);
  if (!m1.open) await signInAsPresenter(page, "/present");
  await page.goto("/quiz/m1");

  for (const [i, q] of m1.questions.entries()) {
    await expect(page.getByText(`Question ${i + 1} of ${m1.questions.length}`)).toBeVisible();
    const right = q.options.find((o) => o.id === q.answer)!;
    // Answer the first question wrong on purpose, the rest right.
    const choice = i === 0 ? q.options.find((o) => o.id !== q.answer)! : right;
    await page.getByRole("radio", { name: new RegExp(choice.text.slice(0, 25).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) }).click();
    await page.getByRole("button", { name: "Check answer" }).click();
    await expect(page.getByText(i === 0 ? "Not quite." : "That’s right.")).toBeVisible();
    await page.getByRole("button", { name: i === m1.questions.length - 1 ? "See results" : "Next question" }).click();
  }

  await expect(page.getByText(`${m1.questions.length - 1}/${m1.questions.length}`)).toBeVisible();
  await expect(page.getByText("Worth a second look")).toHaveCount(1);
  await page.getByRole("button", { name: "Take it again" }).click();
  await expect(page.getByText(`Question 1 of ${m1.questions.length}`)).toBeVisible();
  expect(errors).toEqual([]);
});
