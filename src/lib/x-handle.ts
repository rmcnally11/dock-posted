export const DEFAULT_X_HANDLE = "DockPosted";

const FORBIDDEN = new Set(["rjmtweets11", "goodpiratesalma"]);

export function publicXHandle(raw = process.env.NEXT_PUBLIC_X_HANDLE): string {
  const trimmed = (raw ?? "").trim().replace(/^@+/, "");
  if (!trimmed) return DEFAULT_X_HANDLE;
  if (FORBIDDEN.has(trimmed.toLowerCase())) return DEFAULT_X_HANDLE;
  if (!/^[A-Za-z0-9_]{1,15}$/.test(trimmed)) return DEFAULT_X_HANDLE;
  return trimmed;
}

export function xProfileUrl(handle = publicXHandle()): string {
  return `https://x.com/${handle}`;
}
