import rawHistory from "../../data/price-history.json";
import { formatDate, formatGallonPrice, formatShortDate, gasWords, statedHose } from "./format";
import { freshness, postedQuotes } from "./freshness";
import { HOME_AREAS, homeArea } from "./posted";
import type { Dock, FuelQuote, PostedDepth } from "./types";
import { CORRIDORS, REGIONS } from "./types";

export type { PostedDepth };

/** Public canonical host. JSON-LD must use this, not the Vercel preview host. */
export const DOCK_ORIGIN = "https://www.dockposted.com";

export type EthanolFreeAnswer = "Yes" | "No" | "Not stated";

export interface PriceCheckLine {
  label: string;
  pricePerGallon: number;
}

export interface PriceCheck {
  checkedOn: string;
  source: "marina site";
  sourceUrl: string | null;
  lines: PriceCheckLine[];
}

type HistoryFile = Record<string, unknown>;

/**
 * Phrases already written down from a marina or city page.
 * A match is that sentence, not a guess from a default 87/diesel pair.
 */
const NOTE_FUELS: Array<{ pattern: RegExp; fuels: string[] }> = [
  {
    pattern: /Fuel-dock page \([^)]*\) lists regular, supreme, diesel/i,
    fuels: ["Regular gas", "Premium gas (Supreme), 93 octane", "Diesel"],
  },
  {
    pattern: /marine-grade diesel and regular gasoline/i,
    fuels: ["Regular gas", "Diesel"],
  },
  {
    pattern: /fuel dock sells gasoline and diesel/i,
    fuels: ["Gas", "Diesel"],
  },
  {
    pattern: /Diesel is not named on that page/i,
    fuels: ["Gas"],
  },
  {
    pattern: /does not name a diesel hose/i,
    fuels: ["Gas"],
  },
  {
    pattern: /off-road diesel and mid-grade rec gasoline/i,
    fuels: ["Mid-grade gas", "Off-road diesel (red dyed)"],
  },
  {
    pattern: /Site confirms gas and diesel/i,
    fuels: ["Gas", "Diesel"],
  },
  {
    pattern: /Marina page \([^)]*\): ValvTect gasoline and diesel/i,
    fuels: ["Gas", "Diesel"],
  },
  {
    pattern: /Rec 90 Non-Ethanol Gasoline and Red Dyed Diesel/i,
    fuels: ["Gas, no ethanol, 90 octane", "Off-road diesel (red dyed)"],
  },
  {
    pattern: /Gate Gas and Diesel/i,
    fuels: ["Gas", "Diesel"],
  },
  {
    pattern: /Diesel & Gas/i,
    fuels: ["Gas", "Diesel"],
  },
  {
    pattern: /Marine Gas and Diesel/i,
    fuels: ["Gas", "Diesel"],
  },
  {
    pattern: /Non-Ethanol Gas & Diesel/i,
    fuels: ["Gas, no ethanol", "Diesel"],
  },
  {
    pattern: /90-octane ethanol-free gas and diesel/i,
    fuels: ["Gas, no ethanol, 90 octane", "Diesel"],
  },
  {
    pattern: /diesel and ethanol-free gasoline/i,
    fuels: ["Gas, no ethanol", "Diesel"],
  },
  {
    pattern: /Non Ethanol and High Speed Diesel/i,
    fuels: ["Gas, no ethanol", "Diesel"],
  },
  {
    pattern: /Ethanol-Free Gas & Diesel/i,
    fuels: ["Gas, no ethanol", "Diesel"],
  },
  {
    pattern: /ethanol-free gas, diesel/i,
    fuels: ["Gas, no ethanol", "Diesel"],
  },
  {
    pattern: /90 Octane ETHANOL FREE gas and marine-grade diesel/i,
    fuels: ["Gas, no ethanol, 90 octane", "Diesel"],
  },
];

export function dockCanonicalUrl(id: string): string {
  return `${DOCK_ORIGIN}/docks/${id}`;
}

export function dockAreaLabel(dock: Dock): string {
  const home = homeArea(dock);
  if (home) {
    return HOME_AREAS.find((area) => area.id === home)?.label ?? REGIONS[dock.region].label;
  }
  if (dock.corridor) return CORRIDORS[dock.corridor].label;
  return REGIONS[dock.region].label;
}

/**
 * Opens the phone's maps app. `api=1` is Google's maps-link flag, not an API key.
 * Coordinates when we stored them. Name, town, and state only if the pin is missing.
 */
export function directionsHref(
  dock: Pick<Dock, "lat" | "lng" | "name" | "city" | "state">,
): string | null {
  const { lat, lng } = dock;
  const hasPin =
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    Math.abs(lat) <= 90 &&
    Math.abs(lng) <= 180 &&
    !(lat === 0 && lng === 0);
  const query = hasPin ? `${lat},${lng}` : [dock.name, dock.city, dock.state].filter(Boolean).join(", ");
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * Yes or No only when the marina or city page named the blend.
 * Waterway Guide, a brand name, or a blank stays "Not stated".
 */
export function ethanolFreeAnswer(dock: Dock): EthanolFreeAnswer {
  if (dock.lastVerifiedSource !== "marina site") return "Not stated";
  const gas = dock.quotes.filter((quote) => quote.product !== "diesel" && quote.status !== "not-sold");
  if (gas.some((quote) => quote.ethanol === "E0")) return "Yes";
  if (gas.length > 0 && gas.every((quote) => quote.ethanol === "E10" || quote.ethanol === "E15")) {
    return "No";
  }
  return "Not stated";
}

/** Fuels the marina or city page named. Empty means the page did not say. */
export function fuelsPosted(dock: Dock): string[] {
  if (dock.lastVerifiedSource === "marina site") {
    const priced = dock.quotes.filter(
      (quote) => quote.status === "posted" && quote.pricePerGallon != null,
    );
    if (priced.length > 0) return priced.map((quote) => gasWords(quote));
  }
  const notes = dock.notes ?? "";
  for (const rule of NOTE_FUELS) {
    if (rule.pattern.test(notes)) return [...rule.fuels];
  }
  if (/does not name a grade/i.test(notes)) return [];
  if (dock.lastVerifiedSource !== "marina site") return [];
  return dock.quotes
    .filter(
      (quote) =>
        quote.status !== "not-sold" && (quote.ethanol === "E0" || quote.product === "gasoline"),
    )
    .map((quote) => gasWords(quote));
}

export function postedDepth(dock: { depth?: PostedDepth | null }): PostedDepth | null {
  const depth = dock.depth;
  if (!depth) return null;
  if (!depth.text.trim() || !depth.sourceUrl.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(depth.checkedOn)) {
    return null;
  }
  if (/\b(about|approx(?:imately)?|estimated|estimate)\b/i.test(depth.text)) return null;
  return depth;
}

export function depthSourceLine(depth: PostedDepth, now = Date.now()): string {
  const date = formatShortDate(depth.checkedOn, now);
  return date ? `Marina's website, checked ${date}` : "Marina's website";
}

/**
 * Plain hours. Fuel-dock hours come first when the marina posted a separate clock.
 * Research notes ("Top of the page", "Contact block") stay off the card.
 */
export function publicHours(hours: string | null | undefined): string[] {
  if (!hours?.trim()) return [];
  const gym = hours.match(
    /^Top of the page: (.+)\. Contact block: fuel dock ([^;]+); store and ramp (.+)\.$/,
  );
  if (gym) {
    return [`Fuel dock: ${gym[2]}`, `Store and ramp: ${gym[3]}`, `Marina: ${gym[1]}`];
  }
  const twoClocks = hours.match(
    /^Two clocks on their fuel page\. One is (.+)\. The fuel dock says (.+)\.$/,
  );
  if (twoClocks) {
    return [`Fuel dock: ${twoClocks[2]}`, twoClocks[1]];
  }
  const cleaned = hours
    .replace(/\s*\((?:club marina page|marina site)\)/gi, "")
    .replace(/\s*The page does not post a clock\.?/gi, "")
    .trim();
  return cleaned ? [cleaned] : [];
}

export function hoursSourceLine(dock: Dock, now = Date.now()): string | null {
  if (publicHours(dock.hours).length === 0) return null;
  const fromMarinaPage =
    dock.lastVerifiedSource === "marina site" || /\((?:club )?marina (?:page|site)\)/i.test(dock.hours ?? "");
  if (!fromMarinaPage) return null;
  if (dock.lastVerifiedSource === "marina site" && dock.lastVerifiedAt) {
    const date = formatShortDate(dock.lastVerifiedAt, now);
    return date ? `Marina's website, checked ${date}` : "Marina's website";
  }
  return "Marina's website";
}

function isPriceCheck(value: unknown): value is PriceCheck {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<PriceCheck>;
  if (row.source !== "marina site") return false;
  if (typeof row.checkedOn !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(row.checkedOn)) return false;
  if (!Array.isArray(row.lines) || row.lines.length === 0) return false;
  return row.lines.every(
    (line) =>
      !!line &&
      typeof line.label === "string" &&
      line.label.trim().length > 0 &&
      typeof line.pricePerGallon === "number" &&
      Number.isFinite(line.pricePerGallon),
  );
}

function historyFor(id: string): PriceCheck[] {
  const file = rawHistory as HistoryFile;
  const rows = file[id];
  if (!Array.isArray(rows)) return [];
  return rows.filter(isPriceCheck).map((check) => ({
    checkedOn: check.checkedOn,
    source: "marina site",
    sourceUrl: typeof check.sourceUrl === "string" ? check.sourceUrl : null,
    lines: check.lines.map((line) => ({
      label: line.label,
      pricePerGallon: line.pricePerGallon,
    })),
  }));
}

function currentMarinaCheck(dock: Dock): PriceCheck | null {
  if (dock.lastVerifiedSource !== "marina site" || !dock.lastVerifiedAt) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dock.lastVerifiedAt)) return null;
  const lines = postedQuotes(dock).map((quote) => ({
    label: gasWords(quote),
    pricePerGallon: quote.pricePerGallon as number,
  }));
  if (lines.length === 0) return null;
  return {
    checkedOn: dock.lastVerifiedAt,
    source: "marina site",
    sourceUrl: dock.sourceUrl,
    lines,
  };
}

/** Newest first. Live quotes win on their own date. No filled-in days between checks. */
export function priceChecks(dock: Dock, earlier: PriceCheck[] = historyFor(dock.id)): PriceCheck[] {
  const byDate = new Map<string, PriceCheck>();
  for (const check of earlier) {
    if (!isPriceCheck(check)) continue;
    byDate.set(check.checkedOn, check);
  }
  const current = currentMarinaCheck(dock);
  if (current) byDate.set(current.checkedOn, current);
  return [...byDate.values()].sort((a, b) => (a.checkedOn < b.checkedOn ? 1 : -1));
}

export function priceHistoryLead(count: number, checkedOn: string | null = null): string | null {
  if (count <= 0) return "No posted price yet.";
  if (count === 1) return `Checked once, on ${formatDate(checkedOn)}.`;
  return null;
}

/** One fuel and its price, for a history row. Unknown tax and ethanol stay off the line. */
export function priceCheckLine(label: string, pricePerGallon: number): string {
  return `${statedHose(label)} ${formatGallonPrice(pricePerGallon)}`;
}

function freshPrices(dock: Dock, now: number): FuelQuote[] {
  if (freshness(dock, now) !== "fresh") return [];
  return postedQuotes(dock);
}

function priceClause(dock: Dock, quotes: FuelQuote[]): string {
  const bits = quotes
    .map((quote) => `${statedHose(gasWords(quote))} ${formatGallonPrice(quote.pricePerGallon as number)}`)
    .join(", ");
  const date = formatDate(dock.lastVerifiedAt);
  if (dock.lastVerifiedSource === "marina site") {
    return `Fuel prices on the marina's website, checked ${date}: ${bits}.`;
  }
  if (dock.lastVerifiedSource === "Waterway Guide") {
    return `Fuel prices from Waterway Guide, checked ${date}: ${bits}.`;
  }
  return `Fuel prices checked ${date}: ${bits}.`;
}

export function dockPageTitle(dock: Dock, now = Date.now()): string {
  const place = `${dock.name} fuel prices, ${dock.city}, ${dockAreaLabel(dock)}`;
  const quotes = freshPrices(dock, now);
  if (quotes.length === 0 || !dock.lastVerifiedAt) return place;
  const dollars = quotes.map((quote) => formatGallonPrice(quote.pricePerGallon as number)).join(", ");
  return `${place} — ${dollars}, checked ${formatDate(dock.lastVerifiedAt)}`;
}

export function dockPageDescription(dock: Dock, now = Date.now()): string {
  const place = `${dock.name}, ${dock.city}, ${dockAreaLabel(dock)}.`;
  const quotes = freshPrices(dock, now);
  if (quotes.length > 0) return `${place} ${priceClause(dock, quotes)}`;
  if (freshness(dock, now) === "stale") return `${place} Price over a week old. Call the dock.`;
  return `${place} Fuel prices are not posted. Call the dock.`;
}

export function dockJsonLd(dock: Dock, now = Date.now()) {
  const hours = publicHours(dock.hours);
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: dock.name,
    description: dockPageDescription(dock, now),
    url: dockCanonicalUrl(dock.id),
    address: {
      "@type": "PostalAddress",
      addressLocality: dock.city,
      addressRegion: dock.state,
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: dock.lat,
      longitude: dock.lng,
    },
    ...(dock.phone ? { telephone: dock.phone } : {}),
    ...(hours.length > 0 ? { openingHours: hours.join("; ") } : {}),
  };
}

export interface DockAnswerStats {
  docks: number;
  directions: number;
  ethanolYes: number;
  ethanolNo: number;
  ethanolNotStated: number;
  depth: number;
  historyMany: number;
  historyOne: number;
  fuelsNamed: number;
}

export function dockAnswerStats(docks: Dock[]): DockAnswerStats {
  const stats: DockAnswerStats = {
    docks: docks.length,
    directions: 0,
    ethanolYes: 0,
    ethanolNo: 0,
    ethanolNotStated: 0,
    depth: 0,
    historyMany: 0,
    historyOne: 0,
    fuelsNamed: 0,
  };
  for (const dock of docks) {
    const directions = directionsHref(dock);
    if (directions && decodeURIComponent(directions).includes(`${dock.lat},${dock.lng}`)) {
      stats.directions += 1;
    }
    const ethanol = ethanolFreeAnswer(dock);
    if (ethanol === "Yes") stats.ethanolYes += 1;
    else if (ethanol === "No") stats.ethanolNo += 1;
    else stats.ethanolNotStated += 1;
    if (postedDepth(dock)) stats.depth += 1;
    const count = priceChecks(dock).length;
    if (count > 1) stats.historyMany += 1;
    else if (count === 1) stats.historyOne += 1;
    if (fuelsPosted(dock).length > 0) stats.fuelsNamed += 1;
  }
  return stats;
}
