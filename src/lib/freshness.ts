import type { Dock, FuelQuote } from "./types";

export const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

export type Freshness = "fresh" | "stale" | "call" | "no-report" | "never";

export function postedQuotes(dock: Dock): FuelQuote[] {
  return dock.quotes.filter(
    (quote) => quote.status === "posted" && quote.pricePerGallon != null,
  );
}

export function hasPostedPrice(dock: Dock): boolean {
  return postedQuotes(dock).length > 0;
}

export function isUnverified(dock: Dock): boolean {
  if (!dock.lastVerifiedAt) return true;
  return !hasPostedPrice(dock);
}

export function isOlderThanWeek(dock: Dock, now = Date.now()): boolean {
  if (!dock.lastVerifiedAt) return true;
  const then = Date.parse(dock.lastVerifiedAt);
  if (Number.isNaN(then)) return true;
  return now - then > STALE_AFTER_MS;
}

function openQuotes(dock: Dock): FuelQuote[] {
  return dock.quotes.filter((quote) => quote.status !== "not-sold");
}

export function freshness(dock: Dock, now = Date.now()): Freshness {
  if (hasPostedPrice(dock)) {
    return isOlderThanWeek(dock, now) ? "stale" : "fresh";
  }
  const open = openQuotes(dock);
  if (open.length === 0 && !dock.lastVerifiedAt) return "never";
  if (open.length > 0 && open.every((quote) => quote.status === "no-report")) {
    return "no-report";
  }
  if (!dock.lastVerifiedAt) return "never";
  return "call";
}

export function isMarinaOwned(dock: Dock): boolean {
  return dock.lastVerifiedSource === "marina site" || dock.lastVerifiedSource === "marina";
}

export type PinTrust = "verified" | "last-seen" | "unverified";

export function pinTrust(dock: Dock): PinTrust {
  if (hasPostedPrice(dock) && isMarinaOwned(dock)) return "verified";
  if (hasPostedPrice(dock)) return "last-seen";
  return "unverified";
}

export function freshnessLabel(dock: Dock, now = Date.now()): string {
  const trust = pinTrust(dock);
  if (trust === "unverified") return "Call the dock";
  if (isOlderThanWeek(dock, now)) return "Stale";
  if (trust === "verified") return "Verified";
  return "Last seen";
}

export function boardTally(docks: Dock[], now = Date.now()) {
  let postedThisWeek = 0;
  let call = 0;
  let stale = 0;
  for (const dock of docks) {
    const state = freshness(dock, now);
    if (state === "fresh") postedThisWeek += 1;
    else if (state === "stale") stale += 1;
    else call += 1;
  }
  return { postedThisWeek, call, stale };
}

export function displayGas(dock: Dock): FuelQuote | null {
  const gas = dock.quotes.filter((quote) => quote.product !== "diesel");
  const posted = gas.filter(
    (quote) => quote.status === "posted" && quote.pricePerGallon != null,
  );
  if (posted.length === 0) {
    return (
      gas.find((quote) => quote.status === "no-report") ??
      gas.find((quote) => quote.status === "call") ??
      gas[0] ??
      null
    );
  }
  return posted.find((quote) => quote.ethanol === "E0") ?? posted[0];
}

export function displayDiesel(dock: Dock): FuelQuote | null {
  return dock.quotes.find((quote) => quote.product === "diesel") ?? null;
}

export function boardQuote(dock: Dock, quote: FuelQuote | null, now = Date.now()): FuelQuote | null {
  if (!quote) return null;
  if (quote.status === "posted" && isOlderThanWeek(dock, now)) {
    return { ...quote, pricePerGallon: null, status: "call" };
  }
  return quote;
}
