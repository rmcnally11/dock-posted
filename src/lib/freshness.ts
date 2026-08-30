import type { Dock, FuelQuote } from "./types";

export const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

export type Freshness = "fresh" | "stale" | "call";

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

export function freshness(dock: Dock, now = Date.now()): Freshness {
  if (isUnverified(dock)) return "call";
  if (isOlderThanWeek(dock, now)) return "stale";
  return "fresh";
}

export function freshnessLabel(dock: Dock, now = Date.now()): string {
  const state = freshness(dock, now);
  if (state === "call") return "Call / unverified";
  if (state === "stale") return "Stale — older than 7 days";
  return "Posted this week";
}

export function displayGas(dock: Dock): FuelQuote | null {
  const gas = dock.quotes.filter((quote) => quote.product !== "diesel");
  const posted = gas.filter(
    (quote) => quote.status === "posted" && quote.pricePerGallon != null,
  );
  if (posted.length === 0) {
    return (
      gas.find((quote) => quote.status === "call" || quote.status === "no-report") ??
      gas[0] ??
      null
    );
  }
  return posted.find((quote) => quote.ethanol === "E0") ?? posted[0];
}

export function displayDiesel(dock: Dock): FuelQuote | null {
  return dock.quotes.find((quote) => quote.product === "diesel") ?? null;
}
