"use server";

import { redirect } from "next/navigation";

import {
  endPresenterSession,
  passwordMatches,
  presenterLoginConfigured,
  startPresenterSession,
} from "@/lib/presenter-auth";

export type LoginState = { error?: string };

const safeNext = (value: FormDataEntryValue | null) => {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/present") ? next : "/present";
};

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!presenterLoginConfigured()) {
    return { error: "Presenter login isn't set up yet. Add PRESENTER_PASSWORD and SESSION_SECRET." };
  }
  const password = String(formData.get("password") ?? "");
  if (!passwordMatches(password)) {
    // Slow down repeated guesses.
    await new Promise((r) => setTimeout(r, 600));
    return { error: "That password isn’t right." };
  }
  await startPresenterSession();
  redirect(safeNext(formData.get("next")));
}

export async function logout() {
  await endPresenterSession();
  redirect("/");
}
