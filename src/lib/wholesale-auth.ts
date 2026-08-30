import { createHmac, timingSafeEqual } from "node:crypto";

export const WHOLESALE_COOKIE = "wholesale_session";
export const WHOLESALE_COOKIE_PATH = "/wholesale";

export function wholesalePasswordConfigured(): boolean {
  return Boolean(process.env.WHOLESALE_PASSWORD);
}

function sessionSecret(): string {
  if (process.env.WHOLESALE_SESSION_SECRET) return process.env.WHOLESALE_SESSION_SECRET;
  const password = process.env.WHOLESALE_PASSWORD;
  if (!password) return "";
  return createHmac("sha256", "dock-posted-wholesale-derive").update(password).digest("hex");
}

export function wholesaleSessionToken(): string {
  return createHmac("sha256", sessionSecret()).update("wholesale-ok").digest("hex");
}

function sameBytes(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function wholesaleSessionValid(cookie: string | undefined): boolean {
  if (!wholesalePasswordConfigured()) return false;
  if (!cookie) return false;
  return sameBytes(cookie, wholesaleSessionToken());
}

export function wholesalePasswordMatches(candidate: string): boolean {
  const expected = process.env.WHOLESALE_PASSWORD;
  if (!expected) return false;
  return sameBytes(candidate, expected);
}

export function wholesaleCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: WHOLESALE_COOKIE_PATH,
    maxAge: 60 * 60 * 24 * 14,
  };
}
