import { createHmac, timingSafeEqual } from "node:crypto";

export const DESK_COOKIE = "desk_session";
export const DESK_COOKIE_PATH = "/desk";

export function deskPasswordConfigured(): boolean {
  return Boolean(process.env.DESK_PASSWORD || process.env.WHOLESALE_PASSWORD);
}

function deskPassword(): string {
  return process.env.DESK_PASSWORD || process.env.WHOLESALE_PASSWORD || "";
}

function sessionSecret(): string {
  if (process.env.DESK_SESSION_SECRET) return process.env.DESK_SESSION_SECRET;
  const password = deskPassword();
  if (!password) return "";
  return createHmac("sha256", "dock-posted-desk-derive").update(password).digest("hex");
}

export function deskSessionToken(): string {
  return createHmac("sha256", sessionSecret()).update("desk-ok").digest("hex");
}

function sameBytes(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function deskSessionValid(cookie: string | undefined): boolean {
  if (!deskPasswordConfigured()) return false;
  if (!cookie) return false;
  return sameBytes(cookie, deskSessionToken());
}

export function deskPasswordMatches(candidate: string): boolean {
  const expected = deskPassword();
  if (!expected) return false;
  return sameBytes(candidate, expected);
}

export function deskCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: DESK_COOKIE_PATH,
    maxAge: 60 * 60 * 24 * 14,
  };
}
