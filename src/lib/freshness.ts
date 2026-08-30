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

export function freshnessLabel(dock: Dock, now = Date.now()): string {
  const state = freshness(dock, now);
  if (state === "never") return "Never";
  if (state === "no-report") return "No report";
  if (state === "call") return "Call";
  if (state === "stale") return "Stale";
  return "This week";
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
