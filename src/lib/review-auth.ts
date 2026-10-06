import { createHmac, timingSafeEqual } from "node:crypto";

export const REVIEW_COOKIE = "review_session";
export const REVIEW_COOKIE_PATH = "/review";

export function reviewPasswordConfigured(): boolean {
  return Boolean(process.env.REVIEW_PASSWORD);
}

function sessionSecret(): string {
  if (process.env.REVIEW_SESSION_SECRET) return process.env.REVIEW_SESSION_SECRET;
  const password = process.env.REVIEW_PASSWORD;
  if (!password) return "";
  return createHmac("sha256", "dock-posted-review-derive").update(password).digest("hex");
}

export function reviewSessionToken(): string {
  return createHmac("sha256", sessionSecret()).update("review-ok").digest("hex");
}

function sameBytes(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function reviewSessionValid(cookie: string | undefined): boolean {
  if (!reviewPasswordConfigured()) return false;
  if (!cookie) return false;
  return sameBytes(cookie, reviewSessionToken());
}

export function reviewPasswordMatches(candidate: string): boolean {
  const expected = process.env.REVIEW_PASSWORD;
  if (!expected) return false;
  return sameBytes(candidate, expected);
}

export function reviewCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: REVIEW_COOKIE_PATH,
    maxAge: 60 * 60 * 24 * 14,
  };
}
