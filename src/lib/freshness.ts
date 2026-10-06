import { formatShortDate, gasWords, quoteParts } from "./format";
import type { Dock, FuelQuote } from "./types";

export const STALE_AFTER_MS = 7 * 24 * 60 * 60 * 1000;

/** A marina that prints "Gasoline" with no octane often dates it a few days
 *  before the morning we read the page. That pin stays up for 14 days.
 *  Octane hoses, including Galveston, stay on the one-week gate. */
const UNLABELED_GASOLINE_MS = 14 * 24 * 60 * 60 * 1000;

function postsUnlabeledGasoline(dock: Dock): boolean {
  return dock.quotes.some(
    (quote) =>
      quote.product === "gasoline" && quote.status === "posted" && quote.pricePerGallon != null,
  );
}

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
  const limit = postsUnlabeledGasoline(dock) ? UNLABELED_GASOLINE_MS : STALE_AFTER_MS;
  return now - then > limit;
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

/** A price read off the marina's own website. A report-form "marina" source is staff, not this. */
export function isMarinaSite(dock: Dock): boolean {
  return dock.lastVerifiedSource === "marina site";
}

/** Home-page dollars: the marina's page, or a marina filing. A user report is not this. */
export function isMarinaOwned(dock: Dock): boolean {
  return dock.lastVerifiedSource === "marina site" || dock.lastVerifiedSource === "marina";
}

export type PinTrust = "verified" | "last-seen" | "unverified";

export function pinTrust(dock: Dock): PinTrust {
  if (hasPostedPrice(dock) && isMarinaSite(dock)) return "verified";
  if (hasPostedPrice(dock)) return "last-seen";
  return "unverified";
}

export type PinKind = "marina-site" | "report" | "stale" | "none";

export function pinKind(dock: Dock, now = Date.now()): PinKind {
  const state = freshness(dock, now);
  if (state === "stale") return "stale";
  if (state === "fresh") return isMarinaSite(dock) ? "marina-site" : "report";
  return "none";
}

export const PRICE_LEGEND: { kind: PinKind; label: string; swatch: string }[] = [
  { kind: "marina-site", label: "Marina's price", swatch: "var(--diesel)" },
  { kind: "report", label: "Waterway Guide or a report", swatch: "var(--gold)" },
  { kind: "stale", label: "Price over a week old, call the dock", swatch: "var(--stale)" },
  { kind: "none", label: "No price posted, call the dock", swatch: "var(--signal)" },
];

export function pinSwatch(kind: PinKind): string {
  return PRICE_LEGEND.find((item) => item.kind === kind)?.swatch ?? "var(--signal)";
}

/** Some gas hose is ethanol-free. The dock-level blend field is not the filter. */
export function hasEthanolFreeGas(dock: Dock): boolean {
  return dock.quotes.some(
    (quote) => quote.product !== "diesel" && quote.status !== "not-sold" && quote.ethanol === "E0",
  );
}

export function publicBadge(dock: Dock, now = Date.now()): string {
  const state = freshness(dock, now);
  if (state === "stale") return "Price over a week old";
  if (state === "fresh") {
    switch (dock.lastVerifiedSource) {
      case "marina site":
        return "Marina's price";
      case "Waterway Guide":
        return "From Waterway Guide";
      case "marina":
        return "Marina staff report, not checked";
      case "user report":
        return "Boater report";
      default:
        return "Boater report";
    }
  }
  return "No price posted";
}

export function freshnessLabel(dock: Dock, now = Date.now()): string {
  return publicBadge(dock, now);
}

function withDate(lead: string, date: string): string {
  return date ? `${lead}, ${date}` : lead;
}

export function publicSource(dock: Dock, now = Date.now()): string {
  const date = formatShortDate(dock.lastVerifiedAt, now);
  const state = freshness(dock, now);
  const source = dock.lastVerifiedSource;

  if (state === "stale") {
    if (source === "marina site") {
      return date ? `Posted on the marina's website, checked ${date}` : "Posted on the marina's website";
    }
    if (source === "Waterway Guide") {
      return date ? `Waterway Guide listed a price ${date}` : "Waterway Guide listed a price";
    }
    if (source === "marina") return withDate("Marina staff report, not checked", date);
    if (source === "user report") return withDate("Boater report", date);
    return date;
  }

  if (state === "fresh") {
    if (source === "marina site") {
      return date ? `Posted on the marina's website, checked ${date}` : "Posted on the marina's website";
    }
    if (source === "Waterway Guide") return withDate("From Waterway Guide", date);
    if (source === "marina") return withDate("Marina staff report, not checked", date);
    if (source === "user report") return withDate("Boater report", date);
    return date;
  }

  if (source === "Waterway Guide") return date ? `Waterway Guide, ${date}` : "Waterway Guide";
  if (source === "marina site") {
    return date ? `No price on the marina's website, checked ${date}` : "";
  }
  if (source === "marina") return withDate("Marina staff report, not checked", date);
  if (source === "user report") return withDate("Boater report", date);
  return date;
}

export function publicCallLine(dock: Dock, now = Date.now()): string | null {
  if (!dock.phone) return null;
  if (freshness(dock, now) === "stale") return `Too old to show. Call the dock: ${dock.phone}`;
  if (!hasPostedPrice(dock)) return `Call the dock · ${dock.phone}`;
  return dock.phone;
}

export function pinAriaLabel(dock: Dock, now = Date.now()): string {
  const kind = pinKind(dock, now);
  const date = formatShortDate(dock.lastVerifiedAt, now);
  if (kind === "marina-site") return `${dock.name}: marina's price, checked ${date}`;
  if (kind === "stale") return `${dock.name}: price over a week old, call the dock`;
  if (kind === "none") return `${dock.name}: no price posted, call the dock`;
  if (dock.lastVerifiedSource === "Waterway Guide") {
    return date ? `${dock.name}: From Waterway Guide, ${date}` : `${dock.name}: From Waterway Guide`;
  }
  if (dock.lastVerifiedSource === "marina") {
    return date
      ? `${dock.name}: marina staff report, not checked, ${date}`
      : `${dock.name}: marina staff report, not checked`;
  }
  return date ? `${dock.name}: boater report, ${date}` : `${dock.name}: boater report`;
}

export function reportLinkLabel(dock: Dock, now = Date.now()): string {
  return pinKind(dock, now) === "marina-site" ? "Update the number" : "I was there";
}

export function heroCountLine(posted: number, total: number): string {
  const verb = posted === 1 ? "has" : "have";
  return `${posted} of ${total} docks ${verb} a current posted price. For the rest, call the dock.`;
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

export interface PinQuoteSlot {
  id: string;
  label: string;
  quote: FuelQuote | null;
  kind: "gas" | "diesel";
  suppressed: boolean;
}

function slotFor(
  dock: Dock,
  quote: FuelQuote | null,
  kind: "gas" | "diesel",
  id: string,
  now: number,
): PinQuoteSlot {
  if (!quote) {
    const label = kind === "diesel" ? "Diesel: no price posted. Call the dock." : "Gas: no price posted. Call the dock.";
    return { id, label, quote: null, kind, suppressed: false };
  }
  const shown = boardQuote(dock, quote, now);
  const suppressed = Boolean(
    quote.status === "posted" &&
      quote.pricePerGallon != null &&
      shown &&
      shown.pricePerGallon == null,
  );
  if (suppressed) {
    return { id, label: "Too old to show", quote: shown, kind, suppressed: true };
  }
  const parts = quoteParts(shown, kind);
  const label = parts.blank ? parts.figure : gasWords(quote);
  return { id, label, quote: shown, kind, suppressed: false };
}

/**
 * Every posted gas hose gets its own line. A dock with no posted gas gets one
 * blank gas line, not a Regular placeholder. Diesel is always its own line.
 */
export function pinQuoteSlots(dock: Dock, now = Date.now()): PinQuoteSlot[] {
  const gasQuotes = dock.quotes.filter((quote) => quote.product !== "diesel");
  const postedGas = gasQuotes.filter(
    (quote) => quote.status === "posted" && quote.pricePerGallon != null,
  );
  const gasSlots = postedGas.length
    ? postedGas.map((quote) => slotFor(dock, quote, "gas", `gas-${quote.product}`, now))
    : [
        slotFor(
          dock,
          gasQuotes.find((quote) => quote.status !== "not-sold") ?? gasQuotes[0] ?? null,
          "gas",
          "gas",
          now,
        ),
      ];
  const diesel = dock.quotes.find((quote) => quote.product === "diesel") ?? null;
  return [...gasSlots, slotFor(dock, diesel, "diesel", "diesel", now)];
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
