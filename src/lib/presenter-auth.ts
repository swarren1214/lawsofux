import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/*
 * Phase 0 presenter login: one shared presenter password from the
 * PRESENTER_PASSWORD environment variable. The session cookie is an HMAC
 * signed with SESSION_SECRET, so it can't be forged or read by scripts.
 *
 * Phase 1 replaces this with accounts and presenter/admin roles.
 */

const COOKIE = "lux_presenter";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function presenterLoginConfigured() {
  return Boolean(process.env.PRESENTER_PASSWORD && process.env.SESSION_SECRET);
}

function sessionToken() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  return createHmac("sha256", secret).update("presenter:v1").digest("base64url");
}

const digest = (s: string) => createHash("sha256").update(s).digest();

export function passwordMatches(input: string) {
  const expected = process.env.PRESENTER_PASSWORD;
  if (!expected) return false;
  return timingSafeEqual(digest(input), digest(expected));
}

export async function isPresenter() {
  const token = sessionToken();
  if (!token) return false;
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return false;
  const a = Buffer.from(value);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function startPresenterSession() {
  const token = sessionToken();
  if (!token) throw new Error("SESSION_SECRET is not set");
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endPresenterSession() {
  (await cookies()).delete(COOKIE);
}
